import { useWorkspaces, useCreateWorkspace } from "@/hooks/use-workspaces";
import Layout from "@/components/Layout";
import { WorkspaceForm } from "@/components/WorkspaceForm";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Plus, Users, ArrowRight, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredWorkspaces = workspaces?.filter(w => {
    const n = (w.clientName ?? w.client_name ?? w.name ?? "").toLowerCase();
    const q = (search ?? "").toLowerCase();
    return n.includes(q);
  });

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Workspaces</h1>
          <p className="text-slate-500 mt-2">Manage your clients and their brand voices.</p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Workspace
        </Button>
      </div>

      <div className="mb-8 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <Input 
          placeholder="Search workspaces..." 
          className="pl-10 h-12 bg-white border-slate-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredWorkspaces?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No workspaces found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">
            Get started by creating your first client workspace to define their brand voice.
          </p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline">
            Create Workspace
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces?.map((workspace) => (
            <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
              <div className="cursor-pointer group">
                <Card className="h-full hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 border-slate-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg mb-4">
                        {(workspace.clientName ?? workspace.client_name ?? workspace.name ?? "W").substring(0, 1).toUpperCase()}
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600 uppercase tracking-wide">
                        {workspace.style}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-slate-900">{workspace.clientName ?? workspace.client_name ?? workspace.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-500 line-clamp-3 text-sm leading-relaxed">
                      {workspace.brandDescription || "No description provided."}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t border-slate-100 pt-4 flex justify-between items-center text-sm text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </CardFooter>
                </Card>
              </div>
            </Link>
          ))}
        </div>
      )}

      <WorkspaceForm 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
      />
    </Layout>
  );
}
