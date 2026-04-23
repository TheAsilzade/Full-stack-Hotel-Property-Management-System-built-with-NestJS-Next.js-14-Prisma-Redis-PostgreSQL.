import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { AgeCategoryCountsDto, CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus, RoomStatus } from '@Noblesse/shared';

export class QueryReservationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  propertyId?: string;

  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @IsOptional()
  @IsString()
  checkInFrom?: string;

  @IsOptional()
  @IsString()
  checkInTo?: string;

  @IsOptional()
  @IsString()
  overlapStart?: string;

  @IsOptional()
  @IsString()
  overlapEnd?: string;

  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateReservationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsString()
  ratePlanId?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgeCategoryCountsDto)
  ageCategoryCounts?: AgeCategoryCountsDto;
}

export class CancelReservationDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

const RESERVATION_SELECT = {
  id: true,
  confirmationNumber: true,
  status: true,
  checkIn: true,
  checkOut: true,
  adults: true,
  children: true,
  primaryGuestId: true,
  tenantId: true,
  propertyId: true,
  sourceId: true,
  ratePlanId: true,
  totalAmount: true,
  paidAmount: true,
  specialRequests: true,
  internalNotes: true,
  notes: true,
  version: true,
  checkedInAt: true,
  checkedOutAt: true,
  cancelledAt: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  property: {
    select: { id: true, name: true, code: true },
  },
  source: {
    select: { id: true, name: true, code: true },
  },
  rooms: {
    select: {
      id: true,
      reservationId: true,
      roomId: true,
      roomTypeId: true,
      ratePerNight: true,
      totalRate: true,
      room: { select: { id: true, number: true, floor: true } },
      roomType: { select: { id: true, name: true, code: true } },
    },
  },
  guests: {
    select: {
      isPrimary: true,
      guest: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
};

const AGE_CATEGORY_MARKER = 'AGE_CATEGORIES:';
const CONFIRMATION_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getPropertyConfirmationPrefix(property: { name?: string | null; code?: string | null }): string {
    const configuredCode = (property.code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (configuredCode.length >= 3) return configuredCode.slice(0, 3);

    const words = (property.name ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const initials = words.map((word) => word[0]).join('');
    if (initials.length >= 3) return initials.slice(0, 3);

    const compactName = words.join('');
    return (initials + compactName + 'LUX').slice(0, 3).padEnd(3, 'X');
  }

  private generateConfirmationNumber(property: { name?: string | null; code?: string | null }): string {
    const prefix = this.getPropertyConfirmationPrefix(property);
    const digits = Math.floor(Math.random() * 90 + 10).toString();
    const letters = Array.from({ length: 2 }, () =>
      CONFIRMATION_LETTERS[Math.floor(Math.random() * CONFIRMATION_LETTERS.length)],
    ).join('');

    return `${prefix}-${digits}${letters}`;
  }

  private normalizeAgeCategoryCounts(
    ageCategoryCounts?: AgeCategoryCountsDto,
    fallbackAdults = 1,
    fallbackChildren = 0,
  ) {
    const toCount = (value: unknown, fallback: number) => {
      const count = Number(value ?? fallback);
      return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : fallback;
    };

    const adult18Plus = toCount(ageCategoryCounts?.adult18Plus, fallbackAdults);
    const child7To12 = toCount(ageCategoryCounts?.child7To12, fallbackChildren);
    const child3To6 = toCount(ageCategoryCounts?.child3To6, 0);
    const infant0To2 = toCount(ageCategoryCounts?.infant0To2, 0);

    return {
      adult18Plus,
      child7To12,
      child3To6,
      infant0To2,
    };
  }

  private getAdultChildTotals(ageCategoryCounts: ReturnType<typeof this.normalizeAgeCategoryCounts>) {
    return {
      adults: Math.max(1, ageCategoryCounts.adult18Plus),
      children:
        ageCategoryCounts.child7To12 +
        ageCategoryCounts.child3To6 +
        ageCategoryCounts.infant0To2,
    };
  }

  private extractAgeCategoryMetadata(internalNotes?: string | null) {
    const notes = internalNotes ?? '';
    const markerStart = notes.indexOf(`[${AGE_CATEGORY_MARKER}`);
    if (markerStart === -1) {
      return {
        ageCategoryCounts: undefined,
        internalNotes: internalNotes ?? null,
      };
    }

    const markerEnd = notes.indexOf(']', markerStart);
    if (markerEnd === -1) {
      return {
        ageCategoryCounts: undefined,
        internalNotes: internalNotes ?? null,
      };
    }

    const json = notes.slice(markerStart + AGE_CATEGORY_MARKER.length + 1, markerEnd);
    const cleanedNotes = `${notes.slice(0, markerStart)}${notes.slice(markerEnd + 1)}`.trim();

    try {
      return {
        ageCategoryCounts: this.normalizeAgeCategoryCounts(JSON.parse(json), 1, 0),
        internalNotes: cleanedNotes || null,
      };
    } catch {
      return {
        ageCategoryCounts: undefined,
        internalNotes: cleanedNotes || null,
      };
    }
  }

  private withAgeCategoryMetadata(
    internalNotes: string | null | undefined,
    ageCategoryCounts: ReturnType<typeof this.normalizeAgeCategoryCounts>,
  ) {
    const cleanNotes = this.extractAgeCategoryMetadata(internalNotes).internalNotes;
    const marker = `[${AGE_CATEGORY_MARKER}${JSON.stringify(ageCategoryCounts)}]`;
    return cleanNotes ? `${cleanNotes}\n${marker}` : marker;
  }

  private normalizePagination(page?: number, limit?: number) {
    const safePage = Number.isFinite(page) && page! >= 1 ? Math.floor(page!) : 1;
    const safeLimit =
      Number.isFinite(limit) && limit! >= 1 ? Math.min(Math.floor(limit!), 100) : 20;

    return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
  }

  private mapReservation(reservation: any) {
    const checkIn = new Date(reservation.checkIn);
    const checkOut = new Date(reservation.checkOut);
    const nights = Math.max(
      0,
      Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const totalAmount = Number(reservation.totalAmount ?? 0);
    const paidAmount = Number(reservation.paidAmount ?? 0);
    const metadata = this.extractAgeCategoryMetadata(reservation.internalNotes);
    const primaryGuest =
      reservation.guests?.find((guestLink: any) => guestLink.isPrimary)?.guest ??
      reservation.guests?.[0]?.guest ??
      null;

    return {
      ...reservation,
      internalNotes: metadata.internalNotes,
      ageCategoryCounts: metadata.ageCategoryCounts,
      totalAmount,
      paidAmount,
      balanceDue: totalAmount - paidAmount,
      nights,
      primaryGuest,
      source: reservation.source?.name ?? reservation.source?.code ?? null,
      rooms: (reservation.rooms ?? []).map((room: any) => ({
        ...room,
        ratePerNight: Number(room.ratePerNight ?? 0),
        totalRate: Number(room.totalRate ?? 0),
      })),
      guests: undefined,
    };
  }

  async create(dto: CreateReservationDto, tenantId: string, userId: string) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
      select: { id: true, name: true, code: true },
    });
    if (!property) {
      throw new NotFoundException(`Property ${dto.propertyId} not found`);
    }

    // Validate all rooms are available
    for (const roomDto of dto.rooms) {
      const conflict = await this.prisma.reservationRoom.findFirst({
        where: {
          roomId: roomDto.roomId,
          reservation: {
            status: {
              in: [
                ReservationStatus.CONFIRMED,
                ReservationStatus.CHECKED_IN,
                ReservationStatus.TENTATIVE,
              ],
            },
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        },
      });

      if (conflict) {
        throw new ConflictException(
          `Room ${roomDto.roomId} is not available for the selected dates`,
        );
      }
    }

    const totalAmount = dto.rooms.reduce((sum, r) => sum + r.totalRate, 0);
    const ageCategoryCounts = this.normalizeAgeCategoryCounts(
      dto.ageCategoryCounts,
      dto.adults ?? 1,
      dto.children ?? 0,
    );
    const guestTotals = this.getAdultChildTotals(ageCategoryCounts);

    // Determine primary guest
    const primaryGuest = dto.guests?.find((g) => g.isPrimary) ?? dto.guests?.[0];

    let confirmationNumber: string;
    let attempts = 0;
    do {
      confirmationNumber = this.generateConfirmationNumber(property);
      attempts++;
      if (attempts > 20) throw new BadRequestException('Could not generate unique confirmation number');
    } while (
      await this.prisma.reservation.findUnique({ where: { confirmationNumber } })
    );

    const reservation = await this.prisma.reservation.create({
      data: {
        tenantId,
        propertyId: dto.propertyId,
        confirmationNumber,
        status: ReservationStatus.CONFIRMED,
        checkIn,
        checkOut,
        adults: guestTotals.adults,
        children: guestTotals.children,
        primaryGuestId: primaryGuest?.guestId ?? null,
        sourceId: dto.sourceId ?? null,
        ratePlanId: dto.ratePlanId ?? null,
        totalAmount,
        specialRequests: dto.specialRequests ?? null,
        internalNotes: this.withAgeCategoryMetadata(dto.internalNotes, ageCategoryCounts),
        createdById: userId,
        rooms: {
          create: dto.rooms.map((r) => ({
            roomId: r.roomId,
            roomTypeId: r.roomTypeId,
            ratePerNight: r.ratePerNight,
            totalRate: r.totalRate,
          })),
        },
        guests: dto.guests
          ? {
              create: dto.guests.map((g) => ({
                guestId: g.guestId,
                isPrimary: g.isPrimary ?? false,
              })),
            }
          : undefined,
        logs: {
          create: {
            action: 'CREATED',
            performedById: userId,
            notes: `Created reservation ${confirmationNumber}`,
          },
        },
      },
      select: RESERVATION_SELECT,
    });

    return this.mapReservation(reservation);
  }

  async findAll(tenantId: string, query: QueryReservationsDto) {
    const { page, limit, skip } = this.normalizePagination(query.page, query.limit);

    const where: any = { tenantId };

    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.guestId) {
      where.guests = { some: { guestId: query.guestId } };
    }
    if (query.checkInFrom || query.checkInTo) {
      where.checkIn = {};
      if (query.checkInFrom) where.checkIn.gte = new Date(query.checkInFrom);
      if (query.checkInTo) where.checkIn.lte = new Date(query.checkInTo);
    }
    if (query.overlapStart || query.overlapEnd) {
      where.AND = [
        ...(where.AND ?? []),
        ...(query.overlapEnd ? [{ checkIn: { lt: new Date(query.overlapEnd) } }] : []),
        ...(query.overlapStart ? [{ checkOut: { gt: new Date(query.overlapStart) } }] : []),
      ];
    }
    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { confirmationNumber: { contains: search, mode: 'insensitive' } },
        {
          guests: {
            some: {
              guest: {
                OR: [
                  { firstName: { contains: search, mode: 'insensitive' } },
                  { lastName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { phone: { contains: search } },
                ],
              },
            },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: RESERVATION_SELECT,
      }),
      this.prisma.reservation.count({ where }),
    ]);

    return {
      data: data.map((reservation) => this.mapReservation(reservation)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
      select: {
        ...RESERVATION_SELECT,
        folios: {
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true,
          },
        },
        logs: {
          select: {
            id: true,
            action: true,
            performedById: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation ${id} not found`);
    }

    return this.mapReservation(reservation);
  }

  async findByConfirmationNumber(confirmationNumber: string, tenantId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { confirmationNumber, tenantId },
      select: RESERVATION_SELECT,
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation ${confirmationNumber} not found`,
      );
    }

    return this.mapReservation(reservation);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateReservationDto,
    userId: string,
  ) {
    const existing = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) throw new NotFoundException(`Reservation ${id} not found`);

    if (
      existing.status === ReservationStatus.CANCELLED ||
      existing.status === ReservationStatus.CHECKED_OUT
    ) {
      throw new BadRequestException(
        `Cannot update a ${existing.status} reservation`,
      );
    }

    const { ageCategoryCounts: incomingAgeCategoryCounts, ...reservationUpdate } = dto;
    const updateData: any = {
      ...reservationUpdate,
      version: { increment: 1 },
      logs: {
        create: {
          action: 'UPDATED',
          performedById: userId,
          notes: 'Reservation updated',
        },
      },
    };

    if (incomingAgeCategoryCounts) {
      const ageCategoryCounts = this.normalizeAgeCategoryCounts(
        incomingAgeCategoryCounts,
        existing.adults,
        existing.children,
      );
      const guestTotals = this.getAdultChildTotals(ageCategoryCounts);
      updateData.adults = guestTotals.adults;
      updateData.children = guestTotals.children;
      updateData.internalNotes = this.withAgeCategoryMetadata(
        dto.internalNotes ?? existing.internalNotes,
        ageCategoryCounts,
      );
    }

    const reservation = await this.prisma.reservation.update({
      where: { id },
      data: updateData,
      select: RESERVATION_SELECT,
    });

    return this.mapReservation(reservation);
  }

  async checkIn(id: string, tenantId: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: { rooms: true },
    });

    if (!reservation) throw new NotFoundException(`Reservation ${id} not found`);

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        `Cannot check in a reservation with status ${reservation.status}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CHECKED_IN,
          checkedInAt: new Date(),
          version: { increment: 1 },
          logs: {
            create: {
              action: 'CHECKED_IN',
              performedById: userId,
            },
          },
        },
        select: RESERVATION_SELECT,
      }),
      // Update all reserved rooms to OCCUPIED
      ...reservation.rooms.map((rr) =>
        this.prisma.room.update({
          where: { id: rr.roomId },
          data: { status: RoomStatus.OCCUPIED },
        }),
      ),
    ]);

    return this.mapReservation(updated);
  }

  async checkOut(id: string, tenantId: string, userId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
      include: { rooms: true },
    });

    if (!reservation) throw new NotFoundException(`Reservation ${id} not found`);

    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      throw new BadRequestException(
        `Cannot check out a reservation with status ${reservation.status}`,
      );
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CHECKED_OUT,
          checkedOutAt: new Date(),
          version: { increment: 1 },
          logs: {
            create: {
              action: 'CHECKED_OUT',
              performedById: userId,
            },
          },
        },
        select: RESERVATION_SELECT,
      }),
      // Update all rooms to DIRTY after checkout
      ...reservation.rooms.map((rr) =>
        this.prisma.room.update({
          where: { id: rr.roomId },
          data: { status: RoomStatus.DIRTY },
        }),
      ),
    ]);

    return this.mapReservation(updated);
  }

  async cancel(
    id: string,
    tenantId: string,
    dto: CancelReservationDto,
    userId: string,
  ) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, tenantId },
    });

    if (!reservation) throw new NotFoundException(`Reservation ${id} not found`);

    if (
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.CHECKED_OUT
    ) {
      throw new BadRequestException(
        `Cannot cancel a ${reservation.status} reservation`,
      );
    }

    if (reservation.status === ReservationStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Cannot cancel a checked-in reservation. Please check out first.',
      );
    }

    const updatedReservation = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.reason ?? null,
        version: { increment: 1 },
        logs: {
          create: {
            action: 'CANCELLED',
            performedById: userId,
            notes: dto.reason ?? 'Cancelled',
          },
        },
      },
      select: RESERVATION_SELECT,
    });

    return this.mapReservation(updatedReservation);
  }

  async getAvailability(
    propertyId: string,
    tenantId: string,
    checkIn: string,
    checkOut: string,
  ) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      throw new BadRequestException('Check-out must be after check-in');
    }

    // Cache-aside: 30s TTL for availability queries
    const cacheKey = `availability:${propertyId}:${checkIn}:${checkOut}`;
    const cached = await this.redis.getJson<ReturnType<typeof this.mapAvailabilityRooms>>(cacheKey);
    if (cached) return cached;

    // Get all rooms for the property
    const rooms = await this.prisma.room.findMany({
      where: { propertyId, isActive: true },
      include: {
        roomType: true,
        beds: true,
        reservationRooms: {
          where: {
            reservation: {
              status: {
                in: [
                  ReservationStatus.CONFIRMED,
                  ReservationStatus.CHECKED_IN,
                  ReservationStatus.TENTATIVE,
                ],
              },
              checkIn: { lt: checkOutDate },
              checkOut: { gt: checkInDate },
            },
          },
        },
      },
    });

    const result = this.mapAvailabilityRooms(rooms);
    await this.redis.setJson(cacheKey, result, 30);
    return result;
  }

  private mapAvailabilityRooms(rooms: any[]) {
    return rooms.map((room) => ({
      id: room.id,
      number: room.number,
      floor: room.floor,
      status: room.status,
      isAvailable: room.reservationRooms.length === 0 && room.status !== RoomStatus.OUT_OF_ORDER && room.status !== RoomStatus.OUT_OF_SERVICE,
      roomType: {
        id: room.roomType.id,
        name: room.roomType.name,
        code: room.roomType.code,
        baseRate: room.roomType.baseRate,
        maxOccupancy: room.roomType.maxOccupancy,
      },
      beds: room.beds,
    }));
  }
}
