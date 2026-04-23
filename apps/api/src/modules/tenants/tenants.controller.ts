import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('v1/tenant')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @RequirePermissions('tenant.read')
  @ApiOperation({ summary: 'Get current tenant details' })
  findCurrent(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.findCurrent(user);
  }

  @Patch()
  @RequirePermissions('tenant.update')
  @ApiOperation({ summary: 'Update current tenant' })
  update(@Body() dto: UpdateTenantDto, @CurrentUser() user: JwtPayload) {
    return this.tenantsService.update(dto, user);
  }

  @Get('settings')
  @RequirePermissions('tenant.read')
  @ApiOperation({ summary: 'Get tenant settings' })
  getSettings(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.getSettings(user);
  }

  @Patch('settings')
  @RequirePermissions('tenant.update')
  @ApiOperation({ summary: 'Update tenant settings (merged patch)' })
  updateSettings(
    @Body() settings: Record<string, unknown>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tenantsService.updateSettings(settings, user);
  }
}