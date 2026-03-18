import { useWorkspace, useGenerateContent } from "@/hooks/use-workspaces";
import Layout from "@/components/Layout";
import { ContentOutput } from "@/components/ContentOutput";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import * as Sentry from "@sentry/react";
import {
  Loader2, Settings, History, Wand2, ArrowLeft, Video,
  Trash2, Upload, FileAudio, Sparkles, CheckCircle2,
  AlertTriangle, Crown, X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";


const mono = "'IBM Plex Mono', monospace";
const serif = "Georgia, serif";
const apiBase = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("sb_token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getApiErrorDetails(error: any) {
  const responseData = error?.response?.data ?? error?.data ?? error?.cause?.data ?? error?.details ?? null;
  const code = responseData?.code || error?.code || null;
  const message = responseData?.message || responseData?.error || error?.message || "An unexpected error occurred.";
  const retryAfterSeconds = responseData?.retryAfterSeconds || responseData?.retry_after_seconds || null;
  const maxTranscriptChars = responseData?.maxTranscriptChars || responseData?.max_transcript_chars || null;
  const transcriptSize = responseData?.transcriptSize || responseData?.transcript_size || null;
  const requestId = responseData?.requestId || responseData?.request_id || null;
  return { code, message, retryAfterSeconds, maxTranscriptChars, transcriptSize, requestId };
}

function formatRetryTime(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "a moment";
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function capitalizePlan(plan: string) {
  if (!plan) return "Plan";
  return String(plan).charAt(0).toUpperCase() + String(plan).slice(1);
}

export default function WorkspaceDetail() {
  const { id: workspaceId } = useParams();
  const wid = Number(workspaceId);
  const { toast } = useToast();

  const { data: workspace, isLoading } = useWorkspace(wid);
  const generateMutation = useGenerateContent();

  const [transcript, setTranscript] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedHistoricalContent, setSelectedHistoricalContent] = useState<any>(null);
  const [generations, setGenerations] = useState<any[] | undefined>(undefined);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isTranscribingVideo, setIsTranscribingVideo] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [usage, setUsage] = useState<any>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LONG_TRANSCRIPT_WARNING_CHARS = 12000;
  const transcriptLength = transcript.trim().length;
  const showLongTranscriptWarning = transcriptLength >= LONG_TRANSCRIPT_WARNING_CHARS;
  const transcriptStorageKey = wid ? `recontent_transcript_${wid}` : "";

  // FIX: authHeaders() is sync — no await needed
  const loadUsage = async () => {
    try {
      const headers = authHeaders();
      const res = await fetch(`${apiBase}/api/usage`, { credentials: "include", headers });
      if (!res.ok) throw new Error("Failed to load usage");
      const data = await res.json();
      setUsage(data);
    } catch {
      // silent
    }
  };

  useEffect(() => { loadUsage(); }, []);

  useEffect(() => {
    if (!wid) return;
    Sentry.setTag("workspaceId", String(wid));
    return () => { Sentry.setTag("workspaceId", ""); };
  }, [wid]);

  useEffect(() => {
    if (!transcriptStorageKey) return;
    const saved = localStorage.getItem(transcriptStorageKey);
    if (saved && !transcript.trim()) setTranscript(saved);
  }, [transcriptStorageKey]);

  useEffect(() => {
    if (!transcriptStorageKey) return;
    localStorage.setItem(transcriptStorageKey, transcript);
  }, [transcript, transcriptStorageKey]);

  useEffect(() => {
    if (!showSuccessBanner) return;
    const timer = window.setTimeout(() => setShowSuccessBanner(false), 5000);
    return () => window.clearTimeout(timer);
  }, [showSuccessBanner]);

  // FIX: authHeaders() is sync — removed .then() wrapper that was crashing
  useEffect(() => {
    if (activeTab !== "history" || !wid) return;
    const headers = authHeaders();
    fetch(`${apiBase}/api/workspaces/${wid}/generations`, { credentials: "include", headers })
      .then(async (res) => {
        const json = await res.json();
        setGenerations(json.generations ?? []);
      })
      .catch(() => setGenerations([]));
  }, [activeTab, wid]);

  const normalizeStringArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((x) => (typeof x === "string" ? x : JSON.stringify(x)));
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x));
      } catch {}
      return [value];
    }
    return [];
  };

  const fetchGeneration = async (genId: number) => {
    try {
      const headers = authHeaders();
      const response = await fetch(`${apiBase}/api/generations/${genId}`, { credentials: "include", headers });
      if (!response.ok) throw new Error("Failed to fetch generation");
      const record = await response.json();
      const linkedinArr = normalizeStringArray(record.linkedin_posts || record.outputs?.linkedin);
      const xArr = normalizeStringArray(record.x_posts || record.outputs?.twitter || record.outputs?.x);
      const blogArr = normalizeStringArray(record.blog_outlines || record.outputs?.blog);
      const normalizedRecord = {
        ...record, linkedin_posts: linkedinArr, x_posts: xArr, blog_outlines: blogArr,
        outputs: { linkedin: linkedinArr, twitter: xArr, blog: blogArr },
      };
      setTranscript(record.transcript || "");
      setSelectedHistoricalContent(normalizedRecord);
      setActiveTab("generate");
      setTimeout(() => {
        document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      toast({ title: "Error", description: "Failed to load the full generation record.", variant: "destructive" });
    }
  };

  const activeContent = selectedHistoricalContent;

  const handleClearTranscript = () => {
    setTranscript("");
    setSelectedVideo(null);
    setUploadStatus("");
    setSelectedHistoricalContent(null);
    setIsDragActive(false);
    setShowSuccessBanner(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (transcriptStorageKey) localStorage.removeItem(transcriptStorageKey);
    toast({ title: "Transcript cleared", description: "The transcript box and saved draft have been cleared." });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedVideo(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedVideo(file);
      toast({ title: "File added", description: `${file.name} is ready to transcribe.` });
    }
  };

  const handleUseVideo = async () => {
    if (!selectedVideo) return;
    try {
      setIsTranscribingVideo(true);
      setUploadStatus("Uploading file...");
      const formData = new FormData();
      formData.append("file", selectedVideo);
      const headers = authHeaders();
      // FIX: use apiBase prefix for Railway backend
      const res = await fetch(`${apiBase}/api/transcribe/file`, { method: "POST", body: formData, credentials: "include", headers });
      setUploadStatus("Processing transcription...");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw { response: { data } };
      const transcriptText = data?.transcriptText || "";
      if (!transcriptText.trim()) throw new Error("No transcript was returned from the uploaded file.");
      setTranscript(transcriptText);
      setUploadStatus("Transcript ready");
      toast({ title: "Transcript ready", description: `Transcript successfully extracted from ${selectedVideo.name}.` });
    } catch (error: any) {
      setUploadStatus("");
      const { code, message } = getApiErrorDetails(error);
      if (code === "EMPTY_TRANSCRIPT") {
        toast({ title: "No speech detected", description: "We couldn't detect spoken content in that file.", variant: "destructive" });
        return;
      }
      toast({ title: "Video transcription failed", description: message || "Could not transcribe the uploaded file.", variant: "destructive" });
    } finally {
      setIsTranscribingVideo(false);
    }
  };

  const handleUpgradeCheckout = async (plan: "starter" | "pro" = "pro") => {
    try {
      setIsStartingCheckout(true);
      const headers = authHeaders();
      const res = await fetch("https://api.recontent.online/api/billing/create-checkout", {
  method: "POST", headers: { "Content-Type": "application/json", ...headers }, credentials: "include",
  body: JSON.stringify({ plan }),
});
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw { response: { data }, status: res.status };
      const checkoutUrl = data?.checkoutUrl || data?.url;
      if (!checkoutUrl) throw new Error("Stripe checkout URL was not returned.");
      window.location.href = checkoutUrl;
    } catch (error: any) {
      const { code, message } = getApiErrorDetails(error);
      if (code === "ALREADY_ON_PRO") {
        toast({ title: "Already on Pro", description: "This account is already on the Pro plan." });
        setShowUpgradeModal(false);
        await loadUsage();
        return;
      }
      toast({ title: "Checkout failed", description: message || "We couldn't start Stripe checkout. Please try again.", variant: "destructive" });
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const generationsUsed = typeof usage?.generationsUsed === "number" ? usage.generationsUsed : typeof usage?.generations_used === "number" ? usage.generations_used : 0;
  const generationsLimit = typeof usage?.generationsLimit === "number" ? usage.generationsLimit : typeof usage?.generations_limit === "number" ? usage.generations_limit : 0;
  const planId = usage?.planId || usage?.plan_id || "starter";
  const generationLimitReached = generationsLimit > 0 && generationsUsed >= generationsLimit;
  const generationsRemaining = Math.max(generationsLimit - generationsUsed, 0);
  const isNearLimit = generationsLimit > 0 && !generationLimitReached && (generationsRemaining === 1 || generationsUsed / generationsLimit >= 0.8);
  const transcriptIsEmpty = transcript.trim().length === 0;
  const hasHistory = Array.isArray(generations) && generations.length > 0;
  const isFirstRun = !activeContent && transcriptIsEmpty;
  const generateDisabled = generateMutation.isPending || (transcriptIsEmpty && !generationLimitReached) || isTranscribingVideo;
  const selectedFileSizeMb = selectedVideo ? (selectedVideo.size / (1024 * 1024)).toFixed(2) : null;

  const handleGenerate = async () => {
    if (generationLimitReached) { setShowUpgradeModal(true); return; }
    if (transcriptIsEmpty) {
      toast({ title: "Transcript required", description: "Paste a transcript, a YouTube URL, or upload a file first.", variant: "destructive" });
      return;
    }
    let finalTranscript = transcript;
    let transcriptSource = "pasted";
    let youtubeUrl: string | null = null;
    const trimmedTranscript = transcript.trim();
    const isYoutube = trimmedTranscript.startsWith("http") && (trimmedTranscript.includes("youtube.com") || trimmedTranscript.includes("youtu.be"));

    if (isYoutube) {
      try {
        toast({ title: "Fetching captions", description: "We're pulling the transcript from YouTube..." });
        // FIX: use apiBase prefix for Railway backend
        const res = await fetch(`${apiBase}/api/transcribe/youtube`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ url: trimmedTranscript }), credentials: "include" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw { response: { data } };
        if (!data.transcriptText || data.transcriptText.trim().length === 0) throw new Error("No captions found for this video.");
        finalTranscript = data.transcriptText;
        transcriptSource = "captions";
        youtubeUrl = trimmedTranscript;
        setTranscript(finalTranscript);
        toast({ title: "Captions fetched", description: `Loaded ${finalTranscript.length.toLocaleString()} characters from YouTube.` });
      } catch (error: any) {
        const { code, message } = getApiErrorDetails(error);
        if (code === "TRANSCRIPT_DISABLED") { toast({ title: "YouTube transcript unavailable", description: "Captions are disabled for this video.", variant: "destructive" }); return; }
        if (code === "NO_CAPTIONS_FOUND") { toast({ title: "No captions found", description: "This video has no usable captions.", variant: "destructive" }); return; }
        toast({ title: "YouTube fetch failed", description: message || "Failed to fetch YouTube transcript.", variant: "destructive" });
        return;
      }
    }

    try {
      const result = await generateMutation.mutateAsync({ id: wid, data: { transcript: finalTranscript, youtubeUrl, transcriptSource } });
      const base = (result as any).generation || result;
      const linkedinArr = (result as any).linkedin_posts ?? (result as any).output?.linkedin_posts ?? [];
      const xArr = (result as any).x_posts ?? (result as any).output?.x_posts ?? [];
      const blogArr = (result as any).blog_outlines ?? (result as any).output?.blog_outlines ?? [];
      setSelectedHistoricalContent({ ...base, linkedin_posts: linkedinArr, x_posts: xArr, blog_outlines: blogArr, outputs: { linkedin: linkedinArr, twitter: xArr, blog: blogArr } });
      setTranscript(base.transcript || finalTranscript);
      setActiveTab("generate");
      setUploadStatus("");
      setShowSuccessBanner(true);
      await loadUsage();
      if (transcriptStorageKey) localStorage.removeItem(transcriptStorageKey);
      toast({ title: "Content generated", description: "Your content pack is ready." });
      setTimeout(() => { document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
    } catch (error: any) {
      const { code, message, retryAfterSeconds, maxTranscriptChars, transcriptSize, requestId } = getApiErrorDetails(error);
      if (code === "GENERATION_LIMIT_REACHED" || error?.status === 402) { setShowUpgradeModal(true); await loadUsage(); return; }
      if (code === "RATE_LIMITED") { toast({ title: "Too many requests", description: `Please wait ${formatRetryTime(retryAfterSeconds)} and try again.`, variant: "destructive" }); return; }
      if (code === "TRANSCRIPT_TOO_LONG") {
        const capText = maxTranscriptChars ? `${Number(maxTranscriptChars).toLocaleString()}` : "the allowed size";
        const actualText = transcriptSize && Number(transcriptSize) > 0 ? ` Current size: ${Number(transcriptSize).toLocaleString()} characters.` : "";
        toast({ title: "Transcript too long", description: `Over ${capText} characters. Split into 15–30 minute sections.${actualText}`, variant: "destructive" });
        return;
      }
      toast({ title: "Generation failed", description: requestId ? `${message} (Ref: ${requestId})` : message || "An unexpected error occurred.", variant: "destructive", duration: Infinity });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <Loader2 style={{ width: 32, height: 32, color: "#C05746", animation: "spin 1s linear infinite" }} />
        </div>
      </Layout>
    );
  }

  if (!workspace) {
    return (
      <Layout>
        <div style={{ textAlign: "center", padding: "80px 0", fontFamily: mono }}>
          <h2 style={{ color: "#EDEAE4", fontSize: 18 }}>Workspace not found</h2>
          <Link href="/" style={{ color: "#C05746", marginTop: 16, display: "block", fontSize: 12 }}>Return home</Link>
        </div>
      </Layout>
    );
  }

  const workspaceName = workspace?.clientName ?? "Untitled workspace";
  const workspaceStyle = workspace?.style ?? "professional";
  const workspaceBoldness = workspace?.boldness ?? "moderate";
  const workspaceDescription = workspace?.brandDescription ?? "No description provided.";

  return (
    <Layout>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", padding: "0 16px" }}>
          <div style={{ width: "100%", maxWidth: 480, background: "#1A1A1B", border: "1px solid rgba(245,242,237,0.1)", fontFamily: mono }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "20px 24px", borderBottom: "1px solid rgba(245,242,237,0.08)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ width: 40, height: 40, background: "rgba(192,87,70,0.12)", border: "1px solid rgba(192,87,70,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Crown style={{ width: 20, height: 20, color: "#C05746" }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: serif, fontSize: 18, color: "#EDEAE4", margin: 0 }}>Upgrade to keep generating</h3>
                  <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", marginTop: 4 }}>You've reached the limit on your current plan.</p>
                </div>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} disabled={isStartingCheckout} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(245,242,237,0.3)", padding: 4 }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ border: "1px solid rgba(192,87,70,0.3)", background: "rgba(192,87,70,0.06)", padding: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: "0 0 4px" }}>{capitalizePlan(planId)} plan limit reached</p>
                <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", margin: 0 }}>You've used {generationsUsed} of {generationsLimit} generations.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ border: "1px solid rgba(245,242,237,0.08)", padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: "0 0 4px" }}>Starter</p>
                  {/* FIX: correct plan limits */}
                  <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", margin: 0 }}>1 workspace • 3 generations per month</p>
                </div>
                <div style={{ border: "1px solid rgba(192,87,70,0.4)", background: "rgba(192,87,70,0.05)", padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: 0 }}>Pro</p>
                    <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: "#C05746", border: "1px solid rgba(192,87,70,0.4)", padding: "2px 8px" }}>RECOMMENDED</span>
                  </div>
                  {/* FIX: correct plan limits */}
                  <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", margin: "4px 0 0" }}>5 workspaces • 15 generations per month</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
  <button
    onClick={() => handleUpgradeCheckout("pro")}
    disabled={isStartingCheckout}
    style={{ width: "100%", background: isStartingCheckout ? "rgba(192,87,70,0.5)" : "#C05746", border: "none", color: "#EDEAE4", padding: "12px", fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", cursor: isStartingCheckout ? "not-allowed" : "pointer" }}
  >
    {isStartingCheckout ? "Opening checkout..." : "Upgrade to Pro — $129/mo →"}
  </button>
  <button
    onClick={() => handleUpgradeCheckout("starter")}
    disabled={isStartingCheckout}
    style={{ width: "100%", background: "transparent", border: "1px solid rgba(245,242,237,0.2)", color: "#EDEAE4", padding: "12px", fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", cursor: isStartingCheckout ? "not-allowed" : "pointer" }}
  >
    {isStartingCheckout ? "Opening checkout..." : "Choose Starter — $39/mo →"}
  </button>
  <button
    onClick={() => setShowUpgradeModal(false)}
    disabled={isStartingCheckout}
    style={{ width: "100%", background: "transparent", border: "none", color: "rgba(245,242,237,0.3)", padding: "8px", fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", cursor: "pointer" }}
  >
    Not now
  </button>
</div>
            </div>
          </div>
        </div>
      )}

      {/* Back + Header */}
      <div style={{ marginBottom: 32 }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.4)", textDecoration: "none", letterSpacing: "0.08em", marginBottom: 16 }}>
          <ArrowLeft style={{ width: 12, height: 12 }} /> BACK TO DASHBOARD
        </Link>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontFamily: serif, fontSize: 28, color: "#EDEAE4", margin: 0 }}>{workspaceName}</h1>
              <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", color: "rgba(245,242,237,0.4)", border: "1px solid rgba(245,242,237,0.12)", padding: "3px 10px" }}>
                {workspaceStyle} • {workspaceBoldness}
              </span>
            </div>
            <p style={{ fontFamily: mono, fontSize: 12, color: "rgba(245,242,237,0.4)", marginTop: 8, maxWidth: 600 }}>{workspaceDescription}</p>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: mono, fontSize: 11, letterSpacing: "0.08em", color: "rgba(245,242,237,0.5)", background: "transparent", border: "1px solid rgba(245,242,237,0.15)", padding: "8px 16px", cursor: "pointer", whiteSpace: "nowrap" }}
          >
            <Settings style={{ width: 14, height: 14 }} /> Edit Brand
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {showSuccessBanner && (
        <div style={{ marginBottom: 24, border: "1px solid rgba(192,87,70,0.3)", background: "rgba(192,87,70,0.06)", padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <CheckCircle2 style={{ width: 16, height: 16, color: "#C05746", marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: 0 }}>Your content pack is ready</p>
            <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.5)", marginTop: 4 }}>
              ReContent generated 10 LinkedIn posts, 10 X posts, and 3 blog outlines from your source content.
            </p>
          </div>
        </div>
      )}

      {/* Near limit warning */}
      {isNearLimit && (
        <div style={{ marginBottom: 24, border: "1px solid rgba(192,87,70,0.25)", background: "rgba(192,87,70,0.04)", padding: "16px 20px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#C05746", marginTop: 2, flexShrink: 0 }} />
            <div>
              <p style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: 0 }}>Approaching generation limit</p>
              <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.5)", marginTop: 4 }}>
                {generationsRemaining} generation{generationsRemaining === 1 ? "" : "s"} remaining on the {capitalizePlan(planId)} plan.
              </p>
            </div>
          </div>
          <button onClick={() => setShowUpgradeModal(true)} style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", color: "rgba(245,242,237,0.5)", background: "transparent", border: "1px solid rgba(245,242,237,0.15)", padding: "6px 14px", cursor: "pointer", whiteSpace: "nowrap" }}>
            View upgrade
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: "1px solid rgba(245,242,237,0.08)" }}>
        {[
          { key: "generate", label: "Generate", icon: <Wand2 style={{ width: 13, height: 13 }} /> },
          { key: "history", label: "History", icon: <History style={{ width: 13, height: 13 }} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontFamily: mono, fontSize: 11, letterSpacing: "0.08em",
              color: activeTab === tab.key ? "#EDEAE4" : "rgba(245,242,237,0.35)",
              background: "transparent",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #C05746" : "2px solid transparent",
              padding: "10px 16px",
              cursor: "pointer",
              marginBottom: -1,
            }}
          >
            {tab.icon} {tab.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Intro block — first run only */}
            {isFirstRun && (
              <div style={{ border: "1px solid rgba(192,87,70,0.3)", background: "rgba(192,87,70,0.05)", padding: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 36, height: 36, background: "rgba(192,87,70,0.1)", border: "1px solid rgba(192,87,70,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Sparkles style={{ width: 16, height: 16, color: "#C05746" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: serif, fontSize: 16, color: "#EDEAE4", margin: "0 0 6px" }}>Turn long-form content into weeks of posts</h2>
                    <p style={{ fontFamily: mono, fontSize: 12, color: "rgba(245,242,237,0.5)", lineHeight: 1.6, margin: 0 }}>
                      Start with a webinar, podcast, video, or interview transcript. ReContent will turn it into ready-to-edit social content for this workspace.
                    </p>
                    <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {["Paste a transcript, add a YouTube URL, or upload a file.", "Click generate to create posts and blog outlines.", "Edit, export, and reuse the best outputs."].map((text, i) => (
                        <div key={i} style={{ border: "1px solid rgba(245,242,237,0.08)", padding: 12 }}>
                          <p style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: "#EDEAE4", margin: "0 0 4px", letterSpacing: "0.06em" }}>STEP {i + 1}</p>
                          <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.45)", lineHeight: 1.5, margin: 0 }}>{text}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      {["10 LinkedIn posts", "10 X posts", "3 blog outlines"].map((label) => (
                        <span key={label} style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", color: "rgba(245,242,237,0.4)", border: "1px solid rgba(245,242,237,0.12)", padding: "3px 10px" }}>{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transcript input */}
            <div style={{ border: "1px solid rgba(245,242,237,0.1)", background: "rgba(245,242,237,0.02)", padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
                <div>
                  <p style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#EDEAE4", margin: "0 0 4px", letterSpacing: "0.06em" }}>ADD YOUR CONTENT SOURCE</p>
                  <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.4)", margin: 0 }}>Paste a transcript, paste a YouTube link, or upload a video/audio file.</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isTranscribingVideo}
                    style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", color: "rgba(245,242,237,0.4)", background: "transparent", border: "1px solid rgba(245,242,237,0.12)", padding: "6px 12px", cursor: "pointer" }}
                  >
                    <Video style={{ width: 11, height: 11 }} /> Upload
                  </button>
                  <button
                    onClick={handleClearTranscript}
                    disabled={isTranscribingVideo}
                    style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", color: "rgba(245,242,237,0.4)", background: "transparent", border: "1px solid rgba(245,242,237,0.12)", padding: "6px 12px", cursor: "pointer" }}
                  >
                    <Trash2 style={{ width: 11, height: 11 }} /> Clear
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept="video/*,audio/*" onChange={handleVideoUpload} style={{ display: "none" }} />
                </div>
              </div>

              {/* Drag drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => { e.preventDefault(); setIsDragActive(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
                style={{ border: `1px dashed ${isDragActive ? "#C05746" : "rgba(245,242,237,0.12)"}`, background: isDragActive ? "rgba(192,87,70,0.05)" : "transparent", padding: 16, marginBottom: 12 }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                  <Upload style={{ width: 14, height: 14, color: "rgba(245,242,237,0.3)", marginTop: 2 }} />
                  <div>
                    <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.5)", margin: "0 0 2px" }}>Paste transcript, YouTube URL, or drag a file here</p>
                    <p style={{ fontFamily: mono, fontSize: 10, color: "rgba(245,242,237,0.25)", margin: 0 }}>Works with webinars, podcasts, interviews, and videos.</p>
                  </div>
                </div>
                <textarea
                  placeholder="Paste a transcript here, paste a YouTube URL, or drag a video/audio file into this area..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  style={{
                    width: "100%", minHeight: 280, background: "rgba(245,242,237,0.04)",
                    border: "1px solid rgba(245,242,237,0.08)", outline: "none", resize: "vertical",
                    fontFamily: mono, fontSize: 12, color: "#EDEAE4", padding: 14,
                    lineHeight: 1.7, boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Tip */}
              <div style={{ border: "1px solid rgba(245,242,237,0.08)", background: "rgba(245,242,237,0.02)", padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <CheckCircle2 style={{ width: 13, height: 13, color: "#C05746", marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.4)", margin: 0, lineHeight: 1.6 }}>
                  For best results, use a transcript covering 10–30 minutes of spoken content. ReContent generates 10 LinkedIn posts, 10 X posts, and 3 blog outlines per run.
                </p>
              </div>

              {/* Selected video file */}
              {selectedVideo && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: "1px solid rgba(245,242,237,0.1)", padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileAudio style={{ width: 16, height: 16, color: "#C05746" }} />
                    <div>
                      <p style={{ fontFamily: mono, fontSize: 12, color: "#EDEAE4", margin: 0 }}>{selectedVideo.name}</p>
                      <p style={{ fontFamily: mono, fontSize: 10, color: "rgba(245,242,237,0.35)", margin: "2px 0 0" }}>{selectedFileSizeMb} MB</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUseVideo}
                    disabled={isTranscribingVideo}
                    style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.08em", color: "#EDEAE4", background: isTranscribingVideo ? "rgba(192,87,70,0.5)" : "#C05746", border: "none", padding: "8px 16px", cursor: isTranscribingVideo ? "not-allowed" : "pointer" }}
                  >
                    {isTranscribingVideo ? "Transcribing..." : "Extract Transcript"}
                  </button>
                </div>
              )}

              {/* Upload status */}
              {uploadStatus && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <Loader2 style={{ width: 12, height: 12, color: "#C05746", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.4)" }}>{uploadStatus}</span>
                </div>
              )}

              {/* Transcript length warning */}
              {showLongTranscriptWarning && (
                <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(192,87,70,0.8)", marginTop: 8 }}>
                  This transcript is long. 15–30 minute sections usually give better results.
                </p>
              )}
            </div>

            {/* Results */}
            {activeContent && (
              <div id="results-section" style={{ paddingTop: 8 }}>
                <ContentOutput content={activeContent} />
              </div>
            )}
          </div>

          {/* Right column — generation panel */}
          <div style={{ border: "1px solid rgba(245,242,237,0.1)", background: "rgba(245,242,237,0.02)", padding: 20, position: "sticky", top: 24 }}>
            <p style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", color: "rgba(245,242,237,0.35)", margin: "0 0 12px", textTransform: "uppercase" }}>Generation</p>

            <div style={{ border: "1px solid rgba(245,242,237,0.08)", padding: 14, marginBottom: 16 }}>
              <p style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "#EDEAE4", margin: "0 0 6px" }}>What happens when you click generate</p>
              <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.4)", lineHeight: 1.6, margin: 0 }}>
                One generation creates all outputs in one run and counts as 1 generation from your monthly plan.
              </p>
            </div>

            {/* Usage */}
            {usage && (
              <div style={{ border: "1px solid rgba(245,242,237,0.08)", padding: 14, marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Plan", value: capitalizePlan(planId) },
                  { label: "Generations", value: `${generationsUsed} / ${generationsLimit}` },
                  ...(!generationLimitReached ? [{ label: "Remaining", value: String(generationsRemaining) }] : []),
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.4)" }}>{row.label}</span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: "#EDEAE4" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Limit reached */}
            {generationLimitReached && (
              <div style={{ border: "1px solid rgba(192,87,70,0.3)", background: "rgba(192,87,70,0.06)", padding: 14, marginBottom: 16 }}>
                <p style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "#C05746", margin: "0 0 4px" }}>Monthly limit reached</p>
                <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.4)", lineHeight: 1.6, margin: 0 }}>
                  You've used all {generationsLimit} generations. Upgrade for more or wait for your monthly reset.
                </p>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generateDisabled}
              style={{
                width: "100%", background: generateDisabled ? "rgba(192,87,70,0.4)" : "#C05746",
                border: "none", color: "#EDEAE4", padding: "14px",
                fontFamily: mono, fontSize: 11, letterSpacing: "0.1em",
                cursor: generateDisabled ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {generateMutation.isPending ? (
                <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} /> ANALYZING...</>
              ) : generationLimitReached ? (
                <><Crown style={{ width: 14, height: 14 }} /> UPGRADE TO CONTINUE</>
              ) : (
                <><Wand2 style={{ width: 14, height: 14 }} /> GENERATE CONTENT</>
              )}
            </button>

            {!generationLimitReached && (
              <p style={{ fontFamily: mono, fontSize: 10, color: "rgba(245,242,237,0.3)", marginTop: 10, lineHeight: 1.6, textAlign: "center" }}>
                {transcriptIsEmpty
                  ? "Add a transcript, YouTube URL, or uploaded file to unlock your first generation."
                  : showLongTranscriptWarning
                    ? "Long transcript detected. 15–30 minute sections give best results."
                    : "Ready to generate from the current transcript."}
              </p>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: serif, fontSize: 20, color: "#EDEAE4", margin: "0 0 4px" }}>Content Library</h2>
            <p style={{ fontFamily: mono, fontSize: 12, color: "rgba(245,242,237,0.4)", margin: 0 }}>Open any previous run to view the full outputs.</p>
          </div>

          {generations === undefined ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 10 }}>
              <Loader2 style={{ width: 20, height: 20, color: "rgba(245,242,237,0.3)", animation: "spin 1s linear infinite" }} />
              <span style={{ fontFamily: mono, fontSize: 12, color: "rgba(245,242,237,0.3)" }}>Loading history...</span>
            </div>
          ) : generations.length === 0 ? (
            <div style={{ border: "1px solid rgba(245,242,237,0.08)", padding: "40px 24px", textAlign: "center" }}>
              <h3 style={{ fontFamily: serif, fontSize: 16, color: "#EDEAE4", margin: "0 0 8px" }}>No generations yet</h3>
              <p style={{ fontFamily: mono, fontSize: 12, color: "rgba(245,242,237,0.4)", maxWidth: 400, margin: "0 auto 20px" }}>
                Your past runs will appear here. Generate content from a transcript first, then come back anytime to reopen it.
              </p>
              <button
                onClick={() => setActiveTab("generate")}
                style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.08em", color: "#EDEAE4", background: "#C05746", border: "none", padding: "10px 20px", cursor: "pointer" }}
              >
                Go to Generate
              </button>
            </div>
          ) : (
            generations.map((item: any) => {
              const d = item?.createdAt ? new Date(item.createdAt) : null;
              const isYoutubeRun = !!item?.youtubeUrl;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => fetchGeneration(item.id)}
                  style={{
                    width: "100%", textAlign: "left", background: "rgba(245,242,237,0.02)",
                    border: "1px solid rgba(245,242,237,0.08)", padding: "16px 20px",
                    cursor: "pointer", fontFamily: mono,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#EDEAE4" }}>{d ? d.toLocaleString() : "Unknown date"}</span>
                        <span style={{ fontSize: 10, letterSpacing: "0.08em", color: isYoutubeRun ? "#C05746" : "rgba(245,242,237,0.35)", border: `1px solid ${isYoutubeRun ? "rgba(192,87,70,0.3)" : "rgba(245,242,237,0.1)"}`, padding: "2px 8px" }}>
                          {isYoutubeRun ? "YouTube" : "Transcript"}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "rgba(245,242,237,0.35)", margin: 0 }}>Open to view LinkedIn posts, X posts, and blog outlines.</p>
                    </div>
                    <span style={{ fontSize: 11, color: "#C05746", whiteSpace: "nowrap" }}>Open run →</span>
                  </div>
                </button>
              );
            })
          )}

          {hasHistory && (
            <p style={{ fontFamily: mono, fontSize: 11, color: "rgba(245,242,237,0.3)" }}>
              Tip: open any previous run to reload its transcript and outputs back into the Generate view.
            </p>
          )}
        </div>
      )}

      <WorkspaceForm open={isSettingsOpen} onOpenChange={setIsSettingsOpen} initialData={workspace} />
    </Layout>
  );
}