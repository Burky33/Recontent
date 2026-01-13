import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users, workspaces, generatedContent,
  type User, type InsertUser,
  type Workspace, type InsertWorkspace,
  type GeneratedContent, type InsertGeneratedContent
} from "@shared/schema";

export interface IStorage {
  // Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Workspaces
  getWorkspaces(userId: string): Promise<Workspace[]>;
  getWorkspace(id: number): Promise<Workspace | undefined>;
  createWorkspace(workspace: InsertWorkspace & { userId: string }): Promise<Workspace>;
  updateWorkspace(id: number, updates: Partial<InsertWorkspace>): Promise<Workspace>;
  deleteWorkspace(id: number): Promise<void>;

  // Content
  createGeneratedContent(content: InsertGeneratedContent): Promise<GeneratedContent>;
  getWorkspaceContent(workspaceId: number): Promise<GeneratedContent[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getWorkspaces(userId: string): Promise<Workspace[]> {
    return await db.select().from(workspaces).where(eq(workspaces.userId, userId));
  }

  async getWorkspace(id: number): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async createWorkspace(workspace: InsertWorkspace & { userId: string }): Promise<Workspace> {
    const [newWorkspace] = await db.insert(workspaces).values(workspace).returning();
    return newWorkspace;
  }

  async updateWorkspace(id: number, updates: Partial<InsertWorkspace>): Promise<Workspace> {
    const [updated] = await db.update(workspaces)
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
    return await db.select().from(generatedContent)
      .where(eq(generatedContent.workspaceId, workspaceId))
      .orderBy(generatedContent.createdAt);
  }
}

export const storage = new DatabaseStorage();
