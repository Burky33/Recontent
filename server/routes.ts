import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, registerAuthRoutes } from "./auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI - it will automatically use env vars set by Replit
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // Workspaces
  app.get(api.workspaces.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id || req.user!.claims?.sub;
    const workspaces = await storage.getWorkspaces(userId);
    res.json(workspaces);
  });

  app.post(api.workspaces.create.path, async (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    console.log(`[Workspace Create] Auth status: ${isAuthenticated}`);
    console.log(`[Workspace Create] req.user:`, JSON.stringify(req.user));
    
    if (!isAuthenticated || !req.user) {
      return res.status(401).json({ 
        error: "Authentication required", 
        message: "You must be logged in to create a workspace" 
      });
    }

    // Replit Auth OIDC strategy usually puts the ID in sub
    const userId = req.user.id || req.user.claims?.sub;
    console.log(`[Workspace Create] Derived User ID: ${userId}`);

    if (!userId) {
      console.error("[Workspace Create] User ID missing from authenticated user object");
      return res.status(401).json({ 
        error: "Authentication error", 
        message: "User ID not found in session. Please log in again." 
      });
    }
    
    try {
      const input = api.workspaces.create.input.parse(req.body);
      console.log(`[Workspace Create] Payload:`, JSON.stringify(input));
      
      const workspace = await storage.createWorkspace({ ...input, userId });
      res.status(201).json(workspace);
    } catch (err: any) {
      console.error("[Workspace Create] Error details:", {
        message: err.message,
        code: err.code,
        detail: err.detail,
        constraint: err.constraint,
        stack: err.stack
      });

      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid input", 
          message: "Please check the provided fields",
          details: err.errors 
        });
      }
      
      res.status(500).json({ 
        error: "Database error", 
        message: "An unexpected error occurred while creating the workspace",
        details: err.message || String(err)
      });
    }
  });

  app.get(api.workspaces.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id || req.user!.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);
    res.json(workspace);
  });

  app.patch(api.workspaces.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id || req.user!.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    const updated = await storage.updateWorkspace(workspace.id, req.body);
    res.json(updated);
  });

  app.delete(api.workspaces.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id || req.user!.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    await storage.deleteWorkspace(workspace.id);
    res.sendStatus(204);
  });

  // Content Generation
  app.post(api.workspaces.generate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id || req.user!.claims?.sub;
    
    const workspaceId = parseInt(req.params.id);
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    try {
      const { transcript, selectedOutputs } = api.workspaces.generate.input.parse(req.body);

      // AI Generation Logic
      const systemPrompt = `You are a senior content strategist writing for a specific client brand.

Client brand description:
${workspace.brandDescription}

Tone settings:
${workspace.style}, ${workspace.boldness}, ${workspace.intent}

Sample brand content:
${workspace.sampleContent || "No sample content provided."}

Source content:
{{webinar_transcript}}

Instructions:
- Write in a natural, human, non-AI voice
- Stay fully aligned with the brand tone
- Avoid repetition across outputs
- Prioritise clarity, authority, and engagement
- Do not sound like generic AI marketing copy

Generate:

1) 15 LinkedIn posts  
   - Mix short, medium and long  
   - Use hooks, bullets, storytelling, and insights  
   - No two posts should feel the same  

2) 5 X threads  
   - 5–8 tweets per thread  
   - Strong opening hooks  
   - Educational + opinionated  

3) 3 blog outlines  
   - SEO-friendly  
   - Clear H2/H3 structure  
   - Based on webinar themes  

Return output grouped by platform with clear headings. Return ONLY valid JSON with keys corresponding to the requested outputs (linkedin, twitter, blog).`;

      const userPrompt = `Source content (Transcript):
${transcript.slice(0, 15000)}

Repurpose this transcript into the following formats: ${selectedOutputs.join(", ")}.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(completion.choices[0].message.content || "{}");
      
      const formattedOutputs = {
        linkedin: Array.isArray(content.linkedin) ? content.linkedin.map(String) : [],
        twitter: Array.isArray(content.twitter) ? content.twitter.map((t: any) => 
          Array.isArray(t) ? t.map(String).join("\n\n") : String(t)
        ) : [],
        blog: Array.isArray(content.blog) ? content.blog.map(String) : []
      };
      
      // Save to history
      await storage.createContentGeneration({
        workspaceId,
        transcript,
        linkedinPosts: formattedOutputs.linkedin,
        xThreads: formattedOutputs.twitter,
        blogOutlines: formattedOutputs.blog
      });

      const savedContent = await storage.createGeneratedContent({
        workspaceId,
        transcript,
        outputs: formattedOutputs
      });

      res.json(savedContent);

    } catch (err) {
      console.error("AI Generation error:", err);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  app.get("/api/workspaces/:id/generations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id || req.user!.claims?.sub;
    const workspaceId = parseInt(req.params.id);
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace || workspace.userId !== userId) return res.sendStatus(403);

    const content = await storage.getWorkspaceGenerations(workspaceId);
    const previews = content.map(item => ({
      id: item.id,
      createdAt: item.createdAt,
      transcriptPreview: item.transcript.substring(0, 100)
    }));
    res.json(previews);
  });

  app.get("/api/generations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = req.user!.id || req.user!.claims?.sub;
    const genId = parseInt(req.params.id);
    
    // We need to verify workspace ownership. 
    // Since storage doesn't have a direct getGeneration method yet, we'll use a raw query or add it to storage.
    // For now, let's assume storage.getWorkspaceGenerations can be filtered or we add a new method.
    // Actually, looking at storage.ts, I'll add getContentGeneration to IStorage.
    const [generation] = await db.select().from(contentGenerations).where(eq(contentGenerations.id, genId));
    if (!generation) return res.status(404).send({ message: "Generation not found" });
    
    const workspace = await storage.getWorkspace(generation.workspaceId);
    if (!workspace || workspace.userId !== userId) return res.sendStatus(403);

    res.json(generation);
  });

  return httpServer;
}
