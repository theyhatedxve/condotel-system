# NEXORA system

A React administration interface and a NestJS API for managing guests, rooms,
reservations, payments, transactions, reports, settings, and users.

## Project map

| Location                             | Responsibility                                               |
| ------------------------------------ | ------------------------------------------------------------ |
| `frontend/src/features/`             | Feature pages, forms, API helpers, and feature styles        |
| `frontend/src/routes/`               | Route definitions and session/role checks                    |
| `frontend/src/layouts/`              | Shared administration layout, sidebar, and top bar           |
| `frontend/src/services/apiClient.js` | API base URL and authentication header                       |
| `frontend/src/utils/`                | Shared date and currency formatting                          |
| `backend/src/`                       | NestJS feature modules, controllers, services, and DTOs      |
| `backend/prisma/schema.prisma`       | Database models and enums                                    |
| `backend/prisma/migrations/`         | Existing database migration history                          |
| `backend/src/generated/prisma/`      | Generated database client                                    |
| `docs/MAINTENANCE.md`                | Code navigation, formatting, and behavior-preservation notes |

The homepage leads customers into room browsing, booking, and hosted checkout.
The NFC administration route currently displays a placeholder; the schema retains
the NFC and device models for that feature.

## Local development

Install dependencies separately in `backend/` and `frontend/` with `npm ci`.

The backend reads its configuration from `backend/.env`; use
`backend/.env.example` as a starting point for a new local environment. Database,
JWT, payment-provider, and encryption configuration are consumed by their
respective backend services. Keep an existing environment file when one is
already configured.

Read [PRIVACY.md](PRIVACY.md) before setting up a new database, applying privacy
migrations, or rotating encryption keys. Existing encrypted records require their
matching keys.

Run the API from `backend/`:

```sh
npm run start:dev
```

Run the interface from `frontend/` in a separate terminal:

```sh
npm run dev
```

The API uses the `/api` prefix and defaults to port `3000`. The frontend API client
defaults to `http://localhost:3000/api`; `VITE_API_BASE_URL` overrides that address.
The backend currently allows the frontend origin `http://localhost:5173` in its
CORS configuration.

## Checks

From `frontend/`:

```sh
npm run lint
npm run build
```

From `backend/`:

```sh
npm run lint
npm test -- --runInBand
npm run build
```

The backend unit tests cover the root controller, encryption, privacy maintenance,
administrator provisioning, and payment verification.
After building the backend, `npm run test:e2e -- --runInBand` runs isolated HTTP
workflows with disposable databases and a mocked payment provider. From the
frontend, `node --experimental-vm-modules --test test/hosted-checkout.test.cjs`
checks payment-window behavior.

See [the maintenance guide](docs/MAINTENANCE.md) for formatting commands and the
parts of the system to inspect together when maintaining a feature.
