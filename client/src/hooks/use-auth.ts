import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const buildUrl = (path: string) => {
  const base = (import.meta.env.VITE_API_URL ?? "").toString().replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
};

export type User = {
  id: string | number;
  email?: string | null;
  name?: string | null;
} | null;

export function useUser() {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async (): Promise<User> => {
      const res = await fetch(buildUrl("/api/auth/user"), { credentials: "include" });

      if (res.status === 401 || res.status === 403) return null;

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Failed to load user (${res.status}) ${text}`);
      }

      const data = await res.json();
      return data ?? null;
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(buildUrl("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Logout failed (${res.status}) ${text}`);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const res = await fetch(buildUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Login failed (${res.status}) ${text}`);
      }

      return res.json().catch(() => ({}));
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });
}

// ✅ THIS IS WHAT YOUR BUILD NEEDS:
export function useAuth() {
  const userQuery = useUser();
  const login = useLogin();
  const logout = useLogout();

  return {
    user: userQuery.data ?? null,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    refetchUser: userQuery.refetch,
    login,
    logout,
  };
}