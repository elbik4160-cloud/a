import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, getCurrentUser, supabase } from "../lib/supabase";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isHydrated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isHydrated: false,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  logout: async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("auth-user");
    set({ user: null });
  },
  refresh: async () => {
    const user = await getCurrentUser();
    set({ user, isLoading: false });
  },
}));

export async function hydrateAuth() {
  try {
    const user = await getCurrentUser();
    useAuthStore.getState().setUser(user);
    useAuthStore.setState({ isHydrated: true });
  } catch {
    useAuthStore.setState({ isHydrated: true, isLoading: false });
  }
}

supabase.auth.onAuthStateChange(async (event) => {
  if (event === "SIGNED_OUT") {
    useAuthStore.getState().setUser(null);
  } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    const user = await getCurrentUser();
    useAuthStore.getState().setUser(user);
  }
});
