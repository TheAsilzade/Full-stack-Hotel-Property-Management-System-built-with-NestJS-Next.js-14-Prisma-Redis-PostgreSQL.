/**
 * Unit tests for the folio balance calculator.
 *
 * The core logic is the private `computeBalance()` method in FoliosService.
 * We test it indirectly through the public service methods by mocking Prisma
 * to return controlled folio shapes and asserting the computed fields:
 *   totalCharges  = sum of non-voided item.totalPrice
 *   totalPayments = sum of non-voided, non-refund payments
 *                 - sum of non-voided refund payments
 *   balance       = totalCharges - totalPayments
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FoliosService, AddFolioItemDto, AddPaymentDto } from '../../src/modules/folios/folios.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { FolioStatus, PaymentMethod } from '@Noblesse/shared';

// ─── Folio builder helpers ───────────────────────────────────────────────────

function makeItem(overrides: Partial<{
  id: string;
  totalPrice: number;
  isVoided: boolean;
}> = {}) {
  return {
    id: 'item-1',
    description: 'Room charge',
    quantity: 1,
    unitPrice: 100,
    totalPrice: 100,
    date: new Date('2025-06-01'),
    category: 'ROOM',
    isVoided: false,
    voidedAt: null,
    voidReason: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makePayment(overrides: Partial<{
  id: string;
  amount: number;
  isRefund: boolean;
  isVoided: boolean;
}> = {}) {
  return {
    id: 'pay-1',
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

function makeFolio(overrides: Partial<{
  id: string;
  status: FolioStatus;
  items: ReturnType<typeof makeItem>[];
  payments: ReturnType<typeof makePayment>[];
}> = {}) {
  return {
    id: 'folio-1',
    reservationId: 'res-1',
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

// ─── Mock PrismaService ──────────────────────────────────────────────────────

const mockPrisma = {
  reservation: { findFirst: jest.fn() },
  folio: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
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

describe('Folio Calculator (FoliosService.computeBalance)', () => {
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
  });

  // ── getFolio — balance computation ────────────────────────────────────────

  describe('balance computation via getFolio', () => {
    it('returns zero balance for an empty folio', async () => {
      const folio = makeFolio({ items: [], payments: [] });
      mockPrisma.folio.findFirst.mockResolvedValue(folio);

      const result = await service.getFolio('folio-1', 'tenant-1');

      expect(result.totalCharges).toBe(0);
      expect(result.totalPayments).toBe(0);
      expect(result.balance).toBe(0);
    });

    it('sums non-voided items for totalCharges', async () => {
      const folio = makeFolio({
        items: [
          makeItem({ id: 'i1', totalPrice: 200, isVoided: false }),
          makeItem({ id: 'i2', totalPrice: 150, isVoided: false }),
        ],
      });
      mockPrisma.folio.findFirst.mockResolvedValue(folio);

      const result = await service.getFolio('folio-1', 'tenant-1');

      expect(result.totalCharges).toBe(350);
    });

    it('excludes voided items from totalCharges', async () => {
      const folio = makeFolio({
        items: [
          makeItem({ id: 'i1', totalPrice: 200, isVoided: false }),
          makeItem({ id: 'i2', totalPrice: 100, isVoided: true }),
        ],
      });
      mockPrisma.folio.findFirst.mockResolvedValue(folio);

      const result = await service.getFolio('folio-1', 'tenant-1');

      expect(result.totalCharges).toBe(200);
    });

    it('sums non-voided, non-refund payments for totalPayments', async () => {
      const folio = makeFolio({
        payments: [
          makePayment({ id: 'p1', amount: 100, isRefund: false, isVoided: false }),
          makePayment({ id: 'p2', amount: 50, isRefund: false, isVoided: false }),
        ],
      });
      mockPrisma.folio.findFirst.mockResolvedValue(folio);

      const result = await service.getFolio('folio-1', 'tenant-1');

      expect(result.totalPayments).toBe(150);
    });

    it('subtracts refund payments from totalPayments', async () => {
      const folio = makeFolio({
        payments: [
          makePayment({ id: 'p1', amount: 200, isRefund: false, isVoided: false }),
          makePayment({ id: 'p2', amount: 50, isRefund: true, isVoided: false }),
        ],
      });
      mockPrisma.folio.findFirst.mockResolvedValue(folio);

      const result = await service.getFolio('folio-1', 'tenant-1');

      expect(result.totalPayments).toBe(150);
    });

    it('excludes voided payments from totalPayments', async () => {
      const folio = makeFolio({
        payments: [
          makePayment({ id: 'p1', amount: 200, isRefund: false, isVoided: false }),
          makePayment({ id: 'p2', amount: 100, isRefund: false, isVoided: true }),
        ],
      });
      mockPrisma.folio.findFirst.mockResolvedValue(folio);

      const result = await service.getFolio('folio-1', 'tenant-1');

      expect(result.totalPayments).toBe(200);
    });

    it('computes balance = totalCharges - totalPayments', async () => {
      const folio = makeFolio({
        items: [
          makeItem({ id: 'i1', totalPrice: 300 }),
          makeItem({ id: 'i2', totalPrice: 100 }),
        ],
        payments: [
          makePayment({ id: 'p1', amount: 200 }),
        ],
      });
      mockPrisma.folio.findFirst.mockResolvedValue(folio);

      const result = await service.getFolio('folio-1', 'tenant-1');

      expect(result.totalCharges).toBe(400);
      expect(result.totalPayments).toBe(200);
      expect(result.balance).toBe(200);
    });

    it('balance is negative when overpaid', async () => {
      const folio = makeFolio({
        items: [makeItem({ totalPrice: 100 })],
        payments: [makePayment({ amount: 150 })],
      });
      mockPrisma.folio.findFirst.mockResolvedValue(folio);

      const result = await service.getFolio('folio-1', 'tenant-1');

      expect(result.balance).toBe(-50);
    });

    it('throws NotFoundException when folio does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(null);

      await expect(service.getFolio('nonexistent', 'tenant-1')).rejects.toThrow(NotFoundException);
    });
  });

  // ── addItem — validation ───────────────────────────────────────────────────

  describe('addItem validation', () => {
    it('throws NotFoundException when folio does not exist', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(null);

      const dto: AddFolioItemDto = {
        description: 'Room charge',
        unitPrice: 100,
        date: '2025-06-01',
      };

      await expect(service.addItem('nonexistent', 'tenant-1', dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when folio is not OPEN', async () => {
      mockPrisma.folio.findFirst.mockResolvedValue(
        makeFolio({ status: FolioStatus.CLOSED }),
      );

      const dto: AddFolioItemDto = {
        description: 'Room charge',
        unitPrice: 100,
        date: '2025-06-01',
      };

      await expect(service.addItem('folio-1', 'tenant-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('computes totalPrice = quantity * unitPrice', async () => {
      const openFolio = makeFolio({ status: FolioStatus.OPEN });
      mockPrisma.folio.findFirst
        .mockResolvedValueOnce(openFolio)   // first call in addItem
        .mockResolvedValueOnce(makeFolio({  // second call in getFolio
          items: [makeItem({ totalPrice: 300 })],
        }));
      mockPrisma.folioItem.create.mockResolvedValue({});

      const dto: AddFolioItemDto = {
        description: 'Spa treatment',
        quantity: 3,
        unitPrice: 100,
        date: '2025-06-01',
      };

      await service.addItem('folio-1', 'tenant-1', dto);

      expect(mockPrisma.folioItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 3,
            unitPrice: 100,
            totalPrice: 300,
          }),
        }),
      );
    });

    it('defaults quantity to 1 when not provided', async () => {
      const openFolio = makeFolio({ status: FolioStatus.OPEN });
      mockPrisma.folio.findFirst
        .mockResolvedValueOnce(openFolio)
        .mockResolvedValueOnce(makeFolio({ items: [makeItem({ totalPrice: 75 })] }));
      mockPrisma.folioItem.create.mockResolvedValue({});

      const dto: AddFolioItemDto = {
        description: 'Minibar',
        unitPrice: 75,
        date: '2025-06-01',
      };

      await service.addItem('folio-1', 'tenant-1', dto);

      expect(mockPrisma.folioItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ quantity: 1, totalPrice: 75 }),
        }),
      );
    });
  });

  // ── getFoliosByReservation ─────────────────────────────────────────────────

  describe('getFoliosByReservation', () => {
    it('throws NotFoundException when reservation does not belong to tenant', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(
        service.getFoliosByReservation('res-1', 'tenant-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns all folios with computed balances', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'res-1' });
      mockPrisma.folio.findMany.mockResolvedValue([
        makeFolio({
          id: 'f1',
          items: [makeItem({ totalPrice: 200 })],
          payments: [makePayment({ amount: 100 })],
        }),
        makeFolio({
          id: 'f2',
          items: [makeItem({ totalPrice: 50 })],
          payments: [],
        }),
      ]);

      const result = await service.getFoliosByReservation('res-1', 'tenant-1');

      expect(result).toHaveLength(2);
      expect(result[0].balance).toBe(100);
      expect(result[1].balance).toBe(50);
    });
  });
});