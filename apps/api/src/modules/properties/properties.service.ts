import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const PROPERTY_SELECT = {
  id: true,
  tenantId: true,
  name: true,
  code: true,
  address: true,
  city: true,
  state: true,
  country: true,
  postalCode: true,
  phone: true,
  email: true,
  website: true,
  timezone: true,
  currencyCode: true,
  logoUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      rooms: true,
      floors: true,
    },
  },
};

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyDto, currentUser: JwtPayload) {
    const existing = await this.prisma.property.findFirst({
      where: { code: dto.code, tenantId: currentUser.tenantId },
    });
    if (existing) throw new ConflictException(`Property code '${dto.code}' already in use`);

    return this.prisma.property.create({
      data: {
        ...dto,
        tenantId: currentUser.tenantId,
      },
      select: PROPERTY_SELECT,
    });
  }

  async findAll(currentUser: JwtPayload) {
    const properties = await this.prisma.property.findMany({
      where: { tenantId: currentUser.tenantId },
      select: PROPERTY_SELECT,
      orderBy: { name: 'asc' },
    });
    return properties;
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId: currentUser.tenantId },
      select: {
        ...PROPERTY_SELECT,
        floors: {
          select: { id: true, number: true, name: true },
          orderBy: { number: 'asc' },
        },
        roomTypes: {
          select: {
            id: true,
            name: true,
            code: true,
            maxOccupancy: true,
            baseRate: true,
          },
        },
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, dto: Partial<CreatePropertyDto>, currentUser: JwtPayload) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId: currentUser.tenantId },
    });
    if (!property) throw new NotFoundException('Property not found');

    if (dto.code && dto.code !== property.code) {
      const existing = await this.prisma.property.findFirst({
        where: { code: dto.code, tenantId: currentUser.tenantId },
      });
      if (existing) throw new ConflictException(`Property code '${dto.code}' already in use`);
    }

    return this.prisma.property.update({
      where: { id },
      data: dto,
      select: PROPERTY_SELECT,
    });
  }

  async remove(id: string, currentUser: JwtPayload) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId: currentUser.tenantId },
    });
    if (!property) throw new NotFoundException('Property not found');

    // Soft-delete by deactivating
    await this.prisma.property.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Property deactivated successfully' };
  }

  // ─── Floors ──────────────────────────────────────────────────

  async createFloor(propertyId: string, number: number, name: string | undefined, currentUser: JwtPayload) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId: currentUser.tenantId },
    });
    if (!property) throw new NotFoundException('Property not found');

    const existing = await this.prisma.floor.findFirst({
      where: { propertyId, number },
    });
    if (existing) throw new ConflictException(`Floor ${number} already exists`);

    return this.prisma.floor.create({
      data: { propertyId, number, name },
    });
  }

  async getFloors(propertyId: string, currentUser: JwtPayload) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId: currentUser.tenantId },
    });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.floor.findMany({
      where: { propertyId },
      orderBy: { number: 'asc' },
    });
  }
}