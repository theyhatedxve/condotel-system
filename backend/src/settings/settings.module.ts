import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { SettingsController } from './settings.controller';

import { SettingsService } from './settings.service';

// Wire the settings controllers, services, and imported dependencies into Nest.
@Module({
  imports: [AuthModule],

  controllers: [SettingsController],

  providers: [SettingsService],

  exports: [SettingsService],
})
export class SettingsModule {}
