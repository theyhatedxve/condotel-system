import apiClient from
  '../services/apiClient';

export async function getDashboardReport() {
  const response =
    await apiClient.get(
      '/reports/dashboard',
    );

  return response.data;
}

export async function getReportSummary(
  {
    from,
    to,
  } = {},
) {
  const response =
    await apiClient.get(
      '/reports/summary',
      {
        params: {
          ...(from
            ? {
                from,
              }
            : {}),

          ...(to
            ? {
                to,
              }
            : {}),
        },
      },
    );

  return response.data;
}