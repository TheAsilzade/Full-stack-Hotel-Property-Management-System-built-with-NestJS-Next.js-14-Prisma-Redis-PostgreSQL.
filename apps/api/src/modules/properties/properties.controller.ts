import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Properties')
@ApiBearerAuth()
@Controller('v1/properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @RequirePermissions('properties.create')
  @ApiOperation({ summary: 'Create a new property' })
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: JwtPayload) {
    return this.propertiesService.create(dto, user);
  }

  @Get()
  @RequirePermissions('properties.read')
  @ApiOperation({ summary: 'List all properties for the tenant' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.propertiesService.findAll(user);
  }

  @Get(':id')
  @RequirePermissions('properties.read')
  @ApiOperation({ summary: 'Get a property by ID (includes floors and room types)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.propertiesService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('properties.update')
  @ApiOperation({ summary: 'Update a property' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePropertyDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.propertiesService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('properties.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a property' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.propertiesService.remove(id, user);
  }

  // ─── Floors ──────────────────────────────────────────────────

  @Post(':id/floors')
  @RequirePermissions('properties.update')
  @ApiOperation({ summary: 'Add a floor to a property' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  createFloor(
    @Param('id') id: string,
    @Body() body: { number: number; name?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.propertiesService.createFloor(id, body.number, body.name, user);
  }

  @Get(':id/floors')
  @RequirePermissions('properties.read')
  @ApiOperation({ summary: 'Get all floors for a property' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getFloors(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.propertiesService.getFloors(id, user);
  }
}