import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ReservationsController } from './reservations.controller';

import { ReservationsService } from './reservations.service';

import { PaymentsModule } from '../payments/payments.module';

import { NotificationsModule } from '../notifications/notifications.module';

// Wire the reservations controllers, services, and imported dependencies into Nest.
@Module({
  imports: [AuthModule, PaymentsModule, NotificationsModule],

  controllers: [ReservationsController],

  providers: [ReservationsService],

  exports: [ReservationsService],
})
export class ReservationsModule {}
