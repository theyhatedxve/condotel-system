import apiClient from '../../services/apiClient';

// Request the saved property-settings record.
export async function getSettings() {
  const response = await apiClient.get('/settings');

  return response.data;
}

// Submit editable property settings to the backend.
export async function updateSettings(payload) {
  const response = await apiClient.patch('/settings', payload);

  return response.data;
}
