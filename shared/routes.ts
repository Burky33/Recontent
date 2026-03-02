import { z } from "zod";
import {
  insertWorkspaceSchema,
  workspaces,
  generatedContent,
  insertGeneratedContentSchema,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  workspaces: {
    list: {
      method: "GET" as const,
      path: "/api/workspaces",
      responses: {
        200: z.array(z.custom<typeof workspaces.$inferSelect>()),
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/workspaces",
      input: insertWorkspaceSchema,
      responses: {
        201: z.custom<typeof workspaces.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },

    get: {
      method: "GET" as const,
      path: "/api/workspaces/:id",
      params: z.object({ id: z.string() }),
      responses: {
        200: z.custom<typeof workspaces.$inferSelect>(),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },

    update: {
      method: "PATCH" as const,
      path: "/api/workspaces/:id",
      params: z.object({ id: z.string() }),
      input: insertWorkspaceSchema.partial(),
      responses: {
        200: z.custom<typeof workspaces.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },

    delete: {
      method: "DELETE" as const,
      path: "/api/workspaces/:id",
      params: z.object({ id: z.string() }),
      responses: {
        204: z.null(),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },

    generate: {
      method: "POST" as const,
      path: "/api/workspaces/:id/generate",
      params: z.object({ id: z.string() }),
      input: z.object({
        transcript: z.string().min(1),
        selectedOutputs: z.array(z.enum(["linkedin", "twitter", "blog"])),
      }),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        401: z.object({ error: z.string() }),
        402: z.object({ error: z.string() }),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },
  },

  content: {
    list: {
      method: "GET" as const,
      path: "/api/workspaces/:id/content",
      params: z.object({ id: z.string() }),
      responses: {
        200: z.array(z.custom<typeof generatedContent.$inferSelect>()),
        404: errorSchemas.notFound,
        500: errorSchemas.internal,
      },
    },

    create: {
      method: "POST" as const,
      path: "/api/content",
      input: insertGeneratedContentSchema,
      responses: {
        201: z.custom<typeof generatedContent.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
  },
} as const;