/**
 * Unit tests for the rate / reservation total calculator.
 *
 * The rate calculation logic in ReservationsService.create():
 *   totalAmount = dto.rooms.reduce((sum, r) => sum + r.totalRate, 0)
 *
 * Each room's totalRate is provided by the caller (frontend computes
 * ratePerNight * nights). We test:
 *   1. totalAmount aggregation across multiple rooms
 *   2. Date validation (checkOut must be after checkIn)
 *   3. Conflict detection (room already booked for overlapping dates)
 *   4. Confirmation number generation format
 *   5. Primary guest selection logic
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ReservationsService } from '../../src/modules/reservations/reservations.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { ReservationStatus } from '@Noblesse/shared';

// ─── Mock PrismaService ──────────────────────────────────────────────────────

const mockPrisma = {
  reservationRoom: { findFirst: jest.fn() },
  reservation: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  room: { findMany: jest.fn() },
  folio: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  guest: { findFirst: jest.fn() },
  property: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

const mockRedis = {
  getJson: jest.fn().mockResolvedValue(null),
  setJson: jest.fn().mockResolvedValue(undefined),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCreatedReservation(totalAmount: number) {
  return {
    id: 'res-1',
    confirmationNumber: 'LUM-TEST-0001',
    status: ReservationStatus.CONFIRMED,
    checkIn: new Date('2025-06-01'),
    checkOut: new Date('2025-06-05'),
    adults: 2,
    children: 0,
    primaryGuestId: null,
    totalAmount,
    paidAmount: 0,
    specialRequests: null,
    internalNotes: null,
    notes: null,
    version: 1,
    checkedInAt: null,
    checkedOutAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    property: { id: 'prop-1', name: 'Test Hotel', code: 'TH' },
    source: null,
    rooms: [],
    guests: [],
  };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Rate Calculator (ReservationsService.create)', () => {
  let service: ReservationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    jest.clearAllMocks();

    // Default: no conflicts, unique confirmation number
    mockPrisma.reservationRoom.findFirst.mockResolvedValue(null);
    mockPrisma.reservation.findUnique.mockResolvedValue(null);
  });

  // ── Date validation ────────────────────────────────────────────────────────

  describe('date validation', () => {
    it('throws BadRequestException when checkOut equals checkIn', async () => {
      await expect(
        service.create(
          {
            propertyId: 'prop-1',
            checkIn: '2025-06-01',
            checkOut: '2025-06-01',
            rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 100 }],
          },
          'tenant-1',
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when checkOut is before checkIn', async () => {
      await expect(
        service.create(
          {
            propertyId: 'prop-1',
            checkIn: '2025-06-05',
            checkOut: '2025-06-01',
            rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
          },
          'tenant-1',
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── totalAmount aggregation ────────────────────────────────────────────────

  describe('totalAmount aggregation', () => {
    it('sets totalAmount to the single room totalRate', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
        },
        'tenant-1',
        'user-1',
      );

      expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalAmount: 400 }),
        }),
      );
    });

    it('sums totalRate across multiple rooms', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(900));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-04',
          rooms: [
            { roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 300 },
            { roomId: 'r2', roomTypeId: 'rt2', ratePerNight: 200, totalRate: 600 },
          ],
        },
        'tenant-1',
        'user-1',
      );

      expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalAmount: 900 }),
        }),
      );
    });

    it('handles zero-rate rooms (complimentary)', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(0));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-03',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 0, totalRate: 0 }],
        },
        'tenant-1',
        'user-1',
      );

      expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalAmount: 0 }),
        }),
      );
    });

    it('handles fractional rates correctly', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(333.33));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-04',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 111.11, totalRate: 333.33 }],
        },
        'tenant-1',
        'user-1',
      );

      expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ totalAmount: 333.33 }),
        }),
      );
    });
  });

  // ── Conflict detection ─────────────────────────────────────────────────────

  describe('conflict detection', () => {
    it('throws ConflictException when a room has an overlapping reservation', async () => {
      mockPrisma.reservationRoom.findFirst.mockResolvedValue({ id: 'rr-existing' });

      await expect(
        service.create(
          {
            propertyId: 'prop-1',
            checkIn: '2025-06-01',
            checkOut: '2025-06-05',
            rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
          },
          'tenant-1',
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('does not throw when no overlapping reservations exist', async () => {
      mockPrisma.reservationRoom.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await expect(
        service.create(
          {
            propertyId: 'prop-1',
            checkIn: '2025-06-01',
            checkOut: '2025-06-05',
            rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
          },
          'tenant-1',
          'user-1',
        ),
      ).resolves.toBeDefined();
    });

    it('checks each room individually for conflicts', async () => {
      // First room: no conflict; second room: conflict
      mockPrisma.reservationRoom.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'rr-conflict' });

      await expect(
        service.create(
          {
            propertyId: 'prop-1',
            checkIn: '2025-06-01',
            checkOut: '2025-06-05',
            rooms: [
              { roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 },
              { roomId: 'r2', roomTypeId: 'rt2', ratePerNight: 150, totalRate: 600 },
            ],
          },
          'tenant-1',
          'user-1',
        ),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.reservationRoom.findFirst).toHaveBeenCalledTimes(2);
    });

    it('uses correct overlap filter (checkIn < newCheckOut AND checkOut > newCheckIn)', async () => {
      mockPrisma.reservationRoom.findFirst.mockResolvedValue(null);
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
        },
        'tenant-1',
        'user-1',
      );

      const conflictFilter = mockPrisma.reservationRoom.findFirst.mock.calls[0][0].where.reservation;
      expect(conflictFilter.checkIn.lt).toEqual(new Date('2025-06-05'));
      expect(conflictFilter.checkOut.gt).toEqual(new Date('2025-06-01'));
    });
  });

  // ── Confirmation number ────────────────────────────────────────────────────

  describe('confirmation number', () => {
    it('generates a confirmation number with LUM- prefix', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
        },
        'tenant-1',
        'user-1',
      );

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.confirmationNumber).toMatch(/^LUM-/);
    });

    it('retries if confirmation number already exists', async () => {
      // First findUnique returns existing (collision), second returns null (unique)
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
        },
        'tenant-1',
        'user-1',
      );

      expect(mockPrisma.reservation.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  // ── Primary guest selection ────────────────────────────────────────────────

  describe('primary guest selection', () => {
    it('uses the guest marked isPrimary as primaryGuestId', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
          guests: [
            { guestId: 'g1', isPrimary: false },
            { guestId: 'g2', isPrimary: true },
          ],
        },
        'tenant-1',
        'user-1',
      );

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.primaryGuestId).toBe('g2');
    });

    it('falls back to first guest when none is marked isPrimary', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
          guests: [
            { guestId: 'g1', isPrimary: false },
            { guestId: 'g2', isPrimary: false },
          ],
        },
        'tenant-1',
        'user-1',
      );

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.primaryGuestId).toBe('g1');
    });

    it('sets primaryGuestId to null when no guests provided', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
        },
        'tenant-1',
        'user-1',
      );

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.primaryGuestId).toBeNull();
    });
  });

  // ── Default values ─────────────────────────────────────────────────────────

  describe('default values', () => {
    it('defaults adults to 1 when not provided', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
        },
        'tenant-1',
        'user-1',
      );

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.adults).toBe(1);
    });

    it('defaults children to 0 when not provided', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
        },
        'tenant-1',
        'user-1',
      );

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.children).toBe(0);
    });

    it('sets status to CONFIRMED on creation', async () => {
      mockPrisma.reservation.create.mockResolvedValue(makeCreatedReservation(400));

      await service.create(
        {
          propertyId: 'prop-1',
          checkIn: '2025-06-01',
          checkOut: '2025-06-05',
          rooms: [{ roomId: 'r1', roomTypeId: 'rt1', ratePerNight: 100, totalRate: 400 }],
        },
        'tenant-1',
        'user-1',
      );

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.status).toBe(ReservationStatus.CONFIRMED);
    });
  });
});