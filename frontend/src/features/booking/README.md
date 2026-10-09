# Customer booking

The authenticated customer route `/booking/:roomId` opens from Book This Room in
the room-details dialog. Date-search values and guest count travel in the URL.
The selected room and current rate are reloaded from `GET /rooms/:id`.

- `BookingPage.jsx`: authenticated room/reservation loading states.
- `BookingShell.jsx`, `BookingSteps.jsx`: shared booking/payment layout and progress.
- `BookingForm.jsx`: account details, dates, adults/children, notes, optional arrival
  time, availability check, review, reservation creation, and checkout action.
- `BookingSummary.jsx`: selected room, stay information, and price breakdown.
- `useBooking.js`: cancellable room loading and owned-reservation restoration.
- `bookingUtils.js`: local date defaults, night counts, formatting, and API errors.
- `booking.css`: responsive styles scoped to this feature.

Guest details come from the signed-in account and are read-only. Customers book
for themselves using the existing API rules. Optional arrival time is appended to
special requests. Address fields, identity-document upload, booking for another
person, reviews, and unsupported room amenities are not presented as working
features. Card details are collected by the hosted payment provider.

Review Booking checks the selected room against `GET /reservations/availability`.
Confirm Reservation posts only room ID, dates, adults, children, and requests to
the existing `POST /reservations`. The backend remains responsible for conflicts,
capacity, nightly-rate pricing, and pending status. No service fees or taxes are
added to the existing pricing model.

After creation, the URL includes `reservationId`. Reloads restore that reservation
through `GET /reservations/my`. Payment retries use the same reservation and the
existing checkout-reuse behavior, avoiding a second reservation after checkout
failure. Confirm Reservation and Continue to Payment open the customer route
`/booking/:roomId/payment?reservationId=...`. That page reviews the saved booking
before Pay Now calls the existing checkout endpoint and opens its hosted URL.
Payment methods come from the provider configuration.

Customer payment result pages return to their booking and retain the existing
verified payment confirmation and cancellation behavior. Pending booking reloads
verify the stored checkout with PayMongo through the sync endpoint. The booking
shows a confirmation panel when verified payment confirms the reservation and
offers Check Payment Status if verification is delayed. Admin/staff return paths
remain their reservation screen. No schema changes are required.

Verification uses intercepted API responses in a local browser so smoke tests
do not create real reservations or payments. Run `npm run lint` and `npm run build`
from the frontend directory.
