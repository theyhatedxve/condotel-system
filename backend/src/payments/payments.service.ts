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

import { PrismaService } from '../prisma/prisma.service';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

import type {
  PaymongoPaymentAttempt,
  PaymongoCheckoutSessionResource,
  PaymongoWebhookEvent,
} from './paymongo.interface';

import { PaymongoService } from './paymongo.service';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly paymongoService: PaymongoService,

    private readonly notificationsService: NotificationsService,
  ) {}

  private ensureReservationAccess(user: AuthenticatedUser, guestId: string) {
    if (user.role === UserRole.CUSTOMER && user.id !== guestId) {
      throw new ForbiddenException(
        'You cannot access this reservation payment.',
      );
    }
  }

  private mapPaymentMethod(type?: string): PaymentMethod {
    const normalizedType = type?.trim().toLowerCase();

    switch (normalizedType) {
      case 'card':
        return PaymentMethod.CARD;

      case 'gcash':
        return PaymentMethod.GCASH;

      case 'maya':
      case 'paymaya':
        return PaymentMethod.MAYA;

      default:
        return PaymentMethod.OTHER;
    }
  }

  async createCheckout(reservationId: string, user: AuthenticatedUser) {
    const reservation = await this.prisma.reservation.findUnique({
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
      throw new NotFoundException('Reservation not found.');
    }

    this.ensureReservationAccess(user, reservation.guestId);

    const paidPayment = reservation.payments.find(
      (payment) => payment.status === PaymentStatus.PAID,
    );

    if (paidPayment) {
      throw new ConflictException('This reservation has already been paid.');
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending reservations can proceed to payment.',
      );
    }

    // Reuse a pending hosted checkout when the user retries the payment action.
    const existingCheckout = reservation.payments.find(
      (payment) =>
        payment.status === PaymentStatus.PENDING &&
        payment.checkoutUrl &&
        payment.paymongoCheckoutSessionId,
    );

    if (existingCheckout) {
      return {
        paymentId: existingCheckout.id,

        status: existingCheckout.status,

        checkoutUrl: existingCheckout.checkoutUrl,

        checkoutSessionId: existingCheckout.paymongoCheckoutSessionId,
      };
    }

    const payment = await this.prisma.payment.create({
      data: {
        reservationId: reservation.id,

        provider: 'PAYMONGO',

        amountCentavos: reservation.totalAmountCentavos,

        currency: 'PHP',

        status: PaymentStatus.PENDING,
      },
    });

    try {
      const checkout = await this.paymongoService.createCheckoutSession({
        reservationId: reservation.id,

        referenceNo: reservation.referenceNo,

        roomNumber: reservation.room.roomNumber,

        totalAmountCentavos: reservation.totalAmountCentavos,
      });

      const updatedPayment = await this.prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          paymongoCheckoutSessionId: checkout.data.id,

          checkoutUrl: checkout.data.attributes.checkout_url,
        },
      });

      return {
        paymentId: updatedPayment.id,

        status: updatedPayment.status,

        checkoutSessionId: updatedPayment.paymongoCheckoutSessionId,

        checkoutUrl: updatedPayment.checkoutUrl,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'PayMongo checkout creation failed.';

      await this.prisma.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: PaymentStatus.FAILED,

          failureReason: message,
        },
      });

      throw error;
    }
  }

  async cancelPendingPaymentsForReservation(reservationId: string) {
    const pendingPayments = await this.prisma.payment.findMany({
      where: {
        reservationId,

        status: PaymentStatus.PENDING,
      },
    });

    // Expire hosted sessions before marking local payments cancelled; a provider failure
    // leaves the local records pending so cancellation can be retried.
    for (const payment of pendingPayments) {
      if (payment.paymongoCheckoutSessionId) {
        await this.paymongoService.expireCheckoutSession(
          payment.paymongoCheckoutSessionId,
        );
      }
    }

    const result = await this.prisma.payment.updateMany({
      where: {
        reservationId,

        status: PaymentStatus.PENDING,
      },

      data: {
        status: PaymentStatus.CANCELLED,
      },
    });

    return {
      cancelledPayments: result.count,
    };
  }

  async cancelPendingCheckout(reservationId: string, user: AuthenticatedUser) {
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },

      select: {
        id: true,
        guestId: true,
        status: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    this.ensureReservationAccess(user, reservation.guestId);

    const cancellableReservationStatuses: ReservationStatus[] = [
      ReservationStatus.PENDING,
      ReservationStatus.CANCELLED,
    ];

    if (!cancellableReservationStatuses.includes(reservation.status)) {
      throw new BadRequestException(
        'This reservation no longer has a cancellable payment checkout.',
      );
    }
    return this.cancelPendingPaymentsForReservation(reservationId);
  }

  async findAll() {
    return this.prisma.payment.findMany({
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

  async findByReservation(reservationId: string, user: AuthenticatedUser) {
    const reservation = await this.prisma.reservation.findUnique({
      where: {
        id: reservationId,
      },

      select: {
        guestId: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    this.ensureReservationAccess(user, reservation.guestId);

    return this.prisma.payment.findMany({
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

  async syncCheckout(reservationId: string, user: AuthenticatedUser) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!reservation) throw new NotFoundException('Reservation not found.');
    this.ensureReservationAccess(user, reservation.guestId);

    if (
      !reservation.payments.some(
        (payment) => payment.status === PaymentStatus.PAID,
      )
    ) {
      // The browser supplies a reservation ID, never a payment status or provider session.
      const pendingCheckout = reservation.payments.find(
        (payment) =>
          payment.status === PaymentStatus.PENDING &&
          payment.paymongoCheckoutSessionId,
      );
      if (pendingCheckout?.paymongoCheckoutSessionId) {
        const session = await this.paymongoService.retrieveCheckoutSession(
          pendingCheckout.paymongoCheckoutSessionId,
        );
        if (this.findPaidAttempt(session.attributes?.payments))
          await this.recordPaidCheckout(session);
      }
    }

    const [updatedReservation, payments] = await Promise.all([
      this.prisma.reservation.findUnique({
        where: { id: reservationId },
        select: { id: true, roomId: true, referenceNo: true, status: true },
      }),
      this.findByReservation(reservationId, user),
    ]);
    return { reservation: updatedReservation, payments };
  }

  private findPaidAttempt(payments: PaymongoPaymentAttempt[] | undefined) {
    if (!payments) {
      return undefined;
    }

    return [...payments]
      .reverse()
      .find((payment) => payment.attributes.status === 'paid');
  }

  async handlePaymongoWebhook(
    rawBody: Buffer,
    signatureHeader: string | undefined,
    body: unknown,
  ) {
    /*
     * 1. Verify that this request really came
     *    from PayMongo.
     */
    this.paymongoService.verifyWebhookSignature(rawBody, signatureHeader);

    const webhook = body as PaymongoWebhookEvent;

    /*
     * Actual PayMongo event-resource structure:
     *
     * data.type = "event"
     *
     * data.attributes.type =
     *   "checkout_session.payment.paid"
     *
     * data.attributes.data =
     *   Checkout Session
     */
    const eventType = webhook.data?.attributes?.type;

    /*
     * Ignore events that are unrelated
     * to successful Hosted Checkout payments.
     */
    if (eventType !== 'checkout_session.payment.paid') {
      return {
        received: true,

        ignored: true,

        eventType: eventType ?? 'unknown',
      };
    }

    /*
     * The actual Checkout Session resource.
     */
    const session = webhook.data?.attributes?.data;

    if (!session?.id) {
      throw new BadRequestException('PayMongo checkout session is missing.');
    }

    return this.recordPaidCheckout(session);
  }

  // Only call with a signature-verified webhook or the authenticated PayMongo API response.
  private async recordPaidCheckout(session: PaymongoCheckoutSessionResource) {
    const localPayment = await this.prisma.payment.findUnique({
      where: {
        paymongoCheckoutSessionId: session.id,
      },

      include: {
        reservation: true,
      },
    });

    if (!localPayment) {
      throw new NotFoundException(
        `No local payment found for PayMongo checkout session ${session.id}.`,
      );
    }

    // Skip financial writes when a previous delivery has already marked this payment paid.
    // Retry the notification separately; its dedupe key prevents another notification row.
    if (localPayment.status === PaymentStatus.PAID) {
      await this.notificationsService.notifyPaymentReceived({
        paymentId: localPayment.id,

        reservationId: localPayment.reservationId,

        referenceNo: localPayment.reservation.referenceNo,

        amountCentavos: localPayment.amountCentavos,
      });
      return {
        received: true,

        duplicate: true,

        paymentId: localPayment.id,
      };
    }

    /*
     * 4. Find the successful payment
     *    attempt inside the Checkout Session.
     */
    const paidAttempt = this.findPaidAttempt(session.attributes?.payments);

    if (!paidAttempt) {
      throw new BadRequestException(
        'Verified checkout does not contain a paid payment attempt.',
      );
    }

    /*
     * 5. Never trust the browser for money.
     *
     * Verify PayMongo's paid amount against
     * the amount stored in SQLite.
     */
    if (paidAttempt.attributes.amount !== localPayment.amountCentavos) {
      throw new BadRequestException(
        'PayMongo payment amount does not match the reservation amount.',
      );
    }

    /*
     * Optional but useful:
     * validate currency too.
     */
    if (
      paidAttempt.attributes.currency &&
      paidAttempt.attributes.currency !== 'PHP'
    ) {
      throw new BadRequestException('Unexpected PayMongo payment currency.');
    }

    const method = this.mapPaymentMethod(paidAttempt.attributes.source?.type);

    /*
     * PayMongo timestamps are Unix seconds.
     */
    const paidAt = paidAttempt.attributes.paid_at
      ? new Date(paidAttempt.attributes.paid_at * 1000)
      : new Date();

    /*
     * Some payloads expose the Payment
     * Intent on the Checkout Session,
     * while payment records themselves can
     * also expose payment_intent_id.
     */
    const paymentIntentId =
      session.attributes?.payment_intent?.id ??
      paidAttempt.attributes.payment_intent_id ??
      null;

    // Commit the payment, transaction history and reservation confirmation together
    // so a failed database write cannot leave only part of the financial update saved.
    await this.prisma.$transaction(async (transaction) => {
      /*
       * Mark local payment paid.
       */
      const claimed = await transaction.payment.updateMany({
        where: {
          id: localPayment.id,
          status: { not: PaymentStatus.PAID },
        },

        data: {
          status: PaymentStatus.PAID,

          method,

          paymongoPaymentIntentId: paymentIntentId,

          paymongoPaymentId: paidAttempt.id,

          paidAt,

          failureReason: null,
        },
      });
      // A webhook and a return-page sync may arrive together. Only one records money.
      if (claimed.count === 0) return;

      /*
       * Avoid duplicate transaction
       * history if PayMongo retries.
       */
      const existingTransaction = await transaction.transaction.findFirst({
        where: {
          paymentId: localPayment.id,

          providerReference: paidAttempt.id,

          type: TransactionType.PAYMENT,
        },
      });

      if (!existingTransaction) {
        await transaction.transaction.create({
          data: {
            paymentId: localPayment.id,

            type: TransactionType.PAYMENT,

            status: TransactionStatus.SUCCEEDED,

            amountCentavos: paidAttempt.attributes.amount,

            providerReference: paidAttempt.id,

            description: 'PayMongo reservation payment.',
          },
        });
      }

      /*
       * Only move PENDING → CONFIRMED.
       *
       * We do not blindly overwrite
       * other reservation states.
       */
      if (localPayment.reservation.status === ReservationStatus.PENDING) {
        await transaction.reservation.updateMany({
          where: {
            id: localPayment.reservationId,
            status: ReservationStatus.PENDING,
          },

          data: {
            status: ReservationStatus.CONFIRMED,
          },
        });
      }
    });

    await this.notificationsService.notifyPaymentReceived({
      paymentId: localPayment.id,
      reservationId: localPayment.reservationId,
      referenceNo: localPayment.reservation.referenceNo,
      amountCentavos: localPayment.amountCentavos,
    });

    return {
      received: true,

      paid: true,

      paymentId: localPayment.id,

      reservationId: localPayment.reservationId,

      paymongoPaymentId: paidAttempt.id,

      method,
    };
  }
}
