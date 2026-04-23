import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { FolioStatus, PaymentMethod } from '@Noblesse/shared';

export class AddFolioItemDto {
  @IsString()
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class AddPaymentDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  isRefund?: boolean;
}

export class CloseFolioDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

const FOLIO_SELECT = {
  id: true,
  reservationId: true,
  guestId: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      description: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      date: true,
      category: true,
      isVoided: true,
      voidedAt: true,
      voidReason: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
  payments: {
    select: {
      id: true,
      amount: true,
      method: true,
      reference: true,
      notes: true,
      isRefund: true,
      isVoided: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class FoliosService {
  constructor(private readonly prisma: PrismaService) {}

  private computeBalance(folio: any) {
    const totalCharges = folio.items
      .filter((i: any) => !i.isVoided)
      .reduce((sum: number, i: any) => sum + Number(i.totalPrice), 0);

    const totalPayments = folio.payments
      .filter((p: any) => !p.isVoided)
      .reduce((sum: number, p: any) => {
        return p.isRefund ? sum - Number(p.amount) : sum + Number(p.amount);
      }, 0);

    return {
      ...folio,
      totalCharges,
      totalPayments,
      balance: totalCharges - totalPayments,
    };
  }

  async createFolio(reservationId: string, tenantId: string, guestId?: string) {
    // Verify reservation belongs to tenant
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenantId },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    const folio = await this.prisma.folio.create({
      data: {
        reservationId,
        guestId: guestId ?? null,
        status: FolioStatus.OPEN,
      },
      select: FOLIO_SELECT,
    });

    return this.computeBalance(folio);
  }

  async getFoliosByReservation(reservationId: string, tenantId: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenantId },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation ${reservationId} not found`);
    }

    const folios = await this.prisma.folio.findMany({
      where: { reservationId },
      select: FOLIO_SELECT,
      orderBy: { createdAt: 'asc' },
    });

    return folios.map((f) => this.computeBalance(f));
  }

  async getFolio(id: string, tenantId: string) {
    const folio = await this.prisma.folio.findFirst({
      where: {
        id,
        reservation: { tenantId },
      },
      select: FOLIO_SELECT,
    });

    if (!folio) throw new NotFoundException(`Folio ${id} not found`);

    return this.computeBalance(folio);
  }

  async addItem(id: string, tenantId: string, dto: AddFolioItemDto) {
    const folio = await this.prisma.folio.findFirst({
      where: { id, reservation: { tenantId } },
    });
    if (!folio) throw new NotFoundException(`Folio ${id} not found`);
    if (folio.status !== FolioStatus.OPEN) {
      throw new BadRequestException(`Cannot add items to a ${folio.status} folio`);
    }

    const quantity = dto.quantity ?? 1;
    const totalPrice = quantity * dto.unitPrice;

    await this.prisma.folioItem.create({
      data: {
        folioId: id,
        description: dto.description,
        quantity,
        unitPrice: dto.unitPrice,
        totalPrice,
        date: new Date(dto.date),
        category: dto.category ?? null,
      },
    });

    return this.getFolio(id, tenantId);
  }

  async voidItem(
    folioId: string,
    itemId: string,
    tenantId: string,
    reason: string,
  ) {
    const folio = await this.prisma.folio.findFirst({
      where: { id: folioId, reservation: { tenantId } },
    });
    if (!folio) throw new NotFoundException(`Folio ${folioId} not found`);
    if (folio.status !== FolioStatus.OPEN) {
      throw new BadRequestException(`Cannot void items on a ${folio.status} folio`);
    }

    const item = await this.prisma.folioItem.findFirst({
      where: { id: itemId, folioId },
    });
    if (!item) throw new NotFoundException(`Folio item ${itemId} not found`);
    if (item.isVoided) throw new BadRequestException('Item is already voided');

    await this.prisma.folioItem.update({
      where: { id: itemId },
      data: { isVoided: true, voidedAt: new Date(), voidReason: reason },
    });

    return this.getFolio(folioId, tenantId);
  }

  async addPayment(id: string, tenantId: string, dto: AddPaymentDto) {
    const folio = await this.prisma.folio.findFirst({
      where: { id, reservation: { tenantId } },
    });
    if (!folio) throw new NotFoundException(`Folio ${id} not found`);
    if (folio.status !== FolioStatus.OPEN) {
      throw new BadRequestException(`Cannot add payments to a ${folio.status} folio`);
    }

    await this.prisma.payment.create({
      data: {
        folioId: id,
        amount: dto.amount,
        method: dto.method as any,
        reference: dto.reference ?? null,
        notes: dto.notes ?? null,
        isRefund: dto.isRefund ?? false,
        createdAt: dto.date ? new Date(dto.date) : undefined,
      },
    });

    return this.getFolio(id, tenantId);
  }

  async voidPayment(
    folioId: string,
    paymentId: string,
    tenantId: string,
  ) {
    const folio = await this.prisma.folio.findFirst({
      where: { id: folioId, reservation: { tenantId } },
    });
    if (!folio) throw new NotFoundException(`Folio ${folioId} not found`);

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, folioId },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);
    if (payment.isVoided) throw new BadRequestException('Payment is already voided');

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { isVoided: true },
    });

    return this.getFolio(folioId, tenantId);
  }

  async closeFolio(id: string, tenantId: string, dto: CloseFolioDto) {
    const folio = await this.getFolio(id, tenantId);

    if (folio.status !== FolioStatus.OPEN) {
      throw new BadRequestException(`Folio is already ${folio.status}`);
    }

    if (folio.balance > 0) {
      throw new BadRequestException(
        `Cannot close folio with outstanding balance of ${folio.balance}`,
      );
    }

    const updated = await this.prisma.folio.update({
      where: { id },
      data: {
        status: FolioStatus.CLOSED,
        notes: dto.notes ?? folio.notes,
      },
      select: FOLIO_SELECT,
    });

    return this.computeBalance(updated);
  }

  async voidFolio(id: string, tenantId: string) {
    const folio = await this.prisma.folio.findFirst({
      where: { id, reservation: { tenantId } },
    });
    if (!folio) throw new NotFoundException(`Folio ${id} not found`);
    if (folio.status === FolioStatus.VOIDED) {
      throw new BadRequestException('Folio is already voided');
    }

    const updated = await this.prisma.folio.update({
      where: { id },
      data: { status: FolioStatus.VOIDED },
      select: FOLIO_SELECT,
    });

    return this.computeBalance(updated);
  }
}
