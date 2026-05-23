import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AdminState = {
  token: string | null;
  
  setToken: (token: string) => void;
  logout: () => void;
};

export const useAdminStore = create<AdminState>()(
  persist(
    set => ({
      token: null,
      
      setToken: (token): unknown => set({ token }),
      logout: (): unknown => set({ token: null })
    }),
    {
      name: 'admin-store'
    }
  )
);
