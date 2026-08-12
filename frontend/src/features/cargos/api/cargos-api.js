import api from '@/lib/axios';

export const cargosApi = {
  visibles: () => api.get('/cargos/visibles')
};
