import { ConfigService } from '@nestjs/config';
import { BadGatewayException } from '@nestjs/common';
import { PaymongoService } from './paymongo.service';

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
