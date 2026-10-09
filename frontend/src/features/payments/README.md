# Payment return and confirmation

`CheckoutPage.jsx` is the customer payment review page at
`/booking/:roomId/payment?reservationId=...`. It restores the customer's saved
reservation through the shared booking loader and checks payment status before
offering Pay Now. The room, stay, and total use existing server data. It never
creates a reservation. Pay Now uses the existing checkout endpoint; retries use
the same reservation and the server's checkout reuse behavior. Confirmed or paid
bookings do not offer another payment. Failed verification requires a status
retry before payment can continue.

`BookingShell` and `BookingSteps` keep the booking/payment navigation consistent.
`BookingSummary` shares the real room and pricing display. `checkout.css` scopes
the responsive payment styles. Card entry and method selection stay on PayMongo;
unsupported promotions, additional fees, and offline payment methods are omitted.

`/payment/success` and `/payment/cancelled` are authenticated return URLs. Their
URL names never determine whether money was paid. `usePaymentConfirmation` calls
the owned-reservation sync endpoint and displays the server's verified status.
Pending success returns are checked every two seconds for up to one minute;
errors and delayed verification offer a manual Check Payment Status action.

The backend sync endpoint retrieves the stored checkout session directly from
PayMongo when its local payment is pending. It shares amount/currency validation
and atomic payment/transaction/reservation updates with the signed webhook.
Conditional payment writes prevent duplicate transactions when sync and webhook
arrive together. Other customers cannot synchronize or read this reservation.

A verified paid result displays the reference, paid amount, and reservation
status. Customer View Booking returns to the confirmation step. A cancellation
return verifies payment before requesting checkout cancellation, so revisiting
an old cancellation URL does not cancel a payment already recorded as paid.

If the return requires a new login, ProtectedRoute retains only the internal
payment-return destination; LoginPage resumes it after authentication. Normal
role-based login destinations remain unchanged.
