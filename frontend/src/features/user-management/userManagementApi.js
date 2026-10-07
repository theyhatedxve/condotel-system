import apiClient from '../../services/apiClient';

export async function getManagedUsers(params = {}) {
  const response = await apiClient.get('/admin/users', {
    params,
  });

  return response.data;
}

export async function getManagedUser(userId) {
  const response = await apiClient.get(`/admin/users/${userId}`);

  return response.data;
}

export async function updateManagedUser(userId, payload) {
  const response = await apiClient.patch(`/admin/users/${userId}`, payload);

  return response.data;
}

export async function resetManagedUserPassword(userId, newPassword) {
  const response = await apiClient.post(
    `/admin/users/${userId}/reset-password`,
    {
      newPassword,
    },
  );

  return response.data;
}
