import api from '@/lib/axios';

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  refresh: () => api.post('/auth/refresh'),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  me: () => api.get('/auth/me')
};
