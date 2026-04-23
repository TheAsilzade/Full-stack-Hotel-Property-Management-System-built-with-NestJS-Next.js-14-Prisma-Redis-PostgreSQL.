import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import { HousekeepingStatus, RoomStatus } from '@Noblesse/shared';

export class CreateHousekeepingTaskDto {
  @IsString()
  propertyId: string;

  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  taskType?: string;

  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateHousekeepingTaskDto {
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  taskType?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryHousekeepingDto {
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
  @IsEnum(HousekeepingStatus)
  status?: HousekeepingStatus;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  roomId?: string;
}

const TASK_SELECT = {
  id: true,
  propertyId: true,
  roomId: true,
  assignedToId: true,
  status: true,
  taskType: true,
  scheduledDate: true,
  startedAt: true,
  completedAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  room: {
    select: { id: true, number: true, floor: true, status: true },
  },
  assignedTo: {
    select: { id: true, firstName: true, lastName: true },
  },
};

@Injectable()
export class HousekeepingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHousekeepingTaskDto, tenantId: string) {
    // Verify property belongs to tenant
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${dto.propertyId} not found`);

    const task = await this.prisma.housekeepingTask.create({
      data: {
        propertyId: dto.propertyId,
        roomId: dto.roomId,
        assignedToId: dto.assignedToId ?? null,
        taskType: dto.taskType ?? 'FULL_CLEAN',
        scheduledDate: new Date(dto.scheduledDate),
        notes: dto.notes ?? null,
        status: HousekeepingStatus.PENDING,
      },
      select: TASK_SELECT,
    });

    return task;
  }

  async findAll(tenantId: string, query: QueryHousekeepingDto) {
    const page = Number.isFinite(query.page) && query.page! >= 1 ? Math.floor(query.page!) : 1;
    const limit =
      Number.isFinite(query.limit) && query.limit! >= 1
        ? Math.min(Math.floor(query.limit!), 100)
        : 20;
    const skip = (page - 1) * limit;

    const where: any = {
      property: { tenantId },
    };

    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.status) where.status = query.status;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.roomId) where.roomId = query.roomId;
    if (query.scheduledDate) {
      where.scheduledDate = new Date(query.scheduledDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.housekeepingTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ scheduledDate: 'asc' }, { createdAt: 'asc' }],
        select: TASK_SELECT,
      }),
      this.prisma.housekeepingTask.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, tenantId: string) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id, property: { tenantId } },
      select: TASK_SELECT,
    });
    if (!task) throw new NotFoundException(`Housekeeping task ${id} not found`);
    return task;
  }

  async update(id: string, tenantId: string, dto: UpdateHousekeepingTaskDto) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!task) throw new NotFoundException(`Housekeeping task ${id} not found`);

    if (task.status === HousekeepingStatus.COMPLETED || task.status === HousekeepingStatus.VERIFIED) {
      throw new BadRequestException(`Cannot update a ${task.status} task`);
    }

    return this.prisma.housekeepingTask.update({
      where: { id },
      data: {
        assignedToId: dto.assignedToId,
        taskType: dto.taskType,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        notes: dto.notes,
      },
      select: TASK_SELECT,
    });
  }

  async startTask(id: string, tenantId: string) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!task) throw new NotFoundException(`Housekeeping task ${id} not found`);

    if (task.status !== HousekeepingStatus.PENDING) {
      throw new BadRequestException(`Task is already ${task.status}`);
    }

    return this.prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: HousekeepingStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
      select: TASK_SELECT,
    });
  }

  async completeTask(id: string, tenantId: string, notes?: string) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!task) throw new NotFoundException(`Housekeeping task ${id} not found`);

    if (task.status !== HousekeepingStatus.IN_PROGRESS) {
      throw new BadRequestException(`Task must be IN_PROGRESS to complete`);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.housekeepingTask.update({
        where: { id },
        data: {
          status: HousekeepingStatus.COMPLETED,
          completedAt: new Date(),
          notes: notes ?? task.notes,
        },
        select: TASK_SELECT,
      }),
      // Update room status to CLEAN
      this.prisma.room.update({
        where: { id: task.roomId },
        data: { status: RoomStatus.CLEAN },
      }),
    ]);

    return updated;
  }

  async verifyTask(id: string, tenantId: string) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!task) throw new NotFoundException(`Housekeeping task ${id} not found`);

    if (task.status !== HousekeepingStatus.COMPLETED) {
      throw new BadRequestException(`Task must be COMPLETED to verify`);
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.housekeepingTask.update({
        where: { id },
        data: { status: HousekeepingStatus.VERIFIED },
        select: TASK_SELECT,
      }),
      // Update room status to INSPECTED
      this.prisma.room.update({
        where: { id: task.roomId },
        data: { status: RoomStatus.INSPECTED },
      }),
    ]);

    return updated;
  }

  async skipTask(id: string, tenantId: string, reason?: string) {
    const task = await this.prisma.housekeepingTask.findFirst({
      where: { id, property: { tenantId } },
    });
    if (!task) throw new NotFoundException(`Housekeeping task ${id} not found`);

    if (task.status === HousekeepingStatus.COMPLETED || task.status === HousekeepingStatus.VERIFIED) {
      throw new BadRequestException(`Cannot skip a ${task.status} task`);
    }

    return this.prisma.housekeepingTask.update({
      where: { id },
      data: {
        status: HousekeepingStatus.SKIPPED,
        notes: reason ?? task.notes,
      },
      select: TASK_SELECT,
    });
  }

  async getTodayTasks(propertyId: string, tenantId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId },
    });
    if (!property) throw new NotFoundException(`Property ${propertyId} not found`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.housekeepingTask.findMany({
      where: {
        propertyId,
        scheduledDate: { gte: today, lt: tomorrow },
      },
      select: TASK_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }
}
