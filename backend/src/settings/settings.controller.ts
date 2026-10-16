import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { UserRole } from '../generated/prisma/enums';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { UpdateSettingsDto } from './update-settings.dto';

import { SettingsService } from './settings.service';

// Expose settings HTTP routes with the declared request validation and access guards.
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Load or create the single property-settings record.
  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  // Apply validated editable property/contact/check-in settings to the singleton record.
  @Patch()
  @Roles(UserRole.ADMIN)
  updateSettings(
    @Body()
    dto: UpdateSettingsDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.settingsService.updateSettings(dto, user);
  }
}
