const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../backend/node_modules/typescript');

function mount(guest) {
  let value;
  let busy = false;
  const saves = [];
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(
      path.join(__dirname, '../src/features/guests/GuestFormModal.jsx'),
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
      if (name === 'react/jsx-runtime') return require(name);
      if (name === 'react')
        return {
          useState(initial) {
            value ??= initial();
            return [
              value,
              (next) => {
                value = typeof next === 'function' ? next(value) : next;
              },
            ];
          },
        };
      return {};
    },
  });
  function find(type, predicate = () => true) {
    const nodes = [];
    function walk(node) {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      if (typeof node.type === 'function') return walk(node.type(node.props));
      nodes.push(node);
      walk(node.props?.children);
    }
    walk(
      exports.default({
        guest,
        isSubmitting: busy,
        onClose() {},
        onSubmit: (payload) => saves.push(payload),
      }),
    );
    return nodes.filter((node) => node.type === type && predicate(node.props));
  }
  return {
    find,
    saves,
    setBusy: () => {
      busy = true;
    },
  };
}
const guest = {
  id: 'sample',
  firstName: 'Dianna',
  lastName: 'Sample',
  username: 'sample',
  email: 'guest@example.com',
  phone: '',
  status: 'SUSPENDED',
  guestProfile: {
    city: 'Tarangnan',
    province: 'Samar',
    address: 'Sample address',
    postalCode: '6704',
    emergencyContactName: 'Contact',
    emergencyContactPhone: '09000000000',
  },
};

test('edit guest groups supported fields, shows real account status, and preserves unedited profile data', () => {
  const ui = mount(guest);
  assert.equal(
    ui.find('section', (props) => props.role === 'dialog').length,
    1,
  );
  assert.equal(ui.find('input', (props) => props.readOnly).length, 2);
  assert.equal(
    ui.find(
      'span',
      (props) => props.className === 'guest-active-badge suspended',
    ).length,
    1,
  );
  ui.find('input', (props) => props.value === 'Dianna')[0].props.onChange({
    target: { value: 'Updated' },
  });
  ui.find('form')[0].props.onSubmit({ preventDefault() {} });
  const payload = ui.saves[0];
  assert.equal(payload.firstName, 'Updated');
  assert.equal(payload.postalCode, '6704');
  assert.equal(payload.emergencyContactName, 'Contact');
  assert.equal(payload.emergencyContactPhone, '09000000000');
  for (const field of ['username', 'password', 'status', 'guestType'])
    assert.equal(field in payload, false);
});

test('saving locks the edit form and prevents duplicate submission', () => {
  const ui = mount(guest);
  ui.setBusy();
  assert.equal(ui.find('fieldset')[0].props.disabled, true);
  assert.ok(ui.find('button').every((node) => node.props.disabled));
  ui.find('form')[0].props.onSubmit({ preventDefault() {} });
  assert.equal(ui.saves.length, 0);
});

test('add guest retains temporary password provisioning independently of the edit layout', () => {
  const ui = mount(null);
  assert.equal(
    ui.find('input', (props) => props.type === 'password').length,
    1,
  );
  assert.equal(
    ui.find('div', (props) => props.className === 'guest-edit-summary').length,
    0,
  );
  ui.find('form')[0].props.onSubmit({ preventDefault() {} });
  assert.equal('password' in ui.saves[0], true);
  assert.equal('username' in ui.saves[0], true);
});
