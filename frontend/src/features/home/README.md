# Coastal homepage

The public homepage lives at `/`. The existing room browser lives at `/rooms`
and requires a verified session through `ProtectedRoute`. All room-browsing
links, including Sign In, target `/rooms`: guests are sent to `/login`, while
signed-in users enter the room browser directly. Customers are sent to `/rooms`
after login or password changes. The old `/customer/home` URL redirects there
through the same session guard. Admin and staff login destinations remain their
dashboard; required password changes still run before room access.
Signed-in users see Sign Out in place of Sign In. It uses the existing logout
action to clear both token storage options and the current user session.

Replace mock property details, featured room previews, gallery images, and the
coastal photo in `homeContent.js`. Featured rooms are presentation examples;
they do not change the live room catalog, prices, or reservation logic.
Benefit and amenity copy is in `HomePage.jsx`; sample travel times and the
illustrated location map are in `LocationSection.jsx`.

The hero uses the local homepage and login background assets. View Gallery opens
these photos because no promotional video is configured. Room preview dialogs
link to the real room browser. Room and coastal sample photos use external image
URLs; room images have the existing RoomPhoto fallback, and the coastal image
falls back to the local pool image.

Styles use the `coast-` prefix to isolate this page from the room browser and
admin UI. Run `npm run lint` and `npm run build` from `frontend` to verify changes.
