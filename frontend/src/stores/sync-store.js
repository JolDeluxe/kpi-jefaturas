import { create } from 'zustand';

export const useSyncStore = create((set) => ({
  latestImport: null,
  setLatestImport: (latestImport) => set({ latestImport })
}));
