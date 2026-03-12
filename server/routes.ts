import type { Express } from "express";
import type { Server } from "http";

import { storage } from "./storage";

import { z } from "zod";
import OpenAI from "openai";
import { YoutubeTranscript } from "youtube-transcript";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
 type PlanId = "starter" | "pro";

type Entitlements = {
  planId: PlanId;
  maxWorkspaces: number;
  maxGenerationsPerMonth: number;
};

function monthBucketUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function entitlementsForPlan(planId: PlanId): Entitlements {
  if (planId === "pro") {
    return { planId, maxWorkspaces: 5, maxGenerationsPerMonth: 10 };
  }
  return { planId: "starter", maxWorkspaces: 1, maxGenerationsPerMonth: 3 };
}

async function resolveEntitlements(userId: string): Promise<Entitlements> {
  // Check admin override first
  const { data: override } = await supabaseAdmin
    .from("admin_overrides")
    .select("force_plan_id, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (override?.force_plan_id) {
    const expires = override.expires_at ? new Date(override.expires_at) : null;
    const active = !expires || expires.getTime() > Date.now();
    if (active) {
      return entitlementsForPlan(override.force_plan_id as PlanId);
    }
  }

  // Check profiles table
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("plan_id")
    .eq("user_id", userId)
    .maybeSingle();

  // If no profile exists, create starter
  if (!profile) {
    await supabaseAdmin
      .from("profiles")
      .insert({ user_id: userId, plan_id: "starter" });

    return entitlementsForPlan("starter");
  }

  return entitlementsForPlan((profile.plan_id as PlanId) ?? "starter");
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

// -------------------------
// Workspace input schema (accepts BOTH clientName + name)
// -------------------------
const CreateWorkspaceInput = z
  .object({
    // frontend might send clientName; older backend expects name
    clientName: z.string().min(1).max(200).optional(),
    name: z.string().min(1).max(200).optional(),

    brandDescription: z.string().optional().nullable(),
    style: z.string().optional().nullable(),
    boldness: z.string().optional().nullable(),
    intent: z.string().optional().nullable(),
    sampleContent: z.string().optional().nullable(),

    // optional extras (safe to accept if present)
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

  // blog outlines MUST be 3 markdown strings
  blog_outlines: z.array(z.string().min(1)).length(3),
});

type GenerationResult = z.infer<typeof GenerationSchema>;

function normalizePost(s: string) {
  return (s ?? "").replace(/\r/g, "").trim();
}

function normalizeBlogOutline(s: string) {
  let out = normalizePost(s);

  // Common model mistake: uses ### instead of ## for H2 headings
  out = out.replace(/^###\s+/gm, "## ");

  // Occasionally it uses "# CTA" (wrong) — make it a proper H2
  out = out.replace(/^#\s+CTA\s*$/gmi, "## CTA");

  // Occasionally it uses "## Call to Action" — normalize to exact heading
  out = out.replace(/^##\s+Call to Action\s*$/gmi, "## CTA");

  return out.trim();
}

// If model returns too many/few outlines or non-strings, coerce safely
function coerceToThree(arr: any): string[] {
  if (!Array.isArray(arr)) return [];
  const cleaned = arr
    .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
    .map(normalizePost)
    .filter(Boolean);

  // keep first 3 if more exist
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

/**
 * Blog validation targets: strict-but-realistic.
 * We validate structure and substance, not "perfect writing".
 */
function validateBlogOutlineMarkdown(outline: string, index: number): string[] {
  const errors: string[] = [];
  const s = normalizePost(outline);

  if (!s.startsWith("# ")) errors.push(`blog_outlines[${index}] must start with "# " title`);
  if (!s.includes("## Introduction")) errors.push(`blog_outlines[${index}] missing "## Introduction"`);
  if (!s.includes("## CTA")) errors.push(`blog_outlines[${index}] missing "## CTA"`);

  // requires meta block items
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

  // X rules
  data.x_posts.forEach((p, i) => {
    const len = countChars(p);
    if (len > 280) errors.push(`x_posts[${i}] is ${len} chars (max 280)`);
    if (/^(\d+\/\d+|\d+\)|thread:)/i.test(p)) {
      errors.push(`x_posts[${i}] looks like a thread marker`);
    }
  });

  // Blog outline quality rules
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
  // ✅ BETA MODE: inject stable user if missing
  if (BETA_BYPASS_AUTH) {
    app.use((req: any, _res: any, next: any) => {
      if (!req.user) {
        req.user = {
          id: "11111111-1111-1111-1111-111111111111",
          email: "beta@recontent.online",
          claims: {
            sub: "beta-user",
            email: "beta@recontent.online",
          },
        };
      }
      next();
    });
  }

  // YouTube Transcription
  app.post("/api/transcribe/youtube", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ code: "URL_REQUIRED", message: "URL is required" });

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
      return res.status(400).json({
        code: "VIDEO_ID_PARSE_FAILED",
        message: "Invalid YouTube URL. Please check the link and try again.",
      });
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
            return res.status(422).json({
              code: "TRANSCRIPT_DISABLED",
              message: "Transcripts are disabled for this video by the owner.",
            });
          }
          throw e2;
        }
      }

      if (!transcript || transcript.length === 0) {
        return res.status(422).json({
          code: "NO_CAPTIONS_FOUND",
          message: "No captions were found for this video. Please paste the transcript manually.",
        });
      }

      const transcriptText = transcript.map((t) => t.text).join(" ");
      console.log(`[YOUTUBE] Success. VideoID: ${videoId}, Transcript Length: ${transcriptText.length}`);

      res.json({ transcriptText, source: "captions", videoId });
    } catch (err: any) {
      console.error("[YOUTUBE] Final Error:", err);

      let code = "NETWORK_ERROR";
      let message = "We couldn't reach YouTube to get the transcript. Please try again or paste it manually.";

      if (err.message?.includes("private") || err.message?.includes("unavailable")) {
        code = "AGE_RESTRICTED_OR_PRIVATE";
        message = "This video is private, age-restricted, or unavailable.";
      }

      res.status(422).json({ code, message });
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
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;

    if (!userId) {
  return res.status(401).json({
    code: "UNAUTHORIZED",
    error: "Authentication error",
    message: "User ID not found in session. Please log in again.",
  });
}

    try {
       // --- v1.9 workspace cap enforcement ---
const ent = await resolveEntitlements(userId);

const { count, error: countErr } = await supabaseAdmin
  .from("workspaces")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId);

if (countErr) throw countErr;

if ((count ?? 0) >= ent.maxWorkspaces) {
  return res.status(403).json({
    code: "WORKSPACE_LIMIT_REACHED",
    error: "Workspace limit reached for your plan.",
  });
}
// --- end v1.9 workspace cap enforcement ---
      // ✅ HARD NORMALIZATION (pre-parse)
      // Frontend sends "clientName". Some validators/storage expect "name".
      const body: any = req.body ?? {};
      if (!body.name && typeof body.clientName === "string") body.name = body.clientName;
      if (!body.clientName && typeof body.name === "string") body.clientName = body.name;

      const input = CreateWorkspaceInput.parse(body);

      const normalizedName = (input.name ?? input.clientName ?? "").trim();

      // Provide BOTH fields so storage/db doesn't care which one it expects
      const payload: any = {
        ...input,
        userId,

        // canonical
        name: normalizedName,

        // legacy / UI
        clientName: normalizedName,
      };

      const workspace = await storage.createWorkspace(payload);
      return res.status(201).json(workspace);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: err.errors,
        });
      }
      return res.status(500).json({
        error: "Database error",
        details: err?.message || String(err),
      });
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

    // ✅ MAIN GENERATOR
  app.post("/api/workspaces/:id/generate", async (req, res) => {
    console.log("✅ STRICT GENERATOR HIT", new Date().toISOString());

    try {
      const { userId, email } = getUserIdentity(req);
      if (!userId || !email) {
        return res.status(401).json({ error: "Auth session missing fields" });
      }

      // --- v1.9 monthly generation cap enforcement ---
      const ent = await resolveEntitlements(userId);
      const month = monthBucketUTC();

      const { data: usageRow, error: usageErr } = await supabaseAdmin
        .from("usage_monthly")
        .select("generations_used")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle();

      if (usageErr) throw usageErr;

      const used = usageRow?.generations_used ?? 0;

      if (used >= ent.maxGenerationsPerMonth) {
        return res.status(402).json({
          code: "GENERATION_LIMIT_REACHED",
          error: "Monthly generation limit reached.",
        });
      }
      // --- end monthly cap enforcement ---

      const workspaceId = parseInt(req.params.id);
      const { transcript, youtubeUrl } = req.body;

      if (!transcript) {
        return res.status(400).json({ error: "No transcript provided" });
      }

      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace || workspace.userId !== userId) {
        return res.sendStatus(403);
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

      const styleBlob = `${brandContext.style} ${brandContext.tone} ${brandContext.voice} ${brandContext.intent}`.toLowerCase();

      const allowEmoji =
        /(casual|playful|bold|fun|energetic|cheeky|friendly)/i.test(styleBlob) &&
        !/(formal|conservative|corporate|serious|legal|medical)/i.test(styleBlob);

      const system = `
You are an expert content generator.

Return ONLY valid JSON with this structure:

{
  "linkedin_posts": ["..."],
  "x_posts": ["..."],
  "blog_outlines": ["..."]
}

Rules:
- linkedin_posts must contain exactly 10 posts
- x_posts must contain exactly 10 posts
- blog_outlines must contain exactly 3 outlines
- Output must be valid JSON only
- No markdown
- No commentary
`;

const userPrompt = `
Using the transcript below, generate:

1. 10 LinkedIn posts
2. 10 X posts (under 280 characters)
3. 3 blog outlines

Transcript:
${transcript}

Return ONLY valid JSON.
`;

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
          return res.status(422).json({
            error: "Invalid generation output",
            details: {
              first_attempt_errors: v1.errors,
              second_attempt_errors: v2.errors,
            },
          });
        }

        finalData = v2.data;
      } else {
        finalData = v1.data;
      }

      // Existing generation log
      await supabaseAdmin.from("generation_usage").insert({
        user_id: userId,
        workspace_id: workspaceId,
        format: "generate",
        tokens_used: usageTokens ?? 0,
      });

      // --- increment monthly usage ---
      const { error: upsertErr } = await supabaseAdmin
        .from("usage_monthly")
        .upsert(
          {
            user_id: userId,
            month,
            generations_used: used + 1,
          },
          { onConflict: "user_id,month" }
        );

      if (upsertErr) throw upsertErr;
      // --- end increment ---

      const savedGeneration = await storage.createContentGeneration({
        workspaceId,
        transcript,
        linkedinPosts: JSON.stringify(finalData.linkedin_posts),
        xThreads: JSON.stringify(finalData.x_posts),
        blogOutlines: JSON.stringify(finalData.blog_outlines),
        youtubeUrl: youtubeUrl ?? null,
      } as any);

      return res.json({
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
      console.error("[GENERATE] error:", err);
      return res.status(500).json({ error: "Generation failed" });
    }
  });

  return httpServer;
}