import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { GuestsModule } from './modules/guests/guests.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { FoliosModule } from './modules/folios/folios.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { HousekeepingModule } from './modules/housekeeping/housekeeping.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { NightAuditModule } from './modules/night-audit/night-audit.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    // ─── Config ─────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // ─── Rate Limiting ───────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),

    // ─── Infrastructure ──────────────────────────────────────
    PrismaModule,
    RedisModule,
    WebsocketModule,

    // ─── Feature Modules ─────────────────────────────────────
    AuthModule,
    UsersModule,
    TenantsModule,
    PropertiesModule,
    RoomsModule,
    GuestsModule,
    ReservationsModule,
    FoliosModule,
    PaymentsModule,
    HousekeepingModule,
    MaintenanceModule,
    ReportsModule,
    NotificationsModule,
    NightAuditModule,
  ],
  controllers: [AppController],
  providers: [
    // ─── Global Rate Limiting Guard ──────────────────────────
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ─── Global JWT Auth Guard ────────────────────────────────
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // ─── Global Permissions Guard ─────────────────────────────
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}