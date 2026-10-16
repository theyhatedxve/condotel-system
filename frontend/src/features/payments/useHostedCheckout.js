import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { openHostedCheckout } from './hostedCheckout';

// Manage one payment-window operation, its cleanup, and navigation to the verified
// return flow.
export default function useHostedCheckout() {
  // Track local state and read any session or route values needed by this component.
  const navigate = useNavigate();
  const operation = useRef(null);
  const [waiting, setWaiting] = useState(null);
  // Abort the active payment-window operation when its merchant page unmounts.
  useEffect(() => () => operation.current?.abort(), []);

  // Start one hosted checkout operation and navigate only after its return outcome is
  // known.
  async function start(reservationId) {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    try {
      const outcome = await openHostedCheckout(reservationId, {
        signal: controller.signal,
        onWaiting: () => setWaiting(reservationId),
      });
      if (outcome && !controller.signal.aborted)
        navigate(
          `/payment/${outcome}?${new URLSearchParams({ reservationId })}`,
          { replace: true },
        );
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setWaiting(null);
      }
    }
  }
  // Close the active payment operation and return through the cancellation-verification
  // page.
  function returnToSite() {
    if (!waiting) return;
    const reservationId = waiting;
    operation.current?.abort();
    navigate(`/payment/cancelled?${new URLSearchParams({ reservationId })}`, {
      replace: true,
    });
  }
  return { start, waiting, returnToSite };
}
