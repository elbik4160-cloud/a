import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../lib/api";

export type UserRole = "admin" | "sales";
export type UserStatus = "pending" | "approved" | "rejected";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  image?: string;
}

interface AuthState {
  user: AppUser | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isHydrated: false,

  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),

  loadSession: async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        set({ isHydrated: true, isLoading: false, user: null, token: null });
        return;
      }

      set({ isLoading: true });
      const user = await api.auth.me();
      set({ user, token, isLoading: false, isHydrated: true });
    } catch (error) {
      console.error("Failed to load session:", error);
      await AsyncStorage.removeItem("auth_token");
      set({ user: null, token: null, isLoading: false, isHydrated: true });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = await api.auth.signIn(email, password);
      await AsyncStorage.setItem("auth_token", token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signUp: async (data) => {
    set({ isLoading: true });
    try {
      const { token, user } = await api.auth.signUp(data);
      await AsyncStorage.setItem("auth_token", token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      await api.auth.signOut();
    } catch {}
    await AsyncStorage.removeItem("auth_token");
    set({ user: null, token: null });
  },

  refresh: async () => {
    const token = get().token || await AsyncStorage.getItem("auth_token");
    if (!token) {
      set({ user: null, isLoading: false });
      return;
    }
    try {
      const user = await api.auth.me();
      set({ user, token, isLoading: false });
    } catch (error) {
      await AsyncStorage.removeItem("auth_token");
      set({ user: null, token: null, isLoading: false });
    }
  },
}));

// Call this in root layout
export async function hydrateAuth() {
  await useAuthStore.getState().loadSession();
}
