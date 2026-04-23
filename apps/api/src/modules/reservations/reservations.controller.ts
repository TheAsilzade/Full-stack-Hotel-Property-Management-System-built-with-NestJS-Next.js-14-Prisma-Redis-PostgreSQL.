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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  ReservationsService,
  QueryReservationsDto,
  UpdateReservationDto,
  CancelReservationDto,
} from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ReservationStatus } from '@Noblesse/shared';

@ApiTags('Reservations')
@ApiBearerAuth()
@Controller('v1/reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @RequirePermissions('reservations.create')
  @ApiOperation({ summary: 'Create a new reservation' })
  create(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationsService.create(dto, user.tenantId, user.sub);
  }

  @Get()
  @RequirePermissions('reservations.read')
  @ApiOperation({ summary: 'List reservations with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ReservationStatus })
  @ApiQuery({ name: 'checkInFrom', required: false })
  @ApiQuery({ name: 'checkInTo', required: false })
  @ApiQuery({ name: 'overlapStart', required: false })
  @ApiQuery({ name: 'overlapEnd', required: false })
  @ApiQuery({ name: 'guestId', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryReservationsDto,
  ) {
    return this.reservationsService.findAll(user.tenantId, query);
  }

  @Get('availability')
  @RequirePermissions('reservations.read')
  @ApiOperation({ summary: 'Check room availability for date range' })
  @ApiQuery({ name: 'propertyId', required: true })
  @ApiQuery({ name: 'checkIn', required: true })
  @ApiQuery({ name: 'checkOut', required: true })
  getAvailability(
    @CurrentUser() user: JwtPayload,
    @Query('propertyId') propertyId: string,
    @Query('checkIn') checkIn: string,
    @Query('checkOut') checkOut: string,
  ) {
    return this.reservationsService.getAvailability(
      propertyId,
      user.tenantId,
      checkIn,
      checkOut,
    );
  }

  @Get('confirmation/:confirmationNumber')
  @RequirePermissions('reservations.read')
  @ApiOperation({ summary: 'Find reservation by confirmation number' })
  findByConfirmation(
    @Param('confirmationNumber') confirmationNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationsService.findByConfirmationNumber(
      confirmationNumber,
      user.tenantId,
    );
  }

  @Get(':id')
  @RequirePermissions('reservations.read')
  @ApiOperation({ summary: 'Get reservation details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationsService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @RequirePermissions('reservations.update')
  @ApiOperation({ summary: 'Update reservation details' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationsService.update(id, user.tenantId, dto, user.sub);
  }

  @Post(':id/check-in')
  @RequirePermissions('reservations.checkin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in a reservation' })
  checkIn(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationsService.checkIn(id, user.tenantId, user.sub);
  }

  @Post(':id/check-out')
  @RequirePermissions('reservations.checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check out a reservation' })
  checkOut(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationsService.checkOut(id, user.tenantId, user.sub);
  }

  @Post(':id/cancel')
  @RequirePermissions('reservations.cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a reservation' })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationsService.cancel(id, user.tenantId, dto, user.sub);
  }
}
