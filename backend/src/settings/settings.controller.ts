import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  UserRole,
} from '../generated/prisma/enums';

import type {
  AuthenticatedUser,
} from '../auth/interfaces/authenticated-user.interface';

import {
  CurrentUser,
} from '../auth/decorators/current-user.decorator';

import {
  Roles,
} from '../auth/decorators/roles.decorator';

import {
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard';

import {
  RolesGuard,
} from '../auth/guards/roles.guard';

import {
  UpdateSettingsDto,
} from './dto/update-settings.dto';

import {
  SettingsService,
} from './settings.service';

@Controller('settings')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  UserRole.STAFF,
  UserRole.ADMIN,
)
export class SettingsController {
  constructor(
    private readonly settingsService:
      SettingsService,
  ) {}

  @Get()
  getSettings() {
    return this.settingsService
      .getSettings();
  }

  @Patch()
  @Roles(
    UserRole.ADMIN,
  )
  updateSettings(
    @Body()
    dto:
      UpdateSettingsDto,

    @CurrentUser()
    user:
      AuthenticatedUser,
  ) {
    return this.settingsService
      .updateSettings(
        dto,
        user,
      );
  }
}