/**
 * Integration tests for ReservationsService.
 *
 * Tests the full service layer (with mocked Prisma) to verify:
 *   - create: date validation, totalAmount aggregation, conflict detection, confirmation number
 *   - findAll: pagination, status filter
 *   - findOne: not-found handling
 *   - update: field patching
 *   - checkIn / checkOut: status transitions
 *   - cancel: cancellation logic
 *   - getAvailability: room availability algorithm
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ReservationsService } from '../../src/modules/reservations/reservations.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { ReservationStatus } from '@Noblesse/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT = 'tenant-1';
const USER = 'user-1';
const PROPERTY = 'prop-1';

function makeRoom(overrides: Record<string, unknown> = {}) {
  return {
    id: 'room-1',
    number: '101',
    floor: 1,
    status: 'CLEAN',
    isActive: true,
    tenantId: TENANT,
    propertyId: PROPERTY,
    roomType: { id: 'rt-1', name: 'Standard', code: 'STD', baseRate: 100, maxOccupancy: 2 },
    beds: [],
    reservationRooms: [],
    ...overrides,
  };
}

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res-1',
    confirmationNumber: 'LUM-ABC123-XY',
    tenantId: TENANT,
    propertyId: PROPERTY,
    status: ReservationStatus.CONFIRMED,
    checkIn: new Date('2025-06-01'),
    checkOut: new Date('2025-06-03'),
    totalAmount: 200,
    adults: 2,
    children: 0,
    primaryGuestId: null,
    sourceId: null,
    ratePlanId: null,
    specialRequests: null,
    internalNotes: null,
    cancellationReason: null,
    checkedInAt: null,
    checkedOutAt: null,
    cancelledAt: null,
    version: 1,
    createdById: USER,
    createdAt: new Date(),
    updatedAt: new Date(),
    rooms: [],
    guests: [],
    ...overrides,
  };
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  reservation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  reservationRoom: {
    findFirst: jest.fn(),
    updateMany: jest.fn(),
  },
  room: {
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockRedis = {
  getJson: jest.fn().mockResolvedValue(null),
  setJson: jest.fn().mockResolvedValue(undefined),
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('ReservationsService (integration)', () => {
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

    // Default stubs
    mockPrisma.reservation.create.mockResolvedValue(makeReservation());
    mockPrisma.reservation.findFirst.mockResolvedValue(makeReservation());
    mockPrisma.reservation.findUnique.mockResolvedValue(null); // no collision by default
    mockPrisma.reservation.findMany.mockResolvedValue([]);
    mockPrisma.reservation.count.mockResolvedValue(0);
    mockPrisma.reservation.update.mockResolvedValue(makeReservation());
    mockPrisma.reservationRoom.findFirst.mockResolvedValue(null); // no conflict by default
    mockPrisma.reservationRoom.updateMany.mockResolvedValue({});
    mockPrisma.room.findMany.mockResolvedValue([]);
    mockPrisma.room.update.mockResolvedValue({});
    mockPrisma.room.updateMany.mockResolvedValue({});
    // $transaction with array: return array of results
    mockPrisma.$transaction.mockImplementation((ops: unknown[]) =>
      Promise.resolve(ops.map(() => makeReservation())),
    );
  });

  // ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    const baseDto = {
      propertyId: PROPERTY,
      checkIn: '2025-06-01',
      checkOut: '2025-06-03',
      adults: 2,
      children: 0,
      rooms: [{ roomId: 'room-1', roomTypeId: 'rt-1', ratePerNight: 100, totalRate: 200 }],
      guests: [],
    };

    it('throws BadRequestException when checkOut is not after checkIn', async () => {
      await expect(
        service.create(
          { ...baseDto, checkIn: '2025-06-03', checkOut: '2025-06-01' },
          TENANT,
          USER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when checkIn equals checkOut', async () => {
      await expect(
        service.create({ ...baseDto, checkIn: '2025-06-01', checkOut: '2025-06-01' }, TENANT, USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException when a room is already booked for the date range', async () => {
      mockPrisma.reservationRoom.findFirst.mockResolvedValue({ id: 'rr-1' });

      await expect(
        service.create(baseDto, TENANT, USER),
      ).rejects.toThrow(ConflictException);
    });

    it('computes totalAmount as sum of room totalRate values', async () => {
      const dto = {
        ...baseDto,
        rooms: [
          { roomId: 'room-1', roomTypeId: 'rt-1', ratePerNight: 100, totalRate: 200 },
          { roomId: 'room-2', roomTypeId: 'rt-1', ratePerNight: 125, totalRate: 250 },
        ],
      };

      await service.create(dto, TENANT, USER);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.totalAmount).toBe(450);
    });

    it('generates a confirmation number with LUM- prefix', async () => {
      await service.create(baseDto, TENANT, USER);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.confirmationNumber).toMatch(/^LUM-/);
    });

    it('defaults adults to 1 and children to 0 when not provided', async () => {
      const dto = {
        propertyId: PROPERTY,
        checkIn: '2025-06-01',
        checkOut: '2025-06-03',
        rooms: [{ roomId: 'room-1', roomTypeId: 'rt-1', ratePerNight: 100, totalRate: 200 }],
      };

      await service.create(dto as never, TENANT, USER);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.adults).toBe(1);
      expect(createCall.data.children).toBe(0);
    });

    it('sets status to CONFIRMED by default', async () => {
      await service.create(baseDto, TENANT, USER);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.status).toBe(ReservationStatus.CONFIRMED);
    });

    it('retries confirmation number generation on collision', async () => {
      // First findUnique returns existing (collision), second returns null (unique)
      mockPrisma.reservation.findUnique
        .mockResolvedValueOnce({ id: 'existing' })
        .mockResolvedValueOnce(null);

      await service.create(baseDto, TENANT, USER);

      // findUnique called at least twice (once for collision, once for unique)
      expect(mockPrisma.reservation.findUnique.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(mockPrisma.reservation.create).toHaveBeenCalledTimes(1);
    });

    it('selects primary guest from guests array', async () => {
      const dto = {
        ...baseDto,
        guests: [
          { guestId: 'guest-1', isPrimary: false },
          { guestId: 'guest-2', isPrimary: true },
        ],
      };

      await service.create(dto, TENANT, USER);

      const createCall = mockPrisma.reservation.create.mock.calls[0][0];
      expect(createCall.data.primaryGuestId).toBe('guest-2');
    });
  });

  // ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns paginated reservations with data and meta', async () => {
      const reservations = [makeReservation(), makeReservation({ id: 'res-2' })];
      mockPrisma.reservation.findMany.mockResolvedValue(reservations);
      mockPrisma.reservation.count.mockResolvedValue(2);

      const result = await service.findAll(TENANT, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('applies status filter when provided', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);
      mockPrisma.reservation.count.mockResolvedValue(0);

      await service.findAll(TENANT, { status: ReservationStatus.CHECKED_IN });

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.status).toBe(ReservationStatus.CHECKED_IN);
    });

    it('always filters by tenantId', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);
      mockPrisma.reservation.count.mockResolvedValue(0);

      await service.findAll(TENANT, {});

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.where.tenantId).toBe(TENANT);
    });

    it('uses default page=1 and limit=20 when not provided', async () => {
      mockPrisma.reservation.findMany.mockResolvedValue([]);
      mockPrisma.reservation.count.mockResolvedValue(0);

      await service.findAll(TENANT, {});

      const findManyCall = mockPrisma.reservation.findMany.mock.calls[0][0];
      expect(findManyCall.skip).toBe(0);
      expect(findManyCall.take).toBe(20);
    });
  });

  // ── findOne ────────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent', TENANT)).rejects.toThrow(NotFoundException);
    });

    it('returns the reservation when found', async () => {
      const res = makeReservation();
      mockPrisma.reservation.findFirst.mockResolvedValue(res);

      const result = await service.findOne('res-1', TENANT);

      expect(result.id).toBe('res-1');
    });
  });

  // ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', TENANT, { specialRequests: 'Late check-in' }, USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates the reservation with provided fields', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(makeReservation());
      mockPrisma.reservation.update.mockResolvedValue(
        makeReservation({ specialRequests: 'Late check-in' }),
      );

      await service.update('res-1', TENANT, { specialRequests: 'Late check-in' }, USER);

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'res-1' },
          data: expect.objectContaining({ specialRequests: 'Late check-in' }),
        }),
      );
    });
  });

  // ── checkIn ────────────────────────────────────────────────────────────────

  describe('checkIn', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(service.checkIn('nonexistent', TENANT, USER)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when reservation is not CONFIRMED', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CHECKED_IN }),
      );

      await expect(service.checkIn('res-1', TENANT, USER)).rejects.toThrow(BadRequestException);
    });

    it('transitions reservation status to CHECKED_IN via $transaction', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(
        makeReservation({
          status: ReservationStatus.CONFIRMED,
          rooms: [{ roomId: 'room-1' }],
        }),
      );

      await service.checkIn('res-1', TENANT, USER);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const transactionOps = mockPrisma.$transaction.mock.calls[0][0];
      // First op is the reservation update — verify it's an array
      expect(Array.isArray(transactionOps)).toBe(true);
    });
  });

  // ── checkOut ───────────────────────────────────────────────────────────────

  describe('checkOut', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(service.checkOut('nonexistent', TENANT, USER)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when reservation is not CHECKED_IN', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CONFIRMED }),
      );

      await expect(service.checkOut('res-1', TENANT, USER)).rejects.toThrow(BadRequestException);
    });

    it('transitions reservation status to CHECKED_OUT via $transaction', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(
        makeReservation({
          status: ReservationStatus.CHECKED_IN,
          rooms: [{ roomId: 'room-1' }, { roomId: 'room-2' }],
        }),
      );

      await service.checkOut('res-1', TENANT, USER);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      const transactionOps = mockPrisma.$transaction.mock.calls[0][0];
      // Array: [reservation.update, room.update x2]
      expect(Array.isArray(transactionOps)).toBe(true);
      expect(transactionOps.length).toBe(3); // 1 reservation + 2 rooms
    });
  });

  // ── cancel ─────────────────────────────────────────────────────────────────

  describe('cancel', () => {
    it('throws NotFoundException when reservation does not exist', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(null);

      await expect(
        service.cancel('nonexistent', TENANT, { reason: 'Guest request' }, USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when reservation is already CANCELLED', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CANCELLED }),
      );

      await expect(
        service.cancel('res-1', TENANT, { reason: 'test' }, USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when reservation is CHECKED_OUT', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CHECKED_OUT }),
      );

      await expect(
        service.cancel('res-1', TENANT, { reason: 'test' }, USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when reservation is CHECKED_IN', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CHECKED_IN }),
      );

      await expect(
        service.cancel('res-1', TENANT, { reason: 'test' }, USER),
      ).rejects.toThrow(BadRequestException);
    });

    it('transitions reservation status to CANCELLED', async () => {
      mockPrisma.reservation.findFirst.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CONFIRMED }),
      );
      mockPrisma.reservation.update.mockResolvedValue(
        makeReservation({ status: ReservationStatus.CANCELLED }),
      );

      await service.cancel('res-1', TENANT, { reason: 'Guest request' }, USER);

      expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: ReservationStatus.CANCELLED }),
        }),
      );
    });
  });

  // ── getAvailability ────────────────────────────────────────────────────────

  describe('getAvailability', () => {
    it('throws BadRequestException when checkOut is not after checkIn', async () => {
      await expect(
        service.getAvailability(PROPERTY, TENANT, '2025-06-03', '2025-06-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when checkIn equals checkOut', async () => {
      await expect(
        service.getAvailability(PROPERTY, TENANT, '2025-06-01', '2025-06-01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('marks rooms with no overlapping reservations as available', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        makeRoom({ id: 'room-1', reservationRooms: [] }),
        makeRoom({ id: 'room-2', reservationRooms: [] }),
      ]);

      const result = await service.getAvailability(PROPERTY, TENANT, '2025-06-01', '2025-06-03');

      expect(result).toHaveLength(2);
      expect(result[0].isAvailable).toBe(true);
      expect(result[1].isAvailable).toBe(true);
    });

    it('marks rooms with overlapping reservations as unavailable', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        makeRoom({
          id: 'room-1',
          reservationRooms: [{ id: 'rr-1' }],
        }),
      ]);

      const result = await service.getAvailability(PROPERTY, TENANT, '2025-06-01', '2025-06-03');

      expect(result[0].isAvailable).toBe(false);
    });

    it('marks OUT_OF_ORDER rooms as unavailable regardless of reservations', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        makeRoom({ id: 'room-1', status: 'OUT_OF_ORDER', reservationRooms: [] }),
      ]);

      const result = await service.getAvailability(PROPERTY, TENANT, '2025-06-01', '2025-06-03');

      expect(result[0].isAvailable).toBe(false);
    });

    it('marks OUT_OF_SERVICE rooms as unavailable', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        makeRoom({ id: 'room-1', status: 'OUT_OF_SERVICE', reservationRooms: [] }),
      ]);

      const result = await service.getAvailability(PROPERTY, TENANT, '2025-06-01', '2025-06-03');

      expect(result[0].isAvailable).toBe(false);
    });

    it('marks CLEAN rooms with no reservations as available', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        makeRoom({ id: 'room-1', status: 'CLEAN', reservationRooms: [] }),
      ]);

      const result = await service.getAvailability(PROPERTY, TENANT, '2025-06-01', '2025-06-03');

      expect(result[0].isAvailable).toBe(true);
    });

    it('marks DIRTY rooms with no reservations as available', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        makeRoom({ id: 'room-1', status: 'DIRTY', reservationRooms: [] }),
      ]);

      const result = await service.getAvailability(PROPERTY, TENANT, '2025-06-01', '2025-06-03');

      expect(result[0].isAvailable).toBe(true);
    });

    it('queries rooms by propertyId', async () => {
      mockPrisma.room.findMany.mockResolvedValue([]);

      await service.getAvailability('prop-99', TENANT, '2025-06-01', '2025-06-03');

      const findManyCall = mockPrisma.room.findMany.mock.calls[0][0];
      expect(findManyCall.where.propertyId).toBe('prop-99');
    });

    it('returns room details including roomType and beds', async () => {
      mockPrisma.room.findMany.mockResolvedValue([
        makeRoom({ id: 'room-1', reservationRooms: [] }),
      ]);

      const result = await service.getAvailability(PROPERTY, TENANT, '2025-06-01', '2025-06-03');

      expect(result[0]).toHaveProperty('roomType');
      expect(result[0]).toHaveProperty('beds');
      expect(result[0].roomType.name).toBe('Standard');
    });
  });
});