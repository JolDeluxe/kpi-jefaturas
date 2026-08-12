import axios from 'axios';

const baseConfig = {
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
};

const api = axios.create(baseConfig);
const refreshClient = axios.create(baseConfig);
let refreshPromise = null;
let unauthorizedHandler = () => {};

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthAttempt) {
      originalRequest._retry = true;
      try {
        refreshPromise ||= refreshClient.post('/auth/refresh');
        await refreshPromise;
        return api(originalRequest);
      } catch (refreshError) {
        unauthorizedHandler();
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
