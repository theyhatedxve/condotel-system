import apiClient from '../../services/apiClient';

export async function getRooms(status) {
  const response = await apiClient.get('/rooms/management', {
    params: status
      ? {
          status,
        }
      : {},
  });

  return response.data;
}

export async function createRoom(roomData) {
  const response = await apiClient.post('/rooms', roomData);

  return response.data;
}

export async function updateRoom(id, roomData) {
  const response = await apiClient.patch(`/rooms/${id}`, roomData);

  return response.data;
}

export async function updateRoomStatus(id, status) {
  const response = await apiClient.patch(`/rooms/${id}/status`, {
    status,
  });

  return response.data;
}

export async function deactivateRoom(id) {
  const response = await apiClient.patch(`/rooms/${id}/deactivate`);

  return response.data;
}

export async function reactivateRoom(id) {
  const response = await apiClient.patch(`/rooms/${id}/reactivate`);

  return response.data;
}
