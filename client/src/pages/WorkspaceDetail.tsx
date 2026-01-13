import { useRoute } from "wouter";
import { useWorkspace, useGenerateContent, useWorkspaceContent } from "@/hooks/use-workspaces";
import Layout from "@/components/Layout";
import { ContentOutput } from "@/components/ContentOutput";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings, History, Wand2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function WorkspaceDetail() {
  const [match, params] = useRoute("/workspaces/:id");
  const id = Number(params?.id);
  
  const { data: workspace, isLoading } = useWorkspace(id);
  const { data: history } = useWorkspaceContent(id);
  const generateMutation = useGenerateContent();

  const [transcript, setTranscript] = useState("");
  const [outputs, setOutputs] = useState({
    linkedin: true,
    twitter: true,
    blog: false,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");

  if (isLoading) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
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

  const handleGenerate = async () => {
    if (!transcript) return;
    
    const selectedOutputs = Object.entries(outputs)
      .filter(([_, checked]) => checked)
      .map(([key]) => key as "linkedin" | "twitter" | "blog");

    try {
      await generateMutation.mutateAsync({
        id,
        data: {
          transcript,
          selectedOutputs,
        },
      });
      // Content output updates automatically via Query invalidation
    } catch (error) {
      // Error handled by hook
    }
  };

  const latestContent = history && history.length > 0 ? history[0] : null;

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
              {workspace.clientName}
              <Badge variant="secondary" className="font-normal text-sm bg-indigo-50 text-indigo-700 border-indigo-100">
                {workspace.style} • {workspace.boldness}
              </Badge>
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl truncate">
              {workspace.brandDescription}
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)} className="gap-2">
            <Settings className="w-4 h-4" />
            Edit Brand Details
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                <Label htmlFor="transcript" className="text-base font-semibold mb-4 block">
                  Webinar Transcript / Content Source
                </Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste your transcript here..."
                  className="min-h-[300px] resize-y text-base p-4 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                />
              </div>

              {latestContent && activeTab === "generate" && !generateMutation.isPending && (
                <ContentOutput content={latestContent} />
              )}
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
            <h2 className="text-xl font-bold text-slate-900">Generation History</h2>
            {history?.map((content) => (
              <div key={content.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm text-slate-500">
                      {new Date(content.createdAt!).toLocaleDateString()} at {new Date(content.createdAt!).toLocaleTimeString()}
                    </span>
                    <p className="mt-1 font-medium text-slate-900 line-clamp-2">
                      {content.transcript.substring(0, 100)}...
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                     // In a real app, this would load this content into view
                     // For MVP, we can just expand it in place here or scroll to it
                  }}>
                    View Results
                  </Button>
                </div>
                <ContentOutput content={content} />
              </div>
            ))}
            {history?.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                No history yet. Generate some content to see it here.
              </div>
            )}
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
