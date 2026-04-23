import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  FoliosService,
  AddFolioItemDto,
  AddPaymentDto,
  CloseFolioDto,
} from './folios.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Folios')
@ApiBearerAuth()
@Controller('v1')
export class FoliosController {
  constructor(private readonly foliosService: FoliosService) {}

  // ── Folio endpoints under reservations ──────────────────────

  @Post('reservations/:reservationId/folios')
  @RequirePermissions('folios.create')
  @ApiOperation({ summary: 'Create a folio for a reservation' })
  createFolio(
    @Param('reservationId') reservationId: string,
    @CurrentUser() user: JwtPayload,
    @Body('guestId') guestId?: string,
  ) {
    return this.foliosService.createFolio(reservationId, user.tenantId, guestId);
  }

  @Get('reservations/:reservationId/folios')
  @RequirePermissions('folios.read')
  @ApiOperation({ summary: 'Get all folios for a reservation' })
  getFoliosByReservation(
    @Param('reservationId') reservationId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.foliosService.getFoliosByReservation(reservationId, user.tenantId);
  }

  // ── Folio endpoints ──────────────────────────────────────────

  @Get('folios/:id')
  @RequirePermissions('folios.read')
  @ApiOperation({ summary: 'Get folio details with items and payments' })
  getFolio(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.foliosService.getFolio(id, user.tenantId);
  }

  @Post('folios/:id/items')
  @RequirePermissions('folios.update')
  @ApiOperation({ summary: 'Add a charge item to a folio' })
  addItem(
    @Param('id') id: string,
    @Body() dto: AddFolioItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.foliosService.addItem(id, user.tenantId, dto);
  }

  @Post('folios/:id/items/:itemId/void')
  @RequirePermissions('folios.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void a folio item' })
  voidItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.foliosService.voidItem(id, itemId, user.tenantId, reason);
  }

  @Post('folios/:id/payments')
  @RequirePermissions('payments.create')
  @ApiOperation({ summary: 'Add a payment to a folio' })
  addPayment(
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.foliosService.addPayment(id, user.tenantId, dto);
  }

  @Post('folios/:id/payments/:paymentId/void')
  @RequirePermissions('payments.void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void a payment' })
  voidPayment(
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.foliosService.voidPayment(id, paymentId, user.tenantId);
  }

  @Post('folios/:id/close')
  @RequirePermissions('folios.close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close a folio' })
  closeFolio(
    @Param('id') id: string,
    @Body() dto: CloseFolioDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.foliosService.closeFolio(id, user.tenantId, dto);
  }

  @Post('folios/:id/void')
  @RequirePermissions('folios.void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void a folio' })
  voidFolio(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.foliosService.voidFolio(id, user.tenantId);
  }
}