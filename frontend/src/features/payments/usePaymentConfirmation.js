import { useEffect, useState } from 'react';
import { cancelPendingCheckout, syncReservationPayment } from './paymentApi';

const POLL_INTERVAL = 2000;
const VERIFICATION_WINDOW = 60000;

// Synchronize provider-backed payment state and verify cancellation before showing a
// return result.
export default function usePaymentConfirmation(
  reservationId,
  cancelled,
  userId,
) {
  // Track local state and read any session or route values needed by this component.
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([reservationId, cancelled, userId, attempt]);
  const [result, setResult] = useState({ key: null });

  // Verify the return state with the server and clear polling/requests when the
  // reservation or page changes.
  useEffect(() => {
    if (!reservationId) return;
    const controller = new AbortController();
    let timeout;
    const deadline = Date.now() + VERIFICATION_WINDOW;

    // Synchronize payment, verify any requested cancellation, and poll briefly while
    // success is still pending.
    async function verify() {
      try {
        let verified = await syncReservationPayment(
          reservationId,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        let paid = verified.payments.find(
          (payment) => payment.status === 'PAID',
        );
        // A cancellation URL can be revisited after payment. Verify before expiring a session.
        if (
          cancelled &&
          !paid &&
          verified.payments.some((payment) => payment.status === 'PENDING')
        ) {
          await cancelPendingCheckout(reservationId, controller.signal);
          verified = await syncReservationPayment(
            reservationId,
            controller.signal,
          );
          paid = verified.payments.find((payment) => payment.status === 'PAID');
        }
        if (controller.signal.aborted) return;
        const latest = verified.payments[0];
        const phase = paid
          ? 'paid'
          : cancelled
            ? 'cancelled'
            : latest &&
                ['FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED'].includes(
                  latest.status,
                )
              ? latest.status.toLowerCase()
              : Date.now() >= deadline
                ? 'pending'
                : 'checking';
        setResult({
          key,
          phase,
          reservation: verified.reservation,
          payment: paid || latest,
        });
        if (phase === 'checking') timeout = setTimeout(verify, POLL_INTERVAL);
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            key,
            phase: 'error',
            error:
              error.response?.status === 403 || error.response?.status === 404
                ? 'This reservation is unavailable for your account.'
                : 'We could not verify your payment right now. Please check again.',
          });
      }
    }
    verify();
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [reservationId, cancelled, key]);

  return {
    ...(result.key === key
      ? result
      : { phase: reservationId ? 'checking' : 'missing' }),
    retry: () => setAttempt((current) => current + 1),
  };
}
