import { supabase } from "./lib/supabase"; // adjust path if needed
import type { Express } from "express";
import type { Server } from "http";

import { storage } from "./storage";
import { Sentry } from "./sentry";

import { z } from "zod";
import OpenAI from "openai";
import Stripe from "stripe";
import { YoutubeTranscript } from "youtube-transcript";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { AssemblyAI } from "assemblyai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const assembly = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

const uploadsDir = path.resolve(process.cwd(), "tmp_uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 1024 * 1024 * 500, // 500MB
  },
  fileFilter: (_req, file, cb) => {
    const isAllowed =
      file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/");

    if (!isAllowed) {
      return cb(new Error("Only audio and video files are allowed."));
    }

    cb(null, true);
  },
});

type PlanId = "trial" | "starter" | "pro";

type Entitlements = {
  planId: PlanId;
  maxWorkspaces: number;
  maxGenerationsPerMonth: number;
  maxGenerationsLifetime?: number | null;
};

const PLAN_ENTITLEMENTS: Record<PlanId, Entitlements> = {
  trial: {
    planId: "trial",
    maxWorkspaces: 1,
    maxGenerationsPerMonth: 0,
    maxGenerationsLifetime: 1,
  },
  starter: {
    planId: "starter",
    maxWorkspaces: 1,
    maxGenerationsPerMonth: 3,
    maxGenerationsLifetime: null,
  },
  pro: {
    planId: "pro",
    maxWorkspaces: 5,
    maxGenerationsPerMonth: 15,
    maxGenerationsLifetime: null,
  },
};

const GENERATION_ENABLED =
  String(process.env.GENERATION_ENABLED ?? "true").toLowerCase() !== "false";

const MAX_TRANSCRIPT_CHARS = Number(process.env.MAX_TRANSCRIPT_CHARS ?? 60000);
const GENERATE_RATE_LIMIT_WINDOW_MS = Number(
  process.env.RATE_LIMIT_WINDOW_MS ?? 10 * 60 * 1000
);
const GENERATE_RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? 5);

const generateRateLimitStore = new Map<string, number[]>();

function monthBucketUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function normalizePlanId(value: unknown): PlanId {
  if (value === "trial" || value === "starter" || value === "pro") {
    return value;
  }
  return "trial";
}

function entitlementsForPlan(planId: PlanId): Entitlements {
  return PLAN_ENTITLEMENTS[normalizePlanId(planId)];
}

async function resolveEntitlements(userId: string): Promise<Entitlements> {
  const { data: override } = await supabaseAdmin
    .from("admin_overrides")
    .select("force_plan_id, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (override?.force_plan_id) {
    const expires = override.expires_at ? new Date(override.expires_at) : null;
    const active = !expires || expires.getTime() > Date.now();
    if (active) {
      return entitlementsForPlan(normalizePlanId(override.force_plan_id));
    }
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) {
    await supabaseAdmin
      .from("profiles")
      .insert({ user_id: userId, plan_id: "trial" });

    return entitlementsForPlan("trial");
  }

  return entitlementsForPlan(normalizePlanId(profile.plan_id));
}

/**
 * ✅ BETA BYPASS AUTH (TEMP)
 * When true, if req.user is missing we inject a stable beta user so the app works end-to-end.
 * Turn OFF later by setting BETA_BYPASS_AUTH=false (or removing it).
 */
const BETA_BYPASS_AUTH = String(process.env.BETA_BYPASS_AUTH ?? "").toLowerCase() === "true";

// -------------------------
// Auth helpers
// -------------------------
function getUserIdentity(req: any) {
  const user = req.user as any;
  const userId = user?.id || user?.claims?.sub;
  const emailRaw = user?.email || user?.claims?.email;
  const email = emailRaw ? String(emailRaw).toLowerCase() : null;
  return { user, userId, email };
}

function requireUser(req: any, res: any) {
  if (!req.user) {
    res.status(401).json({ error: "Not logged in" });
    return false;
  }
  return true;
}

function getRequestId(req: any) {
  const existing = req.headers["x-request-id"];
  if (typeof existing === "string" && existing.trim()) return existing.trim();
  return crypto.randomUUID();
}

function getClientIp(req: any) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function getAppBaseUrl(req: any) {
  const envBase =
    process.env.APP_URL ||
    process.env.CLIENT_URL ||
    process.env.PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (envBase && String(envBase).trim()) {
    const base = String(envBase).trim();
    return base.startsWith("http") ? base.replace(/\/+$/, "") : `https://${base.replace(/\/+$/, "")}`;
  }

  const origin = req.headers.origin;
  if (typeof origin === "string" && origin.trim()) {
    return origin.replace(/\/+$/, "");
  }

  const host = req.headers.host;
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto =
    typeof protoHeader === "string" && protoHeader.trim()
      ? protoHeader.split(",")[0].trim()
      : "https";

  if (typeof host === "string" && host.trim()) {
    return `${proto}://${host.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

function jsonError(
  res: any,
  status: number,
  code: string,
  message: string,
  requestId: string,
  extra: Record<string, any> = {}
) {
  return res.status(status).json({
    code,
    message,
    requestId,
    ...extra,
  });
}

function transcriptLength(value: unknown) {
  return typeof value === "string" ? value.trim().length : 0;
}

function enforceGenerateRateLimit(key: string) {
  const now = Date.now();
  const windowStart = now - GENERATE_RATE_LIMIT_WINDOW_MS;
  const existing = generateRateLimitStore.get(key) ?? [];
  const recent = existing.filter((ts) => ts > windowStart);

  if (recent.length >= GENERATE_RATE_LIMIT_MAX) {
    generateRateLimitStore.set(key, recent);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((recent[0] + GENERATE_RATE_LIMIT_WINDOW_MS - now) / 1000)
      ),
      count: recent.length,
    };
  }

  recent.push(now);
  generateRateLimitStore.set(key, recent);

  return {
    allowed: true,
    retryAfterSeconds: 0,
    count: recent.length,
  };
}

function logEvent(event: string, payload: Record<string, any>) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...payload,
    })
  );
}

function captureSentryException(
  err: any,
  context: {
    area: string;
    userId?: string | null;
    email?: string | null;
    workspaceId?: number | null;
    requestId?: string | null;
    transcriptSize?: number | null;
    repairAttempts?: number | null;
    durationMs?: number | null;
    [key: string]: any;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag("area", context.area);

    if (context.workspaceId !== undefined && context.workspaceId !== null) {
      scope.setTag("workspaceId", String(context.workspaceId));
    }

    if (context.requestId) {
      scope.setTag("requestId", context.requestId);
    }

    if (context.userId || context.email) {
      scope.setUser({
        id: context.userId || undefined,
        email: context.email || undefined,
      });
    }

    const {
      area,
      userId,
      email,
      workspaceId,
      requestId,
      ...extra
    } = context;

    scope.setContext("recontent", extra);
    Sentry.captureException(err);
  });
}

// -------------------------
// Workspace input schema (accepts BOTH clientName + name)
// -------------------------
const CreateWorkspaceInput = z
  .object({
    clientName: z.string().min(1).max(200).optional(),
    name: z.string().min(1).max(200).optional(),

    brandDescription: z.string().optional().nullable(),
    style: z.string().optional().nullable(),
    boldness: z.string().optional().nullable(),
    intent: z.string().optional().nullable(),
    sampleContent: z.string().optional().nullable(),

    audience: z.string().optional().nullable(),
    tone: z.string().optional().nullable(),
    brandVoice: z.string().optional().nullable(),
    dosAndDonts: z.string().optional().nullable(),
  })
  .refine((v) => Boolean((v.clientName ?? "").trim() || (v.name ?? "").trim()), {
    message: "clientName or name is required",
    path: ["clientName"],
  });

// -------------------------
// STRICT GENERATION SCHEMA + VALIDATION
// -------------------------
const GenerationSchema = z.object({
  linkedin_posts: z.array(z.string().min(1)).length(10),
  x_posts: z.array(z.string().min(1)).length(10),
  blog_outlines: z.array(z.string().min(1)).length(3),
});

type GenerationResult = z.infer<typeof GenerationSchema>;

function normalizePost(s: string) {
  return (s ?? "").replace(/\r/g, "").trim();
}

function normalizeBlogOutline(s: string) {
  let out = normalizePost(s);

  out = out.replace(/^###\s+/gm, "## ");
  out = out.replace(/^#\s+CTA\s*$/gmi, "## CTA");
  out = out.replace(/^##\s+Call to Action\s*$/gmi, "## CTA");

  return out.trim();
}

function coerceToThree(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  const cleaned = arr
    .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
    .map(normalizePost)
    .filter(Boolean);

  return cleaned.slice(0, 3);
}

function ensureRequiredBlogSections(outline: string) {
  let s = normalizeBlogOutline(outline);

  const hasExamples =
    /##\s+(examples?|real[-\s]?world examples?|case studies?|case[-\s]?study|scenarios?|templates?|proof|results)\b/i.test(s);

  const hasFaqOrMistakes =
    /##\s+(faqs?|frequently asked questions|common mistakes|mistakes|common errors|errors)\b/i.test(s);

  const ctaIndex = s.search(/^##\s+CTA\s*$/im);

  const insertAt = (block: string) => {
    if (ctaIndex >= 0) {
      const before = s.slice(0, ctaIndex).trimEnd();
      const after = s.slice(ctaIndex).trimStart();
      s = `${before}\n\n${block}\n\n${after}`.trim();
    } else {
      s = `${s}\n\n${block}`.trim();
    }
  };

  if (!hasExamples) {
    insertAt(
      `## Examples
- Example 1: Apply the transcript’s core idea to a real scenario and show the steps.
- Example 2: A second scenario with a different audience or constraint.
- Template: A quick checklist or mini script the reader can copy.`
    );
  }

  if (!hasFaqOrMistakes) {
    insertAt(
      `## FAQs
- What should you do if the situation differs from the transcript example?
- How do you avoid common implementation mistakes?
- What’s the simplest first step to get momentum?`
    );
  }

  return s;
}

function countChars(s: string) {
  return normalizePost(s).length;
}

function validateBlogOutlineMarkdown(outline: string, index: number): string[] {
  const errors: string[] = [];
  const s = normalizePost(outline);

  if (!s.startsWith("# ")) errors.push(`blog_outlines[${index}] must start with "# " title`);
  if (!s.includes("## Introduction")) errors.push(`blog_outlines[${index}] missing "## Introduction"`);
  if (!s.includes("## CTA")) errors.push(`blog_outlines[${index}] missing "## CTA"`);

  const mustHave = [
    "Primary keyword",
    "Secondary keywords",
    "Search intent",
    "Suggested URL slug",
    "Meta title",
    "Meta description",
  ];
  for (const k of mustHave) {
    if (!s.toLowerCase().includes(k.toLowerCase())) {
      errors.push(`blog_outlines[${index}] missing meta field: "${k}"`);
    }
  }

  const h2Count = (s.match(/^##\s+/gm) || []).length;

  if (h2Count < 6) {
    errors.push(`blog_outlines[${index}] should have at least 6 H2 sections total (found ${h2Count})`);
  }
  if (h2Count > 14) {
    errors.push(`blog_outlines[${index}] has too many H2 sections (found ${h2Count}, aim <= 14)`);
  }

  const bullets = s.split("\n").filter((l) => l.trim().startsWith("- "));
  if (bullets.length < 18) {
    errors.push(`blog_outlines[${index}] must include enough bullets (found ${bullets.length}, need >= 18)`);
  }

  const thinBullets = bullets.filter((b) => normalizePost(b).length < 35);
  if (thinBullets.length > 10) {
    errors.push(`blog_outlines[${index}] has too many thin bullets (<35 chars): ${thinBullets.length}`);
  }

  const hasExamples =
    /##\s+(examples?|real[-\s]?world examples?|case studies?|case[-\s]?study|scenarios?|templates?|proof|results)\b/i.test(s);
  if (!hasExamples) {
    errors.push(`blog_outlines[${index}] must include an Examples/Case Study style section`);
  }

  const hasFaqOrMistakes =
    /##\s+(faqs?|frequently asked questions|common mistakes|mistakes|common errors|errors)\b/i.test(s);

  if (!hasFaqOrMistakes) {
    errors.push(`blog_outlines[${index}] must include a FAQs or Common Mistakes style section`);
  }

  return errors;
}

function validateGenerationStrict(
  raw: unknown
): { ok: true; data: GenerationResult } | { ok: false; errors: string[] } {
  if (raw && typeof raw === "object") {
    const r: any = raw;

    if (r.blog_outlines) r.blog_outlines = coerceToThree(r.blog_outlines);
    if (r.linkedin_posts && Array.isArray(r.linkedin_posts)) r.linkedin_posts = r.linkedin_posts.slice(0, 10);
    if (r.x_posts && Array.isArray(r.x_posts)) r.x_posts = r.x_posts.slice(0, 10);
  }

  const parsed = GenerationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
    };
  }

  const data = parsed.data;

  data.x_posts = data.x_posts.map(normalizePost);
  data.linkedin_posts = data.linkedin_posts.map(normalizePost);
  data.blog_outlines = data.blog_outlines.map(normalizeBlogOutline).map(ensureRequiredBlogSections);

  const errors: string[] = [];

  data.x_posts.forEach((p, i) => {
    const len = countChars(p);
    if (len > 280) errors.push(`x_posts[${i}] is ${len} chars (max 280)`);
    if (/^(\d+\/\d+|\d+\)|thread:)/i.test(p)) {
      errors.push(`x_posts[${i}] looks like a thread marker`);
    }
  });

  data.blog_outlines.forEach((o, i) => {
    errors.push(...validateBlogOutlineMarkdown(o, i));
  });

  if (errors.length) return { ok: false, errors };
  return { ok: true, data };
}

function safeParseJson<T>(value: any, fallback: T): T {
  try {
    if (typeof value !== "string") return fallback;
    const s = value.trim();
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

async function transcribeLocalFileWithAssembly(filePath: string) {
  const transcript = await assembly.transcripts.transcribe({
    audio: filePath,
    speech_models: ["universal-2"],
  });

  if (transcript.status === "error") {
    throw new Error(transcript.error || "AssemblyAI transcription failed");
  }

  return transcript.text || "";
}

// -------------------------
// Dev auth helper route
// -------------------------

export function attachDevAuthUser(app: any) {
  app.get("/api/auth/user", (req: any, res: any) => {
    const user = req.user;
    if (!user) return res.status(200).json({ user: null });
    return res.status(200).json({ user });
  });
}

// -------------------------
// Routes
// -------------------------
export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  
// -------------------------
// Supabase auth middleware (fixed for build)
// -------------------------
app.use(async (req: any, _res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.replace("Bearer ", "");

  // ✅ Split destructuring to avoid esbuild error
  const result = await supabase.auth.getUser(token);
  const user = result.data.user;
  const error = result.error;

  if (error || !user) {
    req.user = null;
  } else {
    req.user = {
      id: user.id,
      email: user.email,
    };
  }

  next();
});

 
  // File Transcription (uploaded audio/video)
  app.post("/api/transcribe/file", upload.single("file"), async (req, res) => {
    let tempPath: string | null = null;
    const requestId = getRequestId(req);

    try {
      const { userId } = getUserIdentity(req);
      if (!userId) {
        return jsonError(res, 401, "UNAUTHORIZED", "Not logged in", requestId);
      }

      if (!process.env.ASSEMBLYAI_API_KEY) {
        return jsonError(
          res,
          500,
          "ASSEMBLYAI_KEY_MISSING",
          "AssemblyAI API key is not configured on the server.",
          requestId
        );
      }

      if (!req.file) {
        return jsonError(res, 400, "FILE_REQUIRED", "No file uploaded.", requestId);
      }

      tempPath = req.file.path;

      const transcriptText = await transcribeLocalFileWithAssembly(tempPath);

      if (!transcriptText || transcriptText.trim().length === 0) {
        return jsonError(
          res,
          422,
          "EMPTY_TRANSCRIPT",
          "No speech was detected in the uploaded file.",
          requestId
        );
      }

      return res.json({
        requestId,
        transcriptText,
        source: "uploaded_file",
        fileName: req.file.originalname,
      });
    } catch (err: any) {
      const { userId, email } = getUserIdentity(req);

      captureSentryException(err, {
        area: "file_transcription",
        userId,
        email,
        requestId,
        fileName: req.file?.originalname ?? null,
      });

      console.error("[FILE TRANSCRIBE] error:", err);

      return jsonError(
        res,
        500,
        "FILE_TRANSCRIBE_FAILED",
        err?.message || "File transcription failed.",
        requestId
      );
    } finally {
      if (tempPath) {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // ignore cleanup failure
        }
      }
    }
  });

  // YouTube Transcription
  app.post("/api/transcribe/youtube", async (req, res) => {
    const requestId = getRequestId(req);
    const { url } = req.body;

    if (!url) {
      return jsonError(res, 400, "URL_REQUIRED", "URL is required", requestId);
    }

    console.log("[YOUTUBE] Transcribing:", url);

    const extractVideoId = (u: string) => {
      const regex =
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
      const match = u.match(regex);
      return match ? match[1] : null;
    };

    const videoId = extractVideoId(url);
    if (!videoId) {
      console.error("[YOUTUBE] Failed to parse video ID from:", url);
      return jsonError(
        res,
        400,
        "VIDEO_ID_PARSE_FAILED",
        "Invalid YouTube URL. Please check the link and try again.",
        requestId
      );
    }

    console.log("[YOUTUBE] Extracted Video ID:", videoId);

    try {
      console.log("[YOUTUBE] Attempting Strategy 1 (Default fetch)");
      let transcript;
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
      } catch (e1: any) {
        console.warn("[YOUTUBE] Strategy 1 failed:", e1.message);

        console.log("[YOUTUBE] Attempting Strategy 2 (Explicit English)");
        try {
          transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
        } catch (e2: any) {
          console.warn("[YOUTUBE] Strategy 2 failed:", e2.message);

          if (e2.message?.includes("Transcript is disabled")) {
            return jsonError(
              res,
              422,
              "TRANSCRIPT_DISABLED",
              "Transcripts are disabled for this video by the owner.",
              requestId
            );
          }
          throw e2;
        }
      }

      if (!transcript || transcript.length === 0) {
        return jsonError(
          res,
          422,
          "NO_CAPTIONS_FOUND",
          "No captions were found for this video. Please paste the transcript manually.",
          requestId
        );
      }

      const transcriptText = transcript.map((t: any) => t.text).join(" ");
      console.log(`[YOUTUBE] Success. VideoID: ${videoId}, Transcript Length: ${transcriptText.length}`);

      return res.json({ requestId, transcriptText, source: "captions", videoId });
    } catch (err: any) {
      const { userId, email } = getUserIdentity(req);

      captureSentryException(err, {
        area: "youtube_transcription",
        userId,
        email,
        requestId,
        url,
        videoId,
      });

      console.error("[YOUTUBE] Final Error:", err);

      let code = "NETWORK_ERROR";
      let message = "We couldn't reach YouTube to get the transcript. Please try again or paste it manually.";

      if (err.message?.includes("private") || err.message?.includes("unavailable")) {
        code = "AGE_RESTRICTED_OR_PRIVATE";
        message = "This video is private, age-restricted, or unavailable.";
      }

      return jsonError(res, 422, code, message, requestId);
    }
  });

  // Workspaces (LIST)
  app.get("/api/workspaces", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;

    if (!userId) return res.status(401).json({ error: "Not logged in" });

    const workspaces = await storage.getWorkspaces(userId);
    res.json(workspaces);
  });

  // Workspaces (CREATE)
  app.post("/api/workspaces", async (req, res) => {
    const requestId = getRequestId(req);
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;

    if (!userId) {
      return jsonError(
        res,
        401,
        "UNAUTHORIZED",
        "User ID not found in session. Please log in again.",
        requestId,
        { error: "Authentication error" }
      );
    }

    try {
      const ent = await resolveEntitlements(userId);

      const { count, error: countErr } = await supabaseAdmin
        .from("workspaces")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countErr) throw countErr;

      if ((count ?? 0) >= ent.maxWorkspaces) {
        return jsonError(
          res,
          403,
          "WORKSPACE_LIMIT_REACHED",
          "Workspace limit reached for your plan.",
          requestId,
          {
            plan: ent.planId,
            limit: ent.maxWorkspaces,
          }
        );
      }

      const body: any = req.body ?? {};
      if (!body.name && typeof body.clientName === "string") body.name = body.clientName;
      if (!body.clientName && typeof body.name === "string") body.clientName = body.name;

      const input = CreateWorkspaceInput.parse(body);

      const normalizedName = (input.name ?? input.clientName ?? "").trim();

      const payload: any = {
        ...input,
        userId,
        name: normalizedName,
        clientName: normalizedName,
      };

      const workspace = await storage.createWorkspace(payload);
      return res.status(201).json(workspace);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          code: "INVALID_INPUT",
          message: "Invalid input",
          requestId,
          details: err.errors,
        });
      }
      return jsonError(
        res,
        500,
        "DATABASE_ERROR",
        err?.message || "Database error",
        requestId
      );
    }
  });

  // Workspaces (GET)
  app.get("/api/workspaces/:id", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);
    res.json(workspace);
  });

  // Workspaces (UPDATE)
  app.patch("/api/workspaces/:id", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    const updated = await storage.updateWorkspace(workspace.id, req.body);
    res.json(updated);
  });

  // Workspaces (DELETE)
  app.delete("/api/workspaces/:id", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    const workspace = await storage.getWorkspace(parseInt(req.params.id));
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    await storage.deleteWorkspace(workspace.id);
    res.sendStatus(204);
  });

  // Workspace history list
  app.get("/api/workspaces/:id/generations", async (req, res) => {
    try {
      const { userId } = getUserIdentity(req);
      if (!userId) {
        return res.status(401).json({ error: "Not logged in" });
      }

      const workspaceId = parseInt(req.params.id, 10);
      if (Number.isNaN(workspaceId)) {
        return res.status(400).json({ error: "Invalid workspace id" });
      }

      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }

      if (workspace.userId !== userId) {
        return res.sendStatus(403);
      }

      const generations = await storage.getContentGenerations(workspaceId);

      return res.json({
        generations: generations ?? [],
      });
    } catch (err: any) {
      console.error("[WORKSPACE GENERATIONS] error:", err);
      return res.status(500).json({ error: "Failed to load generation history" });
    }
  });

  // Single generation detail
  app.get("/api/generations/:id", async (req, res) => {
    try {
      const { userId } = getUserIdentity(req);
      if (!userId) {
        return res.status(401).json({ error: "Not logged in" });
      }

      const generationId = parseInt(req.params.id, 10);
      if (Number.isNaN(generationId)) {
        return res.status(400).json({ error: "Invalid generation id" });
      }

      const record = await storage.getContentGeneration(generationId);
      if (!record) {
        return res.status(404).json({ error: "Generation not found" });
      }

      const workspace = await storage.getWorkspace(record.workspaceId);
      if (!workspace) {
        return res.status(404).json({ error: "Workspace not found" });
      }

      if (workspace.userId !== userId) {
        return res.sendStatus(403);
      }

      const linkedin_posts = safeParseJson<string[]>(record.linkedinPosts, []);
      const x_posts = safeParseJson<string[]>(record.xThreads, []);
      const blog_outlines = safeParseJson<string[]>(record.blogOutlines, []);

      return res.json({
        ...record,
        linkedin_posts,
        x_posts,
        blog_outlines,
        outputs: {
          linkedin: linkedin_posts,
          twitter: x_posts,
          blog: blog_outlines,
        },
      });
    } catch (err: any) {
      console.error("[GENERATION DETAIL] error:", err);
      return res.status(500).json({ error: "Failed to load generation" });
    }
  });

  // ✅ MAIN GENERATOR
  app.post("/api/workspaces/:id/generate", async (req, res) => {
    const requestId = getRequestId(req);
    const startedAt = Date.now();
    const workspaceId = parseInt(req.params.id, 10);
    const { transcript, youtubeUrl } = req.body ?? {};

    let repairAttempts = 0;
    let userIdForLog: string | null = null;
    let emailForLog: string | null = null;

    try {
      const { userId, email } = getUserIdentity(req);
      userIdForLog = userId ?? null;
      emailForLog = email ?? null;

      if (!userId || !email) {
        return jsonError(
          res,
          401,
          "UNAUTHORIZED",
          "Auth session missing fields",
          requestId
        );
      }

      if (!GENERATION_ENABLED) {
        logEvent("generation_blocked", {
          requestId,
          userId,
          workspaceId,
          reason: "kill_switch_disabled",
        });

        return jsonError(
          res,
          503,
          "GENERATION_DISABLED",
          "Content generation is temporarily unavailable.",
          requestId
        );
      }

      if (Number.isNaN(workspaceId)) {
        return jsonError(
          res,
          400,
          "INVALID_WORKSPACE_ID",
          "Invalid workspace id.",
          requestId
        );
      }

      const transcriptSize = transcriptLength(transcript);
      const rateKey = userId || getClientIp(req);
      const rateResult = enforceGenerateRateLimit(rateKey);

      if (!rateResult.allowed) {
        logEvent("generation_rate_limited", {
          requestId,
          userId,
          workspaceId,
          transcriptSize,
          retryAfterSeconds: rateResult.retryAfterSeconds,
          limit: GENERATE_RATE_LIMIT_MAX,
          windowMs: GENERATE_RATE_LIMIT_WINDOW_MS,
        });

        res.setHeader("Retry-After", String(rateResult.retryAfterSeconds));

        return jsonError(
          res,
          429,
          "RATE_LIMITED",
          "Too many generation requests. Please wait and try again.",
          requestId,
          {
            retryAfterSeconds: rateResult.retryAfterSeconds,
          }
        );
      }

      if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
        return jsonError(
          res,
          400,
          "TRANSCRIPT_REQUIRED",
          "No transcript provided",
          requestId
        );
      }

      if (transcriptSize > MAX_TRANSCRIPT_CHARS) {
        logEvent("generation_blocked", {
          requestId,
          userId,
          workspaceId,
          transcriptSize,
          reason: "transcript_too_long",
          maxTranscriptChars: MAX_TRANSCRIPT_CHARS,
        });

        return jsonError(
          res,
          400,
          "TRANSCRIPT_TOO_LONG",
          `Transcript exceeds the maximum allowed size of ${MAX_TRANSCRIPT_CHARS} characters.`,
          requestId,
          {
            maxTranscriptChars: MAX_TRANSCRIPT_CHARS,
            transcriptSize,
          }
        );
      }

      const ent = await resolveEntitlements(userId);
      const month = monthBucketUTC();

      const { data: usageRow, error: usageErr } = await supabaseAdmin
        .from("usage_monthly")
        .select("generations_used")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle();

      if (usageErr) throw usageErr;

      const monthlyUsed = usageRow?.generations_used ?? 0;

      const { count: lifetimeGenerationsUsed, error: lifetimeUsageErr } = await supabaseAdmin
        .from("generation_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("format", "generate");

      if (lifetimeUsageErr) throw lifetimeUsageErr;

      const lifetimeUsed = lifetimeGenerationsUsed ?? 0;

      if (ent.planId === "trial") {
        const lifetimeLimit = ent.maxGenerationsLifetime ?? 1;

        if (lifetimeUsed >= lifetimeLimit) {
          logEvent("generation_blocked", {
            requestId,
            userId,
            workspaceId,
            transcriptSize,
            reason: "trial_generation_limit_reached",
            used: lifetimeUsed,
            limit: lifetimeLimit,
            planId: ent.planId,
          });

          return jsonError(
            res,
            402,
            "GENERATION_LIMIT_REACHED",
            "Trial generation limit reached.",
            requestId,
            {
              error: "generation_limit_reached",
              plan: ent.planId,
              limit: lifetimeLimit,
            }
          );
        }
      } else {
        if (monthlyUsed >= ent.maxGenerationsPerMonth) {
          logEvent("generation_blocked", {
            requestId,
            userId,
            workspaceId,
            transcriptSize,
            reason: "monthly_generation_limit_reached",
            used: monthlyUsed,
            limit: ent.maxGenerationsPerMonth,
            month,
            planId: ent.planId,
          });

          return jsonError(
            res,
            402,
            "GENERATION_LIMIT_REACHED",
            "Monthly generation limit reached.",
            requestId,
            {
              error: "generation_limit_reached",
              plan: ent.planId,
              limit: ent.maxGenerationsPerMonth,
            }
          );
        }
      }

      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return jsonError(res, 403, "FORBIDDEN", "Access denied", requestId);
      }

      const ws: any = workspace;

      const brandContext = {
        client_name: ws?.clientName ?? ws?.name ?? "Unknown",
        brand_description: ws?.brandDescription ?? ws?.description ?? "",
        style: ws?.style ?? "",
        boldness: ws?.boldness ?? "",
        intent: ws?.intent ?? "",
        sample_content: ws?.sampleContent ?? "",
        audience: ws?.audience ?? ws?.targetAudience ?? "",
        tone: ws?.tone ?? "",
        voice: ws?.brandVoice ?? ws?.voice ?? "",
        do_dont: ws?.dosAndDonts ?? ws?.rules ?? "",
      };

      logEvent("generation_started", {
        requestId,
        userId,
        workspaceId,
        planId: ent.planId,
        transcriptSize,
        sourceType: youtubeUrl ? "youtube" : "manual_or_uploaded",
        monthlyGenerationsUsedBefore: monthlyUsed,
        monthlyGenerationLimit: ent.maxGenerationsPerMonth,
        lifetimeGenerationsUsedBefore: lifetimeUsed,
        lifetimeGenerationLimit: ent.maxGenerationsLifetime ?? null,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      });

      const styleBlob = `${brandContext.style} ${brandContext.tone} ${brandContext.voice} ${brandContext.intent}`.toLowerCase();

      const allowEmoji =
        /(casual|playful|bold|fun|energetic|cheeky|friendly)/i.test(styleBlob) &&
        !/(formal|conservative|corporate|serious|legal|medical)/i.test(styleBlob);

      const system = `
You are Content Forge: an elite multi-platform content writer.

ABSOLUTE RULES:
- Output MUST be VALID JSON only. No markdown fences. No commentary.
- Return EXACTLY this JSON shape:
{
  "linkedin_posts": ["... x10"],
  "x_posts": ["... x10"],
  "blog_outlines": ["... x3"]
}

COUNT RULES (HARD):
- linkedin_posts MUST be exactly 10 strings.
- x_posts MUST be exactly 10 strings.
- blog_outlines MUST be exactly 3 strings.

GLOBAL QUALITY RULES:
- Use the transcript as primary source material.
- Do NOT invent fake stats, fake quotes, fake clients, or fake studies.
- If transcript is thin, infer plausible specifics, but keep claims grounded and cautious.
- Vary angles and formats. No copy/paste templates.

========================
PLATFORM: X (HARD)
========================
- Each x_posts item MUST be <= 280 characters.
- Each X post MUST be standalone (NO threads, no "1/10", no "thread:", no numbering).
- Make them feel like X: punchy, skimmable, pattern interrupts, short lines.
- Avoid corporate fluff and vague motivation.
- Hashtags: 0–2 max, only if genuinely relevant.
- Emoji policy: ${allowEmoji ? "ALLOW 0–2 emojis per post max (only if it fits). Avoid emoji spam." : "NO emojis unless the brand sample_content clearly uses emojis."}
- Write like a real person, not a press release.

========================
PLATFORM: LinkedIn (HARD)
========================
Each LinkedIn post should look like a real LinkedIn post:
- Strong hook in first 1–2 lines
- Lots of whitespace (short paragraphs)
- 3–7 bullets OR short sections
- Concrete takeaways (not vague)
- End with a thoughtful CTA question
Vary formats across the 10:
- story / lesson
- contrarian take
- framework
- checklist
- myth-bust
- mini case study
- here is what I would do steps
Avoid cringe salesy lines and repeated openers.

========================
PLATFORM: Blog Outlines (HARD)
========================
blog_outlines are publish-ready outlines with real substance.
Each outline MUST be detailed Markdown inside the string.

Each blog outline MUST include, in this exact order:

1) # Title (H1)
2) Meta block with:
   - Primary keyword
   - Secondary keywords (3–6)
   - Search intent
   - Suggested URL slug
   - Meta title (<= 60 chars)
   - Meta description (<= 155 chars)

3) ## Introduction
- 3–5 bullets, each bullet is 1–3 sentences (not fragments)

4) H2 sections:
- Include "## Introduction" and "## CTA" as H2 headings.
- Total H2 count (including Intro + CTA) should be 8–14.
- Under EACH H2, include 3–6 bullets.
- Each bullet must be 1–3 sentences with specifics (instruction, context, example).
- Must include one of:
  - ## Examples
  - ## Case study
- Must include one of:
  - ## Common mistakes
  - ## FAQs

5) ## CTA
- 3–6 bullets, 1–2 sentences each, conversion angle aligned to brand intent.

Remember: return ONLY valid JSON.
`.trim();

      const userPrompt = `
Use the BRAND CONTEXT as the single source of truth for tone and intent.

BRAND CONTEXT (obey these):
${JSON.stringify(brandContext, null, 2)}

INTERPRETATION RULES:
- "style" = the vibe (professional, playful, luxury, gritty, etc).
- "boldness" = how spicy or contrarian you can be (low/medium/high).
- "intent" decides the generation style:
  - thought leadership = original insights, strong POV, frameworks
  - SEO optimized = clear structure, keywords, FAQs, search intent focus
  - conversion-focused = benefits, objections, CTAs, proof, urgency without hype
  - authority positioning = credibility, clarity, confident teaching tone
  - bold & polarizing = contrarian hooks, strong takes, still respectful
  - data-driven = careful reasoning, cautious claims, no fake stats
  - tactical step-by-step = numbered steps, checklists, templates
  - case-study heavy = before/after, constraints, decisions, lessons
If intent is empty, default to: authority positioning + tactical step-by-step.

If sample_content is provided, mimic its vibe and structure without copying.

SOURCE TRANSCRIPT (use this content heavily):
${transcript}

OUTPUT TASK:
Create:
1) 10 X posts (<= 280 chars each), varied angles, platform-native.
2) 10 LinkedIn posts, varied formats, platform-native, end with a question.
3) 3 blog_outlines that obey the BLOG OUTLINES RULES exactly.

Return ONLY valid JSON.
`.trim();

      async function runOnce(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.7,
          response_format: { type: "json_object" },
          messages,
        });

        const content = completion.choices?.[0]?.message?.content ?? "{}";

        return {
          parsed: JSON.parse(content),
          usage: completion.usage,
          raw: content,
        };
      }

      const first = await runOnce([
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ]);

      const v1 = validateGenerationStrict(first.parsed);

      let finalData: GenerationResult;
      let usageTokens = first.usage?.total_tokens ?? 0;

      if (!v1.ok) {
        repairAttempts = 1;

        const repairPrompt = `
Your previous JSON failed strict validation.

Fix the JSON so it passes ALL rules.
Keep counts EXACT (10 / 10 / 3).

VALIDATION ERRORS:
${v1.errors.map((e) => `- ${e}`).join("\n")}
`;

        const second = await runOnce([
          { role: "system", content: system },
          { role: "user", content: userPrompt },
          { role: "assistant", content: JSON.stringify(first.parsed) },
          { role: "user", content: repairPrompt },
        ]);

        usageTokens += second.usage?.total_tokens ?? 0;

        const v2 = validateGenerationStrict(second.parsed);

        if (!v2.ok) {
          logEvent("generation_failed_validation", {
            requestId,
            userId,
            workspaceId,
            transcriptSize,
            repairAttempts,
            durationMs: Date.now() - startedAt,
            firstAttemptErrors: v1.errors,
            secondAttemptErrors: v2.errors,
          });

          return jsonError(
            res,
            422,
            "INVALID_GENERATION_OUTPUT",
            "Generated output failed validation.",
            requestId,
            {
              details: {
                first_attempt_errors: v1.errors,
                second_attempt_errors: v2.errors,
              },
            }
          );
        }

        finalData = v2.data;
      } else {
        finalData = v1.data;
      }

      await supabaseAdmin.from("generation_usage").insert({
        user_id: userId,
        workspace_id: workspaceId,
        format: "generate",
        tokens_used: usageTokens ?? 0,
      });

      const { error: upsertErr } = await supabaseAdmin
        .from("usage_monthly")
        .upsert(
          {
            user_id: userId,
            month,
            generations_used: monthlyUsed + 1,
          },
          { onConflict: "user_id,month" }
        );

      if (upsertErr) throw upsertErr;

      const savedGeneration = await storage.createContentGeneration({
        workspaceId,
        transcript,
        linkedinPosts: JSON.stringify(finalData.linkedin_posts),
        xThreads: JSON.stringify(finalData.x_posts),
        blogOutlines: JSON.stringify(finalData.blog_outlines),
        youtubeUrl: youtubeUrl ?? null,
      } as any);

      if (lifetimeUsed === 0) {
        logEvent("first_generation", {
          requestId,
          userId,
          workspaceId,
          transcriptSize,
          sourceType: youtubeUrl ? "youtube" : "manual_or_uploaded",
        });
      }

      logEvent("generation_created", {
        requestId,
        userId,
        workspaceId,
        transcriptSize,
        sourceType: youtubeUrl ? "youtube" : "manual_or_uploaded",
        planId: ent.planId,
      });

      logEvent("generation_succeeded", {
        requestId,
        userId,
        workspaceId,
        transcriptSize,
        repairAttempts,
        durationMs: Date.now() - startedAt,
        tokensUsed: usageTokens,
        counts: {
          linkedin: finalData.linkedin_posts.length,
          x: finalData.x_posts.length,
          blog: finalData.blog_outlines.length,
        },
      });

      return res.json({
        requestId,
        generation: savedGeneration,
        linkedin_posts: finalData.linkedin_posts,
        x_posts: finalData.x_posts,
        blog_outlines: finalData.blog_outlines,
        counts: {
          linkedin: finalData.linkedin_posts.length,
          x: finalData.x_posts.length,
          blog: finalData.blog_outlines.length,
        },
      });
    } catch (err: any) {
      captureSentryException(err, {
        area: "generation",
        userId: userIdForLog,
        email: emailForLog,
        workspaceId,
        requestId,
        repairAttempts,
        durationMs: Date.now() - startedAt,
      });

      logEvent("generation_failed_exception", {
        requestId,
        userId: userIdForLog,
        workspaceId,
        repairAttempts,
        durationMs: Date.now() - startedAt,
        errorMessage: err?.message || String(err),
      });
      // Rollback usage if generation failed
try {
  await supabaseAdmin
    .from("generation_usage")
    .delete()
    .eq("user_id", userIdForLog)
    .eq("workspace_id", workspaceId)
    .eq("format", "generate")
    .order("created_at", { ascending: false })
    .limit(1);

  await supabaseAdmin
    .from("usage_monthly")
    .update({ generations_used: Math.max(monthlyUsed, 0) })
    .eq("user_id", userIdForLog)
    .eq("month", month);
} catch (rollbackErr) {
  console.error("[GENERATE] rollback failed:", rollbackErr);
}

      console.error("[GENERATE] error:", err);

      return jsonError(
        res,
        500,
        "GENERATION_FAILED",
        "Generation failed",
        requestId
      );
    }
  });

  // Billing: create Stripe Checkout session for Pro upgrade
  app.post("/api/billing/create-checkout", async (req, res) => {
    const requestId = getRequestId(req);

    try {
      const { userId, email } = getUserIdentity(req);

      if (!userId || !email) {
        return jsonError(
          res,
          401,
          "UNAUTHORIZED",
          "Auth session missing fields",
          requestId
        );
      }

      if (!stripe) {
        return jsonError(
          res,
          500,
          "STRIPE_NOT_CONFIGURED",
          "Stripe secret key is not configured.",
          requestId
        );
      }

     const requestedPlan = (req.body?.plan === "starter") ? "starter" : "pro";
const priceId = requestedPlan === "starter"
  ? process.env.STRIPE_PRICE_STARTER_MONTHLY
  : process.env.STRIPE_PRICE_PRO_MONTHLY;
if (!priceId) {
  return jsonError(res, 500, "STRIPE_PRICE_MISSING", `Stripe ${requestedPlan} price ID is not configured.`, requestId);
}

      const currentEntitlements = await resolveEntitlements(userId);

      if (currentEntitlements.planId === "pro") {
        return jsonError(
          res,
          409,
          "ALREADY_ON_PRO",
          "User is already on the Pro plan.",
          requestId
        );
      }

      const appBaseUrl = getAppBaseUrl(req);
      const successUrl = `${appBaseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${appBaseUrl}/`;

      let stripeCustomerId: string | null = null;

const { data: profile, error: profileErr } = await supabaseAdmin
  .from("profiles")
  .select("stripe_customer_id")
  .eq("user_id", userId)
  .maybeSingle();

if (profileErr) throw profileErr;

stripeCustomerId = profile?.stripe_customer_id ?? null;

if (stripeCustomerId) {
  try {
    const existingCustomer = await stripe.customers.retrieve(stripeCustomerId);

    if ("deleted" in existingCustomer && existingCustomer.deleted) {
      stripeCustomerId = null;
    }
  } catch {
    stripeCustomerId = null;
  }
}

if (!stripeCustomerId) {
  const customer = await stripe.customers.create({
  email: email,
  metadata: {
    user_id: userId,
  },
});

  stripeCustomerId = customer.id;

  const { error: profileUpsertErr } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        plan_id: currentEntitlements.planId,
        stripe_customer_id: stripeCustomerId,
      },
      { onConflict: "user_id" }
    );

  if (profileUpsertErr) throw profileUpsertErr;
}

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
        customer_update: {
          address: "auto",
          name: "auto",
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        automatic_tax: { enabled: false }, 
        billing_address_collection: "auto",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          user_id: userId,
          email,
          current_plan_id: currentEntitlements.planId,
          target_plan_id: requestedPlan,
        },
        subscription_data: {
          metadata: {
            user_id: userId,
            email,
            current_plan_id: currentEntitlements.planId,
            target_plan_id: requestedPlan,
          },
        },
      });

      logEvent("billing_checkout_created", {
        requestId,
        userId,
        targetPlanId: "pro",
        currentPlanId: currentEntitlements.planId,
        stripeCustomerId,
        stripeCheckoutSessionId: session.id,
      });

      return res.json({
        requestId,
        url: session.url,
        checkoutUrl: session.url,
        sessionId: session.id,
        targetPlanId: "pro",
      });
    } catch (err: any) {
      const { userId, email } = getUserIdentity(req);

      captureSentryException(err, {
        area: "billing_create_checkout",
        userId,
        email,
        requestId,
      });

      console.error("[BILLING CHECKOUT] error:", err);

      return jsonError(
        res,
        500,
        "CHECKOUT_CREATE_FAILED",
        err?.message || "Failed to create Stripe checkout session.",
        requestId
      );
    }
  });

  // Usage summary
  app.get("/api/usage", async (req, res) => {
    try {
      const requestId = getRequestId(req);
      const { userId, email } = getUserIdentity(req);

      if (!userId || !email) {
        return jsonError(
          res,
          401,
          "UNAUTHORIZED",
          "Auth session missing fields",
          requestId
        );
      }

      const ent = await resolveEntitlements(userId);
      const month = monthBucketUTC();

      const { data: usageRow, error: usageErr } = await supabaseAdmin
        .from("usage_monthly")
        .select("generations_used")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle();

      if (usageErr) throw usageErr;

      const { count: workspaceCount, error: workspaceCountErr } = await supabaseAdmin
        .from("workspaces")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (workspaceCountErr) throw workspaceCountErr;

      const { count: lifetimeGenerationsUsed, error: lifetimeUsageErr } = await supabaseAdmin
        .from("generation_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("format", "generate");

      if (lifetimeUsageErr) throw lifetimeUsageErr;

      const generationsUsed =
        ent.planId === "trial"
          ? lifetimeGenerationsUsed ?? 0
          : usageRow?.generations_used ?? 0;

      const generationsLimit =
        ent.planId === "trial"
          ? ent.maxGenerationsLifetime ?? 1
          : ent.maxGenerationsPerMonth;

      return res.json({
        requestId,
        planId: ent.planId,
        generationsUsed,
        generationsLimit,
        workspacesUsed: workspaceCount ?? 0,
        workspacesLimit: ent.maxWorkspaces,
        month,
        isLifetimeLimit: ent.planId === "trial",
      });
    } catch (err: any) {
      console.error("[USAGE] error:", err);
      return res.status(500).json({ error: "Failed to load usage" });
    }
  });
// -------------------------
// Stripe Webhook
// -------------------------
app.post("/api/billing/webhook", async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"];

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return res.status(500).send("Webhook not configured");
  }

  if (!stripe) {
    return res.status(500).send("Stripe not configured");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.user_id;

      if (!userId) {
        console.error("Webhook missing user_id metadata");
        return res.status(400).send("Missing metadata");
      }

      const targetPlan = session.metadata?.target_plan_id === "starter" ? "starter" : "pro";
await supabaseAdmin
  .from("profiles")
  .update({ plan_id: targetPlan })
  .eq("user_id", userId);

      console.log("User upgraded to PRO:", userId);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing failed:", err);
    res.status(500).send("Webhook handler failed");
  }
});
  return httpServer;
}