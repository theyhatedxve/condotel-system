import type { Database } from 'better-sqlite3';
import {
  PrivateDataService,
  profileFields,
  normalizeEmail,
  normalizePhone,
} from './private-data.service';
import { EncryptionService } from './encryption.service';

type Row = Record<string, unknown> & { id: string; userId?: string };
export type PrivacyPhase = 'audit' | 'backfill' | 'verify' | 'finalize';
const specifications = [
  { table: 'User', fields: ['email', 'phone'] },
  { table: 'GuestProfile', fields: [...profileFields] },
  { table: 'Reservation', fields: ['specialRequests'] },
] as const;

// Visit database records in stable batches so offline maintenance does not load the
// whole table at once.
function eachRow(db: Database, table: string, visit: (row: Row) => void) {
  let after = '';
  for (;;) {
    const rows = db
      .prepare(`SELECT * FROM "${table}" WHERE id > ? ORDER BY id LIMIT 100`)
      .all(after) as Row[];
    if (!rows.length) return;
    rows.forEach(visit);
    after = rows[rows.length - 1].id;
  }
}
// Write the supplied encrypted field values to one maintenance record.
function update(
  db: Database,
  table: string,
  id: string,
  data: Record<string, string | null>,
) {
  const fields = Object.keys(data);
  if (fields.length)
    db.prepare(
      `UPDATE "${table}" SET ${fields.map((field) => `"${field}"=?`).join(',')} WHERE id=?`,
    ).run(...Object.values(data), id);
}

// Explicit offline operations only. Roll back the entire phase on any mismatch.
export function migratePrivacy(
  db: Database,
  privacy: PrivateDataService,
  phase: PrivacyPhase,
) {
  if (!['audit', 'backfill', 'verify', 'finalize'].includes(phase))
    throw new Error('Invalid privacy phase.');
  privacy.index('email', 'configuration-check');
  const probe = privacy.writeNotes('configuration-check', 'probe');
  if (
    privacy.readField(
      'Reservation',
      'configuration-check',
      'specialRequests',
      probe,
    ) !== 'probe'
  )
    throw new Error('Invalid encryption configuration.');
  const result: Record<string, number | string> = { phase };
  db.transaction(() => {
    // Detect normalized-email collisions before writing any migrated envelopes.
    const identities = new Map<string, string>();
    eachRow(db, 'User', (row) => {
      if (row.email !== null && typeof row.email !== 'string')
        throw new Error(`Invalid email storage for account ID ${row.id}.`);
      const email =
        row.email === null
          ? privacy.readContacts(row).email
          : normalizeEmail(row.email as string);
      if (!email) throw new Error(`Missing email for account ID ${row.id}.`);
      const index = privacy.index('email', email);
      if (identities.has(index))
        throw new Error(
          `Email normalization collision between account IDs ${identities.get(index)} and ${row.id}.`,
        );
      identities.set(index, row.id);
    });
    for (const { table, fields } of specifications) {
      let count = 0;
      eachRow(db, table, (row) => {
        count++;
        const id = table === 'GuestProfile' ? String(row.userId) : row.id;
        const data: Record<string, string | null> = {};
        for (const field of fields) {
          const envelope = ['Ciphertext', 'Iv', 'AuthTag'].map(
            (suffix) => row[field + suffix],
          );
          if (envelope.some((value) => value === undefined))
            throw new Error(
              'Deploy the schema expansion before privacy maintenance.',
            );
          const absent = envelope.every((value) => value === null);
          if (!absent && envelope.some((value) => value === null))
            throw new Error(`Incomplete envelope in ${table} ID ${row.id}.`);
          if (phase === 'audit') continue;
          const legacy = row[field] as string | null;
          const expected =
            legacy === null
              ? null
              : table === 'User'
                ? field === 'email'
                  ? normalizeEmail(legacy)
                  : normalizePhone(legacy) || null
                : legacy;
          // Backfill retains plaintext until every encrypted value can be compared.
          if (phase === 'backfill' && absent && legacy !== null) {
            Object.assign(
              data,
              table === 'User'
                ? privacy.writeContacts(id, { [field]: expected! })
                : privacy.writeField(table, id, field, expected),
            );
            delete data[field]; // Only finalize clears legacy plaintext.
          }
          const decrypted = privacy.readField(table, id, field, {
            ...row,
            ...data,
          });
          if (legacy !== null && decrypted !== expected)
            throw new Error(`Verification mismatch in ${table} ID ${row.id}.`);
          if (table === 'User' && field === 'email' && !decrypted)
            throw new Error(
              `Missing encrypted email for account ID ${row.id}.`,
            );
        }
        if (table === 'User' && phase !== 'audit')
          privacy.readContacts({ ...row, ...data });
        update(db, table, row.id, data);
      });
      result[table] = count;
    }
    // Finalize only after verification, then protect future writes with database triggers.
    if (phase === 'finalize') {
      for (const { table, fields } of specifications) {
        db.exec(
          `UPDATE "${table}" SET ${fields.map((field) => `"${field}"=NULL`).join(',')}`,
        );
        const required =
          table === 'User'
            ? ' OR NEW.emailCiphertext IS NULL OR NEW.emailIv IS NULL OR NEW.emailAuthTag IS NULL OR NEW.emailBlindIndex IS NULL'
            : '';
        const invalid = fields
          .map(
            (field) =>
              `NEW."${field}" IS NOT NULL OR ((NEW."${field}Ciphertext" IS NULL)+(NEW."${field}Iv" IS NULL)+(NEW."${field}AuthTag" IS NULL)) NOT IN (0,3)${table === 'User' ? ` OR ((NEW."${field}Ciphertext" IS NULL) != (NEW."${field}BlindIndex" IS NULL))` : ''}`,
          )
          .join(' OR ');
        for (const operation of ['INSERT', 'UPDATE'])
          db.exec(
            `CREATE TRIGGER IF NOT EXISTS "${table}_encrypted_${operation}" BEFORE ${operation} ON "${table}" WHEN ${invalid}${required} BEGIN SELECT RAISE(ABORT, 'Encrypted private data required.'); END;`,
          );
      }
      db.exec(
        'CREATE TABLE IF NOT EXISTS PrivacyState (id INTEGER PRIMARY KEY CHECK(id=1), keyCheck TEXT NOT NULL);',
      );
      db.prepare(
        'INSERT INTO PrivacyState(id,keyCheck) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET keyCheck=excluded.keyCheck',
      ).run(privacy.index('email', 'condotel:privacy-ready:v1'));
    }
    if (db.prepare('PRAGMA foreign_key_check').all().length)
      throw new Error('Foreign-key integrity check failed.');
  }).immediate();
  return result;
}

// Re-encrypt private/device data and rebuild contact indexes atomically using explicitly
// supplied next keys.
export function rotatePrivacy(
  db: Database,
  current: EncryptionService,
  next: EncryptionService,
) {
  const previous = new PrivateDataService(current),
    replacement = new PrivateDataService(next);
  db.transaction(() => {
    migratePrivacy(db, previous, 'verify');
    const ready = db
      .prepare('SELECT keyCheck FROM PrivacyState WHERE id=1')
      .get() as { keyCheck?: string } | undefined;
    if (
      ready?.keyCheck !== previous.index('email', 'condotel:privacy-ready:v1')
    )
      throw new Error('Finalize privacy migration before rotation.');
    // Validate the supplied next keys before rebuilding unique contact lookup indexes.
    replacement.index('email', 'configuration-check');
    db.exec('DROP INDEX User_emailBlindIndex_key');
    for (const { table, fields } of specifications)
      eachRow(db, table, (row) => {
        const id = table === 'GuestProfile' ? String(row.userId) : row.id;
        const data: Record<string, string | null> = {};
        for (const field of fields) {
          if (row[field] !== null)
            throw new Error('Plaintext remains; finalize migration first.');
          const original = previous.readField(table, id, field, row);
          Object.assign(
            data,
            table === 'User'
              ? replacement.writeContacts(id, { [field]: original })
              : replacement.writeField(table, id, field, original),
          );
          if (
            replacement.readField(table, id, field, { ...row, ...data }) !==
            original
          )
            throw new Error('Rotation verification failed.');
        }
        update(db, table, row.id, data);
      });
    // Preserve existing device envelopes' no-AAD format and skip unprovisioned devices.
    const devices = db.prepare('SELECT * FROM Device').all() as Array<
      Record<string, string | null>
    >;
    for (const device of devices) {
      const values = [
        device.deviceKeyCiphertext,
        device.deviceKeyIv,
        device.deviceKeyAuthTag,
      ];
      if (values.every((value) => value === null)) continue;
      if (values.some((value) => value === null))
        throw new Error('Incomplete device envelope.');
      const plaintext = current.decrypt({
        ciphertext: values[0]!,
        iv: values[1]!,
        authTag: values[2]!,
      });
      const envelope = next.encrypt(plaintext);
      if (next.decrypt(envelope) !== plaintext)
        throw new Error('Device rotation verification failed.');
      db.prepare(
        'UPDATE Device SET deviceKeyCiphertext=?,deviceKeyIv=?,deviceKeyAuthTag=? WHERE id=?',
      ).run(envelope.ciphertext, envelope.iv, envelope.authTag, device.id);
    }
    db.exec(
      'CREATE UNIQUE INDEX User_emailBlindIndex_key ON User(emailBlindIndex)',
    );
    db.prepare('UPDATE PrivacyState SET keyCheck=? WHERE id=1').run(
      replacement.index('email', 'condotel:privacy-ready:v1'),
    );
    migratePrivacy(db, replacement, 'verify');
  }).immediate();
  return { rotated: true };
}
