import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrent(currentUser: JwtPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        currency: true,
        timezone: true,
        locale: true,
        isActive: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            properties: true,
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(dto: UpdateTenantDto, currentUser: JwtPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const updated = await this.prisma.tenant.update({
      where: { id: currentUser.tenantId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.timezone && { timezone: dto.timezone }),
        ...(dto.locale && { locale: dto.locale }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        currency: true,
        timezone: true,
        locale: true,
        isActive: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async getSettings(currentUser: JwtPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
      select: { settings: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant.settings ?? {};
  }

  async updateSettings(settings: Record<string, unknown>, currentUser: JwtPayload) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: currentUser.tenantId },
      select: { settings: true },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const merged = { ...(tenant.settings as Record<string, unknown> ?? {}), ...settings };

    const updated = await this.prisma.tenant.update({
      where: { id: currentUser.tenantId },
      data: { settings: merged as any },
      select: { settings: true },
    });

    return updated.settings;
  }
}