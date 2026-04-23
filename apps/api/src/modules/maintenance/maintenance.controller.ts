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
  MaintenanceService,
  CreateMaintenanceTicketDto,
  UpdateMaintenanceTicketDto,
  ResolveMaintenanceTicketDto,
  QueryMaintenanceDto,
} from './maintenance.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { MaintenanceStatus, MaintenancePriority } from '@Noblesse/shared';

@ApiTags('Maintenance')
@ApiBearerAuth()
@Controller('v1/maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @RequirePermissions('maintenance.create')
  @ApiOperation({ summary: 'Create a maintenance ticket' })
  create(
    @Body() dto: CreateMaintenanceTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceService.create(dto, user.tenantId, user.sub);
  }

  @Get()
  @RequirePermissions('maintenance.read')
  @ApiOperation({ summary: 'List maintenance tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  @ApiQuery({ name: 'priority', required: false, enum: MaintenancePriority })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryMaintenanceDto,
  ) {
    return this.maintenanceService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('maintenance.read')
  @ApiOperation({ summary: 'Get maintenance ticket details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @RequirePermissions('maintenance.update')
  @ApiOperation({ summary: 'Update a maintenance ticket' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceService.update(id, user.tenantId, dto);
  }

  @Post(':id/start')
  @RequirePermissions('maintenance.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start work on a maintenance ticket' })
  startWork(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceService.startWork(id, user.tenantId);
  }

  @Post(':id/resolve')
  @RequirePermissions('maintenance.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a maintenance ticket' })
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveMaintenanceTicketDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceService.resolve(id, user.tenantId, dto);
  }

  @Post(':id/close')
  @RequirePermissions('maintenance.close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a resolved maintenance ticket' })
  close(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.maintenanceService.close(id, user.tenantId);
  }
}