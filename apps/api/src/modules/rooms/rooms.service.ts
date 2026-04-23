import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomStatus } from '@Noblesse/shared';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const ROOM_SELECT = {
  id: true,
  propertyId: true,
  roomTypeId: true,
  floorId: true,
  number: true,
  floor: true,
  status: true,
  isActive: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  roomType: {
    select: { id: true, name: true, code: true, maxOccupancy: true, baseRate: true, amenities: true, description: true },
  },
  beds: {
    select: { id: true, type: true, count: true },
  },
};

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Room Types ───────────────────────────────────────────────

  async createRoomType(propertyId: string, dto: CreateRoomTypeDto, currentUser: JwtPayload) {
    await this.assertPropertyAccess(propertyId, currentUser);

    const existing = await this.prisma.roomType.findFirst({
      where: { propertyId, code: dto.code },
    });
    if (existing) throw new ConflictException(`Room type code '${dto.code}' already exists`);

    return this.prisma.roomType.create({
      data: {
        propertyId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        maxOccupancy: dto.maxOccupancy ?? 2,
        baseRate: dto.baseRate,
        amenities: dto.amenities ?? [],
        imageUrls: dto.imageUrls ?? [],
      },
    });
  }

  async getRoomTypes(propertyId: string, currentUser: JwtPayload) {
    await this.assertPropertyAccess(propertyId, currentUser);
    return this.prisma.roomType.findMany({
      where: { propertyId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateRoomType(
    propertyId: string,
    roomTypeId: string,
    dto: Partial<CreateRoomTypeDto>,
    currentUser: JwtPayload,
  ) {
    await this.assertPropertyAccess(propertyId, currentUser);
    const rt = await this.prisma.roomType.findFirst({ where: { id: roomTypeId, propertyId } });
    if (!rt) throw new NotFoundException('Room type not found');

    return this.prisma.roomType.update({
      where: { id: roomTypeId },
      data: dto,
    });
  }

  // ─── Rooms ────────────────────────────────────────────────────

  async create(dto: CreateRoomDto, currentUser: JwtPayload) {
    await this.assertPropertyAccess(dto.propertyId, currentUser);

    const existing = await this.prisma.room.findFirst({
      where: { propertyId: dto.propertyId, number: dto.number },
    });
    if (existing) throw new ConflictException(`Room number '${dto.number}' already exists`);

    const { beds, ...roomData } = dto;

    return this.prisma.room.create({
      data: {
        ...roomData,
        ...(beds?.length && {
          beds: {
            create: beds.map((b) => ({ type: b.type, count: b.count ?? 1 })),
          },
        }),
      },
      select: ROOM_SELECT,
    });
  }

  async findAll(
    propertyId: string,
    filters: { status?: RoomStatus; roomTypeId?: string; floor?: number },
    currentUser: JwtPayload,
  ) {
    await this.assertPropertyAccess(propertyId, currentUser);

    const where: any = { propertyId, isActive: true };
    if (filters.status) where.status = filters.status;
    if (filters.roomTypeId) where.roomTypeId = filters.roomTypeId;
    if (Number.isFinite(filters.floor) && filters.floor! >= 0) {
      where.floor = Math.floor(filters.floor!);
    }

    return this.prisma.room.findMany({
      where,
      select: ROOM_SELECT,
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
    });
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      select: {
        ...ROOM_SELECT,
        property: { select: { id: true, name: true, tenantId: true } },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.property.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async update(id: string, dto: Partial<CreateRoomDto>, currentUser: JwtPayload) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { property: { select: { tenantId: true } } },
    });
    if (!room || room.property.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Room not found');
    }

    if (dto.number && dto.number !== room.number) {
      const existing = await this.prisma.room.findFirst({
        where: { propertyId: room.propertyId, number: dto.number },
      });
      if (existing) throw new ConflictException(`Room number '${dto.number}' already exists`);
    }

    const { beds, ...roomData } = dto;

    return this.prisma.room.update({
      where: { id },
      data: roomData,
      select: ROOM_SELECT,
    });
  }

  async updateStatus(id: string, status: RoomStatus, currentUser: JwtPayload) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { property: { select: { tenantId: true } } },
    });
    if (!room || room.property.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Room not found');
    }

    return this.prisma.room.update({
      where: { id },
      data: { status },
      select: ROOM_SELECT,
    });
  }

  async remove(id: string, currentUser: JwtPayload) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { property: { select: { tenantId: true } } },
    });
    if (!room || room.property.tenantId !== currentUser.tenantId) {
      throw new NotFoundException('Room not found');
    }

    await this.prisma.room.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Room deactivated successfully' };
  }

  // ─── Availability ─────────────────────────────────────────────

  async getAvailability(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    currentUser: JwtPayload,
  ) {
    await this.assertPropertyAccess(propertyId, currentUser);

    // Get all active rooms
    const rooms = await this.prisma.room.findMany({
      where: { propertyId, isActive: true, status: { not: RoomStatus.OUT_OF_ORDER } },
      select: ROOM_SELECT,
    });

    // Get rooms that have overlapping reservations
    const occupiedRoomIds = await this.prisma.reservationRoom.findMany({
      where: {
        reservation: {
          propertyId,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      },
      select: { roomId: true },
    });

    const occupiedSet = new Set(occupiedRoomIds.map((r) => r.roomId));

    return rooms.map((room) => ({
      ...room,
      isAvailable: !occupiedSet.has(room.id) && room.status === RoomStatus.AVAILABLE,
    }));
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async assertPropertyAccess(propertyId: string, currentUser: JwtPayload) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId: currentUser.tenantId },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }
}
