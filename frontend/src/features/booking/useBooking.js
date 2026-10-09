import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { requestMessage } from './bookingUtils';
import { syncReservationPayment } from '../payments/paymentApi';

export default function useBooking(roomId, reservationId, userId) {
  const key = JSON.stringify([roomId, reservationId, userId]);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null });
  const requestKey = `${key}:${attempt}`;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        // Always reload the room rate and, when resuming, the customer's own reservation.
        const [roomResponse, reservationsResponse] = await Promise.all([
          apiClient.get(`/rooms/${encodeURIComponent(roomId)}`, {
            signal: controller.signal,
          }),
          reservationId
            ? apiClient.get('/reservations/my', { signal: controller.signal })
            : Promise.resolve(null),
        ]);
        let reservation = reservationId
          ? reservationsResponse.data.find(
              (item) => item.id === reservationId && item.roomId === roomId,
            )
          : null;
        if (reservationId && !reservation)
          throw new Error(
            'Reservation not found. Please return to the room browser.',
          );
        let paymentError = '';
        if (reservation?.status === 'PENDING') {
          try {
            const verified = await syncReservationPayment(
              reservation.id,
              controller.signal,
            );
            reservation = {
              ...reservation,
              ...verified.reservation,
              payments: verified.payments,
            };
          } catch {
            paymentError =
              'We could not verify payment yet. If you have already paid, check payment status before continuing.';
          }
        }
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            room: roomResponse.data,
            reservation,
            error: '',
            paymentError,
          });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            key: requestKey,
            error: requestMessage(
              error,
              error.message || 'Unable to load this booking.',
            ),
          });
      }
    }
    load();
    return () => controller.abort();
  }, [roomId, reservationId, requestKey]);

  return {
    ...result,
    loading: result.key !== requestKey,
    retry: () => setAttempt((current) => current + 1),
  };
}
