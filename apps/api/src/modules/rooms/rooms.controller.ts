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
import { RoomsService } from './rooms.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomStatus } from '@Noblesse/shared';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Rooms')
@ApiBearerAuth()
@Controller('v1')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // ─── Room Types ───────────────────────────────────────────────

  @Post('properties/:propertyId/room-types')
  @RequirePermissions('rooms.create')
  @ApiOperation({ summary: 'Create a room type for a property' })
  @ApiParam({ name: 'propertyId', type: 'string' })
  createRoomType(
    @Param('propertyId') propertyId: string,
    @Body() dto: CreateRoomTypeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomsService.createRoomType(propertyId, dto, user);
  }

  @Get('properties/:propertyId/room-types')
  @RequirePermissions('rooms.read')
  @ApiOperation({ summary: 'Get all room types for a property' })
  @ApiParam({ name: 'propertyId', type: 'string' })
  getRoomTypes(
    @Param('propertyId') propertyId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomsService.getRoomTypes(propertyId, user);
  }

  @Patch('properties/:propertyId/room-types/:roomTypeId')
  @RequirePermissions('rooms.update')
  @ApiOperation({ summary: 'Update a room type' })
  updateRoomType(
    @Param('propertyId') propertyId: string,
    @Param('roomTypeId') roomTypeId: string,
    @Body() dto: Partial<CreateRoomTypeDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomsService.updateRoomType(propertyId, roomTypeId, dto, user);
  }

  // ─── Rooms ────────────────────────────────────────────────────

  @Post('rooms')
  @RequirePermissions('rooms.create')
  @ApiOperation({ summary: 'Create a new room' })
  create(@Body() dto: CreateRoomDto, @CurrentUser() user: JwtPayload) {
    return this.roomsService.create(dto, user);
  }

  @Get('properties/:propertyId/rooms')
  @RequirePermissions('rooms.read')
  @ApiOperation({ summary: 'Get all rooms for a property' })
  @ApiParam({ name: 'propertyId', type: 'string' })
  @ApiQuery({ name: 'status', enum: RoomStatus, required: false })
  @ApiQuery({ name: 'roomTypeId', type: 'string', required: false })
  @ApiQuery({ name: 'floor', type: 'number', required: false })
  findAll(
    @Param('propertyId') propertyId: string,
    @Query('status') status?: RoomStatus,
    @Query('roomTypeId') roomTypeId?: string,
    @Query('floor') floor?: number,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.roomsService.findAll(propertyId, { status, roomTypeId, floor }, user);
  }

  @Get('rooms/:id')
  @RequirePermissions('rooms.read')
  @ApiOperation({ summary: 'Get a room by ID' })
  @ApiParam({ name: 'id', type: 'string' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roomsService.findOne(id, user);
  }

  @Patch('rooms/:id')
  @RequirePermissions('rooms.update')
  @ApiOperation({ summary: 'Update a room' })
  @ApiParam({ name: 'id', type: 'string' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateRoomDto>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomsService.update(id, dto, user);
  }

  @Patch('rooms/:id/status')
  @RequirePermissions('rooms.update')
  @ApiOperation({ summary: 'Update room status' })
  @ApiParam({ name: 'id', type: 'string' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: RoomStatus,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomsService.updateStatus(id, status, user);
  }

  @Delete('rooms/:id')
  @RequirePermissions('rooms.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a room' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.roomsService.remove(id, user);
  }

  // ─── Availability ─────────────────────────────────────────────

  @Get('properties/:propertyId/rooms/availability')
  @RequirePermissions('rooms.read')
  @ApiOperation({ summary: 'Get room availability for a date range' })
  @ApiParam({ name: 'propertyId', type: 'string' })
  @ApiQuery({ name: 'checkIn', type: 'string', example: '2025-06-01' })
  @ApiQuery({ name: 'checkOut', type: 'string', example: '2025-06-05' })
  getAvailability(
    @Param('propertyId') propertyId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.roomsService.getAvailability(
      propertyId,
      new Date(checkIn),
      new Date(checkOut),
      user,
    );
  }
}