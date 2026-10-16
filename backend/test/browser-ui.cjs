// Requires an isolated Chromium CDP instance on 9225 and the frontend on 5174.
// Every API request is intercepted. No reservations/accounts/payments are created.
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path');
(async () => {
  const tabs = await (await fetch('http://127.0.0.1:9225/json')).json();
  const ws = new WebSocket(
    tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl,
  );
  await new Promise((resolve) =>
    ws.addEventListener('open', resolve, { once: true }),
  );
  let sequence = 0;
  let paging = false;
  const pending = new Map(),
    errors = [],
    writes = [];
  let actor = {
    id: 'ui-customer',
    role: 'CUSTOMER',
    status: 'ACTIVE',
    mustChangePassword: false,
    firstName: 'Juan',
    lastName: 'Cruz',
    email: 'juan@example.test',
    phone: '0912',
  };
  const room = {
    id: 'ui-room',
    roomNumber: '101',
    name: 'Ocean Room',
    roomType: 'Deluxe',
    capacity: 4,
    ratePerNightCentavos: 250000,
    status: 'AVAILABLE',
    isActive: true,
  };
  let booking = {
    id: 'ui-reservation',
    guestId: 'ui-customer',
    roomId: room.id,
    referenceNo: 'RES-UI',
    status: 'PENDING',
    checkIn: '2027-04-25T00:00:00Z',
    checkOut: '2027-04-27T00:00:00Z',
    adults: 2,
    children: 0,
    totalAmountCentavos: 500000,
    specialRequests: 'Extra pillows',
    room,
    payments: [],
  };
  const payment = {
    id: 'ui-payment',
    reservationId: booking.id,
    amountCentavos: 500000,
    status: 'PENDING',
    provider: 'PAYMONGO',
    reservation: { ...booking, guest: actor },
    transactions: [],
    createdAt: '2026-10-15T00:00:00Z',
    failureReason: 'Checkout requires staff reconciliation before retrying.',
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      pending.set(++sequence, { resolve, reject });
      ws.send(JSON.stringify({ id: sequence, method, params }));
    });
  ws.addEventListener('message', async (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const item = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) item.reject(message.error);
      else item.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown')
      errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Fetch.requestPaused') {
      const { request, requestId } = message.params,
        url = new URL(request.url);
      let body = {},
        status = 200;
      if (request.method !== 'OPTIONS') {
        if (['POST', 'PATCH'].includes(request.method))
          writes.push({
            path: url.pathname,
            data: JSON.parse(request.postData || '{}'),
          });
        if (url.pathname.endsWith('/auth/me')) body = { user: actor };
        else if (url.pathname.endsWith('/auth/profile')) {
          actor = { ...actor, ...JSON.parse(request.postData) };
          body = { user: actor };
        } else if (url.pathname.endsWith('/auth/register')) {
          status = 201;
          body = { user: actor };
        } else if (url.pathname.endsWith('/admin/users/import')) {
          status = 201;
          body = { imported: 1 };
        } else if (url.pathname.endsWith('/admin/users'))
          body =
            request.method === 'POST'
              ? { ...actor, id: 'created-ui' }
              : paging ? Array.from({length:url.searchParams.get('page')==='2'?1:50},(_,index)=>({...actor,id:`ui-user-${index}`,role:'CUSTOMER',firstName:'Existing'})) : [{ ...actor, id: 'existing-ui', firstName: 'Existing' }];
        else if (url.pathname.endsWith('/admin/users/summary')) body={totalUsers:paging?51:1,totalStaff:0,totalCustomers:paging?51:0,totalSuspended:0};
        else if (url.pathname.endsWith('/rooms/ui-room')) body = room;
        else if (url.pathname.endsWith('/reservations/my')) body = [booking];
        else if (url.pathname.endsWith('/reservations/ui-reservation')) {
          booking = { ...booking, ...JSON.parse(request.postData) };
          body = booking;
        } else if (url.pathname.endsWith('/sync'))
          body = {
            reservation: {
              id: booking.id,
              roomId: room.id,
              referenceNo: booking.referenceNo,
              status: booking.status,
            },
            payments: [],
          };
        else if (url.pathname.endsWith('/payments')) body = [payment];
        else if (url.pathname.endsWith('/reconcile'))
          body = { received: true, paid: true };
        else if (url.pathname.endsWith('/unread-count')) body = { count: 0 };
        else if (url.pathname.endsWith('/notifications'))
          body =
            actor.role === 'CUSTOMER'
              ? [
                  {
                    id: 'ui-notification',
                    title: 'Reservation created',
                    message: 'Your booking is pending payment.',
                    isRead: false,
                    path: '/booking/ui-room?reservationId=ui-reservation',
                  },
                ]
              : [];
        else if (url.pathname.endsWith('/guests')) body = [];
      }
      await send('Fetch.fulfillRequest', {
        requestId,
        responseCode: status,
        responseHeaders: [
          { name: 'Content-Type', value: 'application/json' },
          {
            name: 'Access-Control-Allow-Origin',
            value: 'http://127.0.0.1:5174',
          },
          {
            name: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PATCH, OPTIONS',
          },
          {
            name: 'Access-Control-Allow-Headers',
            value: 'authorization, content-type',
          },
        ],
        body: Buffer.from(JSON.stringify(body)).toString('base64'),
      });
    }
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails)
      throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = async (expression) => {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    throw Error('Timed out: ' + expression);
  };
  const navigate = async (route) => {
    await send('Page.navigate', { url: 'http://127.0.0.1:5174' + route });
    await wait("document.readyState==='complete'");
  };
  const click = async (text) =>
    evaluate(
      `Array.from(document.querySelectorAll('button,a,summary')).find(element=>element.textContent.trim().startsWith(${JSON.stringify(text)})).click()`,
    );
  const input = async (selector, value) =>
    evaluate(
      `(()=>{const element=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(element,${JSON.stringify(value)});element.dispatchEvent(new Event('input',{bubbles:true}));})()`,
    );
  const artifact = async (name) => {
    const output = path.join(__dirname, '../.test-artifacts');
    fs.mkdirSync(output, { recursive: true });
    const result = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
    });
    fs.writeFileSync(
      path.join(output, name),
      Buffer.from(result.data, 'base64'),
    );
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  await navigate('/login');
  await wait("!!document.querySelector('.login-form')");
  await click('Create an account');
  await wait("location.pathname==='/register'");
  for (const [name, value] of Object.entries({
    firstName: 'Juan',
    lastName: 'Cruz',
    email: 'juan@example.test',
    username: 'juan',
    password: 'Test-password-123!',
    confirmPassword: 'Test-password-123!',
  }))
    await input(`[name=${name}]`, value);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  assert((await evaluate('document.documentElement.scrollWidth')) <= 390);
  await artifact('registration-mobile.png');
  await click('Create Account');
  await wait(
    "location.pathname==='/login'&&document.body.textContent.includes('Account created')",
  );
  assert(
    writes.some(
      (item) =>
        item.path.endsWith('/auth/register') &&
        !('role' in item.data) &&
        !('confirmPassword' in item.data),
    ),
  );
  await evaluate(
    "localStorage.setItem('condotel_access_token','ui-only-token')",
  );
  await navigate('/');
  await wait(
    "!!Array.from(document.querySelectorAll('a')).find(a=>a.textContent==='My Account')",
  );
  assert(
    (await evaluate('document.documentElement.scrollWidth')) <= 390,
    'Authenticated homepage overflows on mobile',
  );
  await click('My Account');
  await wait("location.pathname==='/profile'");
  await input('[name=email]', 'updated@example.test');
  await input('[name=phone]', '0999');
  await send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
  // Auto-accept the existing profile success alert.
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.method === 'Page.javascriptDialogOpening')
      void send('Page.handleJavaScriptDialog', { accept: true });
  });
  await click('Save Profile');
  await wait(
    "!!document.querySelector('[name=email]')&&document.querySelector('[name=email]').value==='updated@example.test'",
  );
  await wait(
    "!!Array.from(document.querySelectorAll('.customer-notifications button')).find(button=>button.textContent==='Mark as Read')",
  );
  await click('Mark as Read');
  await wait(
    "!Array.from(document.querySelectorAll('.customer-notifications button')).some(button=>button.textContent==='Mark as Read')",
  );
  assert(writes.some((item) => item.path.endsWith('/ui-notification/read')));
  await navigate('/booking/ui-room?reservationId=ui-reservation');
  await wait("!!document.querySelector('.reservation-notes-editor')");
  await click('Edit Special Requests');
  await input('.reservation-notes-editor textarea', 'Quiet room');
  await click('Save Requests');
  await wait(
    "!!document.querySelector('.booking-layout')&&document.querySelector('.booking-notes textarea').value==='Quiet room'",
  );
  actor = { ...actor, role: 'ADMIN', id: 'ui-admin' };
  await navigate('/admin/users');
  await wait("!!document.querySelector('.managed-account-actions')");
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await click('Add Account');
  await wait("!!document.querySelector('[role=dialog]')");
  for (const [name, value] of Object.entries({
    firstName: 'New',
    lastName: 'Guest',
    email: 'new@example.test',
    password: 'Test-password-123!',
  }))
    await input(`[role=dialog] [name=${name}]`, value);
  await artifact('account-create-desktop.png');
  await click('Create Account');
  await wait("!document.querySelector('[role=dialog]')");
  assert(writes.some((item) => item.path.endsWith('/admin/users')));
  await click('Import Accounts');
  await wait("!!document.querySelector('[name=accounts]')");
  await input(
    '[name=accounts]',
    JSON.stringify([
      {
        firstName: 'Import',
        lastName: 'Guest',
        email: 'import@example.test',
        password: 'Test-password-123!',
      },
    ]),
  );
  await evaluate("document.querySelector('[role=dialog]').requestSubmit()");
  await wait("!document.querySelector('[role=dialog]')");
  assert(writes.some((item) => item.path.endsWith('/admin/users/import')));
  paging = true;
  await navigate('/admin/users');await wait("document.querySelectorAll('.user-management-table tbody tr').length===50");
  await click('Next');await wait("document.querySelector('.list-pagination').textContent.includes('Page 2')&&document.querySelectorAll('.user-management-table tbody tr').length===1");
  assert(await evaluate("document.querySelector('.user-management-summary strong').textContent==='51'"));
  await navigate('/admin/payments');
  await wait("!!document.querySelector('.payments-table')");
  await click('View');
  await wait("!!document.querySelector('.payment-id-block input')");
  await input('.payment-id-block input', 'cs_mock');
  await click('Reconcile Payment');
  await wait("!document.querySelector('.payment-id-block input')");
  assert(writes.some((item) => item.path.endsWith('/ui-payment/reconcile')));
  assert.equal(errors.length, 0, errors.join(';'));
  await evaluate('localStorage.clear();sessionStorage.clear()');
  await send('Fetch.disable');
  await send('Emulation.clearDeviceMetricsOverride');
  await navigate('/');
  ws.close();
  console.log(
    JSON.stringify({
      passed: true,
      checks: [
        'registration',
        'mobile layout',
        'profile contacts',
        'customer notes',
        'admin creation',
        'atomic import UI',
        'payment reconciliation UI',
      ],
      apiWrites: writes.length,
      provider: 'fully intercepted',
    }),
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
