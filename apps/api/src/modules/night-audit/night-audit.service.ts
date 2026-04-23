import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsDateString, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationStatus } from '@Noblesse/shared';

export class RunNightAuditDto {
  @IsString()
  propertyId: string;

  @IsDateString()
  auditDate: string; // YYYY-MM-DD
}

@Injectable()
export class NightAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async runAudit(dto: RunNightAuditDto, tenantId: string, userId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${dto.propertyId} not found`);

    const auditDate = new Date(dto.auditDate);
    auditDate.setHours(0, 0, 0, 0);

    // Check if audit already run for this date
    const existing = await this.prisma.nightAuditLog.findUnique({
      where: {
        propertyId_auditDate: {
          propertyId: dto.propertyId,
          auditDate,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Night audit already completed for ${dto.auditDate}`,
      );
    }

    const nextDay = new Date(auditDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // 1. Post room charges for in-house reservations
    const inHouseReservations = await this.prisma.reservation.findMany({
      where: {
        propertyId: dto.propertyId,
        tenantId,
        status: ReservationStatus.CHECKED_IN,
        checkIn: { lte: auditDate },
        checkOut: { gt: auditDate },
      },
      include: {
        rooms: {
          include: { roomType: true },
        },
        folios: {
          where: { status: 'OPEN' as any },
          take: 1,
        },
      },
    });

    let roomChargesPosted = 0;
    let totalRoomRevenue = 0;

    for (const reservation of inHouseReservations) {
      // Get or create open folio
      let folio = reservation.folios[0];
      if (!folio) {
        folio = await this.prisma.folio.create({
          data: {
            reservationId: reservation.id,
            status: 'OPEN' as any,
          },
        });
      }

      // Post room charge for each room
      for (const reservationRoom of reservation.rooms) {
        const ratePerNight = Number(reservationRoom.ratePerNight);
        await this.prisma.folioItem.create({
          data: {
            folioId: folio.id,
            description: `${reservationRoom.roomType.name} - Night of ${dto.auditDate}`,
            quantity: 1,
            unitPrice: ratePerNight,
            totalPrice: ratePerNight,
            date: auditDate,
            category: 'ROOM_CHARGE',
          },
        });
        totalRoomRevenue += ratePerNight;
        roomChargesPosted++;
      }
    }

    // 2. Handle no-shows: reservations with checkIn = auditDate still CONFIRMED
    const noShows = await this.prisma.reservation.findMany({
      where: {
        propertyId: dto.propertyId,
        tenantId,
        status: ReservationStatus.CONFIRMED,
        checkIn: { gte: auditDate, lt: nextDay },
      },
    });

    let noShowsProcessed = 0;
    for (const reservation of noShows) {
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.NO_SHOW,
          version: { increment: 1 },
          logs: {
            create: {
              action: 'NO_SHOW',
              performedById: userId,
              notes: `Night audit ${dto.auditDate}`,
            },
          },
        },
      });
      noShowsProcessed++;
    }

    // 3. Collect summary stats
    const totalRooms = await this.prisma.room.count({
      where: { propertyId: dto.propertyId, isActive: true },
    });

    const occupiedRooms = inHouseReservations.reduce(
      (sum, r) => sum + r.rooms.length,
      0,
    );

    const occupancyRate =
      totalRooms > 0
        ? Math.round((occupiedRooms / totalRooms) * 10000) / 100
        : 0;

    const summary = {
      auditDate: dto.auditDate,
      totalRooms,
      occupiedRooms,
      occupancyRate,
      inHouseReservations: inHouseReservations.length,
      roomChargesPosted,
      totalRoomRevenue,
      noShowsProcessed,
    };

    // 4. Create audit log
    const auditLog = await this.prisma.nightAuditLog.create({
      data: {
        propertyId: dto.propertyId,
        auditDate,
        performedById: userId,
        status: 'COMPLETED',
        summary: summary as any,
      },
    });

    return {
      ...auditLog,
      summary,
    };
  }

  async getAuditHistory(propertyId: string, tenantId: string, page?: number, limit?: number) {
    page = Number.isFinite(page) && page! >= 1 ? Math.floor(page!) : 1;
    limit =
      Number.isFinite(limit) && limit! >= 1 ? Math.min(Math.floor(limit!), 100) : 20;
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${propertyId} not found`);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.nightAuditLog.findMany({
        where: { propertyId },
        skip,
        take: limit,
        orderBy: { auditDate: 'desc' },
      }),
      this.prisma.nightAuditLog.count({ where: { propertyId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAuditByDate(propertyId: string, tenantId: string, auditDate: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${propertyId} not found`);

    const date = new Date(auditDate);
    date.setHours(0, 0, 0, 0);

    const log = await this.prisma.nightAuditLog.findUnique({
      where: {
        propertyId_auditDate: { propertyId, auditDate: date },
      },
    });

    if (!log) {
      throw new NotFoundException(`No audit found for ${auditDate}`);
    }

    return log;
  }
}
