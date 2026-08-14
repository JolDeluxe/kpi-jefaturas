import api from '@/lib/axios';

export const kpiSyncApi = {
  run: () => api.post('/kpi-sync/run')
};
