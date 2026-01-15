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

import { YoutubeTranscript } from 'youtube-transcript';

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerImageRoutes(app);

  // YouTube Transcription
  app.post("/api/transcribe/youtube", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ message: "URL is required" });

      console.log("[YOUTUBE] Transcribing:", url);
      
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      const transcriptText = transcript.map(t => t.text).join(" ");

      res.json({ 
        transcriptText,
        source: "captions"
      });
    } catch (err: any) {
      console.error("[YOUTUBE] Error:", err);
      res.status(422).json({ 
        message: "No captions available for this video. Please paste a transcript instead." 
      });
    }
  });

  // Workspaces
  app.get(api.workspaces.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
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
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
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
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);
    res.json(workspace);
  });

  app.patch(api.workspaces.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    const updated = await storage.updateWorkspace(workspace.id, req.body);
    res.json(updated);
  });

  app.delete(api.workspaces.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    await storage.deleteWorkspace(workspace.id);
    res.sendStatus(204);
  });

  // Content Generation
  app.post(api.workspaces.generate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
    
    const workspaceId = parseInt(req.params.id);
    console.log("[GENERATE] Full request body:", JSON.stringify(req.body));
    console.log("[GENERATE] workspaceId:", workspaceId, "userId:", userId);
    
    try {
      const { transcript, selectedOutputs, youtubeUrl, transcriptSource } = req.body;

      // 2. Validate required fields
      if (!transcript || transcript.trim().length === 0) {
        return res.status(400).json({ error: "No transcript provided" });
      }

      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }

      if (workspace.userId !== userId) return res.sendStatus(403);

      if (!selectedOutputs || !Array.isArray(selectedOutputs) || selectedOutputs.length === 0) {
        return res.status(400).json({ error: "No output formats selected" });
      }

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

      console.log("[GENERATE] Calling OpenAI...");
      let completion;
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" }
        });
      } catch (openAiErr: any) {
        console.error("[GENERATE] OpenAI API error:", openAiErr);
        return res.status(500).json({ error: openAiErr.message });
      }

      console.log("[GENERATE] OpenAI Response:", completion.choices[0].message.content);
      const content = JSON.parse(completion.choices[0].message.content || "{}");
      
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

      const normalizeThreads = (value: any): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value.map(thread => {
            if (Array.isArray(thread)) {
              return thread.map(tweet => {
                if (typeof tweet === 'string') return tweet;
                if (typeof tweet === 'object' && tweet !== null) {
                  return tweet.text || tweet.content || tweet.value || JSON.stringify(tweet);
                }
                return String(tweet);
              }).join("\n\n");
            }
            if (typeof thread === 'object' && thread !== null) {
              const tweets = thread.tweets || thread.content || thread.value;
              if (Array.isArray(tweets)) {
                return tweets.map((t: any) => {
                  if (typeof t === 'string') return t;
                  if (typeof t === 'object' && t !== null) return t.text || t.content || t.value || JSON.stringify(t);
                  return String(t);
                }).join("\n\n");
              }
              return thread.text || thread.content || thread.post || thread.value || JSON.stringify(thread);
            }
            return String(thread);
          });
        }
        return [];
      };

      const formattedOutputs = {
        linkedin: normalizeStringArray(content.linkedin),
        twitter: normalizeThreads(content.twitter),
        blog: normalizeStringArray(content.blog)
      };
      
      console.log("[GENERATE] Saving generation for workspace", workspaceId);
      
      // Save to history
      const savedGeneration = await storage.createContentGeneration({
        workspaceId,
        transcript,
        youtubeUrl: youtubeUrl || null,
        transcriptSource: transcriptSource || "pasted",
        linkedinPosts: formattedOutputs.linkedin,
        xThreads: formattedOutputs.twitter,
        blogOutlines: formattedOutputs.blog
      });

      console.log("[GENERATE] saved generation id:", savedGeneration.id);

      res.json({ generation: savedGeneration });

    } catch (err: any) {
      console.error("[GENERATE] Unexpected error:", err);
      res.status(500).json({ 
        error: err.message || "An unexpected error occurred"
      });
    }
  });

  app.get("/api/workspaces/:id/generations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
    const workspaceId = parseInt(req.params.id);
    
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    const rows = await storage.getWorkspaceGenerations(workspaceId);
    console.log("[HISTORY] workspaceId:", workspaceId, "rows:", rows.length);
    
    const previews = rows.map(item => ({
      id: item.id,
      createdAt: item.createdAt,
      youtubeUrl: item.youtubeUrl,
      transcriptPreview: item.transcript.substring(0, 100),
      transcript: item.transcript
    }));
    res.json({ generations: previews });
  });

  app.get("/api/generations/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as any;
    const userId = user.id || user.claims?.sub;
    const genId = parseInt(req.params.id);
    
    const [generation] = await storage.getContentGeneration(genId);
    if (!generation) return res.status(404).send({ message: "Generation not found" });
    
    const workspace = await storage.getWorkspace(generation.workspaceId);
    if (!workspace || workspace.userId !== userId) return res.sendStatus(403);

    res.json({
      id: generation.id,
      workspaceId: generation.workspaceId,
      createdAt: generation.createdAt,
      transcript: generation.transcript,
      linkedin_posts: generation.linkedinPosts,
      x_threads: generation.xThreads,
      blog_outlines: generation.blogOutlines
    });
  });

  return httpServer;
}
