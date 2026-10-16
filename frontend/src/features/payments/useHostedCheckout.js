import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { openHostedCheckout } from './hostedCheckout';

export default function useHostedCheckout() {
  const navigate = useNavigate();
  const operation = useRef(null);
  const [waiting, setWaiting] = useState(null);
  useEffect(() => () => operation.current?.abort(), []);

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
