import apiClient from '../../services/apiClient';

// Request notifications belonging to the current account.
export async function getNotifications(take = 10) {
  const response = await apiClient.get('/notifications', {
    params: {
      take,
    },
  });

  return response.data;
}

// Request the unread-notification count for the current account.
export async function getUnreadNotificationCount() {
  const response = await apiClient.get('/notifications/unread-count');

  return response.data;
}

// Mark the selected owned notification as read.
export async function markNotificationRead(notificationId) {
  const response = await apiClient.patch(
    `/notifications/${notificationId}/read`,
  );

  return response.data;
}

// Mark all notifications belonging to the current account as read.
export async function markAllNotificationsRead() {
  const response = await apiClient.patch('/notifications/read-all');

  return response.data;
}
