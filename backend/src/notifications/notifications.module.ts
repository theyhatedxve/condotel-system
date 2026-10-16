import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { NotificationsController } from './notifications.controller';

import { NotificationsService } from './notifications.service';

// Wire the notifications controllers, services, and imported dependencies into Nest.
@Module({
  imports: [AuthModule],

  controllers: [NotificationsController],

  providers: [NotificationsService],

  exports: [NotificationsService],
})
export class NotificationsModule {}
