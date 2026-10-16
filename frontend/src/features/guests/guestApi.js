import apiClient from '../../services/apiClient';

export async function getGuests(search, status, page) {
  const response = await apiClient.get('/guests', {
    params: { ...(search ? { search } : {}), ...(status ? { status } : {}), ...(page ? {page}: {}) },
  });

  return response.data;
}

export async function createGuest(guestData) {
  const response = await apiClient.post('/guests', guestData);

  return response.data;
}

export async function updateGuest(id, guestData) {
  const response = await apiClient.patch(`/guests/${id}`, guestData);

  return response.data;
}
