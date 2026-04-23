import { Injectable, NotFoundException } from '@nestjs/common';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ReservationStatus, RoomStatus } from '@Noblesse/shared';

export class OccupancyReportDto {
  @IsString()
  propertyId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class RevenueReportDto {
  @IsString()
  propertyId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class ReservationStatsReportDto {
  @IsString()
  propertyId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getOccupancyReport(dto: OccupancyReportDto, tenantId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${dto.propertyId} not found`);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Total rooms in property
    const totalRooms = await this.prisma.room.count({
      where: { propertyId: dto.propertyId, isActive: true },
    });

    // Reservations overlapping the date range
    const reservations = await this.prisma.reservation.findMany({
      where: {
        propertyId: dto.propertyId,
        status: {
          in: [
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
            ReservationStatus.CHECKED_OUT,
          ],
        },
        checkIn: { lt: endDate },
        checkOut: { gt: startDate },
      },
      include: { rooms: true },
    });

    // Calculate occupied room-nights
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalRoomNights = totalRooms * days;

    let occupiedRoomNights = 0;
    for (const res of reservations) {
      const resStart = res.checkIn > startDate ? res.checkIn : startDate;
      const resEnd = res.checkOut < endDate ? res.checkOut : endDate;
      const nights = Math.ceil(
        (resEnd.getTime() - resStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      occupiedRoomNights += nights * res.rooms.length;
    }

    const occupancyRate =
      totalRoomNights > 0
        ? Math.round((occupiedRoomNights / totalRoomNights) * 10000) / 100
        : 0;

    // Room status breakdown
    const roomStatusBreakdown = await this.prisma.room.groupBy({
      by: ['status'],
      where: { propertyId: dto.propertyId, isActive: true },
      _count: { id: true },
    });

    return {
      propertyId: dto.propertyId,
      propertyName: property.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalRooms,
      days,
      totalRoomNights,
      occupiedRoomNights,
      occupancyRate,
      roomStatusBreakdown: roomStatusBreakdown.map((r) => ({
        status: r.status,
        count: r._count.id,
      })),
    };
  }

  async getRevenueReport(dto: RevenueReportDto, tenantId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${dto.propertyId} not found`);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Payments in date range
    const payments = await this.prisma.payment.findMany({
      where: {
        isVoided: false,
        isRefund: false,
        createdAt: { gte: startDate, lte: endDate },
        folio: {
          reservation: { propertyId: dto.propertyId, tenantId },
        },
      },
      include: {
        folio: {
          select: { reservation: { select: { checkIn: true, checkOut: true } } },
        },
      },
    });

    const refunds = await this.prisma.payment.findMany({
      where: {
        isVoided: false,
        isRefund: true,
        createdAt: { gte: startDate, lte: endDate },
        folio: {
          reservation: { propertyId: dto.propertyId, tenantId },
        },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalRefunds = refunds.reduce((sum, p) => sum + Number(p.amount), 0);
    const netRevenue = totalRevenue - totalRefunds;

    // Revenue by payment method
    const revenueByMethod: Record<string, number> = {};
    for (const p of payments) {
      revenueByMethod[p.method] = (revenueByMethod[p.method] ?? 0) + Number(p.amount);
    }

    // Folio charges in date range
    const folioItems = await this.prisma.folioItem.findMany({
      where: {
        isVoided: false,
        date: { gte: startDate, lte: endDate },
        folio: {
          reservation: { propertyId: dto.propertyId, tenantId },
        },
      },
    });

    const totalCharges = folioItems.reduce((sum, i) => sum + Number(i.totalPrice), 0);

    // Charges by category
    const chargesByCategory: Record<string, number> = {};
    for (const item of folioItems) {
      const cat = item.category ?? 'UNCATEGORIZED';
      chargesByCategory[cat] = (chargesByCategory[cat] ?? 0) + Number(item.totalPrice);
    }

    return {
      propertyId: dto.propertyId,
      propertyName: property.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
      totalRevenue,
      totalRefunds,
      netRevenue,
      totalCharges,
      revenueByMethod,
      chargesByCategory,
    };
  }

  async getDashboardStats(propertyId: string, tenantId: string) {
    // Cache-aside: 60s TTL for dashboard stats
    const cacheKey = `dashboard:${propertyId}:${tenantId}`;
    const cached = await this.redis.getJson<object>(cacheKey);
    if (cached) return cached;

    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${propertyId} not found`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalRooms,
      occupiedRooms,
      dirtyRooms,
      arrivalsToday,
      departuresToday,
      inHouseGuests,
      openMaintenanceTickets,
      pendingHousekeepingTasks,
    ] = await Promise.all([
      this.prisma.room.count({ where: { propertyId, isActive: true } }),
      this.prisma.room.count({ where: { propertyId, status: RoomStatus.OCCUPIED } }),
      this.prisma.room.count({ where: { propertyId, status: RoomStatus.DIRTY } }),
      this.prisma.reservation.count({
        where: {
          propertyId,
          tenantId,
          status: ReservationStatus.CONFIRMED,
          checkIn: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.reservation.count({
        where: {
          propertyId,
          tenantId,
          status: ReservationStatus.CHECKED_IN,
          checkOut: { gte: today, lt: tomorrow },
        },
      }),
      this.prisma.reservation.count({
        where: {
          propertyId,
          tenantId,
          status: ReservationStatus.CHECKED_IN,
        },
      }),
      this.prisma.maintenanceTicket.count({
        where: {
          propertyId,
          status: { in: ['OPEN', 'IN_PROGRESS'] as any },
        },
      }),
      this.prisma.housekeepingTask.count({
        where: {
          propertyId,
          status: { in: ['PENDING', 'IN_PROGRESS'] as any },
          scheduledDate: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    const occupancyRate =
      totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 10000) / 100 : 0;

    const result = {
      propertyId,
      propertyName: property.name,
      date: today.toISOString().split('T')[0],
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        dirty: dirtyRooms,
        available: totalRooms - occupiedRooms,
        occupancyRate,
      },
      reservations: {
        arrivalsToday,
        departuresToday,
        inHouse: inHouseGuests,
      },
      operations: {
        openMaintenanceTickets,
        pendingHousekeepingTasks,
      },
    };
    await this.redis.setJson(cacheKey, result, 60);
    return result;
  }

  async getReservationStats(dto: ReservationStatsReportDto, tenantId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${dto.propertyId} not found`);

    const where: any = { propertyId: dto.propertyId, tenantId };
    if (dto.startDate || dto.endDate) {
      where.checkIn = {};
      if (dto.startDate) where.checkIn.gte = new Date(dto.startDate);
      if (dto.endDate) where.checkIn.lte = new Date(dto.endDate);
    }

    const statusBreakdown = await this.prisma.reservation.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });
    const reservations = await this.prisma.reservation.findMany({
      where,
      select: {
        checkIn: true,
        checkOut: true,
        rooms: { select: { totalRate: true } },
      },
    });
    const totalRooms = await this.prisma.room.count({
      where: { propertyId: dto.propertyId, isActive: true },
    });

    const countByStatus = Object.fromEntries(
      statusBreakdown.map((status) => [status.status, status._count.id]),
    );
    const totalReservations = reservations.length;
    const totalRoomRevenue = reservations.reduce(
      (sum, reservation) =>
        sum +
        reservation.rooms.reduce(
          (roomSum, room) => roomSum + Number(room.totalRate ?? 0),
          0,
        ),
      0,
    );
    const totalNights = reservations.reduce((sum, reservation) => {
      const nights = Math.max(
        0,
        Math.ceil(
          (reservation.checkOut.getTime() - reservation.checkIn.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      return sum + nights;
    }, 0);
    const occupiedRoomNights = reservations.reduce((sum, reservation) => {
      const nights = Math.max(
        0,
        Math.ceil(
          (reservation.checkOut.getTime() - reservation.checkIn.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      return sum + nights * reservation.rooms.length;
    }, 0);

    return {
      propertyId: dto.propertyId,
      totalReservations,
      confirmedReservations: countByStatus[ReservationStatus.CONFIRMED] ?? 0,
      cancelledReservations: countByStatus[ReservationStatus.CANCELLED] ?? 0,
      noShows: countByStatus[ReservationStatus.NO_SHOW] ?? 0,
      averageStayLength: totalReservations > 0 ? totalNights / totalReservations : 0,
      averageDailyRate:
        occupiedRoomNights > 0 ? totalRoomRevenue / occupiedRoomNights : 0,
      revPAR: totalRooms > 0 ? totalRoomRevenue / totalRooms : 0,
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    };
  }
}
