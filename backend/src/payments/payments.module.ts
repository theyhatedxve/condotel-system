import {
  Module,
} from '@nestjs/common';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  PaymongoService,
} from './paymongo.service';

import {
  PaymentsController,
} from './payments.controller';

import {
  PaymentsService,
} from './payments.service';

import {
  NotificationsModule,
} from '../notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
  ],

  controllers: [
    PaymentsController,
  ],

  providers: [
    PaymentsService,
    PaymongoService,
  ],

  exports: [
    PaymentsService,
  ],
})
export class PaymentsModule {}