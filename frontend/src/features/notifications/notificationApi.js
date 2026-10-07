import apiClient from '../../services/apiClient';

export async function getNotifications(take = 10) {
  const response = await apiClient.get('/notifications', {
    params: {
      take,
    },
  });

  return response.data;
}

export async function getUnreadNotificationCount() {
  const response = await apiClient.get('/notifications/unread-count');

  return response.data;
}

export async function markNotificationRead(notificationId) {
  const response = await apiClient.patch(
    `/notifications/${notificationId}/read`,
  );

  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await apiClient.patch('/notifications/read-all');

  return response.data;
}
