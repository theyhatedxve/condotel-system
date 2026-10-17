const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../backend/node_modules/typescript');

const flush = () => new Promise((resolve) => setImmediate(resolve));
function mount(request) {
  const state = [];
  const effects = [];
  let cursor = 0;
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
    useEffect(effect, deps) {
      const index = cursor++;
      if (JSON.stringify(state[index]?.deps) !== JSON.stringify(deps)) {
        state[index]?.cleanup?.();
        state[index] = { deps };
        effects.push(() => {
          state[index].cleanup = effect();
        });
      }
    },
  };
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(
      path.join(__dirname, '../src/features/guests/GuestsPage.jsx'),
      'utf8',
    ),
    {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    exports,
    require(name) {
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === './guestApi') return { getGuests: request };
      if (name === '../../components/ListPagination') return 'pagination';
      if (name === './GuestFormModal') return 'guest-modal';
      return {};
    },
  });
  function find(type, predicate = () => true) {
    cursor = 0;
    const nodes = [];
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      nodes.push(node);
      walk(node.props?.children);
    };
    walk(exports.default());
    effects.splice(0).forEach((effect) => effect());
    return nodes.filter((node) => node.type === type && predicate(node.props));
  }
  return { find };
}
const preventDefault = () => {};

test('guest searches are submitted explicitly and reset pagination; status filters and reset retain the API contract', async () => {
  const calls = [];
  const ui = mount(async (...args) => {
    calls.push(args);
    return Array.from({ length: 50 }, (_, id) => ({ id, status: 'ACTIVE' }));
  });
  ui.find('input');
  await flush();
  ui.find('input')[0].props.onChange({ target: { value: '  Dianna  ' } });
  ui.find('input');
  await flush();
  assert.equal(calls.length, 1);
  ui.find('pagination')[0].props.onChange(2);
  ui.find('input');
  await flush();
  assert.equal(calls.at(-1)[2], 2);
  ui.find('form')[0].props.onSubmit({ preventDefault });
  ui.find('input');
  await flush();
  assert.deepEqual(calls.at(-1), ['Dianna', undefined, 1]);
  ui.find('select')[0].props.onChange({ target: { value: 'INACTIVE' } });
  ui.find('input');
  await flush();
  assert.deepEqual(calls.at(-1), ['Dianna', 'INACTIVE', 1]);
  ui.find(
    'button',
    (props) => props.className === 'guest-reset-filters',
  )[0].props.onClick();
  ui.find('input');
  await flush();
  assert.deepEqual(calls.at(-1), [undefined, undefined, 1]);
  assert.equal(ui.find('input')[0].props.value, '');
});

test('failed guest refresh hides stale records and retry recovers to the empty directory', async () => {
  let mode = 'rows';
  const ui = mount(async () => {
    if (mode === 'error') throw new Error('offline');
    return mode === 'empty'
      ? []
      : [{ id: 'one', firstName: 'Guest', status: 'ACTIVE' }];
  });
  ui.find('table');
  await flush();
  assert.equal(ui.find('table').length, 1);
  mode = 'error';
  ui.find(
    'button',
    (props) => props.className === 'guest-refresh',
  )[0].props.onClick();
  await flush();
  assert.equal(ui.find('table').length, 0);
  assert.equal(ui.find('div', (props) => props.role === 'alert').length, 1);
  assert.equal(ui.find('pagination')[0].props.loading, true);
  mode = 'empty';
  ui.find(
    'button',
    (props) => props.children === 'Try again',
  )[0].props.onClick();
  await flush();
  assert.equal(
    ui.find('h3')[0].props.children,
    'Your guest directory starts here',
  );
  ui.find('div', (props) => props.className === 'guest-empty')[0]
    .props.children.at(-1)
    .props.onClick();
  assert.equal(ui.find('guest-modal')[0].props.guest, null);
});
