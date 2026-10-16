# Private-data rollout and recovery

The local workspace database completed the offline rollout on October 16, 2026
to resolve the startup readiness error. Both previously missing keys were
initialized in the local backend configuration, and audit, backfill, verification
and finalization preserved all 9 users, 9 guest profiles and 21 reservations.
Backups are in `backend/backups/startup-fix-20261016-before-*.db`.
Keep the configured keys with the matching database; do not regenerate them.
Other installations still require the explicit rollout below. The readiness check
prevents serving incomplete or incorrectly decrypted records.

## What is protected

AES-256-GCM protects User email/phone, all six GuestProfile address/emergency-contact
fields, and Reservation special requests (including appended arrival notes).
Each value has a random 12-byte IV, a 16-byte authentication tag and a context
binding its model, owner ID and field. Existing device envelopes retain their
original no-context encryption format. Passwords remain Argon2id hashes.

The API keeps the original plaintext field names for authorized callers. Internal
envelopes, indexes and password hashes are never included in those responses.
Encryption protects a database copy when the attacker lacks the keys; it does
not hide information from an authorized viewer or a compromised running backend.
Use HTTPS outside local development and restrict access to database/key backups.

## Keys and lookup behavior

- `AES_MASTER_KEY`: the existing canonical Base64 key decoding to 32 bytes. Preserve
  it, including for NFC/device records. Never invent a replacement for a lost key.
- `CONTACT_SEARCH_KEY`: an independent canonical Base64 32-byte key. It must differ
  from AES_MASTER_KEY. HMAC-SHA256 indexes are domain-separated for email and phone.
- Keep the existing `JWT_SECRET`, database URL and PayMongo configuration.
- `NEXT_AES_MASTER_KEY` and `NEXT_CONTACT_SEARCH_KEY` are supplied only for explicit
  rotation. They are not normal runtime configuration or committed defaults.

For a first installation only, generate keys with `crypto.randomBytes(32)` and
store their Base64 values in your restricted backend secret store or `.env`.
Do not run a generator over existing key entries. No command automatically
generates, rewrites or prints application keys.

Email normalization remains trim + lowercase; phone normalization is trim only.
No inferred country codes or punctuation removal are introduced. Email uniqueness
uses the unique blind index; phone remains nonunique, preserving existing rules.
Search uses exact email/phone, partial first/last names and usernames. Blind indexes
reveal equality/repetition. No plaintext shadow search columns, contact substring
indexes, or decrypt-all contact searches are added.

Guest/User Management accepts optional `page=1` (50 rows per page). Omitting page
preserves the existing array API used by reservation guest selectors. Avoid exposing
these staff/admin list endpoints to customers. Contacts are not added to JWTs.

## Windows rollout

Run PowerShell from `D:\condotel-system-nfc-main\condotel-system`. Stop the backend,
watch processes, scheduled writers and every other client that writes this SQLite
database. Keep them stopped through verification/finalization. The `--offline`
flag is your assertion that these writers are stopped, not a process detector.

```powershell
Set-Location D:\condotel-system-nfc-main\condotel-system\backend
npm.cmd ci
```

Manually configure `.env` using `.env.example` as a checklist. Preserve all existing
secrets. Add only the missing independent search key. Confirm `DATABASE_URL`
resolves to the same file as `$dbPath` below; do not accidentally migrate a second
empty database. The current workspace's database is `backend\prisma\dev.db`.

```powershell
$dbPath = (Resolve-Path -LiteralPath .\prisma\dev.db).Path
$runId = Get-Date -Format yyyyMMdd-HHmmss
npm.cmd run privacy:migrate -- backup --database $dbPath --offline --backup ".\backups\$runId-before-schema.db"
npx.cmd prisma migrate deploy --config prisma7.config.ts
npx.cmd prisma generate --config prisma7.config.ts
npm.cmd run privacy:migrate -- audit --database $dbPath
npm.cmd run privacy:migrate -- backfill --database $dbPath --offline --backup ".\backups\$runId-before-backfill.db"
npm.cmd run privacy:migrate -- verify --database $dbPath
```

The schema expansion retains every old record and temporarily retains legacy
plaintext. Backfill is repeatable and verifies all envelopes against the original
normalized contacts and exact notes/profile values. Audit detects normalized-email
collisions; resolve account ownership through a controlled administrative data
correction before proceeding. Never delete one of the accounts merely to pass.
Verify compares every row, counts User/GuestProfile/Reservation records, checks
indexes and foreign-key integrity. Compare its counts with audit/backfill output.

After audit/backfill/verify all succeed, finalize explicitly:

```powershell
npm.cmd run privacy:migrate -- finalize --database $dbPath --offline --backup ".\backups\$runId-before-finalize.db"
npm.cmd run privacy:migrate -- verify --database $dbPath
npm.cmd run build
npm.cmd run start:dev
```

Finalize authenticates and compares every value inside one transaction before
clearing legacy plaintext. Database triggers then reject plaintext or incomplete
envelope writes. A readiness marker binds the configured search key to the finalized
database; startup also verifies configuration, protections and a stored account.
Repeated finalization is safe. It never resets users, rooms or payment history.

For a fresh installation, deploy migrations first, then run audit/backfill/verify/
finalize even with an empty database. An initial administrator can be provisioned
offline by feeding validated account JSON through stdin to:

```powershell
Get-Content -Raw -LiteralPath .\restricted-admin-input.json | npm.cmd run account:create-admin -- --database $dbPath --offline --backup ".\backups\$runId-before-admin.db"
```

That restricted temporary input contains firstName, lastName, email, password and
optional username/phone. It is not a committed seed or a default account. Securely
remove that input after provisioning. The command refuses to create an initial
admin when any administrator already exists. Sign in and change the temporary
password before using business endpoints. Normal admin account creation/import is
available in User Management afterward.

Start the frontend in another VS Code terminal:

```powershell
Set-Location D:\condotel-system-nfc-main\condotel-system\frontend
npm.cmd ci
npm.cmd run dev
```

Test existing email and username login after rollout, profile/guest contact updates,
exact contact searches, reservation notes and the merchant's PayMongo test account.
Do not create a live charge for verification.

## Controlled rotation

Stop writers and retain a matching database backup plus the **old** secret bundle.
Supply explicit NEXT keys through the backend secret environment. Never expose them
in frontend variables, command-line arguments, logs or this runbook.

```powershell
npm.cmd run privacy:rotate -- --database $dbPath --offline --backup ".\backups\$runId-before-rotation.db"
```

Rotation verifies the old database, re-encrypts contacts, guest-profile fields,
notes and existing device keys, rebuilds blind indexes and updates readiness as one
offline transaction. A failed envelope/device check rolls everything back. On
success, replace the runtime AES/search values with the supplied NEXT values before
starting the application. Remove NEXT values from the runtime environment and
verify login again. Keep old bundles with their matching backups until retention
policy allows their retirement.

## Recovery and operational limits

Before a failed maintenance command returns, its transaction rolls back; its new
backup remains available. Missing/wrong keys and corrupt values fail closed. Restore
the original matching keys rather than regenerating them. If a rollout must be
reverted, stop all writers and restore the complete pre-rollout SQLite backup plus
its matching application version and key bundle. Do not overwrite a database that
has accepted later bookings/payments without reconciling those records first.
SQLite backups include WAL state through the database backup API; do not copy only
the main file while it is being written.

Legacy plaintext columns are cleared, not dropped, so recovery/forward migrations
remain manageable. Old backups and SQLite free pages/WAL may still contain earlier
plaintext. Clearing columns is not secure erasure of disks or historical backups;
handle retention and any controlled database compaction separately.

Hosted checkout URLs and current return URLs are preserved. A checkout timeout may
have succeeded remotely, so its pending record blocks a second checkout until an
administrator reconciles the matching provider session. Reconciliation verifies
reference, session, amount and currency; the success URL alone never records money.
There is no automatic refund or provider checkout-discovery feature. Do not release
paid/uncertain bookings as unpaid. Billing autofill was intentionally excluded;
PayMongo continues collecting payment details directly through the existing gateway.

Physical door firmware, account email verification, password recovery, SMS and a
separate booking email provider were not working prototype features and are not
introduced by this integration. NFC models and device encryption remain intact.
