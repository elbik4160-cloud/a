import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "sales";
  status: "pending" | "approved" | "rejected";
  image?: string;
};

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  // If no profile exists yet (trigger might not have run), create a default one
  if (!profile) {
    return {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.user_metadata?.name || session.user.email!.split("@")[0],
      role: "sales",
      status: "approved",
    };
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    name: profile.name,
    role: profile.role,
    status: profile.status,
    image: profile.image,
  };
}
