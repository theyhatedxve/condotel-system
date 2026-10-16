import apiClient from '../../services/apiClient';

// Request customer accounts with the optional search, status, and page parameters.
export async function getGuests(search, status, page) {
  const response = await apiClient.get('/guests', {
    params: {
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(page ? { page } : {}),
    },
  });

  return response.data;
}

// Submit validated guest form values to create a customer account.
export async function createGuest(guestData) {
  const response = await apiClient.post('/guests', guestData);

  return response.data;
}

// Submit editable guest/profile values for the selected customer.
export async function updateGuest(id, guestData) {
  const response = await apiClient.patch(`/guests/${id}`, guestData);

  return response.data;
}
