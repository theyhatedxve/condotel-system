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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body()
    dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

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
