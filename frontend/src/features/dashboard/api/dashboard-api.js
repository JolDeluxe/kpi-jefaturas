import api from '@/lib/axios';

export const dashboardApi = {
  resumen: ({ cargoId, anio, periodo }) => api.get('/dashboard/resumen', { params: { cargoId, anio, periodo } })
};
