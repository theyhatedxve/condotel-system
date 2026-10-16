import apiClient from '../../services/apiClient';

// Request the dashboard summary allowed for the current account role.
export async function getDashboardReport() {
  const response = await apiClient.get('/reports/dashboard');

  return response.data;
}

// Request management report aggregates for the selected date range.
export async function getReportSummary({ from, to } = {}) {
  const response = await apiClient.get('/reports/summary', {
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
  });

  return response.data;
}
