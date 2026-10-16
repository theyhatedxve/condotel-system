import apiClient from '../../services/apiClient';

// Submit the login identifier and password to the authentication API.
export async function loginUser(credentials) {
  const response = await apiClient.post('/auth/login', credentials);

  return response.data;
}

// Request the account associated with the stored access token.
export async function getCurrentUser() {
  const response = await apiClient.get('/auth/me');

  return response.data;
}

// Submit editable profile values for the signed-in account.
export async function updateMyProfile(payload) {
  const response = await apiClient.patch('/auth/profile', payload);

  return response.data;
}

// Submit the current/new password pair for the signed-in account.
export async function changeMyPassword(payload) {
  const response = await apiClient.post('/auth/change-password', payload);

  return response.data;
}
