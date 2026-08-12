import api from '@/lib/axios';

export const importacionesApi = {
  list: () => api.get('/importaciones'),
  status: () => api.get('/importaciones/status')
};
