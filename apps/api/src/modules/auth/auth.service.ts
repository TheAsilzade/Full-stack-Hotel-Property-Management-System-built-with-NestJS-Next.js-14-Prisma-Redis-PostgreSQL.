import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, tenantId: string) {
    // If no specific tenant is resolved (e.g. single-tenant MVP without X-Tenant-ID header),
    // find the user by email across all tenants so login always works.
    const whereClause =
      tenantId && tenantId !== 'default'
        ? { email: dto.email, tenantId, isActive: true, deletedAt: null }
        : { email: dto.email, isActive: true, deletedAt: null };

    const user = await this.prisma.user.findFirst({
      where: whereClause,
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: { include: { permission: true } },
              },
            },
          },
        },
        userProperties: true,
      },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const permissions = user.userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => `${rp.permission.resource}.${rp.permission.action}`),
    );

    // Cache permissions
    await this.redis.cacheUserPermissions(user.id, permissions, 300);

    const tokens = await this.generateTokens(user.id, user.email, user.tenantId, permissions);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        tenantId: user.tenantId,
        roles: user.userRoles.map((ur) => ur.role.name),
        permissions,
        propertyIds: user.userProperties.map((up) => up.propertyId),
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    let payload: { sub: string; email: string; tenantId: string; jti: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { token: refreshToken, isRevoked: false },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const permissions = (await this.redis.getCachedUserPermissions(user.id)) || [];
    return this.generateTokens(user.id, user.email, user.tenantId, permissions);
  }

  async logout(userId: string, jti: string) {
    // Blacklist the access token
    const expiresIn = this.config.get<number>('JWT_EXPIRES_SECONDS', 900);
    await this.redis.blacklistToken(jti, expiresIn);

    // Revoke all refresh tokens for user
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    // Clear permission cache
    await this.redis.invalidateUserPermissions(userId);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null },
      include: {
        userRoles: { include: { role: true } },
        userProperties: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      roles: user.userRoles.map((ur) => ur.role.name),
      propertyIds: user.userProperties.map((up) => up.propertyId),
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    tenantId: string,
    permissions: string[],
  ) {
    const jti = uuidv4();
    const accessToken = this.jwt.sign(
      { sub: userId, email, tenantId, permissions, jti },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
      },
    );

    const refreshJti = uuidv4();
    const refreshToken = this.jwt.sign(
      { sub: userId, email, tenantId, jti: refreshJti },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    const refreshExpiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        jti: refreshJti,
        expiresAt: new Date(Date.now() + refreshExpiresIn * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }
}