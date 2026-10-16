import axios from 'axios';

import { getAccessToken } from '../features/auth/authStorage';

// Share the API base URL and JSON headers across all frontend feature requests.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',

  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the current bearer token immediately before each request is sent.
apiClient.interceptors.request.use(
  (config) => {
    // Read storage for each request so login/logout changes take effect without recreating the client.
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;
