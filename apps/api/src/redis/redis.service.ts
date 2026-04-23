import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: config.get<number>('REDIS_PORT', 6379),
      password: config.get<string>('REDIS_PASSWORD') || undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  getClient(): Redis {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ─── Key helpers ────────────────────────────────────────────

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  // ─── Token blacklist ─────────────────────────────────────────

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.set(`blacklist:${jti}`, '1', ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return this.exists(`blacklist:${jti}`);
  }

  // ─── Permission cache ────────────────────────────────────────

  async cacheUserPermissions(userId: string, permissions: string[], ttlSeconds = 300): Promise<void> {
    await this.setJson(`perms:${userId}`, permissions, ttlSeconds);
  }

  async getCachedUserPermissions(userId: string): Promise<string[] | null> {
    return this.getJson<string[]>(`perms:${userId}`);
  }

  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.del(`perms:${userId}`);
  }
}