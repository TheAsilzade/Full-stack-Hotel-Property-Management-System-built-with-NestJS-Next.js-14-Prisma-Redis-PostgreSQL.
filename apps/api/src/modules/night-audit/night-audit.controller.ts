import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NightAuditService, RunNightAuditDto } from './night-audit.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Night Audit')
@ApiBearerAuth()
@Controller('v1/night-audit')
export class NightAuditController {
  constructor(private readonly nightAuditService: NightAuditService) {}

  @Post('run')
  @RequirePermissions('night-audit.run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run the night audit for a property and date' })
  runAudit(
    @Body() dto: RunNightAuditDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.nightAuditService.runAudit(dto, user.tenantId, user.sub);
  }

  @Get('history')
  @RequirePermissions('night-audit.read')
  @ApiOperation({ summary: 'Get night audit history for a property' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @Query('propertyId') propertyId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.nightAuditService.getAuditHistory(
      propertyId,
      user.tenantId,
      page,
      limit,
    );
  }

  @Get('by-date')
  @RequirePermissions('night-audit.read')
  @ApiOperation({ summary: 'Get audit log for a specific date' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  getByDate(
    @Query('propertyId') propertyId: string,
    @Query('date') date: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.nightAuditService.getAuditByDate(propertyId, user.tenantId, date);
  }
}