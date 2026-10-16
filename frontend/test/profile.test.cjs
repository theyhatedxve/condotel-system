const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('../../backend/node_modules/typescript');

const user = {
  firstName: 'Marielle',
  lastName: 'Manahon',
  username: 'maye_01',
  email: 'test@example.com',
  phone: '09123456789',
  role: 'STAFF',
  status: 'ACTIVE',
};

function mount(file, api = {}) {
  const state = [];
  const alerts = [];
  let cursor = 0;
  let refreshes = 0;
  const exports = {};
  const source = ts.transpileModule(
    readFileSync(path.join(__dirname, '../src/features/auth', file), 'utf8'),
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
    window: { alert: (message) => alerts.push(message) },
    require(name) {
      if (name === 'react')
        return {
          useState(initial) {
            const index = cursor++;
            if (!(index in state))
              state[index] =
                typeof initial === 'function' ? initial() : initial;
            return [
              state[index],
              (next) => {
                state[index] =
                  typeof next === 'function' ? next(state[index]) : next;
              },
            ];
          },
        };
      if (name === 'react/jsx-runtime') return require('react/jsx-runtime');
      if (name === './useAuth')
        return {
          useAuth: () => ({
            user,
            refreshUser: async () => {
              refreshes++;
              return user;
            },
          }),
        };
      if (name === './authApi') return api;
      if (name === 'react-router-dom') return { Link: 'a' };
      if (name === 'lucide-react' || name.endsWith('.css')) return {};
      if (
        name === './ProfileSecurityCard' ||
        name.endsWith('CustomerNotifications')
      )
        return () => null;
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
    walk(exports.default());
    return result;
  }
  const find = (type, match = () => true) =>
    nodes().filter((node) => node.type === type && match(node.props));
  const change = (name, value) =>
    find('input', (props) => props.name === name)[0].props.onChange({
      target: { name, value },
    });
  const submit = () => find('form')[0].props.onSubmit({ preventDefault() {} });
  return { find, change, submit, alerts, refreshes: () => refreshes };
}

test('personal profile saves trimmed fields through the existing API and refreshes the shared user', async () => {
  let payload;
  const ui = mount('ProfilePage.jsx', {
    updateMyProfile: async (value) => {
      payload = value;
      return { user };
    },
  });
  ui.change('firstName', '  Marielle  ');
  ui.change('username', '  ');
  ui.change('phone', '  ');
  await ui.submit();
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    email: user.email,
    firstName: 'Marielle',
    lastName: user.lastName,
    username: null,
    phone: null,
  });
  assert.equal(ui.refreshes(), 1);
  assert.equal(
    ui.find('input', (props) => props.name === 'firstName')[0].props.value,
    user.firstName,
  );
});

test('Cancel restores saved profile values and blank names never submit', async () => {
  let calls = 0;
  const ui = mount('ProfilePage.jsx', {
    updateMyProfile: async () => {
      calls++;
    },
  });
  ui.change('firstName', 'Changed');
  ui.find(
    'button',
    (props) => props.className === 'profile-cancel-button',
  )[0].props.onClick();
  assert.equal(
    ui.find('input', (props) => props.name === 'firstName')[0].props.value,
    user.firstName,
  );
  ui.change('firstName', '   ');
  await ui.submit();
  assert.equal(calls, 0);
  assert.ok(ui.alerts.includes('First name and last name are required.'));
});

test('profile API failures preserve edits and show the server message', async () => {
  const ui = mount('ProfilePage.jsx', {
    updateMyProfile: async () => {
      throw { response: { data: { message: 'Email already in use.' } } };
    },
  });
  ui.change('email', 'duplicate@example.com');
  await ui.submit();
  assert.equal(
    ui.find('input', (props) => props.name === 'email')[0].props.value,
    'duplicate@example.com',
  );
  assert.ok(ui.alerts.includes('Email already in use.'));
  assert.equal(ui.refreshes(), 0);
});

test('security rejects mismatched passwords and never sends confirmation to the API', async () => {
  const calls = [];
  const ui = mount('ProfileSecurityCard.jsx', {
    changeMyPassword: async (value) => calls.push(value),
  });
  ui.change('currentPassword', 'old-password');
  ui.change('newPassword', 'new-password');
  ui.change('confirmPassword', 'mismatch');
  await ui.submit();
  assert.equal(calls.length, 0);
  assert.equal(
    ui.find('p', (props) => props.role === 'alert')[0].props.children,
    'New passwords do not match.',
  );
  ui.change('confirmPassword', 'new-password');
  await ui.submit();
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { currentPassword: 'old-password', newPassword: 'new-password' },
  ]);
  assert.equal(ui.refreshes(), 1);
  assert.ok(ui.find('input').every((node) => node.props.value === ''));
  assert.equal(
    ui.find('p', (props) => props.role === 'status')[0].props.children,
    'Password changed successfully.',
  );
});

test('security exposes a password visibility toggle and displays API errors', async () => {
  const ui = mount('ProfileSecurityCard.jsx', {
    changeMyPassword: async () => {
      throw {
        response: { data: { message: 'Current password is incorrect.' } },
      };
    },
  });
  ui.find(
    'button',
    (props) => props['aria-label'] === 'Show current password',
  )[0].props.onClick();
  assert.equal(
    ui.find('input', (props) => props.name === 'currentPassword')[0].props.type,
    'text',
  );
  ui.change('currentPassword', 'wrong-password');
  ui.change('newPassword', 'new-password');
  ui.change('confirmPassword', 'new-password');
  await ui.submit();
  assert.equal(
    ui.find('p', (props) => props.role === 'alert')[0].props.children,
    'Current password is incorrect.',
  );
  assert.equal(ui.refreshes(), 0);
});
