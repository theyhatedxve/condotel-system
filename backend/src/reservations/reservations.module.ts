import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  ReservationsController,
} from './reservations.controller';

import {
  ReservationsService,
} from './reservations.service';

import {
  PaymentsModule,
} from '../payments/payments.module';

@Module({
  imports: [
    AuthModule,
    PaymentsModule,
  ],

  controllers: [
    ReservationsController,
  ],

  providers: [
    ReservationsService,
  ],

  exports: [
    ReservationsService,
  ],
})
export class ReservationsModule {}