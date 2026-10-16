# Maintaining the code

## Follow a feature from the interface to the database

The usual request path is:

```text
frontend/src/features/<feature>/<Page>.jsx
  -> frontend/src/features/<feature>/*Api.js
  -> frontend/src/services/apiClient.js
  -> backend/src/<feature>/*.controller.ts
  -> backend/src/<feature>/*.service.ts
  -> backend/src/prisma/prisma.service.ts
```

Controllers define routes and access checks. DTO files define validated input
shapes. Services contain business rules and database operations. Module files
connect those dependencies. The database's models and enum values are defined in
`backend/prisma/schema.prisma`.

On the frontend, page components own their current state and event handlers.
Feature API files define HTTP calls. CSS files live alongside their features;
shared layout and global styles live under `layouts/` and `styles/`.

## Files to inspect together

| Concern                                  | Starting points                                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Login and session restoration            | `frontend/src/features/auth/AuthContext.jsx`, `authStorage.js`, and `backend/src/auth/auth.service.ts`         |
| Navigation and permissions               | `frontend/src/routes/AppRoutes.jsx`, `ProtectedRoute.jsx`, backend controllers, and `backend/src/auth/guards/` |
| User editing and password reset          | Both `user-management/` feature directories; frontend handlers and backend service rules                       |
| Room availability and cancellation       | `backend/src/reservations/reservations.service.ts`, `rooms/`, and `payments/payments.service.ts`               |
| Hosted checkout and payment confirmation | `backend/src/payments/payments.service.ts`, `paymongo.service.ts`, and `payments.controller.ts`                |
| Search and notifications                 | `frontend/src/layouts/Topbar.jsx`, frontend API helpers, and backend `search/` and `notifications/`            |
| Reports                                  | `frontend/src/features/reports/ReportsPage.jsx` and `backend/src/reports/reports.service.ts`                   |

The longer page components contain several sections: local state, request effects,
derived display values, event handlers, and returned JSX. Start with the handler
for the action being investigated, then follow its API helper to the backend.

## Preserve the existing behavior during cleanup

- Keep React hook order, effect dependencies, cleanup functions, and request
  timing intact. In particular, reports load the initial range once and apply
  subsequent date selections through `loadReport`.
- Keep route paths, role checks, DTO validation, response shapes, status values,
  and error messages intact.
- Keep prices and totals in their existing centavo units. Preserve each date
  formatter's options and fallback values; similar-looking helpers do not all
  have identical behavior.
- Follow the existing ordering of database writes, provider calls, and
  notifications. Preserve transaction boundaries and webhook verification.
- Reservation cancellation has separate `updateStatus` and `cancel` entry points.
  Read both when investigating that flow; their access checks and return shapes
  are not identical.
- Retain JSX whitespace and separate text fragments. A few labels use explicit
  string expressions so formatting preserves the original React children.
- Preserve CSS rule order and selectors. Moving a rule can change which style
  wins even when the declaration itself stays the same.

## Formatting

Source comments explain function responsibilities, request validation, React
state/effects, important UI sections, and stylesheet blocks. Payment, authentication,
and encryption comments also document the checks that protect each operation.
Keep these explanations synchronized with the code when changing a feature.
Generated Prisma code and dependency packages remain managed by their generators.

The root `.prettierrc.json` uses the backend's existing Prettier conventions:
single quotes, trailing commas, two-space indentation, and the default 80-column
wrapping preference. `.editorconfig` also defines UTF-8 and LF line endings. The
backend retains its matching `.prettierrc` for its existing formatting command.

After installing backend dependencies, run this command from the repository root
to check handwritten JavaScript, JSX, TypeScript, CSS, and the frontend HTML entry:

```sh
node backend/node_modules/prettier/bin/prettier.cjs --check "frontend/src/**/*.{js,jsx,css}" "backend/src/**/*.ts" "backend/test/**/*.ts" "frontend/*.{js,html}" "backend/*.ts"
```

Replace `--check` with `--write` to apply formatting. No additional dependency is
required. The root `.prettierignore` excludes generated code, dependencies, build
output, environment files, and migration history.

For backend source and tests only, the existing `npm run format` command remains
available from `backend/`.

## Validation scope

Run the lint, unit-test, and build commands in the root README after code changes.
The backend integration suite exercises authentication, authorization, bookings,
payments, and privacy maintenance using disposable databases and a mocked payment
provider. The frontend payment-window tests cover failure, verified success,
window closure, blocked popups, and leaving the merchant page.

The readability cleanup retained these existing lint findings:

- Frontend: the initial report effect omits `from` and `to` from its dependency
  array, producing a hook-dependency warning.
- Backend: the redundant room-filter object spread has been simplified without
  changing the resulting query. The bootstrap floating-promise finding was
  resolved by explicitly marking its promise as intentional.

These findings are separate from formatting. Changing request timing or error
handling belongs in a separately reviewed behavior change.

Generated Prisma files and compiled output are not handwritten source. Make
future model changes in the schema and use the project's Prisma configuration to
regenerate the client; keep historical migrations intact.

## Workspace cleanup on October 16, 2026

Unused Vite/React assets, starter App/index styles, the unreferenced duplicate
profile stylesheet, unused social icon symbols, and the unreferenced JWT guard
under `auth/strategies/` were removed after checking imports. The active guard
remains under `auth/guards/`. Temporary integration-reference downloads, diagnostic
screenshots/logs, and the one-time database cleanup script were removed as well.

Handwritten source was formatted using the existing project conventions. Account
management now reuses the existing public user selection; room filtering,
declarations, and encryption guard blocks were simplified without changing their
results. Tests, migration history, encryption maintenance, environment files,
dependencies, and recovery backups remain part of the working system.

The approved local database cleanup retained the existing `dev@gmail.com` ADMIN
account and its credentials. It removed 9 other accounts and their 26 reservations,
25 payments, 13 transactions, and related notifications/audit entries. All 7 rooms
and system settings were retained; the room occupied by deleted test data was made
available. Foreign-key checks, integrity checks, and encryption verification passed.

Recovery backup: `backend/backups/account-cleanup-1792155828355.db`. It contains
the pre-cleanup records and requires the matching existing encryption keys. Stop
all database writers before using a backup for recovery; do not overwrite a newer
database that has accepted subsequent bookings or payments.
