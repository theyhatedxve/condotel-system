# NEXORA interface

React and Vite provide the public homepage, authenticated room browsing, customer
booking and checkout, profiles, and staff/admin management pages.

## Development

```powershell
npm.cmd ci
npm.cmd run dev
```

The interface normally runs at `http://localhost:5173`. API requests default to
`http://localhost:3000/api`; `VITE_API_BASE_URL` overrides that address.

## Code organization

Feature pages, API helpers, and styles live together in `src/features/`.
`src/routes/` defines navigation and role checks; `src/layouts/` contains the
administration layout. Reusable components live under `src/components/`, with
shared formatting in `src/utils/`.

Room, booking, homepage, and payment directories include short feature notes.
Payment details are entered on PayMongo. The merchant page verifies provider
status before showing confirmation or returning from an unpaid attempt.

## Checks

```powershell
npm.cmd run lint
npm.cmd run build
node --experimental-vm-modules --test test/hosted-checkout.test.cjs
```

See [maintenance notes](../docs/MAINTENANCE.md) for formatting and rules for
preserving behavior during refactors.
