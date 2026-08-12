import { create } from 'zustand';

export const useUiStore = create((set) => ({
  mobileMenuOpen: false,
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen })
}));
