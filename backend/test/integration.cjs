// Real HTTP/SQLite/Argon2/JWT, random test keys and mocked provider; never load application .env.
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { randomBytes, createHmac } = require('node:crypto');
const Database = require('better-sqlite3');
const argon2 = require('argon2');
const { execFileSync } = require('node:child_process');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'condotel-integration-'));
const filename = path.join(root, 'isolated.db');
Object.assign(process.env, {
  NODE_ENV: 'test',
  DOTENV_CONFIG_PATH: path.join(root, 'no-application-env'),
  DATABASE_URL: 'file:' + filename.replaceAll('\\', '/'),
  AES_MASTER_KEY: randomBytes(32).toString('base64'),
  CONTACT_SEARCH_KEY: randomBytes(32).toString('base64'),
  JWT_SECRET: randomBytes(48).toString('hex'),
  PAYMONGO_SECRET_KEY: 'sk_test_isolated_mock',
  PAYMONGO_WEBHOOK_SECRET: randomBytes(32).toString('hex'),
  PAYMONGO_WEBHOOK_MODE: 'test',
  FRONTEND_URL: 'http://localhost:5173',
});
const { ConfigService } = require('@nestjs/config');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { EncryptionService } = require('../dist/security/encryption.service');
const { PrivateDataService } = require('../dist/security/private-data.service');
const { migratePrivacy } = require('../dist/security/privacy-maintenance');
const { AppModule } = require('../dist/app.module');
const { PaymongoService } = require('../dist/payments/paymongo.service');
const {
  DatabaseErrorFilter,
} = require('../dist/security/database-error.filter');
let app,
  db,
  base,
  checks = 0;
const sessions = new Map();
let checkoutCount = 0;
let failAfterCreate = false;
const nativeFetch = global.fetch;
// Any unintended external request fails immediately, including PayMongo requests.
global.fetch = (url, options) => {
  if (typeof url !== 'string' || !url.startsWith(base + '/'))
    throw Error('External network forbidden in integration test');
  return nativeFetch(url, options);
};
async function request(
  route,
  { token, method = 'GET', body, status = 200, headers = {} } = {},
) {
  const options = {
    method,
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  };
  if (body !== undefined)
    options.body = typeof body === 'string' ? body : JSON.stringify(body);
  const response = await fetch(base + '/api' + route, options);
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  assert.equal(response.status, status, route + ' ' + text);
  checks++;
  if (response.ok)
    assert(
      !/Ciphertext|AuthTag|BlindIndex|passwordHash/.test(JSON.stringify(data)),
      route + ' leaked protected fields',
    );
  return data;
}
async function login(identifier, password = 'Test-password-123!') {
  return request('/auth/login', {
    method: 'POST',
    body: { identifier, password },
  });
}
async function main() {
  db = new Database(filename);
  db.pragma('foreign_keys=ON');
  const migrations = path.join(__dirname, '../prisma/migrations');
  for (const folder of fs.readdirSync(migrations).sort())
    if (folder !== 'migration_lock.toml')
      db.exec(
        fs.readFileSync(path.join(migrations, folder, 'migration.sql'), 'utf8'),
      );
  const encryption = new EncryptionService(new ConfigService()),
    privacy = new PrivateDataService(encryption);
  const hash = await argon2.hash('Test-password-123!', {
    type: argon2.argon2id,
  });
  db.prepare(
    'INSERT INTO User(id,email,username,passwordHash,firstName,lastName,role,updatedAt) VALUES (?,?,?,?,?,?,?,?)',
  ).run(
    'admin',
    'admin@example.test',
    'admin',
    hash,
    'Test',
    'Admin',
    'ADMIN',
    new Date().toISOString(),
  );
  function cli(operation, backup, extraEnv = {}) {
    return execFileSync(
      process.execPath,
      [
        '-r',
        'ts-node/register',
        'scripts/privacy.ts',
        operation,
        '--database',
        filename,
        ...(backup ? ['--offline', '--backup', path.join(root, backup)] : []),
      ],
      {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, ...extraEnv },
        encoding: 'utf8',
        timeout: 45000,
      },
    );
  }
  cli('backup', 'before-schema.db');
  cli('audit');
  cli('backfill', 'before-backfill.db');
  cli('verify');
  cli('finalize', 'before-finalize.db');
  const backupCheck = new Database(path.join(root, 'before-backfill.db'), {
    readonly: true,
  });
  assert.equal(
    backupCheck.prepare('SELECT email FROM User').get().email,
    'admin@example.test',
  );
  backupCheck.close();
  // Build an application with the same production guards, DTOs, services and readiness check.
  app = await NestFactory.create(AppModule, { logger: false, rawBody: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new DatabaseErrorFilter());
  const provider = app.get(PaymongoService);
  provider.createCheckoutSession = async (input) => {
    checkoutCount++;
    const id = 'cs_mock' + checkoutCount;
    const session = {
      id,
      attributes: {
        reference_number: input.referenceNo,
        metadata: { reservation_id: input.reservationId },
        payments: [],
        checkout_url: 'https://checkout.paymongo.com/' + id,
      },
    };
    sessions.set(id, session);
    if (failAfterCreate)
      throw new Error('Simulated provider timeout after remote creation.');
    return { data: session };
  };
  provider.retrieveCheckoutSession = async (id) => {
    assert(sessions.has(id));
    return sessions.get(id);
  };
  provider.expireCheckoutSession = async (id) => {
    sessions.get(id).attributes.status = 'expired';
  };
  await app.listen(0, '127.0.0.1');
  base = 'http://127.0.0.1:' + app.getHttpServer().address().port;
  const admin = (await login(' ADMIN@EXAMPLE.TEST ')).accessToken;
  const registration = {
    firstName: 'Juan',
    lastName: 'Cruz',
    email: 'Juan@Example.test',
    username: 'juan',
    phone: '0912-345',
    password: 'Test-password-123!',
  };
  const created = await request('/auth/register', {
    method: 'POST',
    body: registration,
    status: 201,
  });
  assert(created.user.id);
  await request('/auth/register', {
    method: 'POST',
    body: { ...registration, username: 'different' },
    status: 409,
  });
  const customer = (await login('juan@example.test')).accessToken;
  assert((await login('juan')).accessToken);
  await request('/auth/login', {
    method: 'POST',
    body: { identifier: 'juan', password: 'wrong' },
    status: 401,
  });
  await request('/admin/users', { status: 401 });
  await request('/admin/users', { token: customer, status: 403 });
  assert.equal(
    (await request('/auth/me', { token: customer })).user.phone,
    '0912-345',
  );
  await request('/auth/profile', {
    token: customer,
    method: 'PATCH',
    body: { email: 'new-juan@example.test', phone: '0999' },
  });
  await request('/auth/login', {
    method: 'POST',
    body: { identifier: 'juan@example.test', password: registration.password },
    status: 401,
  });
  assert((await login('new-juan@example.test')).accessToken);
  assert.equal(
    (
      await request(
        '/guests?search=' + encodeURIComponent('new-juan@example.test'),
        { token: admin },
      )
    ).length,
    1,
  );
  assert.equal(
    (await request('/guests?search=new-juan@', { token: admin })).length,
    0,
  );
  assert.equal(
    (await request('/guests?search=0999', { token: admin })).length,
    1,
  );
  assert.equal(
    (await request('/admin/users?search=Juan%20Cruz', { token: admin })).length,
    1,
  );
  assert.equal(
    (await request('/search?q=0999', { token: admin })).counts.guests,
    1,
  );
  const managed = await request('/admin/users', {
    token: admin,
    method: 'POST',
    body: {
      firstName: 'Staff',
      lastName: 'Member',
      email: 'staff@example.test',
      password: registration.password,
      role: 'STAFF',
    },
    status: 201,
  });
  let staff = (await login('staff@example.test')).accessToken;
  await request('/rooms/management', { token: staff, status: 403 });
  await request('/auth/change-password', {
    token: staff,
    method: 'POST',
    body: {
      currentPassword: registration.password,
      newPassword: 'Changed-password-456!',
    },
  });
  staff = (await login('staff@example.test', 'Changed-password-456!'))
    .accessToken;
  await request('/admin/users', { token: staff, status: 403 });
  const guest = await request('/guests', {
    token: staff,
    method: 'POST',
    body: {
      ...registration,
      email: 'guest@example.test',
      username: 'guest',
      address: 'Private street',
      emergencyContactName: 'Contact',
      emergencyContactPhone: '0900',
    },
    status: 201,
  });
  await request('/guests/' + guest.id, {
    token: staff,
    method: 'PATCH',
    body: { phone: '0888', address: 'New private street' },
  });
  assert.equal(
    (await request('/guests/' + guest.id, { token: staff })).guestProfile
      .address,
    'New private street',
  );
  const countBefore = db.prepare('SELECT count(*) count FROM User').get().count;
  await request('/admin/users/import', {
    token: admin,
    method: 'POST',
    body: {
      users: [
        { ...registration, email: 'import@example.test', username: 'import' },
        { ...registration, email: 'import@example.test', username: 'import2' },
      ],
    },
    status: 409,
  });
  assert.equal(
    db.prepare('SELECT count(*) count FROM User').get().count,
    countBefore,
  );
  await request('/admin/users/import', {
    token: admin,
    method: 'POST',
    body: {
      users: [
        { ...registration, email: 'import@example.test', username: 'import' },
      ],
    },
    status: 201,
  });
  const room = await request('/rooms', {
    token: admin,
    method: 'POST',
    body: {
      roomNumber: '101',
      name: 'Ocean Room',
      roomType: 'Deluxe',
      capacity: 4,
      ratePerNightCentavos: 250000,
    },
    status: 201,
  });
  await request('/rooms', {
    token: customer,
    method: 'POST',
    body: {},
    status: 403,
  });
  const booking = {
    roomId: room.id,
    checkIn: '2027-04-25',
    checkOut: '2027-04-27',
    adults: 2,
    children: 1,
    specialRequests: 'Extra pillows',
    estimatedArrival: '20:00',
  };
  const reservation = await request('/reservations', {
    token: customer,
    method: 'POST',
    body: booking,
    status: 201,
  });
  assert.equal(reservation.totalAmountCentavos, 500000);
  assert(reservation.specialRequests.includes('20:00'));
  await request('/reservations', {
    token: customer,
    method: 'POST',
    body: booking,
    status: 409,
  });
  await request('/reservations', {
    token: customer,
    method: 'POST',
    body: { ...booking, checkOut: booking.checkIn },
    status: 400,
  });
  await request('/reservations/' + reservation.id, {
    token: customer,
    method: 'PATCH',
    body: {},
  });
  assert(
    (
      await request('/reservations/' + reservation.id, { token: customer })
    ).specialRequests.includes('Extra pillows'),
  );
  await request('/reservations/' + reservation.id, {
    token: customer,
    method: 'PATCH',
    body: { specialRequests: 'Quiet room' },
  });
  assert.equal(
    (await request('/reservations/my', { token: customer }))[0].specialRequests,
    'Quiet room',
  );
  const temporaryOther = (await login('import@example.test')).accessToken;
  await request('/auth/change-password', {
    token: temporaryOther,
    method: 'POST',
    body: {
      currentPassword: registration.password,
      newPassword: 'Changed-password-456!',
    },
  });
  const other = (await login('import@example.test', 'Changed-password-456!'))
    .accessToken;
  await request('/reservations/' + reservation.id, {
    token: other,
    status: 403,
  });
  await request('/reservations/' + reservation.id, {
    token: other,
    method: 'PATCH',
    body: { specialRequests: 'Unauthorized' },
    status: 403,
  });
  const checkout = await request(
    '/payments/reservations/' + reservation.id + '/checkout',
    { token: customer, method: 'POST', status: 201 },
  );
  const repeated = await request(
    '/payments/reservations/' + reservation.id + '/checkout',
    { token: customer, method: 'POST', status: 201 },
  );
  assert.equal(repeated.paymentId, checkout.paymentId);
  assert.equal(checkoutCount, 1);
  const session = sessions.get(checkout.checkoutSessionId);
  session.attributes.payments = [
    {
      id: 'pay_mock',
      attributes: {
        status: 'paid',
        amount: 500000,
        currency: 'PHP',
        source: { type: 'qrph' },
      },
    },
  ];
  const event = JSON.stringify({
    data: {
      attributes: {
        type: 'checkout_session.payment.paid',
        livemode: false,
        data: session,
      },
    },
  });
  const timestamp = String(Math.floor(Date.now() / 1000)),
    signature = createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET)
      .update(timestamp + '.' + event)
      .digest('hex');
  await request('/payments/webhook/paymongo', {
    method: 'POST',
    body: event,
    headers: { 'paymongo-signature': 't=' + timestamp + ',te=invalid' },
    status: 401,
  });
  const headers = {
    'paymongo-signature': 't=' + timestamp + ',te=' + signature,
  };
  await request('/payments/webhook/paymongo', {
    method: 'POST',
    body: event,
    headers,
  });
  await request('/payments/webhook/paymongo', {
    method: 'POST',
    body: event,
    headers,
  });
  const sync = await request(
    '/payments/reservations/' + reservation.id + '/sync',
    { token: customer, method: 'POST', status: 201 },
  );
  assert.equal(sync.reservation.status, 'CONFIRMED');
  assert.equal(sync.payments[0].status, 'PAID');
  assert.equal(
    db.prepare('SELECT count(*) count FROM "Transaction"').get().count,
    1,
  );
  await request('/reservations/' + reservation.id + '/cancel', {
    token: customer,
    method: 'PATCH',
    status: 400,
  });
  await request('/reservations/' + reservation.id + '/status', {
    token: staff,
    method: 'PATCH',
    body: { status: 'CHECKED_IN' },
  });
  await request('/reservations/' + reservation.id + '/status', {
    token: staff,
    method: 'PATCH',
    body: { status: 'CHECKED_OUT' },
  });
  await request('/payments', { token: admin });
  // A timeout must not create a second checkout, and only admin may reconcile it.
  const uncertainBooking = await request('/reservations', {
    token: customer,
    method: 'POST',
    body: { ...booking, checkIn: '2028-05-01', checkOut: '2028-05-03' },
    status: 201,
  });
  failAfterCreate = true;
  await request('/payments/reservations/' + uncertainBooking.id + '/checkout', {
    token: customer,
    method: 'POST',
    status: 500,
  });
  failAfterCreate = false;
  await request('/payments/reservations/' + uncertainBooking.id + '/checkout', {
    token: customer,
    method: 'POST',
    status: 409,
  });
  assert.equal(checkoutCount, 2);
  const uncertainPayment = db
    .prepare('SELECT id FROM Payment WHERE reservationId=?')
    .get(uncertainBooking.id);
  const recoveredSession = sessions.get('cs_mock2');
  recoveredSession.attributes.payments = [
    {
      id: 'pay_recovered',
      attributes: { status: 'paid', amount: 500000, currency: 'PHP' },
    },
  ];
  await request('/payments/' + uncertainPayment.id + '/reconcile', {
    token: customer,
    method: 'POST',
    body: { checkoutSessionId: 'cs_mock2' },
    status: 403,
  });
  await request('/payments/' + uncertainPayment.id + '/reconcile', {
    token: admin,
    method: 'POST',
    body: { checkoutSessionId: 'cs_mock2' },
    status: 201,
  });
  assert.equal(
    (
      await request('/payments/reservations/' + uncertainBooking.id + '/sync', {
        token: customer,
        method: 'POST',
        status: 201,
      })
    ).reservation.status,
    'CONFIRMED',
  );
  const unpaidBooking = await request('/reservations', {
    token: customer,
    method: 'POST',
    body: { ...booking, checkIn: '2029-05-01', checkOut: '2029-05-03' },
    status: 201,
  });
  await request('/reservations/' + unpaidBooking.id + '/cancel', {
    token: customer,
    method: 'PATCH',
  });
  assert.equal(
    (await request('/reservations/' + unpaidBooking.id, { token: customer }))
      .status,
    'CANCELLED',
  );
  await request('/transactions', { token: admin });
  await request('/reports/dashboard', { token: admin });
  await request('/reservations', {
    token: admin,
    method: 'POST',
    body: {
      ...booking,
      guestId: guest.id,
      checkIn: '2030-05-01',
      checkOut: '2030-05-03',
    },
    status: 201,
  });
  const ownDashboard = await request('/reports/dashboard', { token: customer });
  assert(
    ownDashboard.recentReservations.every(
      (item) => item.guest.id === created.user.id,
    ),
  );
  await request('/reports/summary', { token: customer, status: 403 });
  await request('/settings', { token: admin });
  const notifications = await request('/notifications', { token: customer });
  assert(notifications.length >= 2);
  await request('/notifications/' + notifications[0].id + '/read', {
    token: customer,
    method: 'PATCH',
  });
  await request('/notifications/' + notifications[0].id + '/read', {
    token: other,
    method: 'PATCH',
    status: 404,
  });
  await request('/admin/users/' + managed.id, {
    token: admin,
    method: 'PATCH',
    body: { status: 'SUSPENDED' },
  });
  await request('/auth/me', { token: staff, status: 401 });
  const raw = db.prepare('SELECT * FROM User WHERE id=?').get(created.user.id);
  assert.equal(raw.email, null);
  assert.equal(raw.phone, null);
  assert(!raw.emailCiphertext.includes('example'));
  assert.equal(
    db
      .prepare('SELECT specialRequests FROM Reservation WHERE id=?')
      .get(reservation.id).specialRequests,
    null,
  );
  migratePrivacy(db, privacy, 'verify');
  // Test pagination without dozens of expensive password hashes. These are isolated fixtures.
  for (let index = 0; index < 51; index++) {
    const id = 'page-user-' + index;
    const data = {
      id,
      ...privacy.writeContacts(id, {
        email: `page${index}@example.test`,
        phone: null,
      }),
      passwordHash: hash,
      firstName: 'Page',
      lastName: 'Fixture',
      updatedAt: new Date().toISOString(),
    };
    const fields = Object.keys(data);
    db.prepare(
      `INSERT INTO User(${fields.map((field) => `"${field}"`).join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    ).run(...Object.values(data));
  }
  assert.equal(
    (await request('/admin/users?page=1', { token: admin })).length,
    50,
  );
  assert((await request('/admin/users?page=2', { token: admin })).length > 0);
  assert.equal(
    (await request('/admin/users/summary', { token: admin })).totalUsers,
    db.prepare('SELECT count(*) count FROM User').get().count,
  );
  assert.equal((await request('/guests?page=1', { token: admin })).length, 50);
  assert((await request('/guests?page=2', { token: admin })).length > 0);
  assert.equal(
    (await request('/reservations?page=2', { token: admin })).length,
    0,
  );
  await app.close();
  app = null;
  const nextAes = randomBytes(32).toString('base64'),
    nextSearch = randomBytes(32).toString('base64');
  const rotated = new EncryptionService(
    new ConfigService({
      AES_MASTER_KEY: nextAes,
      CONTACT_SEARCH_KEY: nextSearch,
    }),
  );
  cli('rotate', 'before-rotation.db', {
    NEXT_AES_MASTER_KEY: nextAes,
    NEXT_CONTACT_SEARCH_KEY: nextSearch,
  });
  migratePrivacy(db, new PrivateDataService(rotated), 'verify');
  process.env.AES_MASTER_KEY = nextAes;
  process.env.CONTACT_SEARCH_KEY = nextSearch;
  app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new DatabaseErrorFilter());
  await app.listen(0, '127.0.0.1');
  base = 'http://127.0.0.1:' + app.getHttpServer().address().port;
  assert((await login('new-juan@example.test')).accessToken);
  console.log(
    JSON.stringify({
      passed: true,
      httpChecks: checks,
      provider: 'mock only',
      database: 'disposable',
      migration: true,
      rotation: true,
    }),
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (app) await app.close();
    if (db) db.close();
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert(path.basename(root).startsWith('condotel-integration-'));
    fs.rmSync(root, { recursive: true, force: true });
  });
