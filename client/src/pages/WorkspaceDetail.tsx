import { useRoute } from "wouter";
import { useWorkspace, useGenerateContent } from "@/hooks/use-workspaces";
import Layout from "@/components/Layout";
import { ContentOutput } from "@/components/ContentOutput";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, History, Wand2, ArrowLeft, Download, Upload, Video, Youtube } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function WorkspaceDetail() {
  const { id: workspaceId } = useParams();
  const wid = Number(workspaceId);
  const { toast } = useToast();
  console.log(`[WorkspaceDetail] Loading workspace ID: ${wid}`);
  
  const { data: workspace, isLoading } = useWorkspace(wid);
  const generateMutation = useGenerateContent();

  const [transcript, setTranscript] = useState("");
  const [outputs, setOutputs] = useState({
    linkedin: true,
    twitter: true,
    blog: false,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedHistoricalContent, setSelectedHistoricalContent] = useState<any>(null);
  const [generations, setGenerations] = useState<any[] | undefined>(undefined);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab !== "history") return;
    if (!wid) return;

    console.log("[History] fetching for wid:", wid);

    fetch(`/api/workspaces/${wid}/generations`, { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        console.log("[History] status:", res.status, "json:", json);
        const gens = json.generations ?? [];
        setGenerations(gens);
      })
      .catch((err) => {
        console.error("[History] fetch error:", err);
        setGenerations([]);
      });
  }, [activeTab, wid]);

  const fetchGeneration = async (genId: number) => {
    try {
      const response = await fetch(`/api/generations/${genId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch generation");
      const record = await response.json();
      
      console.log("[History] Loaded full record:", record);

      const normalizeStringArray = (value: any): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
              return item.text || item.content || item.post || item.value || JSON.stringify(item);
            }
            return String(item);
          });
        }
        if (typeof value === 'string') return [value];
        return [];
      };

      const normalizedRecord = {
        ...record,
        outputs: {
          linkedin: normalizeStringArray(record.linkedin_posts || record.outputs?.linkedin),
          twitter: normalizeStringArray(record.x_threads || record.outputs?.twitter || record.outputs?.x),
          blog: normalizeStringArray(record.blog_outlines || record.outputs?.blog)
        }
      };
      
      setTranscript(record.transcript);
      setSelectedHistoricalContent(normalizedRecord);
      setActiveTab("generate");
    } catch (err) {
      console.error("[History] Error opening generation:", err);
      toast({
        title: "Error",
        description: "Failed to load the full generation record.",
        variant: "destructive"
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
          <Link href="/" className="text-indigo-600 hover:underline mt-4 block">Return home</Link>
        </div>
      </Layout>
    );
  }

  const workspaceName = workspace?.clientName ?? "Untitled workspace";
  const workspaceStyle = workspace?.style ?? "professional";
  const workspaceBoldness = workspace?.boldness ?? "moderate";
  const workspaceDescription = workspace?.brandDescription ?? "No description provided.";

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
    }
  };

  const handleUseVideo = () => {
    if (!selectedVideo) return;
    
    setTranscript("(Placeholder transcript) This is where the video transcript will appear once transcription is enabled.");
    toast({
      title: "Video Selected",
      description: "Video transcription will be enabled in the next step.",
    });
  };

  const handleGenerate = async () => {
    if (!transcript || transcript.trim().length === 0) {
      toast({
        title: "Error",
        description: "Please provide a transcript or content source first.",
        variant: "destructive"
      });
      return;
    }
    
    let finalTranscript = transcript;
    let transcriptSource = "pasted";
    let youtubeUrl = null;

    const isYoutube = transcript.trim().startsWith("http") && (transcript.includes("youtube.com") || transcript.includes("youtu.be"));

    if (isYoutube) {
      try {
        toast({
          title: "Fetching captions",
          description: "We're pulling the transcript from YouTube...",
        });
        
        const res = await fetch("/api/transcribe/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: transcript.trim() }),
          credentials: "include"
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to fetch YouTube transcript");
        }

        const data = await res.json();
        if (!data.transcriptText || data.transcriptText.trim().length === 0) {
          throw new Error("No captions found for this video. Please paste the transcript manually.");
        }
        finalTranscript = data.transcriptText;
        transcriptSource = "captions";
        youtubeUrl = transcript.trim();
        
        setTranscript(finalTranscript);
      } catch (error: any) {
        toast({
          title: "YouTube fetch failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
    }

    const selectedOutputs = Object.entries(outputs)
      .filter(([_, checked]) => checked)
      .map(([key]) => key as "linkedin" | "twitter" | "blog");

    try {
      const result = await generateMutation.mutateAsync({
        id: wid,
        data: {
          transcript: finalTranscript,
          selectedOutputs,
          youtubeUrl,
          transcriptSource
        },
      });
      console.log("Generate response", result);
      
      const newGeneration = result.generation || result;
      setSelectedHistoricalContent(newGeneration);
      setTranscript(newGeneration.transcript || finalTranscript);
      
      // Ensure we stay on the generate tab to show results
      setActiveTab("generate");

      // Scroll to results
      setTimeout(() => {
        const resultsHeader = document.getElementById('results-section');
        if (resultsHeader) {
          resultsHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      // If we're on the history tab, this will refresh it, though we usually generate from the generate tab
      if (activeTab === "history") {
        fetch(`/api/workspaces/${wid}/generations`, { credentials: "include" })
          .then(async (res) => {
            const json = await res.json();
            setGenerations(json.generations ?? []);
          });
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 mb-4 transition-colors">
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
            <p className="text-slate-500 mt-2 max-w-2xl truncate">
              {workspaceDescription}
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2">
            <Settings className="w-4 h-4" />
            Edit Brand Details
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="generate" 
        value={activeTab} 
        onValueChange={(val) => {
          console.log("[History] Tab changing to:", val);
          setActiveTab(val);
        }} 
        className="space-y-6"
      >
        <TabsList className="bg-white p-1 border border-slate-200 rounded-xl">
          <TabsTrigger value="generate" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Input Section */}
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
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-3">
                        <Video className="w-5 h-5 text-indigo-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{selectedVideo.name}</p>
                          <p className="text-xs text-slate-500">{(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={handleUseVideo} className="h-8">Extract Transcript</Button>
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
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-xs text-slate-500 italic flex items-center gap-1">
                    <Youtube className="w-3 h-3 text-red-500" />
                    YouTube links fetch captions automatically.
                  </p>
                  <p className="text-xs text-slate-500 italic flex items-center gap-1">
                    <Video className="w-3 h-3 text-indigo-500" />
                    Upload Video generates a placeholder transcript.
                  </p>
                </div>
                {transcript.length > 0 && transcript.length < 500 && !transcript.includes("placeholder") && (
                  <p className="mt-2 text-sm text-amber-600 font-medium animate-in fade-in slide-in-from-top-1 duration-300">
                    Transcript is short — results may be generic. Paste more for better outputs.
                  </p>
                )}
              </div>

              <div id="results-section" className="space-y-4">
                {activeContent && activeTab === "generate" && !generateMutation.isPending ? (
                  <>
                    <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-4">
                        {selectedHistoricalContent && (
                          <span className="text-sm text-indigo-700 font-medium">
                            {selectedHistoricalContent.createdAt ? `Viewing version from ${new Date(selectedHistoricalContent.createdAt).toLocaleString()}` : 'Latest Generation Result'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={handleDownloadJson} className="text-indigo-600 h-8">
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download JSON
                        </Button>
                        {selectedHistoricalContent && generations?.some(g => g.id === selectedHistoricalContent.id) && (
                          <Button variant="ghost" size="sm" onClick={() => setSelectedHistoricalContent(null)} className="text-indigo-600 h-8">
                            Back to latest
                          </Button>
                        )}
                      </div>
                    </div>
                    <ContentOutput content={activeContent} />
                  </>
                ) : !generateMutation.isPending && (
                  <ContentOutput content={undefined} />
                )}
              </div>
            </div>

            {/* Controls Section */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6">
                <h3 className="font-semibold text-slate-900 mb-4">Output Options</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <Checkbox 
                      id="linkedin" 
                      checked={outputs.linkedin}
                      onCheckedChange={(c) => setOutputs(p => ({ ...p, linkedin: !!c }))}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="linkedin" className="font-medium cursor-pointer">
                        LinkedIn Posts
                      </Label>
                      <p className="text-sm text-slate-500">
                        Generates ~15 varied posts optimized for engagement.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <Checkbox 
                      id="twitter" 
                      checked={outputs.twitter}
                      onCheckedChange={(c) => setOutputs(p => ({ ...p, twitter: !!c }))}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="twitter" className="font-medium cursor-pointer">
                        X Threads
                      </Label>
                      <p className="text-sm text-slate-500">
                        Generates ~5 threads broken down into tweets.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <Checkbox 
                      id="blog" 
                      checked={outputs.blog}
                      onCheckedChange={(c) => setOutputs(p => ({ ...p, blog: !!c }))}
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="blog" className="font-medium cursor-pointer">
                        Blog Outlines
                      </Label>
                      <p className="text-sm text-slate-500">
                        Generates 3 SEO-friendly article structures.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <Button 
                    className="w-full h-12 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !transcript}
                  >
                    {generateMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="animate-in fade-in duration-500">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">Content Library</h2>
            <div className="grid gap-4">
              {generations === undefined ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-400">Loading history...</span>
                </div>
              ) : generations.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No history yet. Generate some content to see it here.
                </div>
              ) : (
                generations.map((item: any) => (
                  <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-6 hover:border-indigo-200 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {new Date(item.createdAt!).toLocaleDateString()} at {new Date(item.createdAt!).toLocaleTimeString()}
                        </span>
                        {item.youtubeUrl && (
                          <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-100">
                            YouTube
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {item.youtubeUrl ? "From YouTube: " : ""}
                        {item.transcriptPreview || (typeof item.transcript === 'string' ? item.transcript.substring(0, 100) : 'No preview available')}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchGeneration(item.id)}
                      className="shrink-0"
                    >
                      Open
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <WorkspaceForm 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
        initialData={workspace}
      />
    </Layout>
  );
}
