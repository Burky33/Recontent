import { z } from 'zod';
import { insertWorkspaceSchema, workspaces, generatedContent, insertGeneratedContentSchema } from './schema';

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
      method: 'GET' as const,
      path: '/api/workspaces',
      responses: {
        200: z.array(z.custom<typeof workspaces.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workspaces',
      input: insertWorkspaceSchema,
      responses: {
        201: z.custom<typeof workspaces.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workspaces/:id',
      responses: {
        200: z.custom<typeof workspaces.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/workspaces/:id',
      input: insertWorkspaceSchema.partial(),
      responses: {
        200: z.custom<typeof workspaces.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/workspaces/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/workspaces/:id/generate',
      input: z.object({
        transcript: z.string(),
        selectedOutputs: z.array(z.enum(["linkedin", "twitter", "blog"])),
      }),
      responses: {
        200: z.custom<typeof generatedContent.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    }
  },
  content: {
    list: {
      method: 'GET' as const,
      path: '/api/workspaces/:id/content',
      responses: {
        200: z.array(z.custom<typeof generatedContent.$inferSelect>()),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
