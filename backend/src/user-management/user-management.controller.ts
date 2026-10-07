import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { UserRole } from '../generated/prisma/enums';

import { ResetUserPasswordDto } from './reset-user-password.dto';

import { UpdateManagedUserDto } from './update-managed-user.dto';

import { UserManagementQueryDto } from './user-management-query.dto';

import { UserManagementService } from './user-management.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Get()
  findAll(
    @Query()
    query: UserManagementQueryDto,
  ) {
    return this.userManagementService.findAll(query);
  }

  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.userManagementService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateManagedUserDto,

    @CurrentUser()
    admin: AuthenticatedUser,
  ) {
    return this.userManagementService.update(id, dto, admin);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(
    @Param('id')
    id: string,

    @Body()
    dto: ResetUserPasswordDto,

    @CurrentUser()
    admin: AuthenticatedUser,
  ) {
    return this.userManagementService.resetPassword(id, dto, admin);
  }
}
