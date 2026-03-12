import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  workspaces,
  generatedContent,
  contentGenerations,
  planIntentLogs,
  type Workspace,
  type InsertWorkspace,
  type GeneratedContent,
  type InsertGeneratedContent,
  type ContentGeneration,
  type InsertContentGeneration,
  type PlanIntentLog,
  type InsertPlanIntentLog,
} from "./shared/schema";

export interface IStorage {
  // Workspaces
  getWorkspaces(userId: string): Promise<Workspace[]>;
  getWorkspace(id: number): Promise<Workspace | undefined>;
  createWorkspace(workspace: InsertWorkspace & { userId: string }): Promise<Workspace>;
  updateWorkspace(id: number, updates: Partial<InsertWorkspace>): Promise<Workspace>;
  deleteWorkspace(id: number): Promise<void>;

  // Content
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  getWorkspaceContent(workspaceId: number): Promise<GeneratedContent[]>;

  // Content Generations (History)
  createContentGeneration(generation: InsertContentGeneration): Promise<ContentGeneration>;
  getContentGenerations(workspaceId: number): Promise<ContentGeneration[]>;
  getWorkspaceGenerations(workspaceId: number): Promise<ContentGeneration[]>;
  getContentGeneration(id: number): Promise<ContentGeneration | undefined>;

  // Intent Logs
  logPlanIntent(intent: InsertPlanIntentLog): Promise<PlanIntentLog>;
}

export class DatabaseStorage implements IStorage {
  async getWorkspaces(userId: string): Promise<Workspace[]> {
    const result = await db.select().from(workspaces).where(eq(workspaces.userId, userId));
    return result;
  }

  async getWorkspace(id: number): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async createWorkspace(workspace: InsertWorkspace & { userId: string }): Promise<Workspace> {
    try {
      const [newWorkspace] = await db.insert(workspaces).values(workspace).returning();
      return newWorkspace;
    } catch (err) {
      console.error("Error creating workspace in storage:", err);
      throw new Error("Failed to create workspace in database");
    }
  }

  async updateWorkspace(id: number, updates: Partial<InsertWorkspace>): Promise<Workspace> {
    const [updated] = await db
      .update(workspaces)
      .set(updates)
      .where(eq(workspaces.id, id))
      .returning();
    return updated;
  }

  async deleteWorkspace(id: number): Promise<void> {
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  async createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent> {
    const [newContent] = await db.insert(generatedContent).values(content).returning();
    return newContent;
  }

  async getWorkspaceContent(workspaceId: number): Promise<GeneratedContent[]> {
    const result = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.workspaceId, workspaceId))
      .orderBy(generatedContent.createdAt);
    return result;
  }

  async createContentGeneration(generation: InsertContentGeneration): Promise<ContentGeneration> {
    const [newGen] = await db.insert(contentGenerations).values(generation).returning();
    return newGen;
  }

  async getContentGenerations(workspaceId: number): Promise<ContentGeneration[]> {
    const result = await db
      .select()
      .from(contentGenerations)
      .where(eq(contentGenerations.workspaceId, workspaceId))
      .orderBy(desc(contentGenerations.createdAt));
    return result;
  }

  // keep this as an alias so older code still works
  async getWorkspaceGenerations(workspaceId: number): Promise<ContentGeneration[]> {
    return this.getContentGenerations(workspaceId);
  }

  async getContentGeneration(id: number): Promise<ContentGeneration | undefined> {
    const [result] = await db
      .select()
      .from(contentGenerations)
      .where(eq(contentGenerations.id, id));

    return result;
  }

  async logPlanIntent(intent: InsertPlanIntentLog): Promise<PlanIntentLog> {
    const [newLog] = await db.insert(planIntentLogs).values(intent).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();