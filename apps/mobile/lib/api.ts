import AsyncStorage from "@react-native-async-storage/async-storage";

// API base URL - points to the Next.js web app
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (res.status === 401) {
    await AsyncStorage.removeItem("auth_token");
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  // Auth endpoints (match Better Auth API routes)
  auth: {
    signIn: (email: string, password: string) =>
      api.post<{ user: any }>("/api/auth/sign-in", { email, password }),
    signUp: (data: { name: string; email: string; password: string }) =>
      api.post<{ user: any }>("/api/auth/sign-up", data),
    me: () => api.get<any>("/api/auth/me"),
    signOut: () => api.post("/api/auth/sign-out"),
  },

  // Data endpoints
  leads: {
    list: (params?: Record<string, string>) => {
      const query = params ? new URLSearchParams(params).toString() : "";
      return api.get<any[]>(`/api/leads${query ? `?${query}` : ""}`);
    },
    get: (id: number) => api.get<any>(`/api/leads/${id}`),
    create: (data: any) => api.post<any>("/api/leads", data),
    update: (id: number, data: any) => api.put<any>(`/api/leads/${id}`, data),
    delete: (id: number) => api.delete(`/api/leads/${id}`),
  },

  clients: {
    list: () => api.get<any[]>("/api/clients"),
    get: (clientId: string) => api.get<any>(`/api/clients/${clientId}`),
    create: (data: any) => api.post<any>("/api/clients", data),
    locks: () => api.get<any[]>("/api/clients/locks"),
  },

  chat: {
    list: () => api.get<any[]>("/api/chat"),
    send: (text: string) => api.post<any>("/api/chat", { messageText: text }),
    delete: (id: number) => api.delete(`/api/chat/${id}`),
  },

  stats: {
    dashboard: () => api.get<any>("/api/stats/dashboard"),
  },

  realtime: {
    token: () => api.get<{ token: string }>("/api/realtime/token"),
  },
};
