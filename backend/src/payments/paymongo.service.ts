import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { createHmac, timingSafeEqual } from 'node:crypto';

import type {
  PaymongoCheckoutSession,
  PaymongoErrorResponse,
  PaymongoCheckoutSessionResource,
  PaymongoWebhookEvent,
} from './paymongo.interface';

interface CreateCheckoutInput {
  reservationId: string;

  referenceNo: string;

  roomNumber: string;

  totalAmountCentavos: number;
}

// Only an explicit provider rejection proves that no checkout was created.
// Network failures, malformed responses and server errors remain uncertain.
export class CheckoutRejectedException extends BadGatewayException {
  constructor() {
    super(
      'PayMongo rejected the checkout request. Check the payment configuration before retrying.',
    );
  }
}

@Injectable()
export class PaymongoService {
  private readonly secretKey: string;

  private readonly webhookSecret: string;

  private readonly webhookMode: 'test' | 'live';

  private readonly frontendUrl: string;

  private readonly paymentMethods: string[];

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('PAYMONGO_SECRET_KEY');

    if (!secretKey) {
      throw new Error('PAYMONGO_SECRET_KEY is missing.');
    }

    this.secretKey = secretKey;

    this.webhookSecret =
      this.configService.get<string>('PAYMONGO_WEBHOOK_SECRET') ?? '';

    this.webhookMode =
      this.configService.get<string>('PAYMONGO_WEBHOOK_MODE') === 'live'
        ? 'live'
        : 'test';

    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';

    const configuredMethods =
      this.configService.get<string>('PAYMONGO_PAYMENT_METHODS') ?? 'qrph';

    this.paymentMethods = configuredMethods
      .split(',')
      .map((method) => method.trim())
      .filter(Boolean);
  }

  private getAuthorizationHeader() {
    const credentials = Buffer.from(`${this.secretKey}:`).toString('base64');

    return `Basic ${credentials}`;
  }

  async createCheckoutSession(
    input: CreateCheckoutInput,
  ): Promise<PaymongoCheckoutSession> {
    const response = await fetch(
      'https://api.paymongo.com/v2/checkout_sessions',
      {
        method: 'POST',

        signal: AbortSignal.timeout(15000),

        headers: {
          Authorization: this.getAuthorizationHeader(),

          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          data: {
            attributes: {
              line_items: [
                {
                  name: `Room ${input.roomNumber} Reservation`,

                  amount: input.totalAmountCentavos,

                  currency: 'PHP',

                  quantity: 1,
                },
              ],

              payment_method_types: this.paymentMethods,

              success_url: `${this.frontendUrl}/payment/success?reservationId=${input.reservationId}`,

              cancel_url: `${this.frontendUrl}/payment/cancelled?reservationId=${input.reservationId}`,

              reference_number: input.referenceNo,

              send_email_receipt: true,

              pass_on_fees: false,

              metadata: {
                reservation_id: input.reservationId,

                reservation_reference: input.referenceNo,
              },
            },
          },
        }),
      },
    );

    const result = (await response.json()) as
      PaymongoCheckoutSession | PaymongoErrorResponse;

    if (
      [400, 401, 403, 422].includes(response.status) &&
      !('data' in result) &&
      'errors' in result &&
      Array.isArray(result.errors) &&
      result.errors.length > 0
    ) {
      throw new CheckoutRejectedException();
    }

    if (!response.ok || !('data' in result)) {
      throw new BadGatewayException(
        'Unable to create PayMongo checkout session.',
      );
    }

    try {
      const url = new URL(result.data.attributes.checkout_url);
      if (
        url.protocol !== 'https:' ||
        url.hostname !== 'checkout.paymongo.com' ||
        url.username ||
        url.password
      )
        throw new Error();
    } catch {
      throw new BadGatewayException(
        'Payment provider returned an invalid checkout URL.',
      );
    }

    return result;
  }

  async retrieveCheckoutSession(
    checkoutSessionId: string,
  ): Promise<PaymongoCheckoutSessionResource> {
    const response = await fetch(
      `https://api.paymongo.com/v1/checkout_sessions/${encodeURIComponent(checkoutSessionId)}`,
      {
        headers: {
          Authorization: this.getAuthorizationHeader(),
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = (await response.json()) as {
      data?: PaymongoCheckoutSessionResource;
    } & PaymongoErrorResponse;
    if (!response.ok || !result.data || result.data.id !== checkoutSessionId) {
      throw new BadGatewayException(
        'Unable to verify PayMongo checkout status.',
      );
    }
    return result.data;
  }

  async expireCheckoutSession(checkoutSessionId: string) {
    const response = await fetch(
      `https://api.paymongo.com/v1/checkout_sessions/${checkoutSessionId}/expire`,
      {
        method: 'POST',

        signal: AbortSignal.timeout(15000),

        headers: {
          Authorization: this.getAuthorizationHeader(),

          Accept: 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new BadGatewayException(
        'Unable to expire PayMongo checkout session.',
      );
    }
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader?: string) {
    if (!this.webhookSecret) {
      throw new UnauthorizedException(
        'PayMongo webhook secret is not configured.',
      );
    }

    if (!signatureHeader) {
      throw new UnauthorizedException('Missing PayMongo signature.');
    }

    const parts = Object.fromEntries(
      signatureHeader.split(',').map((part) => {
        const [key, ...valueParts] = part.trim().split('=');

        return [key, valueParts.join('=')];
      }),
    );

    const timestamp = parts.t;

    const providedSignature = this.webhookMode === 'live' ? parts.li : parts.te;

    if (!timestamp || !/^\d+$/.test(timestamp) || !providedSignature) {
      throw new UnauthorizedException('Invalid PayMongo signature header.');
    }

    const timestampNumber = Number(timestamp);

    if (!Number.isFinite(timestampNumber)) {
      throw new UnauthorizedException('Invalid PayMongo webhook timestamp.');
    }

    // Limit replay of signed requests to a five-minute window around the server clock.
    const ageInSeconds = Math.abs(
      Math.floor(Date.now() / 1000) - timestampNumber,
    );

    if (ageInSeconds > 300) {
      throw new UnauthorizedException(
        'PayMongo webhook timestamp is outside the allowed tolerance.',
      );
    }

    // Verify the timestamp and original body together; JSON re-serialization can change the signature.
    const signedPayload = `${timestamp}.${rawBody.toString('utf8')}`;

    const expectedSignature = createHmac('sha256', this.webhookSecret)
      .update(signedPayload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    const providedBuffer = Buffer.from(providedSignature, 'utf8');

    // Check lengths before the constant-time comparison, which requires equal-sized buffers.
    if (
      expectedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid PayMongo webhook signature.');
    }
    try {
      const event = JSON.parse(
        rawBody.toString('utf8'),
      ) as PaymongoWebhookEvent;
      const live = event.data?.attributes?.livemode;
      if (live !== undefined && live !== (this.webhookMode === 'live'))
        throw new Error();
    } catch {
      throw new UnauthorizedException(
        'PayMongo webhook mode or payload is invalid.',
      );
    }
  }
}
