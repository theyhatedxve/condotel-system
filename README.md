# Condotel system

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

The NFC administration route currently displays a placeholder. The customer home
route also displays a placeholder. The schema includes NFC-related models, but
these placeholders should not be mistaken for completed application flows.

## Local development

Install dependencies separately in `backend/` and `frontend/` with `npm ci`.

The backend reads its configuration from `backend/.env`; use
`backend/.env.example` as a starting point for a new local environment. Database,
JWT, payment-provider, and encryption configuration are consumed by their
respective backend services. Keep an existing environment file when one is
already configured.

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

The backend unit tests cover the starter controller and encryption service.
`npm run test:e2e` is a separate check that initializes the application and needs
its environment and database configuration. There is currently no frontend test
script.

See [the maintenance guide](docs/MAINTENANCE.md) for formatting commands and the
parts of the system to inspect together when maintaining a feature.
