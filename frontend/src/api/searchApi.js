import apiClient from
  '../services/apiClient';

export async function searchGlobal(
  query,
) {
  const response =
    await apiClient.get(
      '/search',
      {
        params: {
          q: query,
        },
      },
    );

  return response.data;
}