import apiClient from '../../services/apiClient';

// Request the management room list with its optional status filter.
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

// Submit the room form to create a new room record.
export async function createRoom(roomData) {
  const response = await apiClient.post('/rooms', roomData);

  return response.data;
}

// Submit editable room values for an existing room.
export async function updateRoom(id, roomData) {
  const response = await apiClient.patch(`/rooms/${id}`, roomData);

  return response.data;
}

// Request a room operational-status change.
export async function updateRoomStatus(id, status) {
  const response = await apiClient.patch(`/rooms/${id}/status`, {
    status,
  });

  return response.data;
}

// Request that an existing room be hidden from active room listings.
export async function deactivateRoom(id) {
  const response = await apiClient.patch(`/rooms/${id}/deactivate`);

  return response.data;
}

// Request that an inactive room be restored to active room listings.
export async function reactivateRoom(id) {
  const response = await apiClient.patch(`/rooms/${id}/reactivate`);

  return response.data;
}
