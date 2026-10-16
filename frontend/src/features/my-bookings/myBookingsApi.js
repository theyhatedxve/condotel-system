import apiClient from '../../services/apiClient';

// The authenticated backend selects the customer's own records.
export async function getMyBookings(signal) {
  const response = await apiClient.get('/reservations/my', { signal });
  return response.data;
}
