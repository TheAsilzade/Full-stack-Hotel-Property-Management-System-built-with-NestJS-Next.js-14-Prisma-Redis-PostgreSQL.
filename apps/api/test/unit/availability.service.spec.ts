/**
 * Unit tests for the availability algorithm.
 *
 * The core logic lives inside ReservationsService.getAvailability().
 * We extract and test the pure availability-determination logic:
 *   isAvailable = reservationRooms.length === 0
 *                 && status !== OUT_OF_ORDER
 *                 && status !== OUT_OF_SERVICE
 *
 * We also test the date-range overlap guard:
 *   checkOut must be strictly after checkIn.
 */

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from '../../src/modules/reservations/reservations.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { RoomStatus, ReservationStatus } from '@Noblesse/shared';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRoom(overrides: Partial<{
  id: string;
  number: string;
  floor: number;
  status: RoomStatus;
  isActive: boolean;
  reservationRooms: unknown[];
  roomType: object;
  beds: unknown[];
}> = {}) {
  return {
    id: 'room-1',
    number: '101',
    floor: 1,
    status: RoomStatus.CLEAN,
    isActive: true,
    reservationRooms: [],
    roomType: {
      id: 'rt-1',
      name: 'Standard',
      code: 'STD',
      baseRate: 100,
      maxOccupancy: 2,
    },
    beds: [],
    ...overrides,
  };
}

// ─── Mock PrismaService ──────────────────────────────────────────────────────

const mockPrisma = {
  room: { findMany: jest.fn() },
  reservation: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  reservationRoom: { findMany: jest.fn() },
  folio: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
  guest: { findFirst: jest.fn() },
  property: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

const mockRedis = {
  getJson: jest.fn().mockResolvedValue(null),
  setJson: jest.fn().mockResolvedValue(undefined),
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('Availability Algorithm', () => {
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
  });

  // ── Date validation ────────────────────────────────────────────────────────

  describe('date range validation', () => {
    it('throws BadRequestException when checkOut equals checkIn', async () => {
      await expect(
        service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when checkOut is before checkIn', async () => {
      await expect(
        service.getAvailability('prop-1', 'tenant-1', '2025-06-05', '2025-06-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('does not throw when checkOut is after checkIn', async () => {
      mockPrisma.room.findMany.mockResolvedValue([]);
      await expect(
        service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05'),
      ).resolves.toEqual([]);
    });
  });

  // ── Room availability mapping ──────────────────────────────────────────────

  describe('room availability mapping', () => {
    it('marks a room as available when it has no overlapping reservations and is CLEAN', async () => {
      const room = makeRoom({ status: RoomStatus.CLEAN, reservationRooms: [] });
      mockPrisma.room.findMany.mockResolvedValue([room]);

      const result = await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      expect(result).toHaveLength(1);
      expect(result[0].isAvailable).toBe(true);
    });

    it('marks a room as available when it has no overlapping reservations and is DIRTY', async () => {
      const room = makeRoom({ status: RoomStatus.DIRTY, reservationRooms: [] });
      mockPrisma.room.findMany.mockResolvedValue([room]);

      const result = await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      expect(result[0].isAvailable).toBe(true);
    });

    it('marks a room as unavailable when it has an overlapping reservation', async () => {
      const room = makeRoom({
        status: RoomStatus.CLEAN,
        reservationRooms: [{ id: 'rr-1', reservationId: 'res-1' }],
      });
      mockPrisma.room.findMany.mockResolvedValue([room]);

      const result = await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      expect(result[0].isAvailable).toBe(false);
    });

    it('marks a room as unavailable when status is OUT_OF_ORDER (even with no reservations)', async () => {
      const room = makeRoom({ status: RoomStatus.OUT_OF_ORDER, reservationRooms: [] });
      mockPrisma.room.findMany.mockResolvedValue([room]);

      const result = await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      expect(result[0].isAvailable).toBe(false);
    });

    it('marks a room as unavailable when status is OUT_OF_SERVICE (even with no reservations)', async () => {
      const room = makeRoom({ status: RoomStatus.OUT_OF_SERVICE, reservationRooms: [] });
      mockPrisma.room.findMany.mockResolvedValue([room]);

      const result = await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      expect(result[0].isAvailable).toBe(false);
    });

    it('returns correct room type data in the result', async () => {
      const room = makeRoom({
        roomType: {
          id: 'rt-deluxe',
          name: 'Deluxe',
          code: 'DLX',
          baseRate: 250,
          maxOccupancy: 3,
        },
      });
      mockPrisma.room.findMany.mockResolvedValue([room]);

      const result = await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      expect(result[0].roomType).toMatchObject({
        id: 'rt-deluxe',
        name: 'Deluxe',
        code: 'DLX',
        baseRate: 250,
        maxOccupancy: 3,
      });
    });

    it('handles multiple rooms with mixed availability', async () => {
      const rooms = [
        makeRoom({ id: 'r1', number: '101', status: RoomStatus.CLEAN, reservationRooms: [] }),
        makeRoom({ id: 'r2', number: '102', status: RoomStatus.CLEAN, reservationRooms: [{ id: 'rr-1' }] }),
        makeRoom({ id: 'r3', number: '103', status: RoomStatus.OUT_OF_ORDER, reservationRooms: [] }),
        makeRoom({ id: 'r4', number: '104', status: RoomStatus.DIRTY, reservationRooms: [] }),
      ];
      mockPrisma.room.findMany.mockResolvedValue(rooms);

      const result = await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      expect(result).toHaveLength(4);
      expect(result.find((r) => r.id === 'r1')?.isAvailable).toBe(true);
      expect(result.find((r) => r.id === 'r2')?.isAvailable).toBe(false);
      expect(result.find((r) => r.id === 'r3')?.isAvailable).toBe(false);
      expect(result.find((r) => r.id === 'r4')?.isAvailable).toBe(true);
    });

    it('returns empty array when property has no rooms', async () => {
      mockPrisma.room.findMany.mockResolvedValue([]);

      const result = await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      expect(result).toEqual([]);
    });

    it('passes correct date filter to Prisma (overlap detection)', async () => {
      mockPrisma.room.findMany.mockResolvedValue([]);

      await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      const call = mockPrisma.room.findMany.mock.calls[0][0];
      const reservationFilter = call.include.reservationRooms.where.reservation;

      // Overlap condition: existing.checkIn < newCheckOut AND existing.checkOut > newCheckIn
      expect(reservationFilter.checkIn.lt).toEqual(new Date('2025-06-05'));
      expect(reservationFilter.checkOut.gt).toEqual(new Date('2025-06-01'));
    });

    it('only queries active rooms for the given property', async () => {
      mockPrisma.room.findMany.mockResolvedValue([]);

      await service.getAvailability('prop-xyz', 'tenant-1', '2025-06-01', '2025-06-05');

      const call = mockPrisma.room.findMany.mock.calls[0][0];
      expect(call.where).toMatchObject({ propertyId: 'prop-xyz', isActive: true });
    });

    it('only considers CONFIRMED, CHECKED_IN, TENTATIVE reservations as blocking', async () => {
      mockPrisma.room.findMany.mockResolvedValue([]);

      await service.getAvailability('prop-1', 'tenant-1', '2025-06-01', '2025-06-05');

      const call = mockPrisma.room.findMany.mock.calls[0][0];
      const statusFilter = call.include.reservationRooms.where.reservation.status.in;

      expect(statusFilter).toContain(ReservationStatus.CONFIRMED);
      expect(statusFilter).toContain(ReservationStatus.CHECKED_IN);
      expect(statusFilter).toContain(ReservationStatus.TENTATIVE);
      expect(statusFilter).not.toContain(ReservationStatus.CANCELLED);
      expect(statusFilter).not.toContain(ReservationStatus.CHECKED_OUT);
    });
  });
});