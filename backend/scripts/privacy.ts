import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { EncryptionService } from '../src/security/encryption.service';
import { PrivateDataService } from '../src/security/private-data.service';
import {
  migratePrivacy,
  rotatePrivacy,
  PrivacyPhase,
} from '../src/security/privacy-maintenance';

// Validate explicit database/offline/backup arguments and run the requested backed-up
// privacy operation.
async function main() {
  const [operation, ...args] = process.argv.slice(2);
  // Read the argument immediately following the requested command-line flag.
  const value = (flag: string) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const filename = value('--database');
  if (!filename || !existsSync(filename))
    throw new Error('Supply --database with an existing SQLite path.');
  const mutating = !['audit', 'verify'].includes(operation);
  if (mutating && !args.includes('--offline'))
    throw new Error(
      'Stop every application/database writer and explicitly pass --offline.',
    );
  const db = new Database(resolve(filename));
  db.pragma('foreign_keys = ON');
  const encryption = new EncryptionService(new ConfigService());
  try {
    if (mutating) {
      const backupPath = value('--backup');
      if (
        !backupPath ||
        existsSync(backupPath) ||
        resolve(backupPath) === resolve(filename)
      )
        throw new Error(
          'Supply --backup with a new file path. Backups are never overwritten.',
        );
      mkdirSync(dirname(resolve(backupPath)), { recursive: true });
      await db.backup(resolve(backupPath));
      const backup = new Database(resolve(backupPath), { readonly: true });
      try {
        if (backup.pragma('integrity_check', { simple: true }) !== 'ok')
          throw new Error('Backup integrity check failed.');
      } finally {
        backup.close();
      }
    }
    if (operation === 'backup') {
      console.log(JSON.stringify({ backedUp: true }));
    } else if (operation === 'rotate') {
      const next = new EncryptionService(
        new ConfigService({
          AES_MASTER_KEY: process.env.NEXT_AES_MASTER_KEY,
          CONTACT_SEARCH_KEY: process.env.NEXT_CONTACT_SEARCH_KEY,
        }),
      );
      // Read exclusively from the explicit next values; no automatic replacement keys.
      if (
        !process.env.NEXT_AES_MASTER_KEY ||
        !process.env.NEXT_CONTACT_SEARCH_KEY
      )
        throw new Error('Both NEXT keys must be explicitly supplied.');
      console.log(JSON.stringify(rotatePrivacy(db, encryption, next)));
    } else {
      console.log(
        JSON.stringify(
          migratePrivacy(
            db,
            new PrivateDataService(encryption),
            operation as PrivacyPhase,
          ),
        ),
      );
    }
  } finally {
    db.close();
  }
}
void main().catch((error: unknown) => {
  // Database/provider errors can contain submitted values. Keep terminal output generic.
  console.error(
    'Privacy operation failed; database changes were rolled back. Check keys, schema, offline/backup arguments and migration integrity. Resolve collisions using a restricted audit before retrying.',
  );
  if (
    error instanceof Error &&
    /^Email normalization collision between account IDs [\w-]+ and [\w-]+\.$/.test(
      error.message,
    )
  )
    console.error(error.message);
  process.exitCode = 1;
});
