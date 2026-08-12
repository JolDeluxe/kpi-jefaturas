import api from '@/lib/axios';

export const usersApi = {
  list: () => api.get('/usuarios')
};
