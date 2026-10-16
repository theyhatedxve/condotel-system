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
import {
  CreateManagedUserDto,
  ImportManagedUsersDto,
} from './create-managed-user.dto';

// Expose user management HTTP routes with the declared request validation and access
// guards.
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UserManagementController {
  constructor(private readonly userManagementService: UserManagementService) {}

  // Create an account and its audit entry in one database transaction.
  @Post()
  create(
    @Body() dto: CreateManagedUserDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.userManagementService.create(dto, admin);
  }

  // Hash temporary passwords sequentially, then save the entire account batch and audit
  // entry atomically.
  @Post('import')
  importUsers(
    @Body() dto: ImportManagedUsersDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.userManagementService.importUsers(dto.users, admin);
  }

  // List public account fields with role/status/search filters and optional pagination.
  @Get()
  findAll(
    @Query()
    query: UserManagementQueryDto,
  ) {
    return this.userManagementService.findAll(query);
  }

  // Count all users by role and suspended status independently of list filters or
  // pagination.
  @Get('summary')
  summary() {
    return this.userManagementService.summary();
  }

  // Load one managed account using the public field selection.
  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.userManagementService.findOne(id);
  }

  // Enforce administrator/self-management safeguards, update validated account fields,
  // and record an audit entry.
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

  // Apply password-reset restrictions and save a temporary password hash with its audit
  // entry.
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
