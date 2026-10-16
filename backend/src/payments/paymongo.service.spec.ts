import { ConfigService } from '@nestjs/config';
import { BadGatewayException } from '@nestjs/common';
import { createHmac, randomBytes } from 'node:crypto';
import { CheckoutRejectedException, PaymongoService } from './paymongo.service';

describe('Checkout creation failure classification', () => {
  afterEach(() => jest.restoreAllMocks());

  const input = {
    reservationId: 'reservation-test',
    referenceNo: 'RES-test',
    roomNumber: '101',
    totalAmountCentavos: 300000,
  };
  const service = () =>
    new PaymongoService(
      new ConfigService({ PAYMONGO_SECRET_KEY: 'sk_test_mock' }),
    );

  it.each([400, 401, 403, 422])(
    'allows recovery after an explicit HTTP %s rejection',
    async (status) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [{ code: 'rejected', detail: 'private provider details' }],
          }),
          { status },
        ),
      );
      await expect(
        service().createCheckoutSession(input),
      ).rejects.toBeInstanceOf(CheckoutRejectedException);
    },
  );

  it.each([408, 429, 500, 502])(
    'keeps HTTP %s failures uncertain',
    async (status) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ errors: [{ code: 'unknown' }] }), {
          status,
        }),
      );
      await expect(
        service().createCheckoutSession(input),
      ).rejects.not.toBeInstanceOf(CheckoutRejectedException);
    },
  );

  it('keeps a timeout uncertain', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('timeout'));
    await expect(
      service().createCheckoutSession(input),
    ).rejects.not.toBeInstanceOf(CheckoutRejectedException);
  });
});

describe('PayMongo checkout retrieval', () => {
  afterEach(() => jest.restoreAllMocks());

  function service() {
    return new PaymongoService({
      get: (key: string) =>
        key === 'PAYMONGO_SECRET_KEY' ? 'test-only-secret' : undefined,
    } as ConfigService);
  }

  it('retrieves the stored session using server authentication', async () => {
    const session = { id: 'cs_expected', attributes: { payments: [] } };
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ data: session }), { status: 200 }),
      );
    await expect(
      service().retrieveCheckoutSession('cs_expected'),
    ).resolves.toEqual(session);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.paymongo.com/v1/checkout_sessions/cs_expected',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
        }),
      }),
    );
  });

  it('rejects a provider response for a different session', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 'cs_other' } }), {
        status: 200,
      }),
    );
    await expect(
      service().retrieveCheckoutSession('cs_expected'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});

describe('PayMongo raw webhook authentication', () => {
  const secret = randomBytes(32).toString('hex');
  function setup(mode = 'test') {
    return new PaymongoService(
      new ConfigService({
        PAYMONGO_SECRET_KEY: 'sk_test_mock',
        PAYMONGO_WEBHOOK_SECRET: secret,
        PAYMONGO_WEBHOOK_MODE: mode,
      }),
    );
  }
  const body = Buffer.from('{"signed":"body"}');
  function signature(
    timestamp = String(Math.floor(Date.now() / 1000)),
    field = 'te',
  ) {
    return `t=${timestamp},${field}=${createHmac('sha256', secret)
      .update(timestamp + '.')
      .update(body)
      .digest('hex')}`;
  }
  it('accepts the correct signature for the exact body', () =>
    expect(() =>
      setup().verifyWebhookSignature(body, signature()),
    ).not.toThrow());
  it('rejects body tampering, stale timestamps and the wrong signature mode', () => {
    expect(() =>
      setup().verifyWebhookSignature(Buffer.from('different'), signature()),
    ).toThrow();
    expect(() =>
      setup().verifyWebhookSignature(
        body,
        signature(String(Math.floor(Date.now() / 1000) - 301)),
      ),
    ).toThrow();
    expect(() =>
      setup('live').verifyWebhookSignature(body, signature()),
    ).toThrow();
  });
  it('rejects a signed live event delivered to the test-mode webhook', () => {
    const liveBody = Buffer.from(
      JSON.stringify({ data: { attributes: { livemode: true } } }),
    );
    const timestamp = String(Math.floor(Date.now() / 1000));
    const digest = createHmac('sha256', secret)
      .update(timestamp + '.')
      .update(liveBody)
      .digest('hex');
    expect(() =>
      setup().verifyWebhookSignature(liveBody, `t=${timestamp},te=${digest}`),
    ).toThrow();
  });
});
