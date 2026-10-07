import apiClient from '../../services/apiClient';

// Public endpoints only; management and authentication keep their existing flow.
export async function getPublicRooms(search, signal) {
  const response = await apiClient.get(
    search ? '/reservations/availability' : '/rooms',
    {
      signal,
      params: search
        ? {
            checkIn: search.checkIn,
            checkOut: search.checkOut,
            capacity: search.guests,
          }
        : undefined,
    },
  );
  return response.data;
}
