const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function setup({
  verified,
  blocked = false,
  closed = false,
  reject = false,
}) {
  const visits = [];
  let didClose = false;
  const popup = {
    closed,
    opener: {},
    close() {
      didClose = true;
    },
    location: {
      replace(url) {
        visits.push(url);
      },
    },
  };
  const context = vm.createContext({
    window: {
      open: () => (blocked ? null : popup),
      location: { assign: (url) => visits.push(url) },
    },
    Date,
    setTimeout,
    clearTimeout,
    URLSearchParams,
  });
  const api = new vm.SyntheticModule(
    ['createCheckout', 'syncReservationPayment'],
    function () {
      this.setExport('createCheckout', async () => ({
        checkoutUrl: 'https://checkout.paymongo.com/test',
      }));
      this.setExport('syncReservationPayment', async () => {
        if (reject) throw new Error('provider unavailable');
        return verified;
      });
    },
    { context },
  );
  const module = new vm.SourceTextModule(
    readFileSync(
      path.join(__dirname, '../src/features/payments/hostedCheckout.js'),
      'utf8',
    ),
    { context },
  );
  await module.link(() => api);
  await module.evaluate();
  return {
    open: module.namespace.openHostedCheckout,
    visits,
    popup,
    didClose: () => didClose,
  };
}

test('failed test payment closes provider window and returns for cancellation verification', async () => {
  const flow = await setup({
    verified: { payments: [{ status: 'PENDING' }], checkoutOutcome: 'failed' },
  });
  assert.equal(
    await flow.open('reservation-1', {
      signal: new AbortController().signal,
      onWaiting() {},
    }),
    'cancelled',
  );
  assert.equal(flow.didClose(), true);
  assert.equal(flow.popup.opener, null);
});

test('verified payment takes priority over a failed outcome', async () => {
  const flow = await setup({
    verified: { payments: [{ status: 'PAID' }], checkoutOutcome: 'failed' },
  });
  assert.equal(
    await flow.open('reservation-1', {
      signal: new AbortController().signal,
      onWaiting() {},
    }),
    'success',
  );
});

test('closing an unverified window returns for verification and never reports success', async () => {
  const flow = await setup({ closed: true, reject: true });
  assert.equal(
    await flow.open('reservation-1', {
      signal: new AbortController().signal,
      onWaiting() {},
    }),
    'cancelled',
  );
});

test('blocked popup asks the user to allow payment window instead of stranding them on the provider page', async () => {
  const flow = await setup({ blocked: true });
  await assert.rejects(
    flow.open('reservation-1', {
      signal: new AbortController().signal,
      onWaiting() {},
    }),
    /Allow the payment window/,
  );
  assert.equal(flow.visits.length, 0);
});

test('leaving merchant page closes the pending window without inferring payment', async () => {
  const flow = await setup({});
  const controller = new AbortController();
  controller.abort();
  assert.equal(
    await flow.open('reservation-1', {
      signal: controller.signal,
      onWaiting() {},
    }),
    null,
  );
  assert.equal(flow.didClose(), true);
});
