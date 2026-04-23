import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.create(dto, user);
  }

  @Get('roles')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List all roles for this tenant' })
  getRoles(@CurrentUser() user: JwtPayload) {
    return this.usersService.getRoles(user);
  }

  @Get()
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'List all users with pagination and filters' })
  findAll(@Query() query: QueryUsersDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(query, user);
  }

  @Get(':id')
  @RequirePermissions('users.read')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.remove(id, user);
  }

  @Patch(':id/change-password')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Change user password' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  changePassword(
    @Param('id') id: string,
    @Body() body: { currentPassword: string; newPassword: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.changePassword(id, body.currentPassword, body.newPassword, user);
  }
}