import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { JwtPayload } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload & { jti: string }) {
    // Check token blacklist
    if (payload.jti) {
      const isBlacklisted = await this.redis.isTokenBlacklisted(payload.jti);
      if (isBlacklisted) throw new UnauthorizedException('Token has been revoked');
    }

    // Try permissions from cache first
    let permissions = await this.redis.getCachedUserPermissions(payload.sub);

    if (!permissions) {
      // Load from DB
      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, isActive: true, deletedAt: null },
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
        },
      });

      if (!user) throw new UnauthorizedException('User not found or inactive');

      permissions = user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => `${rp.permission.resource}.${rp.permission.action}`),
      );

      // Cache for 5 minutes
      await this.redis.cacheUserPermissions(payload.sub, permissions, 300);
    }

    return {
      sub: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      permissions,
      jti: payload.jti,
    };
  }
}