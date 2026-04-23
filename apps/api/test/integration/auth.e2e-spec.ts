/**
 * Integration tests for AuthService.
 *
 * Tests the full service layer (with mocked Prisma, Redis, JWT) to verify:
 *   - login: credential validation, token generation, permission caching
 *   - refreshTokens: token rotation, expiry checks
 *   - logout: token blacklisting, refresh token revocation
 *   - getMe: user profile retrieval
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';

// ─── Mock factories ──────────────────────────────────────────────────────────

function makeUser(overrides: Partial<{
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  isActive: boolean;
  deletedAt: Date | null;
  phone: string | null;
  avatarUrl: string | null;
  userRoles: unknown[];
  userProperties: unknown[];
}> = {}) {
  return {
    id: 'user-1',
    email: 'admin@hotel.com',
    passwordHash: '$2b$10$hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    tenantId: 'tenant-1',
    isActive: true,
    deletedAt: null,
    phone: null,
    avatarUrl: null,
    userRoles: [],
    userProperties: [],
    ...overrides,
  };
}

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockRedis = {
  cacheUserPermissions: jest.fn(),
  getCachedUserPermissions: jest.fn(),
  blacklistToken: jest.fn(),
  invalidateUserPermissions: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string, defaultVal?: unknown) => {
    const values: Record<string, unknown> = {
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      JWT_EXPIRES_SECONDS: 900,
    };
    return values[key] ?? defaultVal;
  }),
};

// ─── Test Suite ──────────────────────────────────────────────────────────────

describe('AuthService (integration)', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    // Default JWT sign returns a token string
    mockJwt.sign.mockReturnValue('mock-token');
    mockPrisma.refreshToken.create.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});
    mockRedis.cacheUserPermissions.mockResolvedValue(undefined);
  });

  // ── login ──────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws UnauthorizedException when user is not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@hotel.com', password: 'pass' }, 'tenant-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is incorrect', async () => {
      const user = makeUser({ passwordHash: await bcrypt.hash('correct-pass', 10) });
      mockPrisma.user.findFirst.mockResolvedValue(user);

      await expect(
        service.login({ email: 'admin@hotel.com', password: 'wrong-pass' }, 'tenant-1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns user profile and tokens on successful login', async () => {
      const hash = await bcrypt.hash('correct-pass', 10);
      const user = makeUser({
        passwordHash: hash,
        userRoles: [
          {
            role: {
              name: 'ADMIN',
              rolePermissions: [
                { permission: { resource: 'reservations', action: 'read' } },
                { permission: { resource: 'reservations', action: 'write' } },
              ],
            },
          },
        ],
        userProperties: [{ propertyId: 'prop-1' }],
      });
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = await service.login({ email: 'admin@hotel.com', password: 'correct-pass' }, 'tenant-1');

      expect(result.user.email).toBe('admin@hotel.com');
      expect(result.user.fullName).toBe('John Doe');
      expect(result.user.roles).toContain('ADMIN');
      expect(result.user.permissions).toContain('reservations.read');
      expect(result.user.permissions).toContain('reservations.write');
      expect(result.user.propertyIds).toContain('prop-1');
      expect(result.tokens.accessToken).toBe('mock-token');
    });

    it('caches user permissions in Redis after login', async () => {
      const hash = await bcrypt.hash('pass', 10);
      const user = makeUser({
        passwordHash: hash,
        userRoles: [
          {
            role: {
              name: 'STAFF',
              rolePermissions: [
                { permission: { resource: 'rooms', action: 'read' } },
              ],
            },
          },
        ],
      });
      mockPrisma.user.findFirst.mockResolvedValue(user);

      await service.login({ email: 'admin@hotel.com', password: 'pass' }, 'tenant-1');

      expect(mockRedis.cacheUserPermissions).toHaveBeenCalledWith(
        'user-1',
        ['rooms.read'],
        300,
      );
    });

    it('updates lastLoginAt after successful login', async () => {
      const hash = await bcrypt.hash('pass', 10);
      const user = makeUser({ passwordHash: hash });
      mockPrisma.user.findFirst.mockResolvedValue(user);

      await service.login({ email: 'admin@hotel.com', password: 'pass' }, 'tenant-1');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({ lastLoginAt: expect.any(Date) }),
        }),
      );
    });

    it('generates both access and refresh tokens', async () => {
      const hash = await bcrypt.hash('pass', 10);
      const user = makeUser({ passwordHash: hash });
      mockPrisma.user.findFirst.mockResolvedValue(user);

      await service.login({ email: 'admin@hotel.com', password: 'pass' }, 'tenant-1');

      // jwt.sign called twice: once for access token, once for refresh token
      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
    });

    it('stores refresh token in database', async () => {
      const hash = await bcrypt.hash('pass', 10);
      const user = makeUser({ passwordHash: hash });
      mockPrisma.user.findFirst.mockResolvedValue(user);

      await service.login({ email: 'admin@hotel.com', password: 'pass' }, 'tenant-1');

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            token: 'mock-token',
          }),
        }),
      );
    });
  });

  // ── refreshTokens ──────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('throws UnauthorizedException when refresh token is invalid JWT', async () => {
      mockJwt.verify.mockImplementation(() => { throw new Error('invalid'); });

      await expect(service.refreshTokens('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when refresh token is not in database', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', email: 'admin@hotel.com', tenantId: 'tenant-1', jti: 'jti-1' });
      mockPrisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(service.refreshTokens('valid-jwt-but-not-stored')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when refresh token is expired', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', email: 'admin@hotel.com', tenantId: 'tenant-1', jti: 'jti-1' });
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
      });

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rotates refresh token (revokes old, issues new)', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', email: 'admin@hotel.com', tenantId: 'tenant-1', jti: 'jti-1' });
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000), // valid for 1 day
      });
      mockPrisma.user.findFirst.mockResolvedValue(makeUser());
      mockRedis.getCachedUserPermissions.mockResolvedValue(['rooms.read']);
      mockPrisma.refreshToken.update.mockResolvedValue({});

      await service.refreshTokens('valid-refresh-token');

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rt-1' },
          data: { isRevoked: true },
        }),
      );
      expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user no longer exists', async () => {
      mockJwt.verify.mockReturnValue({ sub: 'user-1', email: 'admin@hotel.com', tenantId: 'tenant-1', jti: 'jti-1' });
      mockPrisma.refreshToken.findFirst.mockResolvedValue({
        id: 'rt-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 86400000),
      });
      mockPrisma.refreshToken.update.mockResolvedValue({});
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.refreshTokens('valid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('blacklists the access token JTI in Redis', async () => {
      mockRedis.blacklistToken.mockResolvedValue(undefined);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockRedis.invalidateUserPermissions.mockResolvedValue(undefined);

      await service.logout('user-1', 'jti-abc');

      expect(mockRedis.blacklistToken).toHaveBeenCalledWith('jti-abc', expect.any(Number));
    });

    it('revokes all refresh tokens for the user', async () => {
      mockRedis.blacklistToken.mockResolvedValue(undefined);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      mockRedis.invalidateUserPermissions.mockResolvedValue(undefined);

      await service.logout('user-1', 'jti-abc');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    it('clears permission cache in Redis', async () => {
      mockRedis.blacklistToken.mockResolvedValue(undefined);
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });
      mockRedis.invalidateUserPermissions.mockResolvedValue(undefined);

      await service.logout('user-1', 'jti-abc');

      expect(mockRedis.invalidateUserPermissions).toHaveBeenCalledWith('user-1');
    });
  });

  // ── getMe ──────────────────────────────────────────────────────────────────

  describe('getMe', () => {
    it('throws UnauthorizedException when user is not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.getMe('nonexistent-user')).rejects.toThrow(UnauthorizedException);
    });

    it('returns user profile with roles and propertyIds', async () => {
      const user = makeUser({
        userRoles: [{ role: { name: 'FRONT_DESK' } }],
        userProperties: [{ propertyId: 'prop-1' }, { propertyId: 'prop-2' }],
      });
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = await service.getMe('user-1');

      expect(result.id).toBe('user-1');
      expect(result.email).toBe('admin@hotel.com');
      expect(result.fullName).toBe('John Doe');
      expect(result.roles).toContain('FRONT_DESK');
      expect(result.propertyIds).toEqual(['prop-1', 'prop-2']);
    });

    it('constructs fullName from firstName and lastName', async () => {
      const user = makeUser({ firstName: 'Jane', lastName: 'Smith' });
      mockPrisma.user.findFirst.mockResolvedValue(user);

      const result = await service.getMe('user-1');

      expect(result.fullName).toBe('Jane Smith');
    });
  });
});