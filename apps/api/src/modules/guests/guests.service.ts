import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const GUEST_SELECT = {
  id: true,
  tenantId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  nationality: true,
  idType: true,
  idNumber: true,
  dateOfBirth: true,
  gender: true,
  address: true,
  city: true,
  country: true,
  notes: true,
  totalStays: true,
  totalSpend: true,
  createdAt: true,
  updatedAt: true,
};

function mapGuest(guest: any) {
  return {
    ...guest,
    fullName: `${guest.firstName ?? ''} ${guest.lastName ?? ''}`.trim(),
    totalSpend: Number(guest.totalSpend ?? 0),
  };
}

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGuestDto, currentUser: JwtPayload) {
    const guest = await this.prisma.guest.create({
      data: {
        ...dto,
        tenantId: currentUser.tenantId,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      select: GUEST_SELECT,
    });

    return mapGuest(guest);
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      nationality?: string;
    },
    currentUser: JwtPayload,
  ) {
    const page = Number.isFinite(query.page) && query.page! >= 1 ? Math.floor(query.page!) : 1;
    const limit =
      Number.isFinite(query.limit) && query.limit! >= 1
        ? Math.min(Math.floor(query.limit!), 100)
        : 20;
    const { search, nationality } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (search) {
      const parts = search.trim().split(/\s+/);
      const singleTermClauses = [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { idNumber: { contains: search } },
      ];
      // Support "FirstName LastName" or "LastName FirstName" searches
      const multiTermClauses = parts.length >= 2 ? [
        {
          AND: [
            { firstName: { contains: parts[0], mode: 'insensitive' as const } },
            { lastName: { contains: parts.slice(1).join(' '), mode: 'insensitive' as const } },
          ],
        },
        {
          AND: [
            { firstName: { contains: parts.slice(1).join(' '), mode: 'insensitive' as const } },
            { lastName: { contains: parts[0], mode: 'insensitive' as const } },
          ],
        },
      ] : [];
      where.OR = [...singleTermClauses, ...multiTermClauses];
    }

    if (nationality) where.nationality = nationality;

    const [guests, total] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        select: GUEST_SELECT,
        skip,
        take: limit,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      }),
      this.prisma.guest.count({ where }),
    ]);

    return {
      data: guests.map(mapGuest),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const guest = await this.prisma.guest.findFirst({
      where: { id, tenantId: currentUser.tenantId, deletedAt: null },
      select: {
        ...GUEST_SELECT,
        reservationGuests: {
          select: {
            reservation: {
              select: {
                id: true,
                confirmationNumber: true,
                checkIn: true,
                checkOut: true,
                status: true,
                property: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { reservation: { checkIn: 'desc' } },
          take: 10,
        },
      },
    });

    if (!guest) throw new NotFoundException('Guest not found');
    return mapGuest(guest);
  }

  async update(id: string, dto: Partial<CreateGuestDto>, currentUser: JwtPayload) {
    const existingGuest = await this.prisma.guest.findFirst({
      where: { id, tenantId: currentUser.tenantId, deletedAt: null },
    });
    if (!existingGuest) throw new NotFoundException('Guest not found');

    const guest = await this.prisma.guest.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      select: GUEST_SELECT,
    });

    return mapGuest(guest);
  }

  async remove(id: string, currentUser: JwtPayload) {
    const guest = await this.prisma.guest.findFirst({
      where: { id, tenantId: currentUser.tenantId, deletedAt: null },
    });
    if (!guest) throw new NotFoundException('Guest not found');

    await this.prisma.guest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Guest deleted successfully' };
  }

  async getStayHistory(id: string, currentUser: JwtPayload) {
    const guest = await this.prisma.guest.findFirst({
      where: { id, tenantId: currentUser.tenantId, deletedAt: null },
    });
    if (!guest) throw new NotFoundException('Guest not found');

    return this.prisma.reservationGuest.findMany({
      where: { guestId: id },
      select: {
        isPrimary: true,
        reservation: {
          select: {
            id: true,
            confirmationNumber: true,
            checkIn: true,
            checkOut: true,
            status: true,
            totalAmount: true,
            property: { select: { id: true, name: true } },
            rooms: {
              select: {
                room: { select: { number: true } },
                roomType: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { reservation: { checkIn: 'desc' } },
    });
  }
}
