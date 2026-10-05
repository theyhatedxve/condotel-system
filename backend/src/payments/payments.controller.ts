import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import type {
  Request,
} from 'express';

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
  PaymentsService,
} from './payments.service';

type RequestWithRawBody =
  Request & {
    rawBody?: Buffer;
  };

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService:
      PaymentsService,
  ) {}

  @Post(
    'reservations/:reservationId/checkout',
  )
  @UseGuards(JwtAuthGuard)
  createCheckout(
    @Param('reservationId')
    reservationId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.paymentsService
      .createCheckout(
        reservationId,
        user,
      );
  }

  @Get()
  @UseGuards(
    JwtAuthGuard,
    RolesGuard,
  )
  @Roles(
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  findAll() {
    return this.paymentsService
      .findAll();
  }

  @Get(
    'reservations/:reservationId',
  )
  @UseGuards(JwtAuthGuard)
  findByReservation(
    @Param('reservationId')
    reservationId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.paymentsService
      .findByReservation(
        reservationId,
        user,
      );
  }

@Post('webhook/paymongo')
@HttpCode(HttpStatus.OK)
    handlePaymongoWebhook(
      @Req()
      request: RequestWithRawBody,

      @Headers(
        'paymongo-signature',
      )
      signatureHeader:
        string | undefined,
    ) {
      if (!request.rawBody) {
        throw new Error(
          'Raw request body is unavailable.',
        );
      }

      return this.paymentsService
        .handlePaymongoWebhook(
          request.rawBody,
          signatureHeader,
          request.body,
        );
    }
}