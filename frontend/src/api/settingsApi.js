import apiClient from
  '../services/apiClient';

export async function getSettings() {
  const response =
    await apiClient.get(
      '/settings',
    );

  return response.data;
}

export async function updateSettings(
  payload,
) {
  const response =
    await apiClient.patch(
      '/settings',
      payload,
    );

  return response.data;
}