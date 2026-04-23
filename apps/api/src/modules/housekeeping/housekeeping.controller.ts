import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  HousekeepingService,
  CreateHousekeepingTaskDto,
  UpdateHousekeepingTaskDto,
  QueryHousekeepingDto,
} from './housekeeping.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { HousekeepingStatus } from '@Noblesse/shared';

@ApiTags('Housekeeping')
@ApiBearerAuth()
@Controller('v1/housekeeping')
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Post()
  @RequirePermissions('housekeeping.create')
  @ApiOperation({ summary: 'Create a housekeeping task' })
  create(
    @Body() dto: CreateHousekeepingTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.create(dto, user.tenantId);
  }

  @Get()
  @RequirePermissions('housekeeping.read')
  @ApiOperation({ summary: 'List housekeeping tasks' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: HousekeepingStatus })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'scheduledDate', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryHousekeepingDto,
  ) {
    return this.housekeepingService.findAll(user.tenantId, query);
  }

  @Get('today')
  @RequirePermissions('housekeeping.read')
  @ApiOperation({ summary: "Get today's housekeeping tasks for a property" })
  @ApiQuery({ name: 'propertyId', required: true })
  getTodayTasks(
    @Query('propertyId') propertyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.getTodayTasks(propertyId, user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('housekeeping.read')
  @ApiOperation({ summary: 'Get housekeeping task details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @RequirePermissions('housekeeping.update')
  @ApiOperation({ summary: 'Update a housekeeping task' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHousekeepingTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.update(id, user.tenantId, dto);
  }

  @Post(':id/start')
  @RequirePermissions('housekeeping.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start a housekeeping task' })
  startTask(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.startTask(id, user.tenantId);
  }

  @Post(':id/complete')
  @RequirePermissions('housekeeping.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a housekeeping task' })
  completeTask(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.completeTask(id, user.tenantId, notes);
  }

  @Post(':id/verify')
  @RequirePermissions('housekeeping.verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a completed housekeeping task' })
  verifyTask(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.verifyTask(id, user.tenantId);
  }

  @Post(':id/skip')
  @RequirePermissions('housekeeping.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip a housekeeping task' })
  skipTask(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.housekeepingService.skipTask(id, user.tenantId, reason);
  }
}