const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../backend/node_modules/typescript');

const source = ts.transpileModule(
  readFileSync(
    path.join(
      __dirname,
      '../src/features/reservations/ReservationDatePicker.jsx',
    ),
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

function setup(initialValue, afterDate, options = {}) {
  const state = [];
  let cursor = 0;
  let value = initialValue;
  const exports = {};
  const hooks = {
    useId: () => 'date-picker',
    useState(initial) {
      const index = cursor++;
      if (!(index in state))
        state[index] = typeof initial === 'function' ? initial() : initial;
      return [
        state[index],
        (next) => {
          state[index] = typeof next === 'function' ? next(state[index]) : next;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = { current: initial };
      return state[index];
    },
  };
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
      if (name === 'lucide-react') return {};
      if (name.endsWith('.css')) return {};
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  function nodes() {
    cursor = 0;
    const result = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      result.push(node);
      walk(node.props?.children);
    }
    walk(
      exports.default({
        ...options,
        label: 'Check-out',
        value,
        afterDate,
        onChange: (event) => {
          value = event.target.value;
        },
      }),
    );
    return result;
  }
  const find = (type, predicate = () => true) =>
    nodes().filter((node) => node.type === type && predicate(node.props));
  const button = (label) =>
    find('button', (props) => props['aria-label'] === label)[0];
  const open = () => button('Choose check-out date').props.onClick();
  return { find, button, open, value: () => value };
}

test('calendar opens on the selected month and handles leap-year/month boundaries', () => {
  const ui = setup('2028-02-15');
  assert.equal(ui.find('div', (props) => props.role === 'group').length, 0);
  ui.open();
  assert.equal(ui.find('strong')[0].props.children, 'February 2028');
  assert.equal(
    ui.find('button', (props) => 'aria-pressed' in props).length,
    29,
  );
  ui.button('Next month').props.onClick();
  assert.equal(ui.find('strong')[0].props.children, 'March 2028');
  ui.button('Previous month').props.onClick();
  ui.button('Previous month').props.onClick();
  ui.button('Previous month').props.onClick();
  assert.equal(ui.find('strong')[0].props.children, 'December 2027');
});

test('customer minimum dates disable earlier days and preserve the room-search input ID', () => {
  const ui = setup('2028-02-15', undefined, {
    minDate: '2028-02-15',
    id: 'stay-check-in',
  });
  assert.equal(ui.find('input')[0].props.id, 'stay-check-in');
  assert.equal(ui.find('input')[0].props.min, '2028-02-15');
  ui.open();
  assert.equal(ui.button('Monday, February 14, 2028').props.disabled, true);
  assert.equal(ui.button('Tuesday, February 15, 2028').props.disabled, false);
  const checkout = setup('', '2028-02-28', { minDate: '2028-02-01' });
  assert.equal(checkout.find('input')[0].props.min, '2028-02-29');
});

test('choosing a date preserves date-only values and closes the calendar', () => {
  const ui = setup('2028-02-15');
  ui.open();
  ui.button('Tuesday, February 29, 2028').props.onClick();
  assert.equal(ui.value(), '2028-02-29');
  assert.equal(ui.find('div', (props) => props.role === 'group').length, 0);
  ui.open();
  assert.equal(
    ui.button('Tuesday, February 29, 2028').props['aria-pressed'],
    true,
  );
});

test('checkout disables dates through check-in and sets the native input minimum', () => {
  const ui = setup('', '2028-02-28');
  assert.equal(ui.find('input')[0].props.min, '2028-02-29');
  ui.open();
  assert.equal(ui.button('Monday, February 28, 2028').props.disabled, true);
  assert.equal(ui.button('Tuesday, February 29, 2028').props.disabled, false);
});

test('Escape closes the calendar without changing the selected date', () => {
  const ui = setup('2028-02-15');
  ui.open();
  ui.find(
    'div',
    (props) => props.className === 'reservation-date-picker',
  )[0].props.onKeyDown({
    key: 'Escape',
    preventDefault() {},
    stopPropagation() {},
  });
  assert.equal(ui.value(), '2028-02-15');
  assert.equal(ui.find('div', (props) => props.role === 'group').length, 0);
});
