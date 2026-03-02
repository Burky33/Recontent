import type { Express } from "express";
import { z } from "zod";

import {
  workspaces,
  generatedContent,
  insertWorkspaceSchema,
  insertGeneratedContentSchema,
} from "./schema";
import { db } from "./db"; // adjust if your db file is named differently
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  // GET /api/workspaces
  app.get(api.workspaces.list.path, async (_req, res) => {
    const data = await db.select().from(workspaces);
    res.json(data);
  });

  // POST /api/workspaces
  app.post(api.workspaces.create.path, async (req, res) => {
    const parsed = insertWorkspaceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const [created] = await db
      .insert(workspaces)
      .values(parsed.data)
      .returning();

    res.status(201).json(created);
  });

  // GET /api/workspaces/:id
  app.get(api.workspaces.get.path, async (req, res) => {
    const id = Number(req.params.id);

    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);
  });

  // PATCH /api/workspaces/:id
  app.patch(api.workspaces.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const parsed = insertWorkspaceSchema.partial().safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const [updated] = await db
      .update(workspaces)
      .set(parsed.data)
      .where(eq(workspaces.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(updated);
  });

  // DELETE /api/workspaces/:id
  app.delete(api.workspaces.delete.path, async (req, res) => {
    const id = Number(req.params.id);

    await db.delete(workspaces).where(eq(workspaces.id, id));

    res.status(204).send();
  });

  // POST /api/workspaces/:id/generate
  app.post(api.workspaces.generate.path, async (req, res) => {
    const id = Number(req.params.id);

    const inputSchema = z.object({
      transcript: z.string(),
      selectedOutputs: z.array(z.enum(["linkedin", "twitter", "blog"])),
    });

    const parsed = inputSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const [created] = await db
      .insert(generatedContent)
      .values({
        workspaceId: id,
        transcript: parsed.data.transcript,
        outputs: parsed.data.selectedOutputs,
      })
      .returning();

    res.json(created);
  });

  // GET /api/workspaces/:id/content
  app.get(api.content.list.path, async (req, res) => {
    const id = Number(req.params.id);

    const content = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.workspaceId, id));

    res.json(content);
  });
}