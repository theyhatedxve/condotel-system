import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UserRole } from '../generated/prisma/enums';

import { AuthService } from './auth.service';

import { CurrentUser } from './decorators/current-user.decorator';

import { Roles } from './decorators/roles.decorator';

import { ChangePasswordDto } from './dto/change-password.dto';

import { LoginDto } from './dto/login.dto';

import { RegisterDto } from './dto/register.dto';

import { UpdateProfileDto } from './dto/update-profile.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { RolesGuard } from './guards/roles.guard';

import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

// Expose auth HTTP routes with the declared request validation and access guards.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Reject duplicate identifiers, hash the password, and create a customer account.
  @Post('register')
  register(
    @Body()
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  // Verify an active account and password, record login time, and return its JWT and
  // public profile.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body()
    dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  // Return the account attached to the verified request.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return {
      user,
    };
  }

  // Update the signed-in account through the validated user service.
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, dto);
  }

  // Verify the current password before storing a new hash and clearing the
  // temporary-password requirement.
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser()
    user: AuthenticatedUser,

    @Body()
    dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }

  // Expose a small endpoint for checking staff/admin authorization.
  @Get('staff-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  staffTest(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return {
      message: 'You have Staff or Admin access.',

      user,
    };
  }

  // Expose a small endpoint for checking administrator authorization.
  @Get('admin-test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminTest(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return {
      message: 'You have Admin access.',

      user,
    };
  }
}
