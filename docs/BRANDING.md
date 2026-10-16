# NEXORA branding

The interface uses NEXORA across public pages, authentication, administration,
loading text, browser metadata, and API health information. Shared logo rendering
lives in `frontend/src/components/BrandLogo.jsx`; the transparent asset is
`frontend/public/nexora-logo.png`. Dark surfaces use a white CSS treatment.

The logo was prepared from the user's supplied reference using the built-in
imagegen tool. Prompt:

> Use case: background-extraction. Edit target: the attached NEXORA logo (the black/dark geometric N monogram with the NEXORA wordmark below it). Prepare this exact supplied logo as a clean transparent PNG for a web application. Remove all surrounding empty background and preserve the geometric shape, dark charcoal color, letter spacing and exact wordmark NEXORA. Tight bounding box around the N symbol and wordmark with modest clear padding. Do not redesign or add any details. True transparent background.

Existing encryption/HMAC domain identifiers, the token-storage key, repository
paths, historical migrations, and isolated test-directory prefixes retain their
legacy names for compatibility. They are internal identifiers, not displayed
branding. Do not rename cryptographic domains without a dedicated data migration.

New settings records explicitly use NEXORA. The settings API displays NEXORA for
the historical CONDOTEL default without rewriting saved records, and preserves
customized property names. The historical Prisma default and migration history
remain intact; no database migration is needed for this presentation change.

My Profile follows the supplied card layout using existing profile-editing,
account role/status, password-change, and customer-notification features. Photo
uploads, address editing, and notification preferences are outside this redesign.
