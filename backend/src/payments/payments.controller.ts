import {
  Controller,
  Body,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { UserRole } from '../generated/prisma/enums';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { Roles } from '../auth/decorators/roles.decorator';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { RolesGuard } from '../auth/guards/roles.guard';

import { PaymentsService } from './payments.service';
import { ReconcilePaymentDto } from './reconcile-payment.dto';

type RequestWithRawBody = Request & {
  rawBody?: Buffer;
};

// Expose payments HTTP routes with the declared request validation and access guards.
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Verify a provider session against the stored reservation and amount before recording
  // its payment.
  @Post(':id/reconcile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  reconcile(@Param('id') id: string, @Body() dto: ReconcilePaymentDto) {
    return this.paymentsService.reconcile(id, dto.checkoutSessionId);
  }

  // Reuse a ready checkout or claim a new pending attempt while blocking
  // duplicate/uncertain charges.
  @Post('reservations/:reservationId/checkout')
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @Param('reservationId')
    reservationId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.paymentsService.createCheckout(reservationId, user);
  }

  // List management payment records with authorized guest contacts and transaction
  // details.
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  findAll() {
    return this.paymentsService.findAll();
  }

  // Check reservation access before listing its payment attempts and transactions.
  @Get('reservations/:reservationId')
  @UseGuards(JwtAuthGuard)
  findByReservation(
    @Param('reservationId')
    reservationId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.paymentsService.findByReservation(reservationId, user);
  }

  // Authorize the reservation and allow checkout cancellation only in cancellable
  // states.
  @Post('reservations/:reservationId/cancel-pending')
  @UseGuards(JwtAuthGuard)
  cancelPendingCheckout(
    @Param('reservationId') reservationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.paymentsService.cancelPendingCheckout(reservationId, user);
  }

  // Read the stored provider session and return verified payment/booking state and a
  // safe checkout outcome.
  @Post('reservations/:reservationId/sync')
  @UseGuards(JwtAuthGuard)
  syncCheckout(
    @Param('reservationId')
    reservationId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.paymentsService.syncCheckout(reservationId, user);
  }

  // PayMongo authenticates this callback with its signature; no browser JWT is expected.
  @Post('webhook/paymongo')
  @HttpCode(HttpStatus.OK)
  handlePaymongoWebhook(
    @Req()
    request: RequestWithRawBody,

    @Headers('paymongo-signature')
    signatureHeader: string | undefined,
  ) {
    if (!request.rawBody) {
      throw new Error('Raw request body is unavailable.');
    }

    return this.paymentsService.handlePaymongoWebhook(
      request.rawBody,
      signatureHeader,
      request.body,
    );
  }
}
