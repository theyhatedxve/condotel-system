import apiClient from '../../services/apiClient';

// Request the recorded payment transactions for management display.
export async function getTransactions() {
  const response = await apiClient.get('/transactions');

  return response.data;
}
