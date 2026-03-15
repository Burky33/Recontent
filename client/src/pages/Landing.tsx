// client/src/pages/Landing.tsx
import { useLocation } from "wouter";

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#0a0a0f", color: "#f0f0f5", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── NAV ── */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, background: "rgba(10,10,15,0.92)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>Re<span style={{ color: "#6366f1" }}>Content</span></span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => navigate("/login")} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#ccc", padding: "9px 22px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
            Log in
          </button>
          <button onClick={() => navigate("/signup")} style={{ background: "#6366f1", border: "none", color: "#fff", padding: "9px 22px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Start Free Trial
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "100px 40px 80px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 100, padding: "6px 16px", marginBottom: 32, fontSize: 13, color: "#a5b4fc" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
          Content infrastructure for serious marketers
        </div>

        <h1 style={{ fontSize: "clamp(42px, 7vw, 76px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-2px", marginBottom: 28, color: "#fff" }}>
          One recording.<br />
          <span style={{ color: "#6366f1" }}>Weeks of content.</span>
        </h1>

        <p style={{ fontSize: 20, color: "#9ca3af", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 48px", fontWeight: 400 }}>
          Paste a transcript, drop a YouTube link, or upload a recording — ReContent generates 10 LinkedIn posts, 10 X posts, and 3 blog outlines in one shot.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/signup")} style={{ background: "#6366f1", border: "none", color: "#fff", padding: "16px 36px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 700, letterSpacing: "-0.2px" }}>
            Get your first content pack free →
          </button>
          <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#ccc", padding: "16px 28px", borderRadius: 10, cursor: "pointer", fontSize: 16, fontWeight: 500 }}>
            See pricing
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 13, color: "#4b5563" }}>No credit card required · Free trial included</p>
      </section>

      {/* ── CONTENT PACK VISUAL ── */}
      <section style={{ maxWidth: 860, margin: "0 auto 100px", padding: "0 40px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "40px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {[
            { platform: "LinkedIn", count: 10, icon: "in", color: "#0a66c2", desc: "Long-form posts optimised for engagement" },
            { platform: "X (Twitter)", count: 10, icon: "𝕏", color: "#fff", desc: "Sharp, punchy posts ready to publish" },
            { platform: "Blog Outlines", count: 3, icon: "✍", color: "#6366f1", desc: "Full SEO-ready outlines with H2s and CTAs" },
          ].map((item) => (
            <div key={item.platform} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "28px 24px" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: item.color, letterSpacing: "-1px", lineHeight: 1 }}>{item.count}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: "6px 0 8px" }}>{item.platform}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#4b5563" }}>Every single generation. Every single time.</p>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ maxWidth: 860, margin: "0 auto 100px", padding: "0 40px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 14, letterSpacing: "-1px" }}>How it works</h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 52, fontSize: 16 }}>Three steps. Under two minutes.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {[
            { step: "01", title: "Add your content", desc: "Paste a transcript, drop a YouTube URL, or upload an audio/video file from your webinar, podcast, or training session." },
            { step: "02", title: "Set your brand voice", desc: "Create a workspace with your brand style, tone, and audience. ReContent writes in your voice, not a generic AI voice." },
            { step: "03", title: "Get your content pack", desc: "Hit generate. In seconds you have 23 pieces of ready-to-post content across LinkedIn, X, and your blog pipeline." },
          ].map((item) => (
            <div key={item.step} style={{ position: "relative" }}>
              <div style={{ fontSize: 72, fontWeight: 900, color: "rgba(99,102,241,0.08)", letterSpacing: "-3px", lineHeight: 1, marginBottom: -20 }}>{item.step}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section style={{ maxWidth: 860, margin: "0 auto 100px", padding: "0 40px" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: "52px 48px" }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 40, letterSpacing: "-1px", textAlign: "center" }}>Built for people who create more than they post</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {[
              { title: "Solo founders", desc: "You record a Loom, run a webinar, or do a podcast. Now it becomes your entire month of LinkedIn content." },
              { title: "Consultants", desc: "Every client workshop is a content goldmine. Stop letting it sit in a folder — turn it into authority-building posts." },
              { title: "Content marketers", desc: "Stop starting from a blank page. Drop in the recording and edit great output instead of writing from scratch." },
              { title: "Small agencies", desc: "Manage multiple client brands in separate workspaces and crank out content packs for each account." },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", gap: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", marginTop: 7, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ maxWidth: 940, margin: "0 auto 100px", padding: "0 40px" }}>
        <h2 style={{ fontSize: 36, fontWeight: 800, textAlign: "center", marginBottom: 14, letterSpacing: "-1px" }}>Simple, transparent pricing</h2>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: 52, fontSize: 16 }}>Start free. Scale when you're ready.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {/* Trial */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "36px 28px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Trial</div>
            <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-2px", color: "#fff", marginBottom: 4 }}>$0</div>
            <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 28 }}>One-time, no card required</div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, marginBottom: 28 }}>
              {["1 complete content pack", "10 LinkedIn + 10 X posts", "3 blog outlines", "1 workspace"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 14, color: "#9ca3af" }}>
                  <span style={{ color: "#6366f1" }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/signup")} style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              Start free
            </button>
          </div>

          {/* Starter */}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "36px 28px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Starter</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-2px", color: "#fff" }}>$39</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>/month</div>
            </div>
            <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 28 }}>For solo operators</div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, marginBottom: 28 }}>
              {["3 generations / month", "30 LinkedIn + 30 X posts", "9 blog outlines", "1 workspace", "Standard priority"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 14, color: "#9ca3af" }}>
                  <span style={{ color: "#6366f1" }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/signup")} style={{ width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", padding: "12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
              Get started
            </button>
          </div>

          {/* Pro */}
          <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 16, padding: "36px 28px", position: "relative" }}>
            <div style={{ position: "absolute", top: -12, right: 20, background: "#6366f1", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 100, textTransform: "uppercase", letterSpacing: 0.5 }}>Most popular</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#a5b4fc", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Pro</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: "-2px", color: "#fff" }}>$129</div>
              <div style={{ fontSize: 14, color: "#6b7280" }}>/month</div>
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 28 }}>For serious content operators</div>
            <div style={{ borderTop: "1px solid rgba(99,102,241,0.2)", paddingTop: 24, marginBottom: 28 }}>
              {["12 generations / month", "120 LinkedIn + 120 X posts", "36 blog outlines", "Multiple workspaces", "Faster processing priority"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, fontSize: 14, color: "#c7d2fe" }}>
                  <span style={{ color: "#818cf8" }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/signup")} style={{ width: "100%", background: "#6366f1", border: "none", color: "#fff", padding: "12px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700 }}>
              Start free trial
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#374151" }}>All plans start with a free trial generation. No credit card needed to try.</p>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ maxWidth: 700, margin: "0 auto 100px", padding: "0 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-1.5px", marginBottom: 20, color: "#fff" }}>
          Stop letting great content<br />collect dust.
        </h2>
        <p style={{ fontSize: 18, color: "#6b7280", marginBottom: 36, lineHeight: 1.6 }}>
          You're already creating the raw material. ReContent turns it into posts you can publish tomorrow.
        </p>
        <button onClick={() => navigate("/signup")} style={{ background: "#6366f1", border: "none", color: "#fff", padding: "18px 44px", borderRadius: 10, cursor: "pointer", fontSize: 17, fontWeight: 700, letterSpacing: "-0.3px" }}>
          Get your free content pack →
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 940, margin: "0 auto" }}>
        <span style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>Re<span style={{ color: "#6366f1" }}>Content</span></span>
        <div style={{ display: "flex", gap: 24, fontSize: 14, color: "#4b5563" }}>
          <a href="/login" style={{ color: "#4b5563", textDecoration: "none" }}>Login</a>
          <a href="/signup" style={{ color: "#4b5563", textDecoration: "none" }}>Sign up</a>
        </div>
      </footer>
    </div>
  );
}
