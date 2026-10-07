# Public landing page

`AppRoutes.jsx` renders this feature at `/`. Sign In, Book Now, and the room
details sign-in link all navigate to the existing `/login` route. Authentication,
role redirects, admin screens, and the customer-home placeholder retain their
existing behavior. This foundation does not create reservations or carry a room
selection into login.

## Components

- `LandingPage.jsx`: page layout, search summary, filters, sorting, and selected room.
- `StaySearch.jsx`: local date and guest inputs, validation, and search submission.
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
The hero uses an illustrative remote Unsplash photograph, with a solid-color
fallback. Replace that CSS image with a property-owned asset when available.

## Verification

From `frontend/`, run `npm run lint` and `npm run build`. Browser smoke checks for
this foundation covered public listing, room-type filtering, clearing filters,
date-search parameters, dialog opening/Escape closing, API failure/retry, and
sign-in/protected-route navigation using intercepted test responses. Desktop and
390px mobile layouts were also checked for horizontal overflow. These checks do
not exercise a real reservation or payment.
