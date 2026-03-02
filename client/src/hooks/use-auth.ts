import { useQuery, useQueryClient } from "@tanstack/react-query";

const buildUrl = (path: string) => {
  const base = (import.meta.env.VITE_API_URL ?? "").toString().replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
};

export function useAuthUser() {
  return useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const url = buildUrl("/api/auth/user");
      const res = await fetch(url, { credentials: "include" });

      // If not logged in, backend returns { user: null } with 200 (your server route does that)
      if (!res.ok) throw new Error("Failed to fetch auth user");

      return res.json() as Promise<{ user: any | null }>;
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return async () => {
    // If you have a logout route later, call it here.
    // For now just clear cached user.
    qc.setQueryData(["/api/auth/user"], { user: null });
  };
}