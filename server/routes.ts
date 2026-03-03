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
// Workspace input schema (replaces api.workspaces.create.input)
// -------------------------
const CreateWorkspaceInput = z.object({
  name: z.string().min(1).max(200),
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

  if (h2Count < 8) {
    errors.push(`blog_outlines[${index}] should have at least 8 H2 sections total (found ${h2Count})`);
  }
  if (h2Count > 14) {
    errors.push(`blog_outlines[${index}] has too many H2 sections (found ${h2Count}, aim <= 14)`);
  }

  const bullets = s.split("\n").filter((l) => l.trim().startsWith("- "));
  if (bullets.length < 24) {
    errors.push(`blog_outlines[${index}] must include enough bullets (found ${bullets.length}, need >= 24)`);
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
          id: "beta-user",
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
    const workspaces = await storage.getWorkspaces(userId);
    res.json(workspaces);
  });

  // Workspaces (CREATE)
  app.post("/api/workspaces", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication error",
        message: "User ID not found in session. Please log in again.",
      });
    }

    try {
      const input = CreateWorkspaceInput.parse(req.body);
      const workspace = await storage.createWorkspace({ ...input, userId });
      res.status(201).json(workspace);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      }
      res.status(500).json({ error: "Database error", details: err.message || String(err) });
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
      if (!userId || !email) return res.status(401).json({ error: "Auth session missing fields" });

      // Free limit (3/month)
      const monthlyLimit = 3;
      const now = new Date();
      const startOfMonthUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

      const { count, error: countError } = await supabaseAdmin
        .from("generation_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", startOfMonthUTC.toISOString());

      if (!countError && (count ?? 0) >= monthlyLimit) {
        return res.status(402).json({ error: "Generation limit reached" });
      }

      const workspaceId = parseInt(req.params.id);
      const { transcript, youtubeUrl } = req.body;
      if (!transcript) return res.status(400).json({ error: "No transcript provided" });

      const workspace = await storage.getWorkspace(workspaceId);
      if (!workspace || workspace.userId !== userId) return res.sendStatus(403);

      const ws: any = workspace;

      // IMPORTANT: match your DB columns
      const brandContext = {
        client_name: ws?.clientName ?? ws?.name ?? "Unknown",
        brand_description: ws?.brandDescription ?? ws?.description ?? "",
        style: ws?.style ?? "",
        boldness: ws?.boldness ?? "",
        intent: ws?.intent ?? "",
        sample_content: ws?.sampleContent ?? "",

        // optional
        audience: ws?.audience ?? ws?.targetAudience ?? "",
        tone: ws?.tone ?? "",
        voice: ws?.brandVoice ?? ws?.voice ?? "",
        do_dont: ws?.dosAndDonts ?? ws?.rules ?? "",
      };

      // Emoji policy derived from brand style/boldness/intent (simple & robust)
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
- Do NOT invent fake stats, fake quotes, fake clients, or fake “studies”.
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
- “here’s what I’d do” steps
Avoid cringe salesy lines and repeated openers.

========================
PLATFORM: Blog Outlines (HARD)
========================
blog_outlines are "publish-ready outlines" with real substance.
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
- "boldness" = how spicy/contrarian you can be (low/medium/high).
- "intent" decides the generation style:
  - thought leadership = original insights, strong POV, frameworks
  - SEO optimized = clear structure, keywords, FAQs, search intent focus
  - conversion-focused = benefits, objections, CTAs, proof, urgency (without hype)
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
        return { parsed: JSON.parse(content), usage: completion.usage, raw: content };
      }

      // Attempt 1
      const first = await runOnce([
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ]);

      const v1 = validateGenerationStrict(first.parsed);

      let finalData: GenerationResult;
      let usageTokens = first.usage?.total_tokens ?? 0;

      // Attempt 2 (repair using validator errors)
      if (!v1.ok) {
        const repairPrompt = `
Your previous JSON failed strict validation.

Fix the JSON so it passes ALL rules.
Do not change the required JSON keys.
Do not add extra keys.
Keep counts EXACT (10 / 10 / 3).

VALIDATION ERRORS:
${v1.errors.map((e) => `- ${e}`).join("\n")}

Return ONLY the corrected valid JSON.
`.trim();

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

      await supabaseAdmin.from("generation_usage").insert({
        user_id: userId,
        workspace_id: workspaceId,
        format: "generate",
        tokens_used: usageTokens ?? 0,
      });

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

  // History list
  app.get("/api/workspaces/:id/generations", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;

    const workspaceId = parseInt(req.params.id);
    const workspace = await storage.getWorkspace(workspaceId);
    if (!workspace) return res.status(404).send({ message: "Workspace not found" });
    if (workspace.userId !== userId) return res.sendStatus(403);

    const rows = await storage.getWorkspaceGenerations(workspaceId);

    const previews = rows.map((item: any) => ({
      id: item.id,
      createdAt: item.createdAt,
      youtubeUrl: item.youtubeUrl,
      transcriptPreview: item.transcript.substring(0, 100),
      transcript: item.transcript,
    }));

    res.json({ generations: previews });
  });

  // Single generation (parse JSON strings into arrays)
  app.get("/api/generations/:id", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    const genId = parseInt(req.params.id);

    const [generation] = await storage.getContentGeneration(genId);
    if (!generation) return res.status(404).send({ message: "Generation not found" });

    const workspace = await storage.getWorkspace(generation.workspaceId);
    if (!workspace || workspace.userId !== userId) return res.sendStatus(403);

    const linkedin_posts = safeParseJson<string[]>(generation.linkedinPosts, []);
    const x_posts = safeParseJson<string[]>(generation.xThreads, []);
    const blog_outlines = safeParseJson<string[]>(generation.blogOutlines, []);

    return res.json({
      id: generation.id,
      workspaceId: generation.workspaceId,
      createdAt: generation.createdAt,
      transcript: generation.transcript,
      linkedin_posts,
      x_posts,
      blog_outlines,
    });
  });

  // Plan intent
  app.post("/api/plan-intent", async (req, res) => {
    const user = req.user as any;
    const userId = user?.id || user?.claims?.sub;
    const { plan } = req.body;

    if (!plan) return res.status(400).json({ error: "Plan is required" });

    try {
      const intent = await storage.logPlanIntent({ userId, plan });
      res.status(201).json(intent);
    } catch (err: any) {
      console.error("[PLAN_INTENT] Error logging intent:", err);
      res.status(500).json({ error: "Failed to log intent" });
    }
  });

  return httpServer;
}