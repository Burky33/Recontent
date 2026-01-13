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
    const workspaces = await storage.getWorkspaces(req.user!.id);
    res.json(workspaces);
  });

  app.post(api.workspaces.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const input = api.workspaces.create.input.parse(req.body);
      const workspace = await storage.createWorkspace({ ...input, userId: req.user!.id });
      res.status(201).json(workspace);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json(err.errors);
      } else {
        throw err;
      }
    }
  });

  app.get(api.workspaces.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== req.user!.id) return res.sendStatus(403);
    res.json(workspace);
  });

  app.patch(api.workspaces.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== req.user!.id) return res.sendStatus(403);

    const updated = await storage.updateWorkspace(workspace.id, req.body);
    res.json(updated);
  });

  app.delete(api.workspaces.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== req.user!.id) return res.sendStatus(403);

    await storage.deleteWorkspace(workspace.id);
    res.sendStatus(204);
  });

  // Content Generation
  app.post(api.workspaces.generate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const workspaceId = parseInt(req.params.id);
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== req.user!.id) return res.sendStatus(403);

    try {
      const { transcript, selectedOutputs } = api.workspaces.generate.input.parse(req.body);

      // AI Generation Logic
      const systemPrompt = `You are an expert marketing copywriter. 
      Brand Name: ${workspace.name}
      Brand Description: ${workspace.brandDescription}
      Tone: ${workspace.toneSettings.style}, ${workspace.toneSettings.boldness}, ${workspace.toneSettings.intent}.
      
      Your task is to repurpose the provided transcript into specific content formats.
      Return ONLY valid JSON with keys corresponding to the requested outputs.
      Example format:
      {
        "linkedin": ["post 1", "post 2"],
        "twitter": ["thread tweet 1", "thread tweet 2"],
        "blog": ["outline 1"]
      }`;

      const userPrompt = `Repurpose this transcript into the following formats: ${selectedOutputs.join(", ")}.
      
      Requirements:
      - LinkedIn: 15 posts if requested.
      - Twitter: 5 threads if requested.
      - Blog: 3 outlines if requested.
      
      Transcript:
      ${transcript.slice(0, 15000)} // Truncate to avoid token limits
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      });

      const content = JSON.parse(completion.choices[0].message.content || "{}");
      
      const savedContent = await storage.createGeneratedContent({
        workspaceId,
        transcript,
        outputs: content
      });

      res.json(savedContent);

    } catch (err) {
      console.error("AI Generation error:", err);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  app.get(api.content.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const workspaceId = parseInt(req.params.id);
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace || workspace.userId !== req.user!.id) return res.sendStatus(403);

    const content = await storage.getWorkspaceContent(workspaceId);
    res.json(content);
  });

  return httpServer;
}
