# Prototype integration

## Baseline comparison and implementation plan

Source: `theyhatedxve/condotel-system-prototype`, branch `main`, downloaded as a
read-only reference. Target: the existing local `condotel-system` checkout.
No prototype files, existing customer database, or secrets are to be modified.

| Capability                                                               | Target before integration                       | Planned disposition                                                                     |
| ------------------------------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Registration backend, email/username login, Argon2id, JWT                | Implemented                                     | Preserve; add registration access to existing login design                              |
| Session restoration, logout, password change and temporary-password gate | Implemented                                     | Preserve and verify backend enforcement                                                 |
| User profile, staff guest management, admin account updates/reset        | Implemented                                     | Preserve interfaces; integrate encrypted contact writes/reads                           |
| Admin account creation and atomic import                                 | Missing                                         | Add validated, capped import and account creation, using existing dialogs/styles        |
| Room CRUD, public browsing, capacity/rates/status                        | Implemented                                     | Preserve; test authorization and capacity validation                                    |
| Booking, server pricing and availability                                 | Implemented                                     | Make conflict check/create atomic; add note editing and explicit arrival support        |
| Unpaid cancellation and operational status transitions                   | Partial                                         | Reject paid cancellation; require verified payment before confirmation/check-in         |
| Hosted checkout, signed webhook, customer reconciliation/results         | Implemented                                     | Preserve URLs/UI; strengthen references, errors and concurrent checkout behavior        |
| AES-GCM contacts and reservation notes                                   | Missing                                         | Add context-bound envelopes, separate HMAC contact indexes, explicit authorized mapping |
| Encrypted guest profile contact details                                  | Missing in both implementations                 | Protect target's existing address/emergency fields without removing them                |
| Exact email/phone lookup, partial names/usernames                        | Missing encrypted implementation                | Adapt prototype blind indexes; no contact substring indexes                             |
| Staged migration, verification, readiness and rotation                   | Missing                                         | Add explicit offline, backed-up administrative commands and disposable-data tests       |
| Dashboard statistics and occupancy                                       | Implemented via reports                         | Preserve dashboard contract/layout; verify role scope                                   |
| In-app notifications and read/dedupe operations                          | Implemented                                     | Preserve and include customer-specific events                                           |
| Transactions, reports, settings, global search                           | Working target; prototype placeholders/disabled | Retain target implementations and adapt contact search only                             |
| Homepage, rooms, booking, payment designs                                | Working target; incompatible prototype UI       | Retain target React/JavaScript pages and styling                                        |
| NFC/device models and AES device envelopes                               | Present; prototype removed device management    | Preserve all target models and legacy encryption compatibility                          |

The prototype's schema and combined business module are incompatible with the
target's modular services, payment enums, transaction history and customer URLs.
They will not replace the target schema, modules or UI. Security helpers will be
adapted around the target's existing services and explicit response projections.

Contact search intentionally follows the requested exact-email/exact-phone
contract. Partial name and username searches remain. Existing contact substring
matching cannot operate over randomized ciphertext; no plaintext shadow columns
or substring indexes will be introduced. Explain this in search placeholders.

Likely changes: `backend/src/security/*`, account/guest/auth/search/reservation/
payment services and DTOs, module imports, Prisma schema plus one forward-only
schema expansion migration, offline scripts and tests; minimal buttons/forms in
existing auth/user/reservation pages to expose missing workflows.

Rollout: stop writers, back up SQLite with its backup API, deploy additive schema,
audit normalization collisions, backfill, authenticate/compare every envelope,
finalize plaintext removal and database write protections, then restart with
matching keys. Test the entire procedure against disposable databases first.
Existing records and keys will not be changed during implementation.
