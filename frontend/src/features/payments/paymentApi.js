import apiClient from '../../services/apiClient';

// Request a hosted checkout for an existing reservation; the backend controls its amount
// and reuse.
export async function createCheckout(reservationId) {
  const response = await apiClient.post(
    `/payments/reservations/${reservationId}/checkout`,
  );

  return response.data;
}

// Request payment records for the management payment list.
export async function getPayments() {
  const response = await apiClient.get('/payments');

  return response.data;
}

// Request server/provider verification for the reservation, with optional request
// cancellation.
export async function syncReservationPayment(reservationId, signal) {
  const response = await apiClient.post(
    `/payments/reservations/${encodeURIComponent(reservationId)}/sync`,
    undefined,
    { signal },
  );
  return response.data;
}

// Request the payment attempts belonging to an authorized reservation.
export async function getReservationPayments(reservationId) {
  const response = await apiClient.get(
    `/payments/reservations/${reservationId}`,
  );

  return response.data;
}

// Ask the backend to verify and cancel unpaid checkout attempts for this reservation.
export async function cancelPendingCheckout(reservationId, signal) {
  const response = await apiClient.post(
    `/payments/reservations/${reservationId}/cancel-pending`,
    undefined,
    { signal },
  );

  return response.data;
}
