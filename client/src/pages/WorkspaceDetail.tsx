import { useWorkspace, useGenerateContent } from "@/hooks/use-workspaces";
import Layout from "@/components/Layout";
import { ContentOutput } from "@/components/ContentOutput";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, History, Wand2, ArrowLeft, Download, Video, Youtube } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
  const [usage, setUsage] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUsage = async () => {
    try {
      const res = await fetch("/api/usage", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load usage");
      const data = await res.json();
      setUsage(data);
    } catch {
      // ignore silently for now
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  useEffect(() => {
    if (activeTab !== "history") return;
    if (!wid) return;

    fetch(`/api/workspaces/${wid}/generations`, { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        setGenerations(json.generations ?? []);
      })
      .catch(() => setGenerations([]));
  }, [activeTab, wid]);

  const fetchGeneration = async (genId: number) => {
    try {
      const response = await fetch(`/api/generations/${genId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch generation");
      const record = await response.json();

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

      const linkedinArr = normalizeStringArray(record.linkedin_posts || record.outputs?.linkedin);
      const xArr = normalizeStringArray(record.x_posts || record.outputs?.twitter || record.outputs?.x);
      const blogArr = normalizeStringArray(record.blog_outlines || record.outputs?.blog);

      const normalizedRecord = {
        ...record,
        linkedin_posts: linkedinArr,
        x_posts: xArr,
        blog_outlines: blogArr,
        outputs: {
          linkedin: linkedinArr,
          twitter: xArr,
          blog: blogArr,
        },
      };

      setTranscript(record.transcript || "");
      setSelectedHistoricalContent(normalizedRecord);
      setActiveTab("generate");

      setTimeout(() => {
        const resultsHeader = document.getElementById("results-section");
        resultsHeader?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load the full generation record.",
        variant: "destructive",
      });
    }
  };

  const activeContent = selectedHistoricalContent;

  const handleDownloadJson = () => {
    if (!activeContent) return;
    const blob = new Blob([JSON.stringify(activeContent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `generation-${activeContent.id || Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedVideo(file);
  };

  const handleUseVideo = () => {
    if (!selectedVideo) return;
    setTranscript("(Placeholder transcript) This is where the video transcript will appear once transcription is enabled.");
    toast({
      title: "Video Selected",
      description: "Video transcription will be enabled in the next step.",
    });
  };

  const generationsUsed =
    typeof usage?.generationsUsed === "number"
      ? usage.generationsUsed
      : typeof usage?.generations_used === "number"
        ? usage.generations_used
        : 0;

  const generationsLimit =
    typeof usage?.generationsLimit === "number"
      ? usage.generationsLimit
      : typeof usage?.generations_limit === "number"
        ? usage.generations_limit
        : 0;

  const planId = usage?.planId || usage?.plan_id || "starter";

  const generationLimitReached =
    generationsLimit > 0 && generationsUsed >= generationsLimit;

  const transcriptIsEmpty = transcript.trim().length === 0;
  const generateDisabled =
    generateMutation.isPending || transcriptIsEmpty || generationLimitReached;

  const handleGenerate = async () => {
    if (generationLimitReached) {
      toast({
        title: "Monthly limit reached",
        description: "You’ve used all available generations for your current plan. Upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    if (transcriptIsEmpty) {
      toast({
        title: "Error",
        description: "Please provide a transcript or content source first.",
        variant: "destructive",
      });
      return;
    }

    let finalTranscript = transcript;
    let transcriptSource = "pasted";
    let youtubeUrl: string | null = null;

    const trimmedTranscript = transcript.trim();
    const isYoutube =
      trimmedTranscript.startsWith("http") &&
      (trimmedTranscript.includes("youtube.com") || trimmedTranscript.includes("youtu.be"));

    if (isYoutube) {
      try {
        toast({ title: "Fetching captions", description: "We're pulling the transcript from YouTube..." });

        const res = await fetch("/api/transcribe/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedTranscript }),
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          const errorMessage = data.message || "Failed to fetch YouTube transcript";
          const errorDetails = data.code ? ` (${data.code})` : "";
          throw new Error(`${errorMessage}${errorDetails}. Please paste the transcript manually.`);
        }

        if (!data.transcriptText || data.transcriptText.trim().length === 0) {
          throw new Error("No captions found for this video. Please paste the transcript manually.");
        }

        finalTranscript = data.transcriptText;
        transcriptSource = "captions";
        youtubeUrl = trimmedTranscript;
        setTranscript(finalTranscript);

        toast({
          title: "Captions fetched",
          description: `Successfully loaded ${finalTranscript.length} characters from YouTube.`,
        });
      } catch (error: any) {
        toast({
          title: "YouTube fetch failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const result = await generateMutation.mutateAsync({
        id: wid,
        data: {
          transcript: finalTranscript,
          youtubeUrl,
          transcriptSource,
        },
      });

      const base = (result as any).generation || result;

      const linkedinArr = (result as any).linkedin_posts ?? (result as any).output?.linkedin_posts ?? [];
      const xArr = (result as any).x_posts ?? (result as any).output?.x_posts ?? [];
      const blogArr = (result as any).blog_outlines ?? (result as any).output?.blog_outlines ?? [];

      const normalized = {
        ...base,
        linkedin_posts: linkedinArr,
        x_posts: xArr,
        blog_outlines: blogArr,
        outputs: {
          linkedin: linkedinArr,
          twitter: xArr,
          blog: blogArr,
        },
      };

      setSelectedHistoricalContent(normalized);
      setTranscript(base.transcript || finalTranscript);
      setActiveTab("generate");
      await loadUsage();

      setTimeout(() => {
        const resultsHeader = document.getElementById("results-section");
        resultsHeader?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error: any) {
      const message =
        error?.message ||
        error?.response?.data?.error ||
        "An unexpected error occurred. Please try again.";

      const lower = String(message).toLowerCase();

      if (lower.includes("generation limit reached") || lower.includes("monthly generation limit reached")) {
        toast({
          title: "Monthly limit reached",
          description: "You’ve used all available generations for your current plan. Upgrade to continue.",
          variant: "destructive",
        });
        await loadUsage();
        return;
      }

      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  if (!workspace) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-xl font-bold">Workspace not found</h2>
          <Link href="/" className="text-indigo-600 hover:underline mt-4 block">
            Return home
          </Link>
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
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              {workspaceName}
              <Badge variant="secondary" className="font-normal text-sm bg-indigo-50 text-indigo-700 border-indigo-100">
                {workspaceStyle} • {workspaceBoldness}
              </Badge>
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl truncate">{workspaceDescription}</p>
          </div>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2">
            <Settings className="w-4 h-4" />
            Edit Brand Details
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" value={activeTab} onValueChange={(val) => setActiveTab(val)} className="space-y-6">
        <TabsList className="bg-white p-1 border border-slate-200 rounded-xl">
          <TabsTrigger
            value="generate"
            className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="transcript" className="text-base font-semibold">
                      Webinar Transcript / Content Source
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Video className="w-3.5 h-3.5" />
                        Upload Video (MVP)
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="video/mp4,video/quicktime,video/webm"
                        onChange={handleVideoUpload}
                      />
                    </div>
                  </div>

                  {selectedVideo && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{selectedVideo.name}</p>
                          <p className="text-xs text-slate-500">{(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={handleUseVideo} className="h-8">
                        Extract Transcript
                      </Button>
                    </div>
                  )}

                  <Textarea
                    id="transcript"
                    placeholder="Paste your transcript or a YouTube URL here..."
                    className="min-h-[300px] resize-y text-base p-4 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between gap-4 mt-2">
                  <p className="text-xs text-slate-500 italic flex items-center gap-1">
                    <Youtube className="w-3 h-3 text-red-500" />
                    YouTube links fetch captions automatically.
                  </p>
                  <p className="text-xs text-slate-500">
                    Generates <span className="font-medium text-slate-700">10 LinkedIn</span> +{" "}
                    <span className="font-medium text-slate-700">10 X</span> +{" "}
                    <span className="font-medium text-slate-700">3 Blog outlines</span> every time.
                  </p>
                </div>
              </div>

              <div id="results-section" className="space-y-4">
                {activeContent && activeTab === "generate" && !generateMutation.isPending ? (
                  <>
                    <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <div className="text-sm text-indigo-700 font-medium">
                        {activeContent.createdAt
                          ? `Viewing version from ${new Date(activeContent.createdAt).toLocaleString()}`
                          : "Latest Generation Result"}
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleDownloadJson} className="text-indigo-600 h-8">
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download JSON
                      </Button>
                    </div>
                    <ContentOutput content={activeContent} />
                  </>
                ) : !generateMutation.isPending ? (
                  <ContentOutput content={undefined} />
                ) : null}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
                <h3 className="font-semibold text-slate-900 mb-2">Generation</h3>
                <p className="text-sm text-slate-500">
                  ReContent always generates all outputs. Your client can use whichever pieces they want.
                </p>

                {usage && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm text-slate-600">
                      <div className="flex justify-between gap-4">
                        <span>Plan</span>
                        <span className="font-semibold text-slate-900 capitalize">{planId}</span>
                      </div>
                      <div className="flex justify-between gap-4 mt-2">
                        <span>Generations</span>
                        <span className="font-semibold text-slate-900">
                          {generationsUsed} / {generationsLimit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {generationLimitReached && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-medium text-amber-900">Monthly limit reached</p>
                    <p className="text-sm text-amber-800 mt-1">
                      You’ve reached your monthly generation limit on the Starter plan. Upgrade to continue.
                    </p>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <Button
                    className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleGenerate}
                    disabled={generateDisabled}
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : generationLimitReached ? (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Monthly Limit Reached
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>

                  {!generationLimitReached && transcriptIsEmpty && (
                    <p className="mt-3 text-xs text-slate-500">
                      Paste a transcript or YouTube URL to enable generation.
                    </p>
                  )}

                  {generationLimitReached && (
                    <p className="mt-3 text-xs text-amber-700">
                      Starter includes {generationsLimit} generations per month. You’ve used all of them.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in duration-500">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Content Library</h2>
              <p className="text-sm text-slate-500">Click a run to open the full posts.</p>
            </div>

            <div className="grid gap-3">
              {generations === undefined ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-400">Loading history...</span>
                </div>
              ) : generations.length === 0 ? (
                <div className="text-center py-10 text-slate-500">No history yet. Generate some content to see it here.</div>
              ) : (
                generations.map((item: any) => {
                  const d = item?.createdAt ? new Date(item.createdAt) : null;
                  const isYoutubeRun = !!item?.youtubeUrl;

                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => fetchGeneration(item.id)}
                      className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-slate-900">
                              {d ? d.toLocaleString() : "Unknown date"}
                            </span>

                            <Badge
                              variant="secondary"
                              className={
                                isYoutubeRun
                                  ? "font-normal text-xs bg-indigo-50 text-indigo-700 border-indigo-100"
                                  : "font-normal text-xs bg-slate-100 text-slate-700 border-slate-200"
                              }
                            >
                              {isYoutubeRun ? "YouTube" : "Transcript"}
                            </Badge>
                          </div>

                          <div className="text-xs text-slate-500 mt-1">Open to view LinkedIn + X + Blog outputs</div>
                        </div>

                        <div className="shrink-0">
                          <div className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium">
                            Open <span aria-hidden="true">→</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <WorkspaceForm open={isSettingsOpen} onOpenChange={setIsSettingsOpen} initialData={workspace} />
    </Layout>
  );
}