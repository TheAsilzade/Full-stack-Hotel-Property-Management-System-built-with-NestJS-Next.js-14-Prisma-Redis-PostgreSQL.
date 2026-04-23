import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GuestsService } from './guests.service';
import { CreateGuestDto } from './dto/create-guest.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Guests')
@ApiBearerAuth()
@Controller('v1/guests')
export class GuestsController {
  constructor(private readonly guestsService: GuestsService) {}

  @Post()
  @RequirePermissions('guests.create')
  @ApiOperation({ summary: 'Create a new guest profile' })
  create(@Body() dto: CreateGuestDto, @CurrentUser() user: JwtPayload) {
    return this.guestsService.create(dto, user);
  }

  @Get()
  @RequirePermissions('guests.read')
  @ApiOperation({ summary: 'List all guests with search and pagination' })
  @ApiQuery({ name: 'page', type: 'number', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @ApiQuery({ name: 'search', type: 'string', required: false })
  @ApiQuery({ name: 'nationality', type: 'string', required: false })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('nationality') nationality?: string,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.guestsService.findAll({ page, limit, search, nationality }, user);
  }

  @Get(':id')
  @RequirePermissions('guests.read')
  @ApiOperation({ summary: 'Get a guest by ID (includes recent reservations)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.guestsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('guests.update')
  @ApiOperation({ summary: 'Update a guest profile' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateGuestDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guestsService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('guests.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a guest profile' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.guestsService.remove(id, user);
  }

  @Get(':id/stay-history')
  @RequirePermissions('guests.read')
  @ApiOperation({ summary: 'Get full stay history for a guest' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getStayHistory(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.guestsService.getStayHistory(id, user);
  }
}