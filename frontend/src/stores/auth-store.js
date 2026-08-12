import { create } from 'zustand';
import api, { setUnauthorizedHandler } from '@/lib/axios';

export const useAuthStore = create((set, get) => {
  const clearSession = () => {
    set({ user: null, isAuthenticated: false, loading: false });
    if (window.location.pathname !== '/login') window.location.assign('/login');
  };

  setUnauthorizedHandler(clearSession);

  return {
    user: null,
    loading: true,
    isAuthenticated: false,
    setUser: (user) => set({ user, isAuthenticated: Boolean(user), loading: false }),
    hydrate: async () => {
      try {
        const { user } = await api.get('/auth/me');
        set({ user, isAuthenticated: true, loading: false });
      } catch {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    },
    login: async (email, password) => {
      const { user } = await api.post('/auth/login', { email, password });
      set({ user, isAuthenticated: true, loading: false });
      return user;
    },
    logout: async () => {
      try {
        await api.post('/auth/logout');
      } finally {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    },
    logoutAll: async () => {
      try {
        await api.post('/auth/logout-all');
      } finally {
        set({ user: null, isAuthenticated: false, loading: false });
      }
    },
    hasRole: (...roles) => Boolean(get().user && roles.includes(get().user.role))
  };
});
