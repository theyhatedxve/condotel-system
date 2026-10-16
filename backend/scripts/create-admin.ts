import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';
import * as argon2 from 'argon2';
import { RegisterDto } from '../src/auth/dto/register.dto';
import { EncryptionService } from '../src/security/encryption.service';
import { PrivateDataService } from '../src/security/private-data.service';
import { migratePrivacy } from '../src/security/privacy-maintenance';

// Validate offline provisioning input, back up the finalized database, and create its
// initial encrypted administrator.
async function main() {
  // Read the explicit command-line value for a provisioning flag.
  const args = process.argv.slice(2),
    argument = (flag: string) => args[args.indexOf(flag) + 1];
  if (
    !args.includes('--offline') ||
    !args.includes('--database') ||
    !args.includes('--backup')
  )
    throw new Error();
  const filename = resolve(argument('--database')),
    backupPath = resolve(argument('--backup'));
  if (!existsSync(filename) || existsSync(backupPath)) throw new Error();
  // JSON comes from stdin, never command-line passwords or a committed seed file.
  const dto = plainToInstance(
    RegisterDto,
    JSON.parse(readFileSync(0, 'utf8')) as Record<string, unknown>,
  );
  await validateOrReject(dto, { whitelist: true, forbidNonWhitelisted: true });
  const privacy = new PrivateDataService(
    new EncryptionService(new ConfigService()),
  );
  const db = new Database(filename);
  try {
    migratePrivacy(db, privacy, 'verify');
    const state = db
      .prepare('SELECT keyCheck FROM PrivacyState WHERE id=1')
      .get() as { keyCheck: string } | undefined;
    if (state?.keyCheck !== privacy.index('email', 'condotel:privacy-ready:v1'))
      throw new Error();
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });
    await db.backup(backupPath);
    db.transaction(() => {
      if (
        (
          db
            .prepare("SELECT count(*) count FROM User WHERE role='ADMIN'")
            .get() as { count: number }
        ).count
      )
        throw new Error();
      const id = randomUUID();
      const data = {
        id,
        ...privacy.writeContacts(id, dto),
        username: dto.username?.trim().toLowerCase() || null,
        passwordHash,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role: 'ADMIN',
        status: 'ACTIVE',
        mustChangePassword: 1,
        updatedAt: new Date().toISOString(),
      };
      const fields = Object.keys(data);
      db.prepare(
        `INSERT INTO User(${fields.map((field) => `"${field}"`).join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
      ).run(...Object.values(data));
    }).immediate();
    console.log(
      'Initial administrator created. Change the temporary password after signing in.',
    );
  } finally {
    db.close();
  }
}
void main().catch(() => {
  console.error(
    'Administrator provisioning failed. Check validated stdin, keys, finalized migration, offline/database/new-backup arguments and absence of an existing administrator.',
  );
  process.exitCode = 1;
});
