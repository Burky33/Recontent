import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertWorkspace, GenerateRequest } from "@shared/schema";
import { supabase } from "@/lib/supabase";

/**
 * Build a full API URL:
 * - Uses VITE_API_URL if provided (production)
 * - Falls back to relative paths (local dev proxy)
 * - Replaces route params like :id
 */
const buildUrl = (path: string, params?: Record<string, string | number>) => {
  const base = (import.meta.env.VITE_API_URL ?? "").toString().replace(/\/+$/, "");

  let p = path.startsWith("/") ? path : `/${path}`;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      p = p.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  return base ? `${base}${p}` : p;
};

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || localStorage.getItem("sb_token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseErrorResponse(res: Response, fallbackMessage: string) {
  const errorData = await res.json().catch(() => ({}));

  const message =
    errorData?.message ||
    errorData?.error ||
    fallbackMessage;

  const code =
    errorData?.code ||
    errorData?.errorCode ||
    undefined;

  return new ApiError(message, res.status, code, errorData);
}

export function useWorkspaces() {
  return useQuery({
    queryKey: [api.workspaces.list.path],
    queryFn: async () => {
      const url = buildUrl(api.workspaces.list.path);
      const res = await fetch(url, {
        credentials: "include",
        headers: await authHeaders(),
      });

      if (!res.ok) {
        throw await parseErrorResponse(res, "Failed to fetch workspaces");
      }

      return api.workspaces.list.responses[200].parse(await res.json());
    },
  });
}

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: [api.workspaces.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workspaces.get.path, { id });
      const res = await fetch(url, {
        credentials: "include",
        headers: await authHeaders(),
      });

      if (!res.ok) {
        throw await parseErrorResponse(res, "Failed to fetch workspace");
      }

      return api.workspaces.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useUsage() {
  return useQuery({
    queryKey: [api.usage.get.path],
    queryFn: async () => {
      const url = buildUrl(api.usage.get.path);
      const res = await fetch(url, {
        credentials: "include",
        headers: await authHeaders(),
      });

      if (!res.ok) {
        throw await parseErrorResponse(res, "Failed to fetch usage");
      }

      return api.usage.get.responses[200].parse(await res.json());
    },
    refetchOnWindowFocus: true,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertWorkspace) => {
      const validated = api.workspaces.create.input.parse(data);

      const url = buildUrl(api.workspaces.create.path);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...await authHeaders(),
        },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        throw await parseErrorResponse(res, "Failed to create workspace");
      }

      return api.workspaces.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.usage.get.path] });

      toast({
        title: "Success",
        description: "Workspace created successfully",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error Creating Workspace",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
        duration: Infinity,
      });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertWorkspace> }) => {
      const url = buildUrl(api.workspaces.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...await authHeaders(),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        throw await parseErrorResponse(res, "Failed to update workspace");
      }

      return api.workspaces.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.workspaces.get.path, data.id] });

      toast({
        title: "Success",
        description: "Workspace updated",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workspaces.delete.path, { id });
      const res = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: await authHeaders(),
      });

      if (!res.ok) {
        throw await parseErrorResponse(res, "Failed to delete workspace");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.usage.get.path] });

      toast({
        title: "Deleted",
        description: "Workspace removed",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message ?? "Unknown error",
        variant: "destructive",
      });
    },
  });
}

export function useGenerateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GenerateRequest }) => {
      const url = buildUrl(api.workspaces.generate.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...await authHeaders(),
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        throw await parseErrorResponse(res, "Failed to generate content");
      }

      return api.workspaces.generate.responses[200].parse(await res.json());
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [api.content.list.path, variables.id],
      });

      await queryClient.invalidateQueries({
        queryKey: [api.usage.get.path],
      });
    },
  });
}

export function useWorkspaceContent(workspaceId: number) {
  return useQuery({
    queryKey: [api.content.list.path, workspaceId],
    queryFn: async () => {
      const url = buildUrl(api.content.list.path, { id: workspaceId });
      const res = await fetch(url, {
        credentials: "include",
        headers: await authHeaders(),
      });

      if (!res.ok) {
        throw await parseErrorResponse(res, "Failed to fetch content history");
      }

      return api.content.list.responses[200].parse(await res.json());
    },
    enabled: !!workspaceId,
  });
}