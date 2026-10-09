# Room browsing page

`AppRoutes.jsx` renders this feature at `/rooms` behind `ProtectedRoute`.
The separate `home` feature renders the public homepage at `/`. Guests must
sign in before entering this room browser. Customers reach `/rooms` after login
or a required password change; `/customer/home` redirects to the same page.
Admin and staff login destinations remain their dashboard. This foundation
does not create reservations itself. Book This Room in the details dialog opens
the customer booking feature with the selected room, dates, and guest count.

## Components

- `LandingPage.jsx`: Seabreeze page layout, search summary, filters, sorting,
  grid/list display, and selected room.
- `StaySearch.jsx`: local date and guest inputs, validation, room-type selector,
  and search submission. The room-type selector shares state with the sidebar.
- `RoomFilters.jsx`: collapsible price/type filters, live type counts, maximum
  price slider and presets, availability switch, and reset action. One room type
  is selected at a time, preserving the existing filter behavior.
- `usePublicRooms.js`: loading/error state, retries, and cancellation of obsolete requests.
- `landingApi.js`: existing public room and availability endpoints.
- `PublicRoomCard.jsx`: room summary, nightly price, and details action.
- `RoomPhoto.jsx`: stored room image with a fallback for missing or broken images.
- `RoomDetails.jsx`: native modal dialog with keyboard focus and Escape support.
- `landing.css`: styles prefixed with `stay-` to keep the feature isolated.

## Data and display

Initial browsing reads `GET /rooms`; the availability checkbox filters the
current room status. Submitting travel dates reads `GET /reservations/availability`
with `checkIn`, `checkOut`, and `capacity`. That endpoint determines availability
for the selected dates. Room-type and maximum nightly-price filters operate on
the returned rooms. Prices use the existing centavo-based currency formatter.

Room names, descriptions, images, capacities, and prices come from the API. No
sample rooms, ratings, bed configurations, or amenity claims are stored here.
The hero combines the local `src/assets/homepage-background.png` image with
the first homepage room-preview photo from `homeContent.js`. This decorative
photo is independent of the live catalog. Its background is defined in
`landing.css`, with a solid-color fallback. Branding reuses `HomeBrand.jsx`.
The reference's ratings, bed configurations, amenities, view filters, and saved
favorites are not part of the current room model and are not fabricated here.
Book Now and the header search button focus the existing date-search form.

## Verification

From `frontend/`, run `npm run lint` and `npm run build`. Browser smoke checks for
this foundation covered public listing, room-type filtering, clearing filters,
date-search parameters, dialog opening/Escape closing, API failure/retry, grid/list
switching, and protected-route navigation using intercepted test responses.
Desktop, tablet, and 390px mobile layouts were checked for horizontal overflow. These checks do
not exercise a real reservation or payment.
