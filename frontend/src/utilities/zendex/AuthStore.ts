import { create } from 'zustand'

interface AuthState {
  token: string;
  role: string;
  userMail: string;
  updateToken: (token: string, role: string, userMail: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: "false",
  role: "",
  userMail: "",
  updateToken: (token, role, userMail) => set({ token, role, userMail }),
}));