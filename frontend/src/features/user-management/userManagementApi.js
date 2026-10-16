import apiClient from '../../services/apiClient';

// Request account totals independently of the current user-list filters.
export async function getManagedUserSummary() {
  return (await apiClient.get('/admin/users/summary')).data;
}

// Request managed accounts with optional search, role/status filters, and pagination.
export async function getManagedUsers(params = {}) {
  const response = await apiClient.get('/admin/users', {
    params,
  });

  return response.data;
}

// Request public information for one managed account.
export async function getManagedUser(userId) {
  const response = await apiClient.get(`/admin/users/${userId}`);

  return response.data;
}

// Submit allowed account changes for administrator validation.
export async function updateManagedUser(userId, payload) {
  const response = await apiClient.patch(`/admin/users/${userId}`, payload);

  return response.data;
}

// Request a temporary password reset for the selected managed account.
export async function resetManagedUserPassword(userId, newPassword) {
  const response = await apiClient.post(
    `/admin/users/${userId}/reset-password`,
    {
      newPassword,
    },
  );

  return response.data;
}
