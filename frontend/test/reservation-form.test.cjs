const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
// Reuse the repository's compiler without adding a test dependency.
const ts = require('../../backend/node_modules/typescript');

const source = ts.transpileModule(
  readFileSync(
    path.join(
      __dirname,
      '../src/features/reservations/ReservationFormModal.jsx',
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
const rooms = [
  {
    id: 'room-1',
    roomNumber: '101',
    roomType: 'Standard',
    capacity: 2,
    ratePerNightCentavos: 150000,
  },
  {
    id: 'room-2',
    roomNumber: '102',
    roomType: 'Deluxe',
    capacity: 4,
    ratePerNightCentavos: 250000,
  },
];

// Exercise the component's rendered controls and handlers with isolated hook state.
function setup(getAvailableRooms = async () => rooms) {
  const state = [];
  let cursor = 0;
  const submissions = [];
  const requests = [];
  const exports = {};
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (value) => {
          state[index] =
            typeof value === 'function' ? value(state[index]) : value;
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
    window: { alert() {} },
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
      if (name === 'lucide-react') return { Search: () => null, X: () => null };
      if (name === './reservationApi')
        return {
          getAvailableRooms: async (args) => {
            requests.push(args);
            return getAvailableRooms(args);
          },
        };
      if (name === '../../utils/formatCurrency')
        return { formatCurrency: (value) => `PHP ${value / 100}` };
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
        guests: [{ id: 'guest-1', firstName: 'Test', lastName: 'Guest' }],
        isSubmitting: false,
        onClose() {},
        onSubmit: (value) => submissions.push(value),
      }),
    );
    return result;
  }
  const find = (type, predicate = () => true) =>
    nodes().filter((node) => node.type === type && predicate(node.props));
  const change = (type, index, value) =>
    find(type)[index].props.onChange({ target: { value } });
  const check = (valid = true) =>
    find(
      'button',
      (props) => props.className === 'availability-button',
    )[0].props.onClick({
      currentTarget: { form: { reportValidity: () => valid } },
    });
  const submit = () => find('form')[0].props.onSubmit({ preventDefault() {} });
  const next = () => find('button', (props) => props.type === 'submit')[0];
  function fillStay() {
    change('select', 0, 'guest-1');
    change('input', 0, '2026-11-01');
    change('input', 1, '2026-11-03');
  }
  return { find, change, check, submit, next, fillStay, submissions, requests };
}

test('rooms appear only after a check; selection advances to requests before creation', async () => {
  const ui = setup();
  assert.equal(ui.find('fieldset').length, 0);
  assert.equal(ui.find('textarea').length, 0);
  assert.equal(ui.next().props.disabled, true);
  ui.fillStay();
  await ui.check();
  assert.equal(ui.requests[0].capacity, 1);
  assert.equal(ui.find('input', (props) => props.type === 'radio').length, 2);
  assert.equal(ui.next().props.disabled, true);
  ui.find('input', (props) => props.type === 'radio')[1].props.onChange();
  assert.equal(ui.next().props.disabled, false);
  ui.submit();
  assert.equal(ui.submissions.length, 0);
  assert.equal(ui.find('fieldset').length, 0);
  assert.equal(ui.find('textarea').length, 1);
  ui.change('textarea', 0, 'Late arrival');
  ui.find(
    'button',
    (props) => props.className === 'secondary-button',
  )[0].props.onClick();
  assert.equal(
    ui.find('input', (props) => props.type === 'radio')[1].props.checked,
    true,
  );
  ui.submit();
  assert.equal(ui.find('textarea')[0].props.value, 'Late arrival');
  ui.submit();
  assert.deepEqual(JSON.parse(JSON.stringify(ui.submissions)), [
    {
      guestId: 'guest-1',
      roomId: 'room-2',
      checkIn: '2026-11-01',
      checkOut: '2026-11-03',
      adults: 1,
      children: 0,
      specialRequests: 'Late arrival',
    },
  ]);
});

test('changing stay dates or counts clears checked rooms and selection', async () => {
  for (const [index, value] of [
    [0, '2026-11-02'],
    [1, '2026-11-04'],
    [2, '2'],
    [3, '1'],
  ]) {
    const ui = setup();
    ui.fillStay();
    await ui.check();
    ui.find('input', (props) => props.type === 'radio')[0].props.onChange();
    ui.change('input', index, value);
    assert.equal(ui.find('fieldset').length, 0);
    assert.equal(ui.next().props.disabled, true);
    ui.submit();
    assert.equal(ui.find('textarea').length, 0);
  }
});

test('old availability response cannot restore results or clear a newer loading state', async () => {
  const pending = [];
  const ui = setup(() => new Promise((resolve) => pending.push(resolve)));
  ui.fillStay();
  const oldRequest = ui.check();
  ui.change('input', 0, '2026-11-02');
  const newRequest = ui.check();
  pending[0](rooms);
  await oldRequest;
  assert.equal(ui.find('fieldset').length, 0);
  assert.equal(
    ui.find('button', (props) => props.className === 'availability-button')[0]
      .props.disabled,
    true,
  );
  pending[1]([rooms[1]]);
  await newRequest;
  assert.equal(ui.find('input', (props) => props.type === 'radio').length, 1);
  assert.equal(
    ui.find('input', (props) => props.type === 'radio')[0].props.value,
    'room-2',
  );
});

test('empty results and request failures leave continuation disabled with feedback', async () => {
  for (const request of [
    async () => [],
    async () => {
      throw new Error('offline');
    },
  ]) {
    const ui = setup(request);
    ui.fillStay();
    await ui.check();
    assert.equal(ui.find('fieldset').length, 0);
    assert.equal(ui.next().props.disabled, true);
    assert.ok(
      ui.find('p', (props) => props.role === 'status')[0].props.children,
    );
  }
});

test('invalid form or reversed dates do not request availability', async () => {
  const ui = setup();
  ui.fillStay();
  await ui.check(false);
  ui.change('input', 1, '2026-10-31');
  await ui.check();
  assert.equal(ui.requests.length, 0);
  assert.equal(ui.next().props.disabled, true);
});
