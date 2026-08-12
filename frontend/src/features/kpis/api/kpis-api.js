import api from '@/lib/axios';

export const kpisApi = {
  list: ({ cargoId, anio, periodo }) => api.get('/kpis', { params: { cargoId, anio, periodo } }),
  periodos: ({ cargoId, anio }) => api.get('/kpis/periodos', { params: { cargoId, anio } }),
  anios: ({ cargoId }) => api.get('/kpis/anios', { params: { cargoId } })
};
