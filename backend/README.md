# Condotel API

NestJS feature modules provide authentication, users, guests, rooms, reservations,
payments, notifications, search, reports, transactions, and settings.

## Development

Run commands from this directory:

```powershell
npm.cmd ci
npx.cmd prisma generate --config prisma7.config.ts
npm.cmd run start:dev
```

The API defaults to `http://localhost:3000/api`. Run one backend process at a time.
Keep the existing `.env` and encryption keys. For a new database, schema changes,
or key rotation, follow [PRIVACY.md](../PRIVACY.md) before starting the API.

## Code organization

Each feature keeps routes in its controller, validated inputs in DTO files,
business rules in its service, and dependency wiring in its module. Database
models live in `prisma/schema.prisma`; generated Prisma code is not edited by hand.
Shared encryption and explicit offline maintenance live under `src/security/`.

## Checks

```powershell
npm.cmd run lint
npm.cmd test -- --runInBand
npm.cmd run build
npm.cmd run test:e2e -- --runInBand
```

End-to-end tests use disposable databases and a mocked payment provider.
Offline administrative commands in `scripts/` are documented in the privacy
runbook. Never run tests or maintenance against the working database by accident.
