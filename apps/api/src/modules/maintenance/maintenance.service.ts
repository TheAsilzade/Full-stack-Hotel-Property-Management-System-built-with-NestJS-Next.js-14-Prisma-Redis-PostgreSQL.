import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { MaintenanceStatus, MaintenancePriority } from '@Noblesse/shared';

export class CreateMaintenanceTicketDto {
  @IsString()
  propertyId: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class UpdateMaintenanceTicketDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;
}

export class ResolveMaintenanceTicketDto {
  @IsString()
  resolution: string;
}

export class QueryMaintenanceDto {
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
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  roomId?: string;
}

const TICKET_SELECT = {
  id: true,
  propertyId: true,
  roomId: true,
  reportedById: true,
  assignedToId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  resolvedAt: true,
  resolution: true,
  createdAt: true,
  updatedAt: true,
  property: {
    select: { id: true, name: true, code: true },
  },
  room: {
    select: { id: true, number: true, floor: true },
  },
  reportedBy: {
    select: { id: true, firstName: true, lastName: true },
  },
  assignedTo: {
    select: { id: true, firstName: true, lastName: true },
  },
};

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaintenanceTicketDto, tenantId: string, userId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${dto.propertyId} not found`);

    return this.prisma.maintenanceTicket.create({
      data: {
        propertyId: dto.propertyId,
        roomId: dto.roomId ?? null,
        reportedById: userId,
        assignedToId: dto.assignedToId ?? null,
        title: dto.title,
        description: dto.description,
        priority: (dto.priority as any) ?? MaintenancePriority.MEDIUM,
        status: MaintenanceStatus.OPEN,
      },
      select: TICKET_SELECT,
    });
  }

  async findAll(tenantId: string, query: QueryMaintenanceDto) {
    const page = Number.isFinite(query.page) && query.page! >= 1 ? Math.floor(query.page!) : 1;
    const limit =
      Number.isFinite(query.limit) && query.limit! >= 1
        ? Math.min(Math.floor(query.limit!), 100)
        : 20;
    const skip = (page - 1) * limit;

    const where: any = { property: { tenantId } };

    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.roomId) where.roomId = query.roomId;

    const [data, total] = await Promise.all([
      this.prisma.maintenanceTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        select: TICKET_SELECT,
      }),
      this.prisma.maintenanceTicket.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const ticket = await this.prisma.maintenanceTicket.findFirst({
      where: { id, property: { tenantId } },
      select: TICKET_SELECT,
    });
    if (!ticket) throw new NotFoundException(`Maintenance ticket ${id} not found`);
    return ticket;
  }

  async update(id: string, tenantId: string, dto: UpdateMaintenanceTicketDto) {
    const ticket = await this.prisma.maintenanceTicket.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!ticket) throw new NotFoundException(`Maintenance ticket ${id} not found`);

    if (ticket.status === MaintenanceStatus.CLOSED) {
      throw new BadRequestException('Cannot update a closed ticket');
    }

    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority as any,
        assignedToId: dto.assignedToId,
      },
      select: TICKET_SELECT,
    });
  }

  async startWork(id: string, tenantId: string) {
    const ticket = await this.prisma.maintenanceTicket.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!ticket) throw new NotFoundException(`Maintenance ticket ${id} not found`);

    if (ticket.status !== MaintenanceStatus.OPEN) {
      throw new BadRequestException(`Ticket is already ${ticket.status}`);
    }

    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: { status: MaintenanceStatus.IN_PROGRESS },
      select: TICKET_SELECT,
    });
  }

  async resolve(id: string, tenantId: string, dto: ResolveMaintenanceTicketDto) {
    const ticket = await this.prisma.maintenanceTicket.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!ticket) throw new NotFoundException(`Maintenance ticket ${id} not found`);

    if (ticket.status === MaintenanceStatus.CLOSED || ticket.status === MaintenanceStatus.RESOLVED) {
      throw new BadRequestException(`Ticket is already ${ticket.status}`);
    }

    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status: MaintenanceStatus.RESOLVED,
        resolvedAt: new Date(),
        resolution: dto.resolution,
      },
      select: TICKET_SELECT,
    });
  }

  async close(id: string, tenantId: string) {
    const ticket = await this.prisma.maintenanceTicket.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!ticket) throw new NotFoundException(`Maintenance ticket ${id} not found`);

    if (ticket.status !== MaintenanceStatus.RESOLVED) {
      throw new BadRequestException('Ticket must be RESOLVED before closing');
    }

    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: { status: MaintenanceStatus.CLOSED },
      select: TICKET_SELECT,
    });
  }
}
