const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../backend/node_modules/typescript');

function load(file, imports = {}) {
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(path.join(__dirname, '../src', file), 'utf8'),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    AbortController,
    URLSearchParams,
    require(name) {
      if (name in imports) return imports[name];
      if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
      if (name.endsWith('.css') || name === 'lucide-react') return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return exports;
}

const helpers = load('features/my-bookings/myBookingsUtils.js');
const bookingUtils = load('features/booking/bookingUtils.js');
const booking = {
  id: 'booking-1',
  referenceNo: 'RES-001',
  roomId: 'room-1',
  status: 'CONFIRMED',
  checkIn: '2026-11-01T00:00:00.000Z',
  checkOut: '2026-11-03T00:00:00.000Z',
  adults: 2,
  children: 1,
  totalAmountCentavos: 500000,
  room: { name: 'Coastal Deluxe', roomNumber: '101', roomType: 'Deluxe' },
  payments: [{ status: 'PAID', amountCentavos: 500000 }],
};
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

test('customer profile overview counts real reservations and links each summary to My Bookings', async () => {
  const ui = mount(
    async () =>
      ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'].map(
        (status) => ({ status }),
      ),
    'features/auth/CustomerBookingOverview.jsx',
  );
  assert.equal(ui.find('p', (props) => props.role === 'status').length, 1);
  await flush();
  assert.deepEqual(
    ui.find('strong').map((node) => node.props.children),
    [3, 1, 5],
  );
  assert.equal(ui.find('a', (props) => props.to === '/my-bookings').length, 3);
});

test('customer overview reports load failure instead of showing fabricated zero counts and can retry', async () => {
  let fail = true;
  const ui = mount(async () => {
    if (fail) throw new Error('offline');
    return [];
  }, 'features/auth/CustomerBookingOverview.jsx');
  ui.find('strong');
  await flush();
  assert.equal(ui.find('div', (props) => props.role === 'alert').length, 1);
  assert.equal(ui.find('strong').length, 0);
  fail = false;
  ui.find('button')[0].props.onClick();
  ui.find('strong');
  await flush();
  assert.deepEqual(
    ui.find('strong').map((node) => node.props.children),
    [0, 0, 0],
  );
});

function mount(request, source = 'features/my-bookings/MyBookingsPage.jsx') {
  const state = [];
  let cursor = 0;
  let userId = 'customer-1';
  const effects = [];
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (next) => {
          state[index] = typeof next === 'function' ? next(state[index]) : next;
        },
      ];
    },
    useEffect(effect, deps) {
      const index = cursor++;
      if (
        !state[index] ||
        JSON.stringify(state[index].deps) !== JSON.stringify(deps)
      ) {
        state[index]?.cleanup?.();
        state[index] = { deps };
        effects.push(() => {
          state[index].cleanup = effect();
        });
      }
    },
  };
  const component = load(source, {
    react: hooks,
    'react-router-dom': { Link: 'a' },
    '../booking/BookingShell': 'section',
    '../booking/bookingUtils': bookingUtils,
    '../auth/useAuth': { useAuth: () => ({ user: { id: userId } }) },
    './useAuth': { useAuth: () => ({ user: { id: userId } }) },
    '../my-bookings/myBookingsApi': { getMyBookings: request },
    '../my-bookings/myBookingsUtils': helpers,
    '../../utils/formatCurrency': {
      formatCurrency: (value) => `PHP ${value / 100}`,
    },
    './myBookingsApi': { getMyBookings: request },
    './myBookingsUtils': helpers,
  }).default;
  function nodes() {
    cursor = 0;
    const result = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      result.push(node);
      walk(node.props?.children);
    }
    walk(component());
    effects.splice(0).forEach((effect) => effect());
    return result;
  }
  const find = (type, predicate = () => true) =>
    nodes().filter((node) => node.type === type && predicate(node.props));
  return {
    find,
    switchUser: () => {
      userId = 'customer-2';
    },
  };
}

test('the customer API only requests the authenticated my endpoint and supports cancellation', async () => {
  const calls = [];
  const api = load('features/my-bookings/myBookingsApi.js', {
    '../../services/apiClient': {
      get: async (...args) => {
        calls.push(args);
        return { data: [booking] };
      },
    },
  });
  const controller = new AbortController();
  const rows = await api.getMyBookings(controller.signal);
  assert.equal(rows[0].id, booking.id);
  assert.equal(calls[0][0], '/reservations/my');
  assert.equal(calls[0][1].signal, controller.signal);
  assert.equal(Object.keys(calls[0][1]).length, 1);
});

test('only active statuses are current; payment requires server-paid evidence', () => {
  for (const status of ['PENDING', 'CONFIRMED', 'CHECKED_IN'])
    assert.equal(helpers.isCurrentBooking({ status }), true);
  for (const status of ['CANCELLED', 'CHECKED_OUT'])
    assert.equal(helpers.isCurrentBooking({ status }), false);
  assert.equal(helpers.paymentLabel(booking), 'Paid');
  assert.equal(
    helpers.paymentLabel({
      ...booking,
      payments: [{ status: 'PENDING', amountCentavos: 500000 }],
    }),
    'Awaiting payment',
  );
  assert.equal(
    helpers.paymentLabel({
      ...booking,
      payments: [{ status: 'PAID', amountCentavos: 100 }],
    }),
    'Partially paid',
  );
  assert.equal(
    helpers.paymentLabel({
      ...booking,
      payments: [{ status: 'REFUNDED', amountCentavos: 500000 }],
    }),
    'Refunded',
  );
  assert.equal(helpers.paymentLabel({ ...booking, payments: [] }), 'Unpaid');
});

test('current bookings load with history separated and pending checkout uses the existing reservation', async () => {
  const ui = mount(async () => [
    booking,
    { ...booking, id: 'past', status: 'CHECKED_OUT' },
    { ...booking, id: 'pending', status: 'PENDING', payments: [] },
  ]);
  assert.equal(ui.find('div', (props) => props.role === 'status').length, 1);
  await flush();
  assert.equal(ui.find('article').length, 2);
  assert.equal(
    ui.find('a', (props) => props.className === 'my-booking-pay')[0].props.to,
    '/booking/room-1/payment?reservationId=pending',
  );
  ui.find(
    'button',
    (props) => props['aria-pressed'] === false,
  )[0].props.onClick();
  assert.equal(ui.find('article').length, 1);
  assert.equal(
    ui.find('a', (props) => props.className === 'my-booking-pay').length,
    0,
  );
});

test('empty results have a room-browser link; request failure supports retry', async () => {
  const empty = mount(async () => []);
  empty.find('article');
  await flush();
  assert.equal(empty.find('article').length, 0);
  assert.equal(empty.find('a', (props) => props.to === '/rooms').length, 1);
  let fail = true;
  const ui = mount(async () => {
    if (fail) throw new Error('offline');
    return [booking];
  });
  ui.find('article');
  await flush();
  assert.equal(ui.find('div', (props) => props.role === 'alert').length, 1);
  fail = false;
  ui.find(
    'button',
    (props) => props.children === 'Try again',
  )[0].props.onClick();
  ui.find('article');
  await flush();
  assert.equal(ui.find('article').length, 1);
});

test('switching accounts aborts the old request and hides previous-account bookings', async () => {
  const requests = [];
  const ui = mount(
    (signal) => new Promise((resolve) => requests.push({ resolve, signal })),
  );
  ui.find('article');
  requests[0].resolve([booking]);
  await flush();
  assert.equal(ui.find('article').length, 1);
  ui.switchUser();
  assert.equal(ui.find('article').length, 0);
  assert.equal(requests[0].signal.aborted, true);
  requests[1].resolve([]);
  await flush();
  assert.equal(ui.find('article').length, 0);
});
