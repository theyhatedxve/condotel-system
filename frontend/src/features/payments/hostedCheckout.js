import { createCheckout, syncReservationPayment } from './paymentApi';

// Keep the merchant page available when the provider's test page has no return link.
export async function openHostedCheckout(reservationId, { signal, onWaiting }) {
  const paymentWindow = window.open(
    'about:blank',
    '_blank',
    'popup,width=1100,height=800',
  );
  if (!paymentWindow)
    throw new Error(
      'Allow the payment window in your browser, then try again.',
    );
  paymentWindow.opener = null;
  try {
    const checkout = await createCheckout(reservationId);
    if (!checkout.checkoutUrl)
      throw new Error('Checkout is unavailable. Please try again.');
    if (signal.aborted) return null;
    paymentWindow.location.replace(checkout.checkoutUrl);
    onWaiting();
    const deadline = Date.now() + 15 * 60 * 1000;
    while (!signal.aborted && Date.now() < deadline) {
      let outcome;
      try {
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
      if (outcome || paymentWindow.closed) {
        paymentWindow.close();
        return outcome || 'cancelled';
      }
      await new Promise((resolve) => {
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
