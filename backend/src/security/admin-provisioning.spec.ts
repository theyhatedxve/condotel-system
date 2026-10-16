import Database from 'better-sqlite3';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, basename, join, resolve } from 'node:path';
import * as argon2 from 'argon2';
import { EncryptionService } from './encryption.service';
import { PrivateDataService } from './private-data.service';
import { migratePrivacy } from './privacy-maintenance';

it('provisions one encrypted initial administrator through validated stdin and refuses a second', async () => {
  const root = mkdtempSync(join(tmpdir(), 'condotel-provision-test-')),
    filename = join(root, 'test.db');
  if (
    dirname(resolve(root)) !== resolve(tmpdir()) ||
    !basename(root).startsWith('condotel-provision-test-')
  )
    throw new Error('Unexpected temporary path.');
  const keys = {
    AES_MASTER_KEY: randomBytes(32).toString('base64'),
    CONTACT_SEARCH_KEY: randomBytes(32).toString('base64'),
  };
  const privacy = new PrivateDataService(
    new EncryptionService(new ConfigService(keys)),
  );
  const db = new Database(filename);
  try {
    const migrations = join(process.cwd(), 'prisma/migrations');
    for (const folder of readdirSync(migrations).sort())
      if (folder !== 'migration_lock.toml')
        db.exec(
          readFileSync(join(migrations, folder, 'migration.sql'), 'utf8'),
        );
    migratePrivacy(db, privacy, 'finalize');
    const input = JSON.stringify({
      firstName: 'Initial',
      lastName: 'Admin',
      email: 'initial@example.test',
      password: 'Test-only-password-123!',
    });
    const command = (backup: string) =>
      execFileSync(
        process.execPath,
        [
          '-r',
          'ts-node/register',
          'scripts/create-admin.ts',
          '--offline',
          '--database',
          filename,
          '--backup',
          join(root, backup),
        ],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
          input,
          timeout: 30000,
          env: {
            ...process.env,
            ...keys,
            DOTENV_CONFIG_PATH: join(root, 'no-application-env'),
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );
    expect(command('before-admin.db')).toContain(
      'Initial administrator created',
    );
    const row = db.prepare('SELECT * FROM User').get() as Record<
      string,
      unknown
    >;
    expect(row.email).toBeNull();
    expect(row.role).toBe('ADMIN');
    expect(row.mustChangePassword).toBe(1);
    expect(privacy.readContacts(row).email).toBe('initial@example.test');
    expect(
      await argon2.verify(
        row.passwordHash as string,
        'Test-only-password-123!',
      ),
    ).toBe(true);
    expect(() => command('before-second.db')).toThrow();
    expect(
      (db.prepare('SELECT count(*) count FROM User').get() as { count: number })
        .count,
    ).toBe(1);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
}, 70000);
