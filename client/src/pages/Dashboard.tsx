import { useWorkspaces } from "@/hooks/use-workspaces";
import Layout from "@/components/Layout";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Plus,
  Users,
  ArrowRight,
  Loader2,
  Search,
  FolderKanban,
  Gauge,
  CalendarDays,
  CheckCircle2,
  Wand2,
  FileText,
} from "lucide-react";
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
  const planId = usage?.planId ?? "starter";

  const generationPercent =
    generationsLimit > 0 ? Math.min((generationsUsed / generationsLimit) * 100, 100) : 0;

  const workspacePercent =
    workspacesLimit > 0 ? Math.min((workspacesUsed / workspacesLimit) * 100, 100) : 0;

  const hasWorkspaces = (workspaces?.length ?? 0) > 0;
  const isStarterPlan = String(planId).toLowerCase() === "starter";
  const workspaceLimitReached = workspacesLimit > 0 && workspacesUsed >= workspacesLimit;
  const generationLimitReached = generationsLimit > 0 && generationsUsed >= generationsLimit;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workspaces</h1>
            <p className="mt-2 text-slate-500">
              Create a workspace for each brand, client, or content project you want to generate from.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="text-white" style={{ background: '#C05746' }}
            disabled={workspaceLimitReached}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </div>

        {!hasWorkspaces && !isLoading && (
          <div className="rounded-3xl border p-8 shadow-sm" style={{ borderColor: 'rgba(192,87,70,0.2)', background: 'rgba(192,87,70,0.04)' }}>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm" style={{ borderColor: 'rgba(192,87,70,0.2)', color: '#C05746' }}>
                  <span style={{ fontSize: 10 }}>✦</span>
                  Start here
                </div>

                <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
                  Turn long-form content into ready-to-post marketing content
                </h2>

                <p className="mt-3 max-w-2xl text-slate-600">
                  ReContent helps you turn webinars, podcasts, interviews, and videos into LinkedIn posts,
                  X posts, and blog outlines. Start by creating your first workspace.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">1. Create workspace</p>
                    <p className="mt-1 text-sm text-slate-500">
                      One workspace = one client, brand, or content project.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">2. Add content</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Paste a transcript, add a YouTube URL, or upload audio/video.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">3. Generate outputs</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create LinkedIn posts, X posts, and blog outlines in one run.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="text-white" style={{ background: '#C05746' }}
                    disabled={workspaceLimitReached}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Workspace
                  </Button>

                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
                    <Wand2 className="mr-2 h-4 w-4" color="#C05746" />
                    10 LinkedIn + 10 X + 3 blog outlines per generation
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">What is a workspace?</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  A workspace stores the brand voice, transcript inputs, and generation history for one
                  client or project.
                </p>

                <div className="mt-5 space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <Users className="mt-0.5 h-5 w-5" color="#C05746" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Client or brand</p>
                      <p className="text-sm text-slate-500">
                        Keep each client voice separate and organized.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <FileText className="mt-0.5 h-5 w-5" color="#C05746" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Transcript history</p>
                      <p className="text-sm text-slate-500">
                        Reload previous generations and reuse source material later.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5" color="#C05746" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Consistent outputs</p>
                      <p className="text-sm text-slate-500">
                        Generate content matched to each workspace’s style and tone.
                      </p>
                    </div>
                  </div>
                </div>

                {usage && (
                  <div className="mt-6 rounded-2xl border p-4" style={{ borderColor: 'rgba(192,87,70,0.2)', background: 'rgba(192,87,70,0.06)' }}>
                    <p className="text-sm font-semibold text-slate-900 capitalize">{planId} plan</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {workspacesUsed} of {workspacesLimit} workspace{workspacesLimit === 1 ? "" : "s"} used
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {generationsUsed} of {generationsLimit} generations used this month
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {usage && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="border-slate-200 bg-white">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Current plan</p>
                    <p className="mt-1 text-2xl font-semibold capitalize text-slate-900">
                      {planId}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {isStarterPlan
                        ? "Starter is designed for controlled beta usage."
                        : "You have expanded usage capacity on this plan."}
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(192,87,70,0.1)' }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" fill="#C05746"/><rect x="10" y="2" width="6" height="6" fill="#C05746" opacity=".4"/><rect x="2" y="10" width="6" height="6" fill="#C05746" opacity=".4"/><rect x="10" y="10" width="6" height="6" fill="#C05746"/></svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Generations this month</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {generationsUsed} / {generationsLimit}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      One generation creates all outputs in a single run.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(192,87,70,0.1)' }}>
                    <Gauge className="h-5 w-5" color="#C05746" />
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all" style={{ width: `${generationPercent}%`, background: '#C05746' }}
                  />
                </div>

                {generationLimitReached && (
                  <p className="mt-3 text-xs text-amber-700">
                    You’ve used all available generations for this month.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardContent className="pt-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Workspace usage</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">
                      {workspacesUsed} / {workspacesLimit}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Create a separate workspace for each client, brand, or project.
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(192,87,70,0.1)' }}>
                    <FolderKanban className="h-5 w-5" color="#C05746" />
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all" style={{ width: `${workspacePercent}%`, background: '#C05746' }}
                  />
                </div>

                {workspaceLimitReached && (
                  <p className="mt-3 text-xs text-amber-700">
                    You’ve reached your workspace limit for the current plan.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {hasWorkspaces && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by client name, style, or description..."
              className="h-12 border-slate-200 bg-white pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" color="#C05746" />
          </div>
        ) : filteredWorkspaces.length === 0 && hasWorkspaces && search ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(192,87,70,0.1)' }}>
              <Search className="h-8 w-8" color="#C05746" />
            </div>

            <h3 className="mb-2 text-xl font-semibold text-slate-900">
              No matching workspaces
            </h3>

            <p className="mx-auto mb-6 max-w-md text-slate-500">
              Try a different search term, or create a new workspace for another client.
            </p>

            <Button onClick={() => setSearch("")} variant="outline">
              Clear Search
            </Button>
          </div>
        ) : hasWorkspaces ? (
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
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold" style={{ background: 'rgba(192,87,70,0.12)', color: '#C05746' }}>
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

                      <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-medium" style={{ color: '#C05746' }}>
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
        ) : null}

        <WorkspaceForm open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      </div>
    </Layout>
  );
}