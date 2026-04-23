import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  ReportsService,
  OccupancyReportDto,
  ReservationStatsReportDto,
  RevenueReportDto,
} from './reports.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('v1/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get dashboard statistics for a property' })
  @ApiQuery({ name: 'propertyId', required: true })
  getDashboardStats(
    @Query('propertyId') propertyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getDashboardStats(propertyId, user.tenantId);
  }

  @Get('occupancy')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get occupancy report for a date range' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'startDate', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: true, description: 'YYYY-MM-DD' })
  getOccupancyReport(
    @Query() dto: OccupancyReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getOccupancyReport(dto, user.tenantId);
  }

  @Get('revenue')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get revenue report for a date range' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'startDate', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: true, description: 'YYYY-MM-DD' })
  getRevenueReport(
    @Query() dto: RevenueReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getRevenueReport(dto, user.tenantId);
  }

  @Get('reservations/stats')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get reservation status breakdown for a property' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'startDate', required: false, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'endDate', required: false, description: 'YYYY-MM-DD' })
  getReservationStats(
    @Query() dto: ReservationStatsReportDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getReservationStats(dto, user.tenantId);
  }
}
