import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymongoService } from './paymongo.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../generated/prisma/enums';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('Verified checkout synchronization', () => {
  const customer = {
    id: 'guest-1',
    role: UserRole.CUSTOMER,
  } as AuthenticatedUser;

  function setup({ paid = true, amount = 760000, currency = 'PHP' } = {}) {
    let paymentStatus = 'PENDING';
    let reservationStatus = 'PENDING';
    const payment = () => ({
      id: 'payment-1',
      reservationId: 'reservation-1',
      status: paymentStatus,
      amountCentavos: 760000,
      paymongoCheckoutSessionId: 'cs_verified',
    });
    const reservation = () => ({
      id: 'reservation-1',
      guestId: customer.id,
      roomId: 'room-1',
      referenceNo: 'RES-1',
      status: reservationStatus,
      payments: [payment()],
    });
    const session = {
      id: 'cs_verified',
      attributes: {
        payments: [
          {
            id: 'pay_verified',
            attributes: {
              status: paid ? 'paid' : 'pending',
              amount,
              currency,
              paid_at: 1800000000,
              source: { type: 'qrph' },
            },
          },
        ],
      },
    };
    const transaction = {
      payment: {
        updateMany: jest.fn().mockImplementation(() => {
          if (paymentStatus === 'PAID') return { count: 0 };
          paymentStatus = 'PAID';
          return { count: 1 };
        }),
      },
      reservation: {
        updateMany: jest.fn().mockImplementation(() => {
          reservationStatus = 'CONFIRMED';
          return { count: 1 };
        }),
      },
      transaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      reservation: {
        findUnique: jest
          .fn()
          .mockImplementation(() => Promise.resolve(reservation())),
      },
      payment: {
        findUnique: jest
          .fn()
          .mockImplementation(() =>
            Promise.resolve({ ...payment(), reservation: reservation() }),
          ),
        findMany: jest
          .fn()
          .mockImplementation(() => Promise.resolve([payment()])),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          (callback: (value: typeof transaction) => unknown) =>
            callback(transaction),
        ),
    };
    const provider = {
      retrieveCheckoutSession: jest.fn().mockResolvedValue(session),
      verifyWebhookSignature: jest.fn(),
    };
    const notifications = {
      notifyPaymentReceived: jest.fn().mockResolvedValue({}),
    };
    const service = new PaymentsService(
      prisma as unknown as PrismaService,
      provider as unknown as PaymongoService,
      notifications as unknown as NotificationsService,
    );
    return { service, prisma, transaction, provider, notifications, session };
  }

  it('confirms a paid provider session when the webhook has not arrived', async () => {
    const { service, provider, transaction, notifications } = setup();
    const result = await service.syncCheckout('reservation-1', customer);
    expect(provider.retrieveCheckoutSession).toHaveBeenCalledWith(
      'cs_verified',
    );
    expect(result.reservation?.status).toBe('CONFIRMED');
    expect(result.payments[0].status).toBe('PAID');
    expect(transaction.transaction.create).toHaveBeenCalledTimes(1);
    expect(notifications.notifyPaymentReceived).toHaveBeenCalledTimes(1);
  });

  it('leaves an unpaid session pending', async () => {
    const { service, transaction, notifications } = setup({ paid: false });
    const result = await service.syncCheckout('reservation-1', customer);
    expect(result.reservation?.status).toBe('PENDING');
    expect(result.payments[0].status).toBe('PENDING');
    expect(transaction.payment.updateMany).not.toHaveBeenCalled();
    expect(notifications.notifyPaymentReceived).not.toHaveBeenCalled();
  });

  it('denies another customer before contacting PayMongo', async () => {
    const { service, provider } = setup();
    await expect(
      service.syncCheckout('reservation-1', { ...customer, id: 'other-guest' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(provider.retrieveCheckoutSession).not.toHaveBeenCalled();
  });

  it.each([{ amount: 1 }, { currency: 'USD' }])(
    'rejects mismatched payment details: %o',
    async (details) => {
      const { service, transaction } = setup(details);
      await expect(
        service.syncCheckout('reservation-1', customer),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(transaction.payment.updateMany).not.toHaveBeenCalled();
    },
  );

  it('does not record another transaction on repeated synchronization', async () => {
    const { service, transaction, provider } = setup();
    await service.syncCheckout('reservation-1', customer);
    await service.syncCheckout('reservation-1', customer);
    expect(transaction.transaction.create).toHaveBeenCalledTimes(1);
    expect(provider.retrieveCheckoutSession).toHaveBeenCalledTimes(1);
  });

  it('handles a webhook racing the browser status check without duplicate transactions', async () => {
    const { service, session, transaction, provider } = setup();
    await Promise.all([
      service.syncCheckout('reservation-1', customer),
      service.handlePaymongoWebhook(Buffer.from('signed'), 'signature', {
        data: {
          attributes: { type: 'checkout_session.payment.paid', data: session },
        },
      }),
    ]);
    expect(provider.verifyWebhookSignature).toHaveBeenCalledWith(
      Buffer.from('signed'),
      'signature',
    );
    expect(transaction.transaction.create).toHaveBeenCalledTimes(1);
  });
});
