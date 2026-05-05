import { useWorkspaces } from "@/hooks/use-workspaces";
import Layout from "@/components/Layout";
import { WorkspaceForm } from "@/components/WorkspaceForm";
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
import { trackPaywallHit } from "@/lib/analytics";

const mono = "'IBM Plex Mono', monospace";
const serif = "'Georgia', 'Times New Roman', serif";
const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const LinkedInIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2" style={{ flexShrink: 0 }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(245,242,237,0.7)" style={{ flexShrink: 0 }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

function formatDate(dateValue?: string | null) {
  if (!dateValue) return "No activity yet";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function getWorkspaceName(w: any) { return w.clientName ?? w.client_name ?? w.name ?? "Untitled Workspace"; }
function getWorkspaceDescription(w: any) { return w.brandDescription ?? w.brand_description ?? "No description provided."; }
function getWorkspaceStyle(w: any) { return w.style ?? "Not set"; }
function getWorkspaceBoldness(w: any) { return w.boldness ?? w.brightness ?? w.toneStrength ?? "Not set"; }
function getWorkspaceDate(w: any) { return w.lastGenerationAt ?? w.last_generation_at ?? w.updatedAt ?? w.updated_at ?? w.createdAt ?? w.created_at ?? null; }

const card: React.CSSProperties = { background: "#1E1E1F", border: "1px solid rgba(245,242,237,0.08)" };
const cardInner: React.CSSProperties = { background: "rgba(245,242,237,0.03)", border: "1px solid rgba(245,242,237,0.07)" };

export default function Dashboard() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("sb_token") || "";
    fetch(`${apiBase}/api/usage`, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => setUsage(d))
      .catch(() => {});
  }, []);

  const filteredWorkspaces = useMemo(() => {
    const q = (search ?? "").toLowerCase().trim();
    if (!q) return workspaces ?? [];
    return (workspaces ?? []).filter((w: any) =>
      getWorkspaceName(w).toLowerCase().includes(q) ||
      String(getWorkspaceStyle(w)).toLowerCase().includes(q) ||
      String(getWorkspaceDescription(w)).toLowerCase().includes(q)
    );
  }, [workspaces, search]);

  const generationsUsed = usage?.generationsUsed ?? 0;
  const generationsLimit = usage?.generationsLimit ?? 0;
  const workspacesUsed = usage?.workspacesUsed ?? 0;
  const workspacesLimit = usage?.workspacesLimit ?? 0;
  const planId = usage?.planId ?? "starter";
  const generationPercent = generationsLimit > 0 ? Math.min((generationsUsed / generationsLimit) * 100, 100) : 0;
  const workspacePercent = workspacesLimit > 0 ? Math.min((workspacesUsed / workspacesLimit) * 100, 100) : 0;
  const hasWorkspaces = (workspaces?.length ?? 0) > 0;
  const isStarterPlan = String(planId).toLowerCase() === "starter";
  const workspaceLimitReached = workspacesLimit > 0 && workspacesUsed >= workspacesLimit;
  const generationLimitReached = generationsLimit > 0 && generationsUsed >= generationsLimit;

  return (
    <Layout>
      <div style={{ fontFamily: mono, display: "flex", flexDirection: "column", gap: 32 }}>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: serif, fontSize: 32, fontWeight: 700, color: "#F5F2ED", letterSpacing: "-1px", marginBottom: 8 }}>Workspaces</h1>
            <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", letterSpacing: "0.02em", lineHeight: 1.6 }}>
              Create a workspace for each brand, client, or content project you want to generate from.
            </p>
          </div>
          <button
            onClick={() => {
              if (workspaceLimitReached) {
                trackPaywallHit(planId);
              } else {
                setIsCreateOpen(true);
              }
            }}
            disabled={workspaceLimitReached}
            style={{ background: workspaceLimitReached ? "rgba(192,87,70,0.4)" : "#C05746", border: "none", color: "#F5F2ED", padding: "10px 20px", fontSize: 11, letterSpacing: "0.1em", fontWeight: 600, cursor: workspaceLimitReached ? "not-allowed" : "pointer", fontFamily: mono, display: "flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={14} /> NEW WORKSPACE
          </button>
        </div>

        {/* EMPTY STATE */}
        {!hasWorkspaces && !isLoading && (
          <div style={{ border: "1px solid rgba(192,87,70,0.2)", background: "rgba(192,87,70,0.04)", padding: 40 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 48, alignItems: "start" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid rgba(192,87,70,0.25)", padding: "4px 14px", marginBottom: 24, fontSize: 10, letterSpacing: "0.14em", color: "#C05746" }}>
                  ✦ START HERE
                </div>
                <h2 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: "#F5F2ED", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: 14 }}>
                  Turn long-form content into ready-to-post marketing content
                </h2>
                <p style={{ fontSize: 13, color: "rgba(245,242,237,0.45)", lineHeight: 1.8, marginBottom: 28, maxWidth: 480 }}>
                  ReContent helps you turn webinars, podcasts, interviews, and videos into{" "}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><LinkedInIcon size={12} /> LinkedIn posts</span>,{" "}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><XIcon size={12} /> X posts</span>, and blog outlines.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
                  {[
                    { n: "1.", title: "Create workspace", body: "One workspace = one client, brand, or content project." },
                    { n: "2.", title: "Add content", body: "Paste a transcript, add a YouTube URL, or upload audio/video." },
                    { n: "3.", title: "Generate outputs", body: "Create LinkedIn posts, X posts, and blog outlines in one run." },
                  ].map(item => (
                    <div key={item.n} style={{ ...cardInner, padding: 14 }}>
                      <p style={{ fontSize: 11, color: "#C05746", marginBottom: 5, letterSpacing: "0.06em" }}>{item.n}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "#F5F2ED", marginBottom: 5 }}>{item.title}</p>
                      <p style={{ fontSize: 11, color: "rgba(245,242,237,0.4)", lineHeight: 1.6 }}>{item.body}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    disabled={workspaceLimitReached}
                    style={{ background: "#C05746", border: "none", color: "#F5F2ED", padding: "11px 22px", fontSize: 11, letterSpacing: "0.1em", fontWeight: 600, cursor: "pointer", fontFamily: mono, display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Plus size={13} /> CREATE YOUR FIRST WORKSPACE
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid rgba(245,242,237,0.1)", padding: "10px 14px", fontSize: 11, color: "rgba(245,242,237,0.35)" }}>
                    <Wand2 size={12} color="#C05746" />
                    <LinkedInIcon size={11} /> 10
                    <span style={{ color: "rgba(245,242,237,0.2)" }}>·</span>
                    <XIcon size={10} /> 10
                    <span style={{ color: "rgba(245,242,237,0.2)" }}>·</span>
                    3 blog per generation
                  </div>
                </div>
              </div>

              <div style={{ ...card, padding: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#F5F2ED", marginBottom: 8 }}>What is a workspace?</p>
                <p style={{ fontSize: 11, color: "rgba(245,242,237,0.4)", lineHeight: 1.7, marginBottom: 16 }}>
                  A workspace stores the brand voice, transcript inputs, and generation history for one client or project.
                </p>
                {[
                  { icon: <Users size={13} color="#C05746" />, title: "Client or brand", body: "Keep each client voice separate and organized." },
                  { icon: <FileText size={13} color="#C05746" />, title: "Transcript history", body: "Reload previous generations and reuse source material later." },
                  { icon: <CheckCircle2 size={13} color="#C05746" />, title: "Consistent outputs", body: "Generate content matched to each workspace's style and tone." },
                ].map(item => (
                  <div key={item.title} style={{ display: "flex", gap: 10, padding: "12px 0", borderTop: "1px solid rgba(245,242,237,0.06)" }}>
                    <div style={{ flexShrink: 0, marginTop: 1 }}>{item.icon}</div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#F5F2ED", marginBottom: 3 }}>{item.title}</p>
                      <p style={{ fontSize: 11, color: "rgba(245,242,237,0.35)", lineHeight: 1.6 }}>{item.body}</p>
                    </div>
                  </div>
                ))}
                {usage && (
                  <div style={{ marginTop: 14, padding: 12, background: "rgba(192,87,70,0.06)", border: "1px solid rgba(192,87,70,0.15)" }}>
                    <p style={{ fontSize: 10, color: "#C05746", fontWeight: 600, marginBottom: 5, textTransform: "capitalize", letterSpacing: "0.08em" }}>{planId} plan</p>
                    <p style={{ fontSize: 11, color: "rgba(245,242,237,0.4)", marginBottom: 3 }}>{workspacesUsed} of {workspacesLimit} workspace{workspacesLimit === 1 ? "" : "s"} used</p>
                    <p style={{ fontSize: 11, color: "rgba(245,242,237,0.4)" }}>{generationsUsed} of {generationsLimit} generations used this month</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* USAGE CARDS */}
        {usage && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{ ...card, padding: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(245,242,237,0.25)", marginBottom: 8 }}>CURRENT PLAN</p>
                <p style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: "#F5F2ED", textTransform: "capitalize", marginBottom: 6 }}>{planId}</p>
                <p style={{ fontSize: 11, color: "rgba(245,242,237,0.35)", lineHeight: 1.6 }}>
                  {isStarterPlan ? "Starter is designed for controlled beta usage." : "You have expanded usage capacity on this plan."}
                </p>
              </div>
              <div style={{ flexShrink: 0, width: 34, height: 34, background: "rgba(192,87,70,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" fill="#C05746"/><rect x="8" y="1" width="5" height="5" fill="#C05746" opacity=".4"/><rect x="1" y="8" width="5" height="5" fill="#C05746" opacity=".4"/><rect x="8" y="8" width="5" height="5" fill="#C05746"/></svg>
              </div>
            </div>

            <div style={{ ...card, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(245,242,237,0.25)", marginBottom: 8 }}>GENERATIONS THIS MONTH</p>
                  <p style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: "#F5F2ED", marginBottom: 4 }}>{generationsUsed} / {generationsLimit}</p>
                  <p style={{ fontSize: 11, color: "rgba(245,242,237,0.35)" }}>One generation = all outputs.</p>
                </div>
                <div style={{ flexShrink: 0, width: 34, height: 34, background: "rgba(192,87,70,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Gauge size={14} color="#C05746" />
                </div>
              </div>
              <div style={{ height: 3, background: "rgba(245,242,237,0.08)" }}>
                <div style={{ height: "100%", background: "#C05746", width: `${generationPercent}%`, transition: "width 0.3s" }} />
              </div>
              {generationLimitReached && <p style={{ fontSize: 10, color: "#C05746", marginTop: 8 }}>All generations used this month.</p>}
            </div>

            <div style={{ ...card, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: "0.14em", color: "rgba(245,242,237,0.25)", marginBottom: 8 }}>WORKSPACE USAGE</p>
                  <p style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: "#F5F2ED", marginBottom: 4 }}>{workspacesUsed} / {workspacesLimit}</p>
                  <p style={{ fontSize: 11, color: "rgba(245,242,237,0.35)" }}>Separate workspace per client.</p>
                </div>
                <div style={{ flexShrink: 0, width: 34, height: 34, background: "rgba(192,87,70,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FolderKanban size={14} color="#C05746" />
                </div>
              </div>
              <div style={{ height: 3, background: "rgba(245,242,237,0.08)" }}>
                <div style={{ height: "100%", background: "#C05746", width: `${workspacePercent}%`, transition: "width 0.3s" }} />
              </div>
              {workspaceLimitReached && <p style={{ fontSize: 10, color: "#C05746", marginTop: 8 }}>Workspace limit reached.</p>}
            </div>
          </div>
        )}

        {/* SEARCH */}
        {hasWorkspaces && (
          <div style={{ position: "relative" }}>
            <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} size={13} color="rgba(245,242,237,0.25)" />
            <input
              placeholder="Search by client name, style, or description..."
              style={{ width: "100%", background: "rgba(245,242,237,0.03)", border: "1px solid rgba(245,242,237,0.09)", padding: "11px 16px 11px 40px", fontSize: 12, color: "#F5F2ED", fontFamily: mono, outline: "none", boxSizing: "border-box", letterSpacing: "0.02em" }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* WORKSPACE GRID */}
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={28} color="#C05746" className="animate-spin" />
          </div>
        ) : filteredWorkspaces.length === 0 && hasWorkspaces && search ? (
          <div style={{ ...cardInner, padding: 60, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, background: "rgba(192,87,70,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <Search size={22} color="#C05746" />
            </div>
            <p style={{ fontFamily: serif, fontSize: 20, fontWeight: 700, color: "#F5F2ED", marginBottom: 8 }}>No matching workspaces</p>
            <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", marginBottom: 24 }}>Try a different search term, or create a new workspace.</p>
            <button onClick={() => setSearch("")} style={{ background: "none", border: "1px solid rgba(245,242,237,0.15)", color: "rgba(245,242,237,0.6)", padding: "9px 22px", fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", fontFamily: mono }}>
              CLEAR SEARCH
            </button>
          </div>
        ) : hasWorkspaces ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filteredWorkspaces.map((workspace: any) => {
              const name = getWorkspaceName(workspace);
              const desc = getWorkspaceDescription(workspace);
              const style = getWorkspaceStyle(workspace);
              const boldness = getWorkspaceBoldness(workspace);
              const date = formatDate(getWorkspaceDate(workspace));
              return (
                <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                  <div
                    style={{ ...card, padding: 22, cursor: "pointer", display: "flex", flexDirection: "column", gap: 14, height: "100%", boxSizing: "border-box", transition: "border-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(192,87,70,0.3)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(245,242,237,0.08)")}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ width: 38, height: 38, background: "rgba(192,87,70,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 17, fontWeight: 700, color: "#C05746", flexShrink: 0 }}>
                        {name.substring(0, 1).toUpperCase()}
                      </div>
                      <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "rgba(245,242,237,0.3)", border: "1px solid rgba(245,242,237,0.08)", padding: "3px 8px", textTransform: "uppercase" }}>
                        {style}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: "#F5F2ED", marginBottom: 7, lineHeight: 1.3 }}>{name}</p>
                      <p style={{ fontSize: 11, color: "rgba(245,242,237,0.38)", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as any}>{desc}</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[{ label: "STYLE", value: style }, { label: "BOLDNESS", value: boldness }].map(item => (
                        <div key={item.label} style={{ ...cardInner, padding: "9px 11px" }}>
                          <p style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(245,242,237,0.22)", marginBottom: 4 }}>{item.label}</p>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "#F5F2ED", textTransform: "capitalize" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid rgba(245,242,237,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "rgba(245,242,237,0.28)" }}>
                        <CalendarDays size={11} /> {date}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#C05746" }}>
                        Open <ArrowRight size={12} />
                      </div>
                    </div>
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