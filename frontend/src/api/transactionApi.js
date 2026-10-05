import apiClient from
  '../services/apiClient';

export async function getTransactions() {
  const response =
    await apiClient.get(
      '/transactions',
    );

  return response.data;
}