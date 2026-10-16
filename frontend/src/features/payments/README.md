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

Payment opens in a separate window, keeping the merchant page available when
PayMongo's failed test-source screen has no return link. The merchant page checks
verified status every three seconds for up to 15 minutes. Verified payments open
confirmation. Failed attempts, expired checkouts and a closed payment window open
the authenticated cancellation return, which verifies payment before expiring the
unpaid checkout. Customers then return automatically to their saved checkout;
ADMIN/STAFF return to `/admin/reservations`. The reservation remains pending.

Allow the payment window when prompted by the browser; no checkout is created if
the window is blocked. If provider status is delayed, use Return to Checkout or
Return to Reservations on the merchant page. Network/provider errors never prove
that money was paid or that a payment failed. Already-expired sessions skip a
duplicate expiration request.

Run payment-window tests from frontend:
`node --experimental-vm-modules --test test/hosted-checkout.test.cjs`.
