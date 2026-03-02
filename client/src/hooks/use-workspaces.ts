import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, errorSchemas } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertWorkspace, GenerateRequest } from "@shared/schema";
import { z } from "zod";

export function useWorkspaces() {
  return useQuery({
    queryKey: [api.workspaces.list.path],
    queryFn: async () => {
      const res = await fetch(api.workspaces.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      return api.workspaces.list.responses[200].parse(await res.json());
    },
  });
}

export function useWorkspace(id: number) {
  return useQuery({
    queryKey: [api.workspaces.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.workspaces.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch workspace");
      return api.workspaces.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertWorkspace) => {
      const validated = api.workspaces.create.input.parse(data);
      const res = await fetch(api.workspaces.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || "Failed to create workspace";
        const detailedError = errorData.details ? ` (${errorData.details})` : "";
        throw new Error(`${errorMessage}${detailedError}`);
      }
      return api.workspaces.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
      toast({ title: "Success", description: "Workspace created successfully" });
    },
    onError: (err) => {
      toast({ 
        title: "Error Creating Workspace", 
        description: err.message, 
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update workspace");
      return api.workspaces.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.workspaces.get.path, data.id] });
      toast({ title: "Success", description: "Workspace updated" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.workspaces.delete.path, { id });
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete workspace");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.workspaces.list.path] });
      toast({ title: "Deleted", description: "Workspace removed" });
    },
  });
}

export function useGenerateContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: GenerateRequest }) => {
      const url = buildUrl(api.workspaces.generate.path, { id });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate content");
      }
      return api.workspaces.generate.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.content.list.path.replace(":id", String(variables.id))] });
      toast({ title: "Magic happened!", description: "Content generated successfully" });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });
}

export function useWorkspaceContent(workspaceId: number) {
  return useQuery({
    queryKey: [api.content.list.path.replace(":id", String(workspaceId))],
    queryFn: async () => {
      const url = buildUrl(api.content.list.path, { id: workspaceId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch content history");
      return api.content.list.responses[200].parse(await res.json());
    },
    enabled: !!workspaceId,
  });
}
