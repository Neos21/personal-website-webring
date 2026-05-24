import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AdminState = {
  token: string | null;
  supportUserName: string | null;
  
  setToken: (token: string) => void;
  logout: () => void;
  setSupportUserName: (supportUserName: string) => void;
};

export const useAdminStore = create<AdminState>()(
  persist(
    set => ({
      token: null,
      supportUserName: null,
      
      setToken: (token): unknown => set({ token }),
      logout: (): unknown => set({ token: null }),
      setSupportUserName: (supportUserName): unknown => set({ supportUserName })
    }),
    {
      name: 'admin-store'
    }
  )
);
