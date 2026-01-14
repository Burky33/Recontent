import { pgTable, text, serial, integer, boolean, jsonb, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";
export * from "./models/chat";

export const workspaces = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  clientName: text("client_name").notNull(),
  brandDescription: text("brand_description"),
  style: text("style"),
  boldness: text("boldness"),
  intent: text("intent"),
  sampleContent: text("sample_content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedContent = pgTable("generated_content", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id),
  transcript: text("transcript").notNull(),
  outputs: jsonb("outputs").$type<{
    linkedin?: string[];
    twitter?: string[];
    blog?: string[];
  }>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const contentGenerations = pgTable("content_generations", {
  id: serial("id").primaryKey(),
  workspaceId: integer("workspace_id").notNull().references(() => workspaces.id),
  transcript: text("transcript").notNull(),
  linkedinPosts: jsonb("linkedin_posts").$type<string[]>(),
  xThreads: jsonb("x_threads").$type<string[]>(),
  blogOutlines: jsonb("blog_outlines").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({ id: true, userId: true, createdAt: true });
export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({ id: true, createdAt: true });
export const insertContentGenerationSchema = createInsertSchema(contentGenerations).omit({ id: true, createdAt: true });

export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type ContentGeneration = typeof contentGenerations.$inferSelect;
export type InsertContentGeneration = z.infer<typeof insertContentGenerationSchema>;

export type GenerateRequest = {
  transcript: string;
  selectedOutputs: ("linkedin" | "twitter" | "blog")[];
};
