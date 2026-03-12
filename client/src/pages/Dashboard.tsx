import { useWorkspaces } from "@/hooks/use-workspaces";
import Layout from "@/components/Layout";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Plus, Users, ArrowRight, Loader2, Search, FolderKanban, Sparkles, Gauge, CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "No activity yet";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "No activity yet";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getWorkspaceName(workspace: any) {
  return workspace.clientName ?? workspace.client_name ?? workspace.name ?? "Untitled Workspace";
}

function getWorkspaceDescription(workspace: any) {
  return workspace.brandDescription ?? workspace.brand_description ?? "No description provided.";
}

function getWorkspaceStyle(workspace: any) {
  return workspace.style ?? "Not set";
}

function getWorkspaceBoldness(workspace: any) {
  return workspace.boldness ?? workspace.brightness ?? workspace.toneStrength ?? "Not set";
}

function getWorkspaceDate(workspace: any) {
  return (
    workspace.lastGenerationAt ??
    workspace.last_generation_at ??
    workspace.updatedAt ??
    workspace.updated_at ??
    workspace.createdAt ??
    workspace.created_at ??
    null
  );
}

export default function Dashboard() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load usage");
        return res.json();
      })
      .then((data) => setUsage(data))
      .catch(() => {});
  }, []);

  const filteredWorkspaces = useMemo(() => {
    const query = (search ?? "").toLowerCase().trim();

    if (!query) return workspaces ?? [];

    return (workspaces ?? []).filter((workspace: any) => {
      const name = getWorkspaceName(workspace).toLowerCase();
      const style = String(getWorkspaceStyle(workspace)).toLowerCase();
      const description = String(getWorkspaceDescription(workspace)).toLowerCase();

      return (
        name.includes(query) ||
        style.includes(query) ||
        description.includes(query)
      );
    });
  }, [workspaces, search]);

  const generationsUsed = usage?.generationsUsed ?? 0;
  const generationsLimit = usage?.generationsLimit ?? 0;
  const workspacesUsed = usage?.workspacesUsed ?? 0;
  const workspacesLimit = usage?.workspacesLimit ?? 0;

  const generationPercent =
    generationsLimit > 0 ? Math.min((generationsUsed / generationsLimit) * 100, 100) : 0;

  const workspacePercent =
    workspacesLimit > 0 ? Math.min((workspacesUsed / workspacesLimit) * 100, 100) : 0;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workspaces</h1>
            <p className="mt-2 text-slate-500">
              Manage your clients, brand voices, and content generation activity.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </div>

        {usage && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-slate-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Current plan</p>
                    <p className="mt-1 text-2xl font-semibold capitalize text-slate-900">
                      {usage.planId}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Generations this month</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {generationsUsed} / {generationsLimit}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <Gauge className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${generationPercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">Workspace usage</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {workspacesUsed} / {workspacesLimit}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                    <FolderKanban className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${workspacePercent}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by client name, style, or description..."
            className="h-12 border-slate-200 bg-white pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>

            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              {search ? "No matching workspaces" : "No workspaces yet"}
            </h3>

            <p className="mx-auto mb-6 max-w-md text-slate-500">
              {search
                ? "Try a different search term, or create a new workspace for another client."
                : "Create your first workspace to define a client voice, save transcripts, and generate platform-ready content."}
            </p>

            <Button onClick={() => setIsCreateOpen(true)} variant="outline">
              Create Workspace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredWorkspaces.map((workspace: any) => {
              const workspaceName = getWorkspaceName(workspace);
              const workspaceDescription = getWorkspaceDescription(workspace);
              const workspaceStyle = getWorkspaceStyle(workspace);
              const workspaceBoldness = getWorkspaceBoldness(workspace);
              const workspaceDate = formatDate(getWorkspaceDate(workspace));

              return (
                <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                  <div className="group h-full cursor-pointer">
                    <Card className="flex h-full flex-col border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
                            {workspaceName.substring(0, 1).toUpperCase()}
                          </div>

                          <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                            {workspaceStyle}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <CardTitle className="line-clamp-2 text-xl text-slate-900">
                            {workspaceName}
                          </CardTitle>
                          <p className="text-sm text-slate-500">
                            Brand voice workspace
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="flex-1 space-y-5">
                        <p className="line-clamp-3 text-sm leading-relaxed text-slate-500">
                          {workspaceDescription}
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Style
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {workspaceStyle}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Boldness
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {workspaceBoldness}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <CalendarDays className="h-4 w-4" />
                          <span>Last activity: {workspaceDate}</span>
                        </div>
                      </CardContent>

                      <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-medium text-indigo-600">
                        <span className="transition-transform group-hover:translate-x-0.5">
                          Open workspace
                        </span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </CardFooter>
                    </Card>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <WorkspaceForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    </Layout>
  );
}