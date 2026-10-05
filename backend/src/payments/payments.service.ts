import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PaymentMethod,
  PaymentStatus,
  ReservationStatus,
  TransactionStatus,
  TransactionType,
  UserRole,
} from '../generated/prisma/enums';

import {
  PrismaService,
} from '../prisma/prisma.service';

import type {
  AuthenticatedUser,
} from '../auth/interfaces/authenticated-user.interface';

import type {
  PaymongoCheckoutWebhook,
  PaymongoPaymentAttempt,
} from './interfaces/paymongo.interface';

import {
  PaymongoService,
} from './paymongo.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly paymongoService:
      PaymongoService,
  ) {}

  private ensureReservationAccess(
    user: AuthenticatedUser,
    guestId: string,
  ) {
    if (
      user.role ===
        UserRole.CUSTOMER &&
      user.id !== guestId
    ) {
      throw new ForbiddenException(
        'You cannot access this reservation payment.',
      );
    }
  }

  private mapPaymentMethod(
    type?: string,
  ): PaymentMethod {
    switch (type) {
      case 'card':
        return PaymentMethod.CARD;

      case 'gcash':
        return PaymentMethod.GCASH;

      case 'paymaya':
        return PaymentMethod.MAYA;

      default:
        return PaymentMethod.OTHER;
    }
  }

  async createCheckout(
    reservationId: string,
    user: AuthenticatedUser,
  ) {
    const reservation =
      await this.prisma
        .reservation
        .findUnique({
          where: {
            id: reservationId,
          },

          include: {
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },

            room: true,

            payments: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });

    if (!reservation) {
      throw new NotFoundException(
        'Reservation not found.',
      );
    }

    this.ensureReservationAccess(
      user,
      reservation.guestId,
    );

    const paidPayment =
      reservation.payments.find(
        (payment) =>
          payment.status ===
          PaymentStatus.PAID,
      );

    if (paidPayment) {
      throw new ConflictException(
        'This reservation has already been paid.',
      );
    }

    if (
      reservation.status !==
      ReservationStatus.PENDING
    ) {
      throw new BadRequestException(
        'Only pending reservations can proceed to payment.',
      );
    }

    const existingCheckout =
      reservation.payments.find(
        (payment) =>
          payment.status ===
            PaymentStatus.PENDING &&
          payment.checkoutUrl &&
          payment
            .paymongoCheckoutSessionId,
      );

    if (existingCheckout) {
      return {
        paymentId:
          existingCheckout.id,

        status:
          existingCheckout.status,

        checkoutUrl:
          existingCheckout.checkoutUrl,

        checkoutSessionId:
          existingCheckout
            .paymongoCheckoutSessionId,
      };
    }

    const payment =
      await this.prisma
        .payment
        .create({
          data: {
            reservationId:
              reservation.id,

            provider:
              'PAYMONGO',

            amountCentavos:
              reservation
                .totalAmountCentavos,

            currency: 'PHP',

            status:
              PaymentStatus.PENDING,
          },
        });

    try {
      const checkout =
        await this.paymongoService
          .createCheckoutSession({
            reservationId:
              reservation.id,

            referenceNo:
              reservation.referenceNo,

            roomNumber:
              reservation
                .room
                .roomNumber,

            totalAmountCentavos:
              reservation
                .totalAmountCentavos,
          });

      const updatedPayment =
        await this.prisma
          .payment
          .update({
            where: {
              id:
                payment.id,
            },

            data: {
              paymongoCheckoutSessionId:
                checkout.data.id,

              checkoutUrl:
                checkout.data
                  .attributes
                  .checkout_url,
            },
          });

      return {
        paymentId:
          updatedPayment.id,

        status:
          updatedPayment.status,

        checkoutSessionId:
          updatedPayment
            .paymongoCheckoutSessionId,

        checkoutUrl:
          updatedPayment
            .checkoutUrl,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'PayMongo checkout creation failed.';

      await this.prisma
        .payment
        .update({
          where: {
            id:
              payment.id,
          },

          data: {
            status:
              PaymentStatus.FAILED,

            failureReason:
              message,
          },
        });

      throw error;
    }
  }

  async findAll() {
    return this.prisma
      .payment
      .findMany({
        include: {
          reservation: {
            include: {
              guest: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },

              room: true,
            },
          },

          transactions: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
  }

  async findByReservation(
    reservationId: string,
    user: AuthenticatedUser,
  ) {
    const reservation =
      await this.prisma
        .reservation
        .findUnique({
          where: {
            id:
              reservationId,
          },

          select: {
            guestId: true,
          },
        });

    if (!reservation) {
      throw new NotFoundException(
        'Reservation not found.',
      );
    }

    this.ensureReservationAccess(
      user,
      reservation.guestId,
    );

    return this.prisma
      .payment
      .findMany({
        where: {
          reservationId,
        },

        include: {
          transactions: true,
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
  }

  private findPaidAttempt(
    payments:
      | PaymongoPaymentAttempt[]
      | undefined,
  ) {
    if (!payments) {
      return undefined;
    }

    return [...payments]
      .reverse()
      .find(
        (payment) =>
          payment.attributes
            .status === 'paid',
      );
  }

  async handlePaymongoWebhook(
    rawBody: Buffer,
    signatureHeader: string | undefined,
    body: unknown,
  ) {
    this.paymongoService
      .verifyWebhookSignature(
        rawBody,
        signatureHeader,
      );

    const webhook =
      body as PaymongoCheckoutWebhook;

    const event =
      webhook.data;

    if (
      event?.type !==
      'checkout_session.payment.paid'
    ) {
      return {
        received: true,
        ignored: true,
      };
    }

    const session =
      event.data;

    if (!session?.id) {
      throw new BadRequestException(
        'Webhook checkout session is missing.',
      );
    }

    const localPayment =
      await this.prisma
        .payment
        .findUnique({
          where: {
            paymongoCheckoutSessionId:
              session.id,
          },

          include: {
            reservation: true,
          },
        });

    if (!localPayment) {
      throw new NotFoundException(
        'Local payment record was not found.',
      );
    }

    if (
      localPayment.status ===
      PaymentStatus.PAID
    ) {
      return {
        received: true,
        duplicate: true,
      };
    }

    const paidAttempt =
      this.findPaidAttempt(
        session.attributes
          ?.payments,
      );

    if (!paidAttempt) {
      throw new BadRequestException(
        'Webhook does not contain a paid payment attempt.',
      );
    }

    if (
      paidAttempt.attributes
        .amount !==
      localPayment.amountCentavos
    ) {
      throw new BadRequestException(
        'PayMongo payment amount does not match the reservation amount.',
      );
    }

    const method =
      this.mapPaymentMethod(
        paidAttempt.attributes
          .source?.type,
      );

    const paidAt =
      paidAttempt.attributes
        .paid_at
        ? new Date(
            paidAttempt.attributes
              .paid_at * 1000,
          )
        : new Date();

    await this.prisma
      .$transaction(
        async (transaction) => {
          await transaction
            .payment
            .update({
              where: {
                id:
                  localPayment.id,
              },

              data: {
                status:
                  PaymentStatus.PAID,

                method,

                paymongoPaymentIntentId:
                  session.attributes
                    ?.payment_intent
                    ?.id ??
                  null,

                paymongoPaymentId:
                  paidAttempt.id,

                paidAt,

                failureReason:
                  null,
              },
            });

          const existingTransaction =
            await transaction
              .transaction
              .findFirst({
                where: {
                  paymentId:
                    localPayment.id,

                  providerReference:
                    paidAttempt.id,

                  type:
                    TransactionType.PAYMENT,
                },
              });

          if (
            !existingTransaction
          ) {
            await transaction
              .transaction
              .create({
                data: {
                  paymentId:
                    localPayment.id,

                  type:
                    TransactionType.PAYMENT,

                  status:
                    TransactionStatus.SUCCEEDED,

                  amountCentavos:
                    paidAttempt
                      .attributes
                      .amount,

                  providerReference:
                    paidAttempt.id,

                  description:
                    'PayMongo reservation payment.',
                },
              });
          }

          if (
            localPayment
              .reservation
              .status ===
            ReservationStatus.PENDING
          ) {
            await transaction
              .reservation
              .update({
                where: {
                  id:
                    localPayment
                      .reservationId,
                },

                data: {
                  status:
                    ReservationStatus.CONFIRMED,
                },
              });
          }
        },
      );

    return {
      received: true,
      paid: true,
    };
  }
}