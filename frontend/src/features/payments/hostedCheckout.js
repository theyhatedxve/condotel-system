import { createCheckout, syncReservationPayment } from './paymentApi';

// Keep the merchant page available when the provider's test page has no return link.
export async function openHostedCheckout(reservationId, { signal, onWaiting }) {
  // Open during the click event so browser popup blocking is detected up front.
  const paymentWindow = window.open(
    'about:blank',
    '_blank',
    'popup,width=1100,height=800',
  );
  if (!paymentWindow)
    throw new Error(
      'Allow the payment window in your browser, then try again.',
    );
  // Prevent the external page from navigating the merchant's opener window.
  paymentWindow.opener = null;
  try {
    const checkout = await createCheckout(reservationId);
    if (!checkout.checkoutUrl)
      throw new Error('Checkout is unavailable. Please try again.');
    if (signal.aborted) return null;
    paymentWindow.location.replace(checkout.checkoutUrl);
    onWaiting();
    // Bound polling while keeping the merchant page available for a safe return.
    const deadline = Date.now() + 15 * 60 * 1000;
    while (!signal.aborted && Date.now() < deadline) {
      let outcome;
      try {
        // Trust provider verification from the backend, never text on the popup.
        const verified = await syncReservationPayment(reservationId, signal);
        if (verified.payments.some((payment) => payment.status === 'PAID'))
          outcome = 'success';
        else if (
          ['failed', 'expired'].includes(verified.checkoutOutcome) ||
          ['FAILED', 'EXPIRED', 'CANCELLED'].includes(
            verified.payments[0]?.status,
          )
        )
          outcome = 'cancelled';
      } catch {
        // Network/provider errors do not prove failure or payment.
      }
      if (signal.aborted) return null;
      // Closing the window returns through verification; it does not prove failure.
      if (outcome || paymentWindow.closed) {
        paymentWindow.close();
        return outcome || 'cancelled';
      }
      await new Promise((resolve) => {
        // Clear the polling delay and its abort listener before resuming or stopping the
        // checkout loop.
        const finish = () => {
          clearTimeout(timer);
          signal.removeEventListener('abort', finish);
          resolve();
        };
        const timer = setTimeout(finish, 3000);
        signal.addEventListener('abort', finish, { once: true });
      });
    }
    return null;
  } catch (error) {
    paymentWindow?.close();
    throw error;
  } finally {
    if (signal.aborted) paymentWindow?.close();
  }
}
