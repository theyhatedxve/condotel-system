const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../backend/node_modules/typescript');

function load(file, imports = {}) {
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(
      path.join(__dirname, '../src/features/dashboard', file),
      'utf8',
    ),
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
    require(name) {
      if (name in imports) return imports[name];
      if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
      if (name === 'lucide-react' || name.endsWith('.css')) return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  return exports;
}
const helpers = load('dashboardUtils.js');

test('dashboard ratios remain bounded and a zero-room hotel never appears fully available', () => {
  assert.equal(helpers.percentOf(0, 0), 0);
  assert.equal(helpers.percentOf(3, 6), 50);
  assert.equal(helpers.percentOf(8, 6), 100);
  assert.equal(helpers.percentOf(-1, 6), 0);
  assert.equal(
    helpers.occupancyMessage({
      totalRooms: 0,
      occupiedRooms: 0,
      availableRooms: 0,
      maintenanceRooms: 0,
    })[0],
    'No rooms configured yet',
  );
  assert.equal(
    helpers.occupancyMessage({
      totalRooms: 6,
      occupiedRooms: 0,
      availableRooms: 6,
      maintenanceRooms: 0,
    })[0],
    'All rooms currently available',
  );
  assert.notEqual(
    helpers.occupancyMessage({
      totalRooms: 6,
      occupiedRooms: 0,
      availableRooms: 5,
      maintenanceRooms: 1,
    })[0],
    'All rooms currently available',
  );
  assert.equal(
    helpers.occupancyMessage({
      totalRooms: 6,
      occupiedRooms: 1,
      availableRooms: 4,
      maintenanceRooms: 1,
    })[0],
    '1 room currently occupied',
  );
});

test('the date badge uses the report calendar date rather than a hard-coded reference date', () => {
  assert.match(helpers.reportDate('2026-10-17'), /Saturday/);
  assert.match(helpers.reportDate('2026-10-17'), /Oct 17, 2026/);
});

test('failed dashboard loads show recovery without fabricated zero statistics', async () => {
  let fail = true;
  let cursor = 0;
  const state = [],
    effects = [];
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
  const component = load('DashboardPage.jsx', {
    react: hooks,
    'react-router-dom': { Link: 'a' },
    '../auth/LoadingScreen': 'loading',
    '../auth/useAuth': { useAuth: () => ({ user: { firstName: 'Dave' } }) },
    '../reports/reportApi': {
      getDashboardReport: async () => {
        if (fail) throw new Error('offline');
        return {
          date: '2026-10-17',
          statistics: {
            totalRooms: 6,
            currentGuests: 0,
            todayCheckIns: 0,
            todayCheckOuts: 1,
            todayPaymentsCentavos: 250000,
            todayPaymentCount: 1,
          },
          occupancy: {
            totalRooms: 6,
            availableRooms: 6,
            occupiedRooms: 0,
            maintenanceRooms: 0,
            occupancyPercent: 0,
          },
          recentReservations: [],
        };
      },
    },
    '../../utils/formatCurrency': {
      formatCurrency: (value) => `PHP ${value / 100}`,
    },
    '../../utils/formatDate': { formatDate: (value) => value },
    './dashboardUtils': helpers,
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
  const flush = async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
  };
  nodes();
  await flush();
  assert.equal(
    nodes().filter((node) => node.props?.role === 'alert').length,
    1,
  );
  assert.equal(
    nodes().filter((node) => node.props?.className?.includes('stat-card '))
      .length,
    0,
  );
  fail = false;
  nodes()
    .find((node) => node.type === 'button')
    .props.onClick();
  nodes();
  await flush();
  const cards = nodes().filter(
    (node) => node.type === 'a' && node.props.className?.includes('stat-card '),
  );
  assert.equal(cards.length, 4);
  assert.equal(cards[0].props.to, '/admin/rooms');
  assert.equal(cards[3].props.to, '/admin/payments');
  assert.ok(
    nodes().some(
      (node) => node.props?.children === 'All rooms currently available',
    ),
  );
});
