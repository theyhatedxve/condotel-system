import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { EncryptionService } from './encryption.service';
import { PrivateDataService } from './private-data.service';
import { migratePrivacy, rotatePrivacy } from './privacy-maintenance';

function services() {
  const encryption = new EncryptionService(
    new ConfigService({
      AES_MASTER_KEY: randomBytes(32).toString('base64'),
      CONTACT_SEARCH_KEY: randomBytes(32).toString('base64'),
    }),
  );
  return { encryption, privacy: new PrivateDataService(encryption) };
}
function database(expand = true) {
  const db = new Database(':memory:');
  const path = join(process.cwd(), 'prisma', 'migrations');
  for (const folder of readdirSync(path).sort())
    if (
      folder !== 'migration_lock.toml' &&
      (expand || folder !== '20261015010000_private_contacts_and_notes')
    )
      db.exec(readFileSync(join(path, folder, 'migration.sql'), 'utf8'));
  db.pragma('foreign_keys=ON');
  db.prepare(
    'INSERT INTO User(id,email,phone,passwordHash,firstName,lastName,updatedAt) VALUES (?,?,?,?,?,?,?)',
  ).run(
    'u1',
    'Test@Example.test',
    ' 0912-345 ',
    'test-hash',
    'Test',
    'Guest',
    new Date().toISOString(),
  );
  db.prepare(
    'INSERT INTO GuestProfile(id,userId,address,emergencyContactName,updatedAt) VALUES (?,?,?,?,?)',
  ).run(
    'g1',
    'u1',
    'Private address',
    'Private contact',
    new Date().toISOString(),
  );
  db.prepare(
    'INSERT INTO Room(id,roomNumber,name,roomType,capacity,ratePerNightCentavos,updatedAt) VALUES (?,?,?,?,?,?,?)',
  ).run('room1', '101', 'Ocean', 'Deluxe', 2, 250000, new Date().toISOString());
  db.prepare(
    'INSERT INTO Reservation(id,referenceNo,guestId,roomId,checkIn,checkOut,adults,totalAmountCentavos,specialRequests,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)',
  ).run(
    'r1',
    'RES-1',
    'u1',
    'room1',
    new Date('2027-04-25').getTime(),
    new Date('2027-04-27').getTime(),
    2,
    500000,
    'Private request',
    new Date().toISOString(),
  );
  return db;
}

describe('Context-bound personal data', () => {
  it('uses randomized envelopes, normalized exact indexes and field separation', () => {
    const { privacy } = services();
    const a = privacy.writeContacts('u1', {
      email: ' TEST@example.test ',
      phone: ' 0912-345 ',
    });
    const b = privacy.writeContacts('u1', {
      email: 'test@example.test',
      phone: '0912-345',
    });
    expect(a.emailCiphertext).not.toBe(b.emailCiphertext);
    expect(a.emailBlindIndex).toBe(b.emailBlindIndex);
    expect(privacy.index('email', 'x')).not.toBe(privacy.index('phone', 'x'));
    expect(privacy.readContacts({ id: 'u1', ...a })).toEqual({
      email: 'test@example.test',
      phone: '0912-345',
    });
  });
  it('rejects ciphertext copied to another user or field and modified tags', () => {
    const { privacy } = services();
    const data = privacy.writeContacts('u1', {
      email: 'test@example.test',
      phone: null,
    });
    expect(() => privacy.readContacts({ id: 'u2', ...data })).toThrow();
    expect(() =>
      privacy.readContacts({
        id: 'u1',
        ...data,
        emailAuthTag: randomBytes(16).toString('base64'),
      }),
    ).toThrow();
    expect(() =>
      privacy.readField('Reservation', 'u1', 'specialRequests', {
        specialRequestsCiphertext: data.emailCiphertext,
        specialRequestsIv: data.emailIv,
        specialRequestsAuthTag: data.emailAuthTag,
      }),
    ).toThrow();
  });
  it('keeps absent and empty notes distinct and strips internal fields from nested responses', () => {
    const { privacy } = services();
    expect(
      privacy.readField(
        'Reservation',
        'r1',
        'specialRequests',
        privacy.writeNotes('r1', ''),
      ),
    ).toBe('');
    expect(
      privacy.readField(
        'Reservation',
        'r1',
        'specialRequests',
        privacy.writeNotes('r1', null),
      ),
    ).toBeNull();
    const result = privacy.response({
      id: 'r1',
      ...privacy.writeNotes('r1', 'Extra pillows'),
      guest: {
        id: 'u1',
        ...privacy.writeContacts('u1', {
          email: 'test@example.test',
          phone: null,
        }),
      },
    });
    expect(result.specialRequests).toBe('Extra pillows');
    expect(JSON.stringify(result)).not.toMatch(
      /Ciphertext|AuthTag|BlindIndex|Iv/,
    );
  });
  it('rejects reused encryption/search keys', () => {
    const key = randomBytes(32).toString('base64');
    expect(() =>
      new EncryptionService(
        new ConfigService({ AES_MASTER_KEY: key, CONTACT_SEARCH_KEY: key }),
      ).blindIndex('email', 'test'),
    ).toThrow();
  });
});

describe('Disposable database migration and rotation', () => {
  let db: Database.Database;
  beforeEach(() => {
    db = database();
  });
  afterEach(() => db.close());
  it('expands an existing schema without losing legacy users or reservation relationships', () => {
    const legacy = database(false);
    try {
      legacy.exec(
        readFileSync(
          join(
            process.cwd(),
            'prisma/migrations/20261015010000_private_contacts_and_notes/migration.sql',
          ),
          'utf8',
        ),
      );
      expect(
        (
          legacy.prepare('SELECT email FROM User WHERE id=?').get('u1') as {
            email: string;
          }
        ).email,
      ).toBe('Test@Example.test');
      expect(
        (
          legacy
            .prepare('SELECT guestId FROM Reservation WHERE id=?')
            .get('r1') as { guestId: string }
        ).guestId,
      ).toBe('u1');
      expect(legacy.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      expect(
        (
          legacy.prepare('SELECT count(*) count FROM GuestProfile').get() as {
            count: number;
          }
        ).count,
      ).toBe(1);
    } finally {
      legacy.close();
    }
  });
  it('audits, backfills, verifies and finalizes without changing IDs, counts or relationships', () => {
    const { privacy } = services();
    expect(migratePrivacy(db, privacy, 'audit')).toMatchObject({
      User: 1,
      GuestProfile: 1,
      Reservation: 1,
    });
    migratePrivacy(db, privacy, 'backfill');
    expect(
      (db.prepare('SELECT email FROM User').get() as { email: string }).email,
    ).toBe('Test@Example.test');
    migratePrivacy(db, privacy, 'backfill');
    migratePrivacy(db, privacy, 'verify');
    migratePrivacy(db, privacy, 'finalize');
    migratePrivacy(db, privacy, 'finalize');
    const user = db.prepare('SELECT * FROM User').get() as Record<
      string,
      unknown
    >;
    expect(user.email).toBeNull();
    expect(privacy.readContacts(user)).toEqual({
      email: 'test@example.test',
      phone: '0912-345',
    });
    const profile = privacy.response(
      db.prepare('SELECT * FROM GuestProfile').get(),
    ) as { address: string; emergencyContactName: string };
    expect(profile.address).toBe('Private address');
    expect(profile.emergencyContactName).toBe('Private contact');
    expect(
      privacy.response(db.prepare('SELECT * FROM Reservation').get())
        .specialRequests,
    ).toBe('Private request');
    expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(() =>
      db.prepare('UPDATE User SET email=?').run('plaintext@example.test'),
    ).toThrow();
    expect(() =>
      db.prepare('UPDATE Reservation SET specialRequests=?').run('plaintext'),
    ).toThrow();
  });
  it('detects normalized-email collisions before changing any data', () => {
    db.prepare(
      'INSERT INTO User(id,email,passwordHash,firstName,lastName,updatedAt) VALUES (?,?,?,?,?,?)',
    ).run(
      'u2',
      'test@example.test',
      'test-hash',
      'Another',
      'Guest',
      new Date().toISOString(),
    );
    expect(() => migratePrivacy(db, services().privacy, 'backfill')).toThrow(
      /collision/,
    );
    expect(
      (
        db.prepare('SELECT emailCiphertext FROM User LIMIT 1').get() as {
          emailCiphertext: null;
        }
      ).emailCiphertext,
    ).toBeNull();
  });
  it('refuses finalize with wrong keys or a corrupted envelope and preserves plaintext', () => {
    const { privacy } = services();
    migratePrivacy(db, privacy, 'backfill');
    expect(() => migratePrivacy(db, services().privacy, 'finalize')).toThrow();
    db.prepare('UPDATE Reservation SET specialRequestsAuthTag=?').run(
      randomBytes(16).toString('base64'),
    );
    expect(() => migratePrivacy(db, privacy, 'finalize')).toThrow();
    expect(
      (db.prepare('SELECT email FROM User').get() as { email: string }).email,
    ).toBe('Test@Example.test');
  });
  it('rotates contacts, profiles, notes and indexes atomically and rejects the old key', () => {
    const old = services(),
      next = services();
    const device = old.encryption.encrypt('existing-device-key');
    db.prepare(
      'INSERT INTO Device(id,deviceId,name,deviceKeyCiphertext,deviceKeyIv,deviceKeyAuthTag,updatedAt) VALUES (?,?,?,?,?,?,?)',
    ).run(
      'd1',
      'door-1',
      'Door',
      device.ciphertext,
      device.iv,
      device.authTag,
      new Date().toISOString(),
    );
    db.prepare(
      'INSERT INTO Device(id,deviceId,name,updatedAt) VALUES (?,?,?,?)',
    ).run('d2', 'door-2', 'Unprovisioned', new Date().toISOString());
    migratePrivacy(db, old.privacy, 'backfill');
    migratePrivacy(db, old.privacy, 'finalize');
    const before = db.prepare('SELECT emailBlindIndex FROM User').get() as {
      emailBlindIndex: string;
    };
    rotatePrivacy(db, old.encryption, next.encryption);
    const after = db.prepare('SELECT * FROM User').get() as Record<
      string,
      unknown
    >;
    expect(after.emailBlindIndex).not.toBe(before.emailBlindIndex);
    expect(next.privacy.readContacts(after).email).toBe('test@example.test');
    expect(() => old.privacy.readContacts(after)).toThrow();
    expect(
      next.privacy.response(db.prepare('SELECT * FROM Reservation').get())
        .specialRequests,
    ).toBe('Private request');
    const rotated = db
      .prepare(
        'SELECT deviceKeyCiphertext AS ciphertext,deviceKeyIv AS iv,deviceKeyAuthTag AS authTag FROM Device WHERE id=?',
      )
      .get('d1') as { ciphertext: string; iv: string; authTag: string };
    expect(next.encryption.decrypt(rotated)).toBe('existing-device-key');
    expect(() => old.encryption.decrypt(rotated)).toThrow();
  });
  it('rolls back every rotated contact when an existing device key is corrupt', () => {
    const old = services(),
      next = services();
    migratePrivacy(db, old.privacy, 'backfill');
    migratePrivacy(db, old.privacy, 'finalize');
    db.prepare(
      'INSERT INTO Device(id,deviceId,name,deviceKeyCiphertext,deviceKeyIv,deviceKeyAuthTag,updatedAt) VALUES (?,?,?,?,?,?,?)',
    ).run('d1', 'door-1', 'Door', 'bad', null, null, new Date().toISOString());
    expect(() => rotatePrivacy(db, old.encryption, next.encryption)).toThrow();
    expect(
      old.privacy.readContacts(
        db.prepare('SELECT * FROM User').get() as Record<string, unknown>,
      ).email,
    ).toBe('test@example.test');
  });
});
