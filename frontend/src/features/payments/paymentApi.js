import apiClient from '../../services/apiClient';

export async function createCheckout(reservationId) {
  const response = await apiClient.post(
    `/payments/reservations/${reservationId}/checkout`,
  );

  return response.data;
}

export async function getPayments() {
  const response = await apiClient.get('/payments');

  return response.data;
}

export async function syncReservationPayment(reservationId, signal) {
  const response = await apiClient.post(
    `/payments/reservations/${encodeURIComponent(reservationId)}/sync`,
    undefined,
    { signal },
  );
  return response.data;
}

export async function getReservationPayments(reservationId) {
  const response = await apiClient.get(
    `/payments/reservations/${reservationId}`,
  );

  return response.data;
}

export async function cancelPendingCheckout(reservationId, signal) {
  const response = await apiClient.post(
    `/payments/reservations/${reservationId}/cancel-pending`,
    undefined,
    { signal },
  );

  return response.data;
}
