import api from '@/lib/axios';

export const usersApi = {
  list: () => api.get('/usuarios'),
  detail: (id) => api.get(`/usuarios/${id}`),
  create: (payload) => api.post('/usuarios', payload),
  update: (id, payload) => api.patch(`/usuarios/${id}`, payload),
  revealPassword: (id) => api.get(`/usuarios/${id}/password`),
  revealAllPasswords: () => api.post('/usuarios/reveal-all-passwords'),
  exportCredentials: () => api.post('/usuarios/export-credentials', {}, { responseType: 'blob' }),
  changePassword: (id, password) => api.post(`/usuarios/${id}/password`, { password }),
  activate: (id) => api.post(`/usuarios/${id}/activate`),
  deactivate: (id) => api.post(`/usuarios/${id}/deactivate`),
  delete: (id) => api.delete(`/usuarios/${id}`)
};
