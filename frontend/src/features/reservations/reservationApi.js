import apiClient from '../../services/apiClient';

// Request reservation records with optional status filtering and pagination.
export async function getReservations(status, page) {
  const response = await apiClient.get('/reservations', {
    params: status
      ? {
          status,
          page,
        }
      : page
        ? { page }
        : {},
  });

  return response.data;
}

// Request rooms available for the selected dates and required capacity.
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

// Submit stay/guest values while leaving pricing and final availability checks to the
// backend.
export async function createReservation(reservationData) {
  const response = await apiClient.post('/reservations', reservationData);

  return response.data;
}

// Submit the requested operational reservation transition to the backend.
export async function updateReservationStatus(id, status) {
  const response = await apiClient.patch(`/reservations/${id}/status`, {
    status,
  });

  return response.data;
}
