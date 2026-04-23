# Noblesse PMS — Backend Architecture (NestJS)

> **Framework:** NestJS 10  
> **Language:** TypeScript 5  
> **Runtime:** Node.js 20 LTS  
> **ORM:** Prisma 5  
> **Database:** PostgreSQL 16  
> **Cache/Queue:** Redis 7 + BullMQ

---

## Folder Structure

```
apps/
└── api/
    ├── src/
    │   ├── main.ts                          # Bootstrap, Swagger, global pipes
    │   ├── app.module.ts                    # Root module
    │   │
    │   ├── config/                          # Configuration
    │   │   ├── app.config.ts
    │   │   ├── database.config.ts
    │   │   ├── redis.config.ts
    │   │   ├── jwt.config.ts
    │   │   ├── mail.config.ts
    │   │   └── storage.config.ts
    │   │
    │   ├── common/                          # Shared utilities
    │   │   ├── decorators/
    │   │   │   ├── current-user.decorator.ts
    │   │   │   ├── current-tenant.decorator.ts
    │   │   │   ├── permissions.decorator.ts
    │   │   │   └── public.decorator.ts
    │   │   ├── guards/
    │   │   │   ├── jwt-auth.guard.ts
    │   │   │   ├── permissions.guard.ts
    │   │   │   └── tenant.guard.ts
    │   │   ├── interceptors/
    │   │   │   ├── tenant.interceptor.ts    # Injects tenant_id into all queries
    │   │   │   ├── audit.interceptor.ts     # Auto-logs mutations
    │   │   │   ├── response.interceptor.ts  # Wraps responses in envelope
    │   │   │   └── logging.interceptor.ts
    │   │   ├── filters/
    │   │   │   ├── http-exception.filter.ts
    │   │   │   ├── prisma-exception.filter.ts
    │   │   │   └── validation-exception.filter.ts
    │   │   ├── pipes/
    │   │   │   ├── zod-validation.pipe.ts
    │   │   │   └── parse-uuid.pipe.ts
    │   │   ├── middleware/
    │   │   │   ├── rate-limit.middleware.ts
    │   │   │   └── request-id.middleware.ts
    │   │   ├── dto/
    │   │   │   ├── pagination.dto.ts
    │   │   │   └── date-range.dto.ts
    │   │   ├── types/
    │   │   │   ├── jwt-payload.type.ts
    │   │   │   ├── tenant-context.type.ts
    │   │   │   └── api-response.type.ts
    │   │   └── utils/
    │   │       ├── date.util.ts
    │   │       ├── number.util.ts
    │   │       ├── string.util.ts
    │   │       └── reservation-number.util.ts
    │   │
    │   ├── prisma/                          # Prisma service
    │   │   ├── prisma.module.ts
    │   │   └── prisma.service.ts
    │   │
    │   ├── redis/                           # Redis service
    │   │   ├── redis.module.ts
    │   │   └── redis.service.ts
    │   │
    │   ├── modules/
    │   │   │
    │   │   ├── auth/
    │   │   │   ├── auth.module.ts
    │   │   │   ├── auth.controller.ts
    │   │   │   ├── auth.service.ts
    │   │   │   ├── strategies/
    │   │   │   │   ├── jwt.strategy.ts
    │   │   │   │   └── jwt-refresh.strategy.ts
    │   │   │   └── dto/
    │   │   │       ├── login.dto.ts
    │   │   │       ├── register.dto.ts
    │   │   │       ├── refresh-token.dto.ts
    │   │   │       └── reset-password.dto.ts
    │   │   │
    │   │   ├── tenants/
    │   │   │   ├── tenants.module.ts
    │   │   │   ├── tenants.controller.ts
    │   │   │   ├── tenants.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-tenant.dto.ts
    │   │   │       └── update-tenant.dto.ts
    │   │   │
    │   │   ├── users/
    │   │   │   ├── users.module.ts
    │   │   │   ├── users.controller.ts
    │   │   │   ├── users.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-user.dto.ts
    │   │   │       ├── update-user.dto.ts
    │   │   │       └── user-response.dto.ts
    │   │   │
    │   │   ├── roles/
    │   │   │   ├── roles.module.ts
    │   │   │   ├── roles.controller.ts
    │   │   │   ├── roles.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-role.dto.ts
    │   │   │       └── update-role.dto.ts
    │   │   │
    │   │   ├── properties/
    │   │   │   ├── properties.module.ts
    │   │   │   ├── properties.controller.ts
    │   │   │   ├── properties.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-property.dto.ts
    │   │   │       └── update-property.dto.ts
    │   │   │
    │   │   ├── rooms/
    │   │   │   ├── rooms.module.ts
    │   │   │   ├── rooms.controller.ts
    │   │   │   ├── rooms.service.ts
    │   │   │   ├── room-types.controller.ts
    │   │   │   ├── room-types.service.ts
    │   │   │   ├── availability.service.ts  # Core availability engine
    │   │   │   └── dto/
    │   │   │       ├── create-room.dto.ts
    │   │   │       ├── create-room-type.dto.ts
    │   │   │       ├── availability-query.dto.ts
    │   │   │       └── update-room-status.dto.ts
    │   │   │
    │   │   ├── rates/
    │   │   │   ├── rates.module.ts
    │   │   │   ├── rates.controller.ts
    │   │   │   ├── rates.service.ts
    │   │   │   ├── rate-calculator.service.ts  # Rate calculation engine
    │   │   │   └── dto/
    │   │   │       ├── create-rate-plan.dto.ts
    │   │   │       ├── create-seasonal-rate.dto.ts
    │   │   │       └── rate-query.dto.ts
    │   │   │
    │   │   ├── guests/
    │   │   │   ├── guests.module.ts
    │   │   │   ├── guests.controller.ts
    │   │   │   ├── guests.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-guest.dto.ts
    │   │   │       ├── update-guest.dto.ts
    │   │   │       └── merge-guests.dto.ts
    │   │   │
    │   │   ├── reservations/
    │   │   │   ├── reservations.module.ts
    │   │   │   ├── reservations.controller.ts
    │   │   │   ├── reservations.service.ts
    │   │   │   ├── checkin.service.ts
    │   │   │   ├── checkout.service.ts
    │   │   │   ├── reservation-number.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-reservation.dto.ts
    │   │   │       ├── update-reservation.dto.ts
    │   │   │       ├── checkin.dto.ts
    │   │   │       ├── checkout.dto.ts
    │   │   │       ├── cancel-reservation.dto.ts
    │   │   │       ├── walk-in.dto.ts
    │   │   │       └── change-room.dto.ts
    │   │   │
    │   │   ├── folios/
    │   │   │   ├── folios.module.ts
    │   │   │   ├── folios.controller.ts
    │   │   │   ├── folios.service.ts
    │   │   │   ├── folio-calculator.service.ts
    │   │   │   └── dto/
    │   │   │       ├── add-folio-item.dto.ts
    │   │   │       ├── void-folio-item.dto.ts
    │   │   │       └── apply-discount.dto.ts
    │   │   │
    │   │   ├── payments/
    │   │   │   ├── payments.module.ts
    │   │   │   ├── payments.controller.ts
    │   │   │   ├── payments.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-payment.dto.ts
    │   │   │       └── refund-payment.dto.ts
    │   │   │
    │   │   ├── invoices/
    │   │   │   ├── invoices.module.ts
    │   │   │   ├── invoices.controller.ts
    │   │   │   ├── invoices.service.ts
    │   │   │   ├── invoice-pdf.service.ts
    │   │   │   └── dto/
    │   │   │       └── create-invoice.dto.ts
    │   │   │
    │   │   ├── housekeeping/
    │   │   │   ├── housekeeping.module.ts
    │   │   │   ├── housekeeping.controller.ts
    │   │   │   ├── housekeeping.service.ts
    │   │   │   ├── housekeeping-scheduler.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-task.dto.ts
    │   │   │       ├── update-task-status.dto.ts
    │   │   │       └── auto-assign.dto.ts
    │   │   │
    │   │   ├── maintenance/
    │   │   │   ├── maintenance.module.ts
    │   │   │   ├── maintenance.controller.ts
    │   │   │   ├── maintenance.service.ts
    │   │   │   └── dto/
    │   │   │       ├── create-ticket.dto.ts
    │   │   │       └── update-ticket.dto.ts
    │   │   │
    │   │   ├── reports/
    │   │   │   ├── reports.module.ts
    │   │   │   ├── reports.controller.ts
    │   │   │   ├── reports.service.ts
    │   │   │   ├── occupancy-report.service.ts
    │   │   │   ├── revenue-report.service.ts
    │   │   │   ├── daily-report.service.ts
    │   │   │   └── dto/
    │   │   │       ├── report-query.dto.ts
    │   │   │       └── export-report.dto.ts
    │   │   │
    │   │   ├── notifications/
    │   │   │   ├── notifications.module.ts
    │   │   │   ├── notifications.controller.ts
    │   │   │   ├── notifications.service.ts
    │   │   │   └── notification-events.service.ts
    │   │   │
    │   │   ├── night-audit/
    │   │   │   ├── night-audit.module.ts
    │   │   │   ├── night-audit.controller.ts
    │   │   │   └── night-audit.service.ts
    │   │   │
    │   │   ├── room-rack/
    │   │   │   ├── room-rack.module.ts
    │   │   │   ├── room-rack.controller.ts
    │   │   │   └── room-rack.service.ts
    │   │   │
    │   │   ├── settings/
    │   │   │   ├── settings.module.ts
    │   │   │   ├── settings.controller.ts
    │   │   │   └── settings.service.ts
    │   │   │
    │   │   ├── audit/
    │   │   │   ├── audit.module.ts
    │   │   │   ├── audit.controller.ts
    │   │   │   └── audit.service.ts
    │   │   │
    │   │   ├── ai/
    │   │   │   ├── ai.module.ts
    │   │   │   ├── ai.controller.ts
    │   │   │   ├── ai.service.ts
    │   │   │   ├── command-parser.service.ts
    │   │   │   └── pricing-suggestion.service.ts
    │   │   │
    │   │   └── mail/
    │   │       ├── mail.module.ts
    │   │       ├── mail.service.ts
    │   │       └── templates/
    │   │           ├── booking-confirmation.mjml
    │   │           ├── checkin-reminder.mjml
    │   │           ├── checkout-invoice.mjml
    │   │           └── payment-reminder.mjml
    │   │
    │   ├── jobs/                            # BullMQ background jobs
    │   │   ├── jobs.module.ts
    │   │   ├── email.processor.ts
    │   │   ├── report.processor.ts
    │   │   ├── night-audit.processor.ts
    │   │   ├── notification.processor.ts
    │   │   └── ai-summary.processor.ts
    │   │
    │   └── websocket/                       # Socket.io gateway
    │       ├── websocket.module.ts
    │       ├── websocket.gateway.ts
    │       └── websocket.service.ts
    │
    ├── prisma/
    │   ├── schema.prisma
    │   ├── migrations/
    │   └── seed.ts
    │
    ├── test/
    │   ├── unit/
    │   │   ├── auth/
    │   │   ├── reservations/
    │   │   ├── availability/
    │   │   └── billing/
    │   ├── integration/
    │   │   ├── auth.e2e-spec.ts
    │   │   ├── reservations.e2e-spec.ts
    │   │   └── billing.e2e-spec.ts
    │   └── fixtures/
    │       ├── tenant.fixture.ts
    │       ├── user.fixture.ts
    │       └── reservation.fixture.ts
    │
    ├── .env
    ├── .env.example
    ├── nest-cli.json
    ├── tsconfig.json
    └── package.json
```

---

## Core Implementation Details

### 1. Main Bootstrap (`main.ts`)

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Security
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // API versioning
  app.enableVersioning({ type: VersioningType.URI });
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Noblesse PMS API')
      .setDescription('Hotel Property Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
```

---

### 2. Tenant Interceptor (Critical for Multi-tenancy)

```typescript
// common/interceptors/tenant.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return next.handle();

    // Get tenant from cache or DB
    const cacheKey = `tenant:${user.tenantId}`;
    let tenant = await this.redis.get(cacheKey);

    if (!tenant) {
      tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId, deletedAt: null },
        select: { id: true, slug: true, status: true, plan: true, timezone: true, currency: true },
      });

      if (!tenant) throw new ForbiddenException('Tenant not found or suspended');
      if (tenant.status === 'SUSPENDED') throw new ForbiddenException('Account suspended');

      await this.redis.set(cacheKey, JSON.stringify(tenant), 300); // 5 min cache
    } else {
      tenant = JSON.parse(tenant);
    }

    // Inject tenant context into request
    request.tenant = tenant;
    request.tenantId = tenant.id;

    return next.handle();
  }
}
```

---

### 3. Permissions Guard

```typescript
// common/guards/permissions.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) throw new ForbiddenException('Authentication required');

    // Super admin bypasses all permission checks
    if (user.isSuperAdmin) return true;

    const hasPermission = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Missing required permissions: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
```

---

### 4. Availability Service (Core Algorithm)

```typescript
// modules/rooms/availability.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface AvailabilityQuery {
  propertyId: string;
  tenantId: string;
  checkIn: Date;
  checkOut: Date;
  roomTypeId?: string;
  adults?: number;
  children?: number;
}

export interface RoomAvailability {
  roomTypeId: string;
  roomTypeName: string;
  availableCount: number;
  totalCount: number;
  baseRate: number;
  availableRooms: { id: string; number: string; floor: number }[];
}

@Injectable()
export class AvailabilityService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getAvailableRoomTypes(query: AvailabilityQuery): Promise<RoomAvailability[]> {
    const { propertyId, tenantId, checkIn, checkOut, roomTypeId } = query;

    // Get all room types for property
    const roomTypes = await this.prisma.roomType.findMany({
      where: {
        propertyId,
        tenantId,
        isActive: true,
        ...(roomTypeId && { id: roomTypeId }),
      },
      include: {
        rooms: {
          where: { isActive: true, tenantId },
          select: { id: true, number: true, status: true, floor: { select: { number: true } } },
        },
      },
    });

    const results: RoomAvailability[] = [];

    for (const roomType of roomTypes) {
      const availableRooms = await this.getAvailableRoomsForType({
        roomTypeId: roomType.id,
        tenantId,
        checkIn,
        checkOut,
        allRooms: roomType.rooms,
      });

      results.push({
        roomTypeId: roomType.id,
        roomTypeName: roomType.name,
        availableCount: availableRooms.length,
        totalCount: roomType.rooms.length,
        baseRate: Number(roomType.baseRate),
        availableRooms: availableRooms.map((r) => ({
          id: r.id,
          number: r.number,
          floor: r.floor?.number || 0,
        })),
      });
    }

    return results;
  }

  async getAvailableRoomsForType(params: {
    roomTypeId: string;
    tenantId: string;
    checkIn: Date;
    checkOut: Date;
    allRooms: any[];
  }): Promise<any[]> {
    const { roomTypeId, tenantId, checkIn, checkOut, allRooms } = params;

    // Find rooms that have conflicting reservations
    const conflictingRoomIds = await this.prisma.reservationRoom.findMany({
      where: {
        roomType: { id: roomTypeId },
        isActive: true,
        reservation: {
          tenantId,
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'CHECKED_OUT'] },
        },
        // Overlap condition: existing.checkIn < newCheckOut AND existing.checkOut > newCheckIn
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
      select: { roomId: true },
    });

    const conflictingIds = new Set(
      conflictingRoomIds.map((r) => r.roomId).filter(Boolean),
    );

    // Filter out conflicting and out-of-order rooms
    return allRooms.filter(
      (room) =>
        !conflictingIds.has(room.id) &&
        room.status !== 'OUT_OF_ORDER' &&
        room.status !== 'MAINTENANCE' &&
        room.status !== 'BLOCKED',
    );
  }

  async checkRoomAvailability(params: {
    roomId: string;
    tenantId: string;
    checkIn: Date;
    checkOut: Date;
    excludeReservationId?: string;
  }): Promise<boolean> {
    const { roomId, tenantId, checkIn, checkOut, excludeReservationId } = params;

    const conflict = await this.prisma.reservationRoom.findFirst({
      where: {
        roomId,
        isActive: true,
        reservation: {
          tenantId,
          status: { notIn: ['CANCELLED', 'NO_SHOW', 'CHECKED_OUT'] },
          ...(excludeReservationId && { id: { not: excludeReservationId } }),
        },
        checkInDate: { lt: checkOut },
        checkOutDate: { gt: checkIn },
      },
    });

    return !conflict;
  }

  // Advisory lock-based double-booking prevention
  async acquireRoomLock(roomId: string, prismaClient: any): Promise<void> {
    // PostgreSQL advisory lock using room ID hash
    await prismaClient.$executeRaw`
      SELECT pg_advisory_xact_lock(hashtext(${`room_${roomId}`}))
    `;
  }
}
```

---

### 5. Reservation Service (with Transaction)

```typescript
// modules/reservations/reservations.service.ts
import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../rooms/availability.service';
import { FolioCalculatorService } from '../folios/folio-calculator.service';
import { NotificationEventsService } from '../notifications/notification-events.service';
import { AuditService } from '../audit/audit.service';
import { ReservationNumberService } from './reservation-number.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus } from '@prisma/client';
import { differenceInDays } from 'date-fns';

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private availability: AvailabilityService,
    private folioCalculator: FolioCalculatorService,
    private notifications: NotificationEventsService,
    private audit: AuditService,
    private reservationNumber: ReservationNumberService,
  ) {}

  async create(dto: CreateReservationDto, context: { userId: string; tenantId: string }) {
    const { userId, tenantId } = context;
    const checkIn = new Date(dto.arrivalDate);
    const checkOut = new Date(dto.departureDate);
    const nights = differenceInDays(checkOut, checkIn);

    if (nights <= 0) {
      throw new BadRequestException('Departure date must be after arrival date');
    }

    // Run everything in a transaction with advisory lock
    return this.prisma.$transaction(async (tx) => {
      // 1. Acquire advisory lock for each room to prevent race conditions
      for (const roomData of dto.rooms) {
        if (roomData.roomId) {
          await this.availability.acquireRoomLock(roomData.roomId, tx);
        }
      }

      // 2. Verify room availability (inside transaction)
      for (const roomData of dto.rooms) {
        if (roomData.roomId) {
          const isAvailable = await this.availability.checkRoomAvailability({
            roomId: roomData.roomId,
            tenantId,
            checkIn,
            checkOut,
          });

          if (!isAvailable) {
            throw new ConflictException(
              `Room is not available for the selected dates`,
            );
          }
        }
      }

      // 3. Generate reservation number
      const reservationNumber = await this.reservationNumber.generate(tenantId, tx);

      // 4. Calculate total amount
      let totalAmount = 0;
      for (const roomData of dto.rooms) {
        totalAmount += roomData.ratePerNight * nights;
      }

      // 5. Create reservation
      const reservation = await tx.reservation.create({
        data: {
          tenantId,
          propertyId: dto.propertyId,
          reservationNumber,
          status: ReservationStatus.CONFIRMED,
          sourceId: dto.sourceId,
          ratePlanId: dto.ratePlanId,
          arrivalDate: checkIn,
          departureDate: checkOut,
          nights,
          adults: dto.adults,
          children: dto.children || 0,
          infants: dto.infants || 0,
          totalAmount,
          depositAmount: dto.depositAmount || 0,
          currency: dto.currency || 'USD',
          notes: dto.notes,
          specialRequests: dto.specialRequests,
          isCorporate: dto.isCorporate || false,
          createdBy: userId,
          confirmedAt: new Date(),
        },
      });

      // 6. Create reservation rooms
      for (const roomData of dto.rooms) {
        await tx.reservationRoom.create({
          data: {
            reservationId: reservation.id,
            roomId: roomData.roomId || null,
            roomTypeId: roomData.roomTypeId,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            ratePerNight: roomData.ratePerNight,
            totalRate: roomData.ratePerNight * nights,
            adults: dto.adults,
            children: dto.children || 0,
          },
        });
      }

      // 7. Link guests
      if (dto.primaryGuestId) {
        await tx.reservationGuest.create({
          data: {
            reservationId: reservation.id,
            guestId: dto.primaryGuestId,
            isPrimary: true,
          },
        });
      }

      // 8. Create folio
      const folioNumber = await this.generateFolioNumber(tenantId, tx);
      const folio = await tx.folio.create({
        data: {
          tenantId,
          reservationId: reservation.id,
          folioNumber,
          currency: dto.currency || 'USD',
          total: totalAmount,
          balance: totalAmount,
        },
      });

      // 9. Create folio items (room charges)
      for (const roomData of dto.rooms) {
        for (let i = 0; i < nights; i++) {
          const serviceDate = new Date(checkIn);
          serviceDate.setDate(serviceDate.getDate() + i);

          await tx.folioItem.create({
            data: {
              folioId: folio.id,
              type: 'ROOM_CHARGE',
              description: `Room charge - Night ${i + 1}`,
              quantity: 1,
              unitPrice: roomData.ratePerNight,
              taxRate: 0, // Tax calculated separately
              taxAmount: 0,
              total: roomData.ratePerNight,
              serviceDate,
              roomId: roomData.roomId || null,
              createdBy: userId,
            },
          });
        }
      }

      // 10. Create reservation log
      await tx.reservationLog.create({
        data: {
          reservationId: reservation.id,
          userId,
          action: 'CREATED',
          description: `Reservation created with status CONFIRMED`,
          newValue: { status: 'CONFIRMED', totalAmount },
        },
      });

      return { reservation, folio };
    });

    // Post-transaction: send notifications (outside transaction)
    // These are fire-and-forget
  }

  async checkIn(reservationId: string, dto: any, context: { userId: string; tenantId: string }) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenantId: context.tenantId, deletedAt: null },
      include: { reservationRooms: { where: { isActive: true } } },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(`Cannot check in reservation with status: ${reservation.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Update reservation status
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.CHECKED_IN,
          checkedInAt: new Date(),
          version: { increment: 1 },
        },
      });

      // Update room status to OCCUPIED
      for (const resRoom of reservation.reservationRooms) {
        if (resRoom.roomId) {
          await tx.room.update({
            where: { id: resRoom.roomId },
            data: { status: 'OCCUPIED' },
          });
        }
      }

      // Log check-in
      await tx.reservationLog.create({
        data: {
          reservationId,
          userId: context.userId,
          action: 'CHECKIN',
          description: 'Guest checked in',
          oldValue: { status: 'CONFIRMED' },
          newValue: { status: 'CHECKED_IN', checkedInAt: new Date() },
        },
      });

      return updated;
    });
  }

  async checkOut(reservationId: string, dto: any, context: { userId: string; tenantId: string }) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id: reservationId, tenantId: context.tenantId, deletedAt: null },
      include: {
        reservationRooms: { where: { isActive: true } },
        folios: { include: { payments: true } },
      },
    });

    if (!reservation) throw new NotFoundException('Reservation not found');
    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      throw new BadRequestException('Reservation is not checked in');
    }

    return this.prisma.$transaction(async (tx) => {
      // Process final payment if provided
      if (dto.finalPaymentAmount > 0) {
        const folio = reservation.folios[0];
        await tx.payment.create({
          data: {
            tenantId: context.tenantId,
            folioId: folio.id,
            paymentNumber: await this.generatePaymentNumber(context.tenantId, tx),
            method: dto.finalPaymentMethod,
            amount: dto.finalPaymentAmount,
            currency: folio.currency,
            reference: dto.finalPaymentReference,
            processedBy: context.userId,
          },
        });

        // Update folio
        await tx.folio.update({
          where: { id: folio.id },
          data: {
            paidAmount: { increment: dto.finalPaymentAmount },
            balance: { decrement: dto.finalPaymentAmount },
            status: 'PAID',
          },
        });
      }

      // Update reservation
      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: ReservationStatus.CHECKED_OUT,
          checkedOutAt: new Date(),
          version: { increment: 1 },
        },
      });

      // Update rooms to DIRTY
      for (const resRoom of reservation.reservationRooms) {
        if (resRoom.roomId) {
          await tx.room.update({
            where: { id: resRoom.roomId },
            data: { status: 'DIRTY' },
          });
        }
      }

      // Log check-out
      await tx.reservationLog.create({
        data: {
          reservationId,
          userId: context.userId,
          action: 'CHECKOUT',
          description: 'Guest checked out',
          oldValue: { status: 'CHECKED_IN' },
          newValue: { status: 'CHECKED_OUT', checkedOutAt: new Date() },
        },
      });

      return updated;
    });
  }

  private async generateFolioNumber(tenantId: string, tx: any): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.folio.count({ where: { tenantId } });
    return `LUM-F-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  private async generatePaymentNumber(tenantId: string, tx: any): Promise<string> {
    const year = new Date().getFullYear();
    const count = await tx.payment.count({ where: { tenantId } });
    return `LUM-P-${year}-${String(count + 1).padStart(5, '0')}`;
  }
}
```

---

### 6. JWT Strategy

```typescript
// modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

export interface JwtPayload {
  sub: string;       // user ID
  tenantId: string;
  email: string;
  isSuperAdmin: boolean;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload) {
    // Check if token is blacklisted (logged out)
    const isBlacklisted = await this.redis.get(`blacklist:${payload.sub}:${payload.iat}`);
    if (isBlacklisted) throw new UnauthorizedException('Token has been revoked');

    // Get user with permissions from cache or DB
    const cacheKey = `user_permissions:${payload.sub}`;
    let userData = await this.redis.get(cacheKey);

    if (!userData) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, deletedAt: null },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
          userProperties: { select: { propertyId: true } },
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Flatten permissions
      const permissions = new Set<string>();
      for (const userRole of user.userRoles) {
        for (const rp of userRole.role.rolePermissions) {
          permissions.add(`${rp.permission.resource}.${rp.permission.action}`);
        }
      }

      userData = JSON.stringify({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        isSuperAdmin: false,
        permissions: Array.from(permissions),
        propertyIds: user.userProperties.map((up) => up.propertyId),
        roles: user.userRoles.map((ur) => ur.role.name),
      });

      await this.redis.set(cacheKey, userData, 300); // 5 min cache
    }

    return JSON.parse(userData);
  }
}
```

---

### 7. Audit Service

```typescript
// modules/audit/audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogEntry {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    // Fire and forget - don't await in critical paths
    this.prisma.auditLog
      .create({
        data: {
          tenantId: entry.tenantId,
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          description: entry.description,
          oldValues: entry.oldValues,
          newValues: entry.newValues,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      })
      .catch((err) => console.error('Audit log failed:', err));
  }

  async findAll(tenantId: string, filters: any) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.resourceId && { resourceId: filters.resourceId }),
        ...(filters.action && { action: filters.action }),
        ...(filters.dateFrom && { createdAt: { gte: new Date(filters.dateFrom) } }),
        ...(filters.dateTo && { createdAt: { lte: new Date(filters.dateTo) } }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });
  }
}
```

---

### 8. WebSocket Gateway

```typescript
// websocket/websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(','), credentials: true },
  namespace: '/ws',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('WebSocketGateway');
  private connectedUsers = new Map<string, { userId: string; tenantId: string; propertyIds: string[] }>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token?.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);

      this.connectedUsers.set(client.id, {
        userId: payload.sub,
        tenantId: payload.tenantId,
        propertyIds: [],
      });

      // Join tenant room
      client.join(`tenant:${payload.tenantId}`);
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:property')
  handleSubscribeProperty(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { propertyId: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      client.join(`property:${data.propertyId}`);
      user.propertyIds.push(data.propertyId);
    }
  }

  // Emit methods called by services
  emitRoomStatusChanged(tenantId: string, propertyId: string, data: any) {
    this.server.to(`property:${propertyId}`).emit('room:status_changed', data);
  }

  emitReservationCreated(tenantId: string, propertyId: string, data: any) {
    this.server.to(`property:${propertyId}`).emit('reservation:created', data);
  }

  emitReservationStatusChanged(tenantId: string, propertyId: string, data: any) {
    this.server.to(`property:${propertyId}`).emit('reservation:status_changed', data);
  }

  emitNotification(tenantId: string, userId: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit('notification:new', data);
  }

  emitHousekeepingUpdate(propertyId: string, data: any) {
    this.server.to(`property:${propertyId}`).emit('housekeeping:task_updated', data);
  }
}
```

---

### 9. BullMQ Job Processors

```typescript
// jobs/email.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../modules/mail/mail.service';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private logger = new Logger('EmailProcessor');

  constructor(private mailService: MailService) {
    super();
  }

  async process(job: Job) {
    this.logger.log(`Processing email job: ${job.name}`);

    switch (job.name) {
      case 'booking_confirmation':
        await this.mailService.sendBookingConfirmation(job.data);
        break;
      case 'checkin_reminder':
        await this.mailService.sendCheckinReminder(job.data);
        break;
      case 'checkout_invoice':
        await this.mailService.sendCheckoutInvoice(job.data);
        break;
      case 'payment_reminder':
        await this.mailService.sendPaymentReminder(job.data);
        break;
      default:
        this.logger.warn(`Unknown email job: ${job.name}`);
    }
  }
}
```

---

### 10. Rate Calculator Service

```typescript
// modules/rates/rate-calculator.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { eachDayOfInterval, format } from 'date-fns';

export interface RateCalculationResult {
  nights: number;
  dailyRates: { date: string; rate: number }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  ratePlanName: string;
}

@Injectable()
export class RateCalculatorService {
  constructor(private prisma: PrismaService) {}

  async calculateRate(params: {
    roomTypeId: string;
    ratePlanId: string;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
    tenantId: string;
  }): Promise<RateCalculationResult> {
    const { roomTypeId, ratePlanId, checkIn, checkOut, adults, children, tenantId } = params;

    // Get rate plan with room type rates
    const ratePlan = await this.prisma.ratePlan.findFirst({
      where: { id: ratePlanId, tenantId },
      include: {
        ratePlanRoomTypes: { where: { roomTypeId } },
      },
    });

    const roomType = await this.prisma.roomType.findUnique({
      where: { id: roomTypeId },
    });

    const baseRate = ratePlan?.ratePlanRoomTypes[0]?.baseRate || roomType?.baseRate || 0;

    // Get seasonal rate overrides for each night
    const days = eachDayOfInterval({ start: checkIn, end: new Date(checkOut.getTime() - 86400000) });
    const dailyRates: { date: string; rate: number }[] = [];

    for (const day of days) {
      const seasonalRate = await this.prisma.seasonalRate.findFirst({
        where: {
          ratePlanId,
          roomTypeId,
          startDate: { lte: day },
          endDate: { gte: day },
          stopSell: false,
        },
        orderBy: { startDate: 'desc' }, // Most specific rate wins
      });

      const nightRate = seasonalRate ? Number(seasonalRate.rate) : Number(baseRate);

      // Extra person charges
      const extraAdults = Math.max(0, adults - (roomType?.maxAdults || 2));
      const extraChildren = Math.max(0, children - (roomType?.maxChildren || 1));
      const extraCharges =
        extraAdults * Number(roomType?.extraAdultRate || 0) +
        extraChildren * Number(roomType?.extraChildRate || 0);

      dailyRates.push({
        date: format(day, 'yyyy-MM-dd'),
        rate: nightRate + extraCharges,
      });
    }

    const subtotal = dailyRates.reduce((sum, d) => sum + d.rate, 0);

    // Get applicable taxes
    const taxes = await this.prisma.tax.findMany({
      where: {
        tenantId,
        isActive: true,
        appliesTo: { hasSome: ['ROOM_CHARGE'] },
      },
    });

    let taxAmount = 0;
    for (const tax of taxes) {
      if (!tax.isInclusive) {
        if (tax.type === 'PERCENTAGE') {
          taxAmount += subtotal * (Number(tax.rate) / 100);
        } else {
          taxAmount += Number(tax.rate) * days.length;
        }
      }
    }

    return {
      nights: days.length,
      dailyRates,
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
      ratePlanName: ratePlan?.name || 'Standard Rate',
    };
  }
}
```

---

### 11. Night Audit Service

```typescript
// modules/night-audit/night-audit.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';
import { format, addDays } from 'date-fns';

@Injectable()
export class NightAuditService {
  constructor(private prisma: PrismaService) {}

  async runAudit(params: {
    propertyId: string;
    tenantId: string;
    auditDate: Date;
    userId: string;
  }) {
    const { propertyId, tenantId, auditDate, userId } = params;

    // Check if audit already run for this date
    const existing = await this.prisma.nightAuditLog.findUnique({
      where: { propertyId_auditDate: { propertyId, auditDate } },
    });

    if (existing?.status === 'COMPLETED') {
      throw new BadRequestException('Night audit already completed for this date');
    }

    // Create audit log entry
    const auditLog = await this.prisma.nightAuditLog.create({
      data: {
        tenantId,
        propertyId,
        auditDate,
        status: 'RUNNING',
        startedAt: new Date(),
        runBy: userId,
      },
    });

    try {
      const summary = await this.prisma.$transaction(async (tx) => {
        const nextDate = addDays(auditDate, 1);
        const summary: Record<string, any> = {};

        // 1. Post room charges for all in-house guests
        const inHouseReservations = await tx.reservation.findMany({
          where: {
            tenantId,
            propertyId,
            status: ReservationStatus.CHECKED_IN,
            departureDate: { gt: auditDate },
          },
          include: {
            reservationRooms: { where: { isActive: true } },
            folios: { where: { status: 'OPEN' } },
          },
        });

        let roomChargesPosted = 0;
        for (const reservation of inHouseReservations) {
          const folio = reservation.folios[0];
          if (!folio) continue;

          for (const resRoom of reservation.reservationRooms) {
            await tx.folioItem.create({
              data: {
                folioId: folio.id,
                type: 'ROOM_CHARGE',
                description: `Room charge - ${format(nextDate, 'MMM dd, yyyy')}`,
                quantity: 1,
                unitPrice: resRoom.ratePerNight,
                taxRate: 0,
                taxAmount: 0,
                total: resRoom.ratePerNight,
                serviceDate: nextDate,
                roomId: resRoom.roomId,
                createdBy: userId,
              },
            });

            // Update folio totals
            await tx.folio.update({
              where: { id: folio.id },
              data: {
                total: { increment: Number(resRoom.ratePerNight) },
                balance: { increment: Number(resRoom.ratePerNight) },
              },
            });

            roomChargesPosted++;
          }
        }

        summary.roomChargesPosted = roomChargesPosted;
        summary.inHouseGuests = inHouseReservations.length;

        // 2. Calculate daily statistics
        const todayArrivals = await tx.reservation.count({
          where: { tenantId, propertyId, arrivalDate: auditDate, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
        });

        const todayDepartures = await tx.reservation.count({
          where: { tenantId, propertyId, departureDate: auditDate, status: 'CHECKED_OUT' },
        });

        const totalRooms = await tx.room.count({ where: { propertyId, isActive: true } });
        const occupiedRooms = inHouseReservations.length;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        summary.arrivals = todayArrivals;
        summary.departures = todayDepartures;
        summary.occupancyRate = Math.round(occupancyRate * 10) / 10;
        summary.totalRooms = totalRooms;
        summary.occupiedRooms = occupiedRooms;

        return summary;
      });

      // Update audit log as completed
      await this.prisma.nightAuditLog.update({
        where: { id: auditLog.id },
        data: { status: 'COMPLETED', completedAt: new Date(), summary },
      });

      return { success: true, summary };
    } catch (error) {
      await this.prisma.nightAuditLog.update({
        where: { id: auditLog.id },
        data: { status: 'FAILED', errors: [{ message: error.message }] },
      });
      throw error;
    }
  }
}
```

---

### 12. Error Handling

```typescript
// common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || exception.message;
      code = exceptionResponse.code || this.getCodeFromStatus(status);
      details = exceptionResponse.details;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with this value already exists';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'Record not found';
      }
    }

    this.logger.error(`${request.method} ${request.url} - ${status}: ${message}`, exception instanceof Error ? exception.stack : '');

    response.status(status).json({
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getCodeFromStatus(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
    };
    return codes[status] || 'INTERNAL_ERROR';
  }
}
```

---

### 13. Environment Configuration

```bash
# .env.example

# App
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000

# Database
DATABASE_URL=postgresql://Noblesse:password@localhost:5432/Noblesse_pms

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=7d

# Mail
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
MAIL_FROM=noreply@Noblessepms.com
MAIL_FROM_NAME=Noblesse PMS

# Storage (S3-compatible)
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_BUCKET=Noblesse-pms-files
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_REGION=us-east-1

# OpenAI (for AI features)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

### 14. Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://Noblesse:password@postgres:5432/Noblesse_pms
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001/api/v1
    depends_on:
      - api
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: Noblesse_pms
      POSTGRES_USER: Noblesse
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api
      - web
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data: