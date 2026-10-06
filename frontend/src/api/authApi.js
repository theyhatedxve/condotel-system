import apiClient from '../services/apiClient';

export async function loginUser(credentials) {
  const response = await apiClient.post(
    '/auth/login',
    credentials,
  );

  return response.data;
}

export async function getCurrentUser() {
  const response = await apiClient.get(
    '/auth/me',
  );

  return response.data;
}

export async function updateMyProfile(
  payload,
) {
  const response =
    await apiClient.patch(
      '/auth/profile',
      payload,
    );

  return response.data;
}

export async function changeMyPassword(
  payload,
) {
  const response =
    await apiClient.post(
      '/auth/change-password',
      payload,
    );

  return response.data;
}