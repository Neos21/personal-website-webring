import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserState = {
  name: string | null;
  
  setName: (name: string) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      name: null,
      
      setName: (name): unknown => set({ name })
    }),
    {
      name: 'user-store'
    }
  )
);
