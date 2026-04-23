import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  gender: true,
  isActive: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
  userRoles: {
    select: {
      role: {
        select: { id: true, name: true, description: true },
      },
    },
  },
  userProperties: {
    select: {
      property: {
        select: { id: true, name: true },
      },
    },
  },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoles(currentUser: JwtPayload) {
    return this.prisma.role.findMany({
      where: { tenantId: currentUser.tenantId },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUserDto, currentUser: JwtPayload) {
    // Check email uniqueness within tenant
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: currentUser.tenantId, deletedAt: null },
    });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        gender: dto.gender,
        tenantId: currentUser.tenantId,
        ...(dto.roleIds?.length && {
          userRoles: {
            create: dto.roleIds.map((roleId) => ({ roleId })),
          },
        }),
        ...(dto.propertyIds?.length && {
          userProperties: {
            create: dto.propertyIds.map((propertyId) => ({ propertyId })),
          },
        }),
      },
      select: USER_SELECT,
    });

    return this.formatUser(user);
  }

  async findAll(query: QueryUsersDto, currentUser: JwtPayload) {
    const page = Number.isFinite(query.page) && query.page! >= 1 ? Math.floor(query.page!) : 1;
    const limit =
      Number.isFinite(query.limit) && query.limit! >= 1
        ? Math.min(Math.floor(query.limit!), 100)
        : 20;
    const { search, isActive, roleId, propertyId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: currentUser.tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) where.isActive = isActive;

    if (roleId) {
      where.userRoles = { some: { roleId } };
    }

    if (propertyId) {
      where.userProperties = { some: { propertyId } };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(this.formatUser),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: currentUser.tenantId, deletedAt: null },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException('User not found');
    return this.formatUser(user);
  }

  async update(id: string, dto: UpdateUserDto, currentUser: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: currentUser.tenantId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check email uniqueness if changing email
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId: currentUser.tenantId, deletedAt: null },
      });
      if (existing) throw new ConflictException('Email already in use');
    }

    const updateData: any = {};
    if (dto.email) updateData.email = dto.email;
    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.gender !== undefined) updateData.gender = dto.gender;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.password) updateData.passwordHash = await bcrypt.hash(dto.password, 12);

    // Update roles if provided
    if (dto.roleIds !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (dto.roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
    }

    // Update properties if provided
    if (dto.propertyIds !== undefined) {
      await this.prisma.userProperty.deleteMany({ where: { userId: id } });
      if (dto.propertyIds.length > 0) {
        await this.prisma.userProperty.createMany({
          data: dto.propertyIds.map((propertyId) => ({ userId: id, propertyId })),
        });
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    return this.formatUser(updated);
  }

  async remove(id: string, currentUser: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: currentUser.tenantId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    // Prevent self-deletion
    if (id === currentUser.sub) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'User deleted successfully' };
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
    currentUser: JwtPayload,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId: currentUser.tenantId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new ForbiddenException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });

    return { message: 'Password changed successfully' };
  }

  private formatUser(user: any) {
    return {
      ...user,
      roles: user.userRoles?.map((ur: any) => ur.role?.name ?? ur.role) ?? [],
      properties: user.userProperties?.map((up: any) => up.property) ?? [],
      userRoles: undefined,
      userProperties: undefined,
    };
  }
}
