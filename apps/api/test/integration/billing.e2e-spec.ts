/**
 * Integration tests for FoliosService (billing).
 *
 * Tests the full service layer (with mocked Prisma) to verify:
 *   - createFolio: reservation validation, folio creation, balance computation
 *   - getFoliosByReservation: reservation validation, balance computation
 *   - getFolio: not-found handling, balance computation
 *   - addItem: folio status validation, quantity*unitPrice, totalPrice
 *   - voidItem: folio/item validation, already-voided guard
 *   - addPayment: folio status validation, payment creation
 *   - voidPayment: payment validation, already-voided guard
 *   - closeFolio: balance check, status transition
 *   - voidFolio: already-voided guard, status transition
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FoliosService } from '../../src/modules/folios/folios.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { FolioStatus, PaymentMethod } from '@Noblesse/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT = 'tenant-1';
const FOLIO_ID = 'folio-1';
const RES_ID = 'res-1';

function makeFolioRaw(overrides: Record<string, unknown> = {}) {
  return {
    id: FOLIO_ID,
    reservationId: RES_ID,
    guestId: null,
    status: FolioStatus.OPEN,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    payments: [],
    ...overrides,
  };
}

function makeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    folioId: FOLIO_ID,
    description: 'Room charge',
    quantity: 1,
    unitPrice: 100,
    totalPrice: 100,
    date: new Date(),
    category: 'ROOM',
    isVoided: false,
    voidedAt: null,
    voidReason: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makePayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pay-1',
    folioId: FOLIO_ID,
    amount: 100,
    method: PaymentMethod.CREDIT_CARD,
    reference: null,
    notes: null,
    isRefund: false,
    isVoided: false,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  reservation: {
    findFirst: jest.fn(),
  },
  folio: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  folioItem: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('FoliosService (integration)', () => {
  let service: FoliosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoliosService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FoliosService>(FoliosService);
    jest.clearAllMocks();

    // Default stubs
    mockPrisma.reservation.findFirst.mockResolvedValue({ id: RES_ID, tenantId: TENANT });
    mockPrisma.folio.create.mockResolvedValue(makeFolioRaw());
    mockPrisma.folio.findMany.mockResolvedValue([]);
    mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());
    mockPrisma.folio.update.mockResolvedValue(makeFolioRaw());
    mockPrisma.folioItem.create.mockResolvedValue(makeItem());
    mockPrisma.folioItem.findFirst.mockResolvedValue(makeItem());
    mockPrisma.folioItem.update.mockResolvedValue({});
    mockPrisma.payment.create.mockResolvedValue(makePayment());
    mockPrisma.payment.findFirst.mockResolvedValue(makePayment());
    mockPrisma.payment.update.mockResolvedValue({});
  });

  // ── createFolio ────────────────────────────────────────────────────────────

  describe('createFolio', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(service.createFolio('nonexistent', TENANT)).rejects.toThrow(NotFoundException);
    });

    it('creates a folio with OPEN status', async () => {
      await service.createFolio(RES_ID, TENANT);

      expect(mockPrisma.folio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: FolioStatus.OPEN, reservationId: RES_ID }),
        }),
      );
    });

    it('returns folio with computed balance fields', async () => {
      const result = await service.createFolio(RES_ID, TENANT);

      expect(result).toHaveProperty('totalCharges');
      expect(result).toHaveProperty('totalPayments');
      expect(result).toHaveProperty('balance');
    });

    it('returns zero balance for empty folio', async () => {
      const result = await service.createFolio(RES_ID, TENANT);

      expect(result.totalCharges).toBe(0);
      expect(result.totalPayments).toBe(0);
      expect(result.balance).toBe(0);
    });

    it('sets guestId when provided', async () => {
      await service.createFolio(RES_ID, TENANT, 'guest-1');

      expect(mockPrisma.folio.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ guestId: 'guest-1' }),
        }),
      );
    });
  });

  // ── getFoliosByReservation ─────────────────────────────────────────────────

  describe('getFoliosByReservation', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(service.getFoliosByReservation('nonexistent', TENANT)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns folios with computed balance', async () => {
      mockPrisma.folio.findMany.mockResolvedValue([
        makeFolioRaw({
          items: [makeItem({ totalPrice: 200, isVoided: false })],
          payments: [makePayment({ amount: 100, isRefund: false, isVoided: false })],
        }),
      ]);

      const result = await service.getFoliosByReservation(RES_ID, TENANT);

      expect(result).toHaveLength(1);
      expect(result[0].totalCharges).toBe(200);
      expect(result[0].totalPayments).toBe(100);
      expect(result[0].balance).toBe(100);
    });

    it('returns empty array when no folios exist', async () => {
      mockPrisma.folio.findMany.mockResolvedValue([]);

      const result = await service.getFoliosByReservation(RES_ID, TENANT);

      expect(result).toHaveLength(0);
    });
  });

  // ── getFolio ───────────────────────────────────────────────────────────────

  describe('getFolio', () => {
    it('throws NotFoundException when folio does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(null);

      await expect(service.getFolio('nonexistent', TENANT)).rejects.toThrow(NotFoundException);
    });

    it('returns folio with computed balance', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({
          items: [makeItem({ totalPrice: 300, isVoided: false })],
          payments: [],
        }),
      );

      const result = await service.getFolio(FOLIO_ID, TENANT);

      expect(result.totalCharges).toBe(300);
      expect(result.balance).toBe(300);
    });

    it('excludes voided items from totalCharges', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({
          items: [
            makeItem({ id: 'item-1', totalPrice: 200, isVoided: false }),
            makeItem({ id: 'item-2', totalPrice: 100, isVoided: true }),
          ],
          payments: [],
        }),
      );

      const result = await service.getFolio(FOLIO_ID, TENANT);

      expect(result.totalCharges).toBe(200);
    });

    it('excludes voided payments from totalPayments', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({
          items: [makeItem({ totalPrice: 200, isVoided: false })],
          payments: [
            makePayment({ id: 'pay-1', amount: 150, isRefund: false, isVoided: false }),
            makePayment({ id: 'pay-2', amount: 50, isRefund: false, isVoided: true }),
          ],
        }),
      );

      const result = await service.getFolio(FOLIO_ID, TENANT);

      expect(result.totalPayments).toBe(150);
      expect(result.balance).toBe(50);
    });

    it('subtracts refund payments from totalPayments', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({
          items: [makeItem({ totalPrice: 200, isVoided: false })],
          payments: [
            makePayment({ id: 'pay-1', amount: 200, isRefund: false, isVoided: false }),
            makePayment({ id: 'pay-2', amount: 50, isRefund: true, isVoided: false }),
          ],
        }),
      );

      const result = await service.getFolio(FOLIO_ID, TENANT);

      expect(result.totalPayments).toBe(150); // 200 - 50
      expect(result.balance).toBe(50); // 200 - 150
    });
  });

  // ── addItem ────────────────────────────────────────────────────────────────

  describe('addItem', () => {
    it('throws NotFoundException when folio does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(null);

      await expect(
        service.addItem('nonexistent', TENANT, {
          description: 'Room charge',
          unitPrice: 100,
          date: '2025-06-01',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when folio is not OPEN', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({ status: FolioStatus.CLOSED }),
      );

      await expect(
        service.addItem(FOLIO_ID, TENANT, {
          description: 'Room charge',
          unitPrice: 100,
          date: '2025-06-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes totalPrice as quantity * unitPrice', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());

      await service.addItem(FOLIO_ID, TENANT, {
        description: 'Room charge',
        quantity: 3,
        unitPrice: 150,
        date: '2025-06-01',
      });

      expect(mockPrisma.folioItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 3,
            unitPrice: 150,
            totalPrice: 450,
          }),
        }),
      );
    });

    it('defaults quantity to 1 when not provided', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());

      await service.addItem(FOLIO_ID, TENANT, {
        description: 'Room charge',
        unitPrice: 200,
        date: '2025-06-01',
      });

      expect(mockPrisma.folioItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: 1, totalPrice: 200 }),
        }),
      );
    });
  });

  // ── voidItem ───────────────────────────────────────────────────────────────

  describe('voidItem', () => {
    it('throws NotFoundException when folio does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(null);

      await expect(
        service.voidItem('nonexistent', 'item-1', TENANT, 'Duplicate charge'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when folio is not OPEN', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({ status: FolioStatus.CLOSED }),
      );

      await expect(
        service.voidItem(FOLIO_ID, 'item-1', TENANT, 'Duplicate charge'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when item does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());
      mockPrisma.folioItem.findFirst.mockResolvedValue(null);

      await expect(
        service.voidItem(FOLIO_ID, 'nonexistent-item', TENANT, 'Duplicate charge'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when item is already voided', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());
      mockPrisma.folioItem.findFirst.mockResolvedValue(makeItem({ isVoided: true }));

      await expect(
        service.voidItem(FOLIO_ID, 'item-1', TENANT, 'Duplicate charge'),
      ).rejects.toThrow(BadRequestException);
    });

    it('marks item as voided with reason', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());
      mockPrisma.folioItem.findFirst.mockResolvedValue(makeItem({ isVoided: false }));

      await service.voidItem(FOLIO_ID, 'item-1', TENANT, 'Duplicate charge');

      expect(mockPrisma.folioItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: expect.objectContaining({ isVoided: true, voidReason: 'Duplicate charge' }),
        }),
      );
    });
  });

  // ── addPayment ─────────────────────────────────────────────────────────────

  describe('addPayment', () => {
    it('throws NotFoundException when folio does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(null);

      await expect(
        service.addPayment('nonexistent', TENANT, {
          amount: 100,
          method: PaymentMethod.CREDIT_CARD,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when folio is not OPEN', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({ status: FolioStatus.CLOSED }),
      );

      await expect(
        service.addPayment(FOLIO_ID, TENANT, {
          amount: 100,
          method: PaymentMethod.CREDIT_CARD,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates payment with correct data', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());

      await service.addPayment(FOLIO_ID, TENANT, {
        amount: 250,
        method: PaymentMethod.CREDIT_CARD,
        reference: 'TXN-123',
        isRefund: false,
      });

      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            folioId: FOLIO_ID,
            amount: 250,
            method: PaymentMethod.CREDIT_CARD,
            reference: 'TXN-123',
            isRefund: false,
          }),
        }),
      );
    });

    it('defaults isRefund to false when not provided', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());

      await service.addPayment(FOLIO_ID, TENANT, {
        amount: 100,
        method: PaymentMethod.CASH,
      });

      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isRefund: false }),
        }),
      );
    });
  });

  // ── voidPayment ────────────────────────────────────────────────────────────

  describe('voidPayment', () => {
    it('throws NotFoundException when folio does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(null);

      await expect(
        service.voidPayment('nonexistent', 'pay-1', TENANT),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when payment does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());
      mockPrisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.voidPayment(FOLIO_ID, 'nonexistent-pay', TENANT),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when payment is already voided', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());
      mockPrisma.payment.findFirst.mockResolvedValue(makePayment({ isVoided: true }));

      await expect(
        service.voidPayment(FOLIO_ID, 'pay-1', TENANT),
      ).rejects.toThrow(BadRequestException);
    });

    it('marks payment as voided', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw());
      mockPrisma.payment.findFirst.mockResolvedValue(makePayment({ isVoided: false }));

      await service.voidPayment(FOLIO_ID, 'pay-1', TENANT);

      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'pay-1' },
          data: { isVoided: true },
        }),
      );
    });
  });

  // ── closeFolio ─────────────────────────────────────────────────────────────

  describe('closeFolio', () => {
    it('throws BadRequestException when folio is not OPEN', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({ status: FolioStatus.CLOSED }),
      );

      await expect(service.closeFolio(FOLIO_ID, TENANT, {})).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when folio has outstanding balance', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({
          status: FolioStatus.OPEN,
          items: [makeItem({ totalPrice: 200, isVoided: false })],
          payments: [],
        }),
      );

      await expect(service.closeFolio(FOLIO_ID, TENANT, {})).rejects.toThrow(BadRequestException);
    });

    it('closes folio when balance is zero', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({
          status: FolioStatus.OPEN,
          items: [makeItem({ totalPrice: 200, isVoided: false })],
          payments: [makePayment({ amount: 200, isRefund: false, isVoided: false })],
        }),
      );
      mockPrisma.folio.update.mockResolvedValue(
        makeFolioRaw({ status: FolioStatus.CLOSED, items: [], payments: [] }),
      );

      await service.closeFolio(FOLIO_ID, TENANT, {});

      expect(mockPrisma.folio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: FolioStatus.CLOSED }),
        }),
      );
    });

    it('closes folio when balance is negative (overpaid)', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({
          status: FolioStatus.OPEN,
          items: [makeItem({ totalPrice: 100, isVoided: false })],
          payments: [makePayment({ amount: 150, isRefund: false, isVoided: false })],
        }),
      );
      mockPrisma.folio.update.mockResolvedValue(
        makeFolioRaw({ status: FolioStatus.CLOSED, items: [], payments: [] }),
      );

      await service.closeFolio(FOLIO_ID, TENANT, {});

      expect(mockPrisma.folio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: FolioStatus.CLOSED }),
        }),
      );
    });
  });

  // ── voidFolio ──────────────────────────────────────────────────────────────

  describe('voidFolio', () => {
    it('throws NotFoundException when folio does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(null);

      await expect(service.voidFolio('nonexistent', TENANT)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when folio is already voided', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolioRaw({ status: FolioStatus.VOIDED }),
      );

      await expect(service.voidFolio(FOLIO_ID, TENANT)).rejects.toThrow(BadRequestException);
    });

    it('transitions folio status to VOIDED', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(makeFolioRaw({ status: FolioStatus.OPEN }));
      mockPrisma.folio.update.mockResolvedValue(
        makeFolioRaw({ status: FolioStatus.VOIDED, items: [], payments: [] }),
      );

      await service.voidFolio(FOLIO_ID, TENANT);

      expect(mockPrisma.folio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: FolioStatus.VOIDED },
        }),
      );
    });
  });
});