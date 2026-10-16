import apiClient from '../../services/apiClient';

// Submit the management search text to the authorized global-search endpoint.
export async function searchGlobal(query) {
  const response = await apiClient.get('/search', {
    params: {
      q: query,
    },
  });

  return response.data;
}
