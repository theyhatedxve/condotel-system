import apiClient from '../../services/apiClient';

export async function getReservations(status) {
  const response = await apiClient.get('/reservations', {
    params: status
      ? {
          status,
        }
      : {},
  });

  return response.data;
}

export async function getAvailableRooms({ checkIn, checkOut, capacity }) {
  const response = await apiClient.get('/reservations/availability', {
    params: {
      checkIn,
      checkOut,
      capacity,
    },
  });

  return response.data;
}

export async function createReservation(reservationData) {
  const response = await apiClient.post('/reservations', reservationData);

  return response.data;
}

export async function updateReservationStatus(id, status) {
  const response = await apiClient.patch(`/reservations/${id}/status`, {
    status,
  });

  return response.data;
}
