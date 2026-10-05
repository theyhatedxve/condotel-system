import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  ConfigService,
} from '@nestjs/config';

import {
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

import type {
  PaymongoCheckoutSession,
  PaymongoErrorResponse,
} from './interfaces/paymongo.interface';

interface CreateCheckoutInput {
  reservationId: string;

  referenceNo: string;

  roomNumber: string;

  totalAmountCentavos: number;
}

@Injectable()
export class PaymongoService {
  private readonly secretKey: string;

  private readonly webhookSecret: string;

  private readonly webhookMode:
    | 'test'
    | 'live';

  private readonly frontendUrl: string;

  private readonly paymentMethods:
    string[];

  constructor(
    private readonly configService:
      ConfigService,
  ) {
    const secretKey =
      this.configService.get<string>(
        'PAYMONGO_SECRET_KEY',
      );

    if (!secretKey) {
      throw new Error(
        'PAYMONGO_SECRET_KEY is missing.',
      );
    }

    this.secretKey = secretKey;

    this.webhookSecret =
      this.configService.get<string>(
        'PAYMONGO_WEBHOOK_SECRET',
      ) ?? '';

    this.webhookMode =
      this.configService.get<string>(
        'PAYMONGO_WEBHOOK_MODE',
      ) === 'live'
        ? 'live'
        : 'test';

    this.frontendUrl =
      this.configService.get<string>(
        'FRONTEND_URL',
      ) ??
      'http://localhost:5173';

    const configuredMethods =
      this.configService.get<string>(
        'PAYMONGO_PAYMENT_METHODS',
      ) ?? 'qrph';

    this.paymentMethods =
      configuredMethods
        .split(',')
        .map((method) =>
          method.trim(),
        )
        .filter(Boolean);
  }

  private getAuthorizationHeader() {
    const credentials =
      Buffer.from(
        `${this.secretKey}:`,
      ).toString('base64');

    return `Basic ${credentials}`;
  }

  async createCheckoutSession(
    input: CreateCheckoutInput,
  ): Promise<PaymongoCheckoutSession> {
    const response = await fetch(
      'https://api.paymongo.com/v2/checkout_sessions',
      {
        method: 'POST',

        headers: {
          Authorization:
            this.getAuthorizationHeader(),

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          data: {
            attributes: {
              line_items: [
                {
                  name:
                    `Room ${input.roomNumber} Reservation`,

                  amount:
                    input.totalAmountCentavos,

                  currency: 'PHP',

                  quantity: 1,
                },
              ],

              payment_method_types:
                this.paymentMethods,

              success_url:
                `${this.frontendUrl}/payment/success?reservationId=${input.reservationId}`,

              cancel_url:
                `${this.frontendUrl}/payment/cancelled?reservationId=${input.reservationId}`,

              reference_number:
                input.referenceNo,

              send_email_receipt:
                true,

              pass_on_fees:
                false,

              metadata: {
                reservation_id:
                  input.reservationId,

                reservation_reference:
                  input.referenceNo,
              },
            },
          },
        }),
      },
    );

    const result =
      (await response.json()) as
        | PaymongoCheckoutSession
        | PaymongoErrorResponse;

    if (
      !response.ok ||
      !('data' in result)
    ) {
      const detail =
        'errors' in result
          ? result.errors?.[0]?.detail
          : undefined;

      throw new BadGatewayException(
        detail ??
          'Unable to create PayMongo checkout session.',
      );
    }

    return result;
  }

  verifyWebhookSignature(
    rawBody: Buffer,
    signatureHeader?: string,
  ) {
    if (!this.webhookSecret) {
      throw new UnauthorizedException(
        'PayMongo webhook secret is not configured.',
      );
    }

    if (!signatureHeader) {
      throw new UnauthorizedException(
        'Missing PayMongo signature.',
      );
    }

    const parts =
      Object.fromEntries(
        signatureHeader
          .split(',')
          .map((part) => {
            const [
              key,
              ...valueParts
            ] = part
              .trim()
              .split('=');

            return [
              key,
              valueParts.join('='),
            ];
          }),
      );

    const timestamp =
      parts.t;

    const providedSignature =
      this.webhookMode === 'live'
        ? parts.li
        : parts.te;

    if (
      !timestamp ||
      !providedSignature
    ) {
      throw new UnauthorizedException(
        'Invalid PayMongo signature header.',
      );
    }

    const timestampNumber =
      Number(timestamp);

    if (
      !Number.isFinite(
        timestampNumber,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid PayMongo webhook timestamp.',
      );
    }

    const ageInSeconds =
      Math.abs(
        Math.floor(
          Date.now() / 1000,
        ) -
          timestampNumber,
      );

    if (ageInSeconds > 300) {
      throw new UnauthorizedException(
        'PayMongo webhook timestamp is outside the allowed tolerance.',
      );
    }

    const signedPayload =
      `${timestamp}.${rawBody.toString(
        'utf8',
      )}`;

    const expectedSignature =
      createHmac(
        'sha256',
        this.webhookSecret,
      )
        .update(signedPayload)
        .digest('hex');

    const expectedBuffer =
      Buffer.from(
        expectedSignature,
        'utf8',
      );

    const providedBuffer =
      Buffer.from(
        providedSignature,
        'utf8',
      );

    if (
      expectedBuffer.length !==
        providedBuffer.length ||
      !timingSafeEqual(
        expectedBuffer,
        providedBuffer,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid PayMongo webhook signature.',
      );
    }
  }
}