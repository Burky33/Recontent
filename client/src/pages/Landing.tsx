// client/src/pages/Landing.tsx
import { useLocation } from "wouter";

const S: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'IBM Plex Mono', monospace",
    background: "#1A1A1B",
    color: "#F5F2ED",
    minHeight: "100vh",
    overflowX: "hidden",
  },
  serif: { fontFamily: "'Georgia', 'Times New Roman', serif" },
};

function BlueprintLine() {
  return (
    <div style={{ width: "100%", height: 1, background: "rgba(245,242,237,0.08)", margin: "0" }} />
  );
}

export default function Landing() {
  const [, navigate] = useLocation();

  return (
    <div style={S.root}>
      {/* ── NAV ── */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 56px", position: "sticky", top: 0, background: "rgba(26,26,27,0.95)", backdropFilter: "blur(12px)", zIndex: 100 }}>
        <span style={{ ...S.serif, fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", color: "#F5F2ED" }}>
          Re<span style={{ color: "#C05746" }}>Content</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
            style={{ background: "none", border: "none", color: "rgba(245,242,237,0.45)", fontSize: 12, letterSpacing: "0.08em", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
            PRICING
          </button>
          <button onClick={() => navigate("/login")}
            style={{ background: "none", border: "1px solid rgba(245,242,237,0.15)", color: "rgba(245,242,237,0.6)", fontSize: 12, letterSpacing: "0.08em", padding: "8px 20px", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
            LOG_IN
          </button>
          <button onClick={() => navigate("/signup")}
            style={{ background: "#C05746", border: "none", color: "#F5F2ED", fontSize: 12, letterSpacing: "0.08em", padding: "10px 24px", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
            START FREE →
          </button>
        </div>
      </nav>

      <BlueprintLine />

      {/* ── HERO SPLIT ── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "88vh", position: "relative" }}>

        {/* LEFT — headline */}
        <div style={{ padding: "80px 56px 80px 56px", display: "flex", flexDirection: "column", justifyContent: "center", borderRight: "1px solid rgba(245,242,237,0.08)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", color: "#C05746", marginBottom: 40, fontWeight: 500 }}>
            CONTENT INFRASTRUCTURE / v1.0
          </p>

          <h1 style={{ ...S.serif, fontSize: "clamp(48px, 5.5vw, 80px)", fontWeight: 700, lineHeight: 1.03, letterSpacing: "-2.5px", color: "#F5F2ED", marginBottom: 40 }}>
            One recording.<br />
            Weeks of<br />
            <span style={{ color: "#C05746", fontStyle: "italic" }}>ready-to-post</span><br />
            content.
          </h1>

          <p style={{ fontSize: 14, color: "rgba(245,242,237,0.5)", lineHeight: 1.9, maxWidth: 400, marginBottom: 48, letterSpacing: "0.01em" }}>
            Paste a transcript, drop a YouTube link, or upload a recording. ReContent generates a full content pack — LinkedIn posts, X posts, blog outlines — in seconds.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button onClick={() => navigate("/signup")}
              style={{ background: "#C05746", border: "none", color: "#F5F2ED", padding: "16px 36px", fontSize: 13, letterSpacing: "0.1em", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
              GET FIRST PACK FREE →
            </button>
            <span style={{ fontSize: 11, color: "rgba(245,242,237,0.3)", letterSpacing: "0.05em" }}>
              no card required
            </span>
          </div>
        </div>

        {/* RIGHT — 3D stone sculpture SVG */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#141415", position: "relative", overflow: "hidden" }}>
          {/* Grain overlay */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")", opacity: 0.6, pointerEvents: "none", zIndex: 1 }} />

          <svg viewBox="0 0 480 520" style={{ width: "72%", maxWidth: 380, position: "relative", zIndex: 2 }} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="stoneLight" cx="35%" cy="28%" r="65%">
                <stop offset="0%" stopColor="#6B5B4E" />
                <stop offset="40%" stopColor="#3D3530" />
                <stop offset="100%" stopColor="#1E1B19" />
              </radialGradient>
              <radialGradient id="stoneDark" cx="70%" cy="70%" r="55%">
                <stop offset="0%" stopColor="#2A2520" />
                <stop offset="100%" stopColor="#0F0E0D" />
              </radialGradient>
              <radialGradient id="accent" cx="30%" cy="25%" r="50%">
                <stop offset="0%" stopColor="#8B6A5E" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#3A2F2A" stopOpacity="0" />
              </radialGradient>
              <filter id="roughness">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>

            {/* Main abstract form - asymmetric monolith */}
            <ellipse cx="240" cy="420" rx="110" ry="18" fill="#0F0E0D" opacity="0.6" />

            {/* Base slab */}
            <path d="M120 390 L360 390 L340 415 L140 415 Z" fill="#1A1715" />
            <path d="M120 390 L360 390 L355 395 L125 395 Z" fill="#2A2520" />

            {/* Main torso - tapered monolith */}
            <path d="M155 390 L165 120 Q200 80 240 70 Q280 80 315 120 L325 390 Z" fill="url(#stoneLight)" filter="url(#roughness)" />

            {/* Left face shadow */}
            <path d="M155 390 L165 120 Q185 95 210 80 L200 390 Z" fill="url(#stoneDark)" opacity="0.7" />

            {/* Top sphere/head */}
            <ellipse cx="240" cy="72" rx="58" ry="52" fill="url(#stoneLight)" filter="url(#roughness)" />
            <ellipse cx="220" cy="58" rx="28" ry="24" fill="url(#accent)" opacity="0.5" />

            {/* Highlight ridge */}
            <path d="M200 390 L208 130 Q222 95 235 78" stroke="#8B7060" strokeWidth="1.5" fill="none" opacity="0.4" />

            {/* Notch / carved detail */}
            <path d="M210 280 Q240 265 270 280 L268 310 Q240 298 212 310 Z" fill="#111010" opacity="0.8" />
            <path d="M212 282 Q240 268 268 282" stroke="#5A4A40" strokeWidth="0.8" fill="none" opacity="0.6" />

            {/* Horizontal band groove */}
            <path d="M168 220 L320 218" stroke="#5A4A40" strokeWidth="1" opacity="0.35" />
            <path d="M166 223 L322 221" stroke="#2A2218" strokeWidth="1.5" opacity="0.5" />

            {/* Surface texture lines */}
            <path d="M180 170 Q200 165 215 168" stroke="#6B5B4E" strokeWidth="0.6" fill="none" opacity="0.3" />
            <path d="M265 155 Q280 150 300 158" stroke="#6B5B4E" strokeWidth="0.6" fill="none" opacity="0.3" />
            <path d="M175 310 Q195 305 205 308" stroke="#5A4A40" strokeWidth="0.5" fill="none" opacity="0.25" />
            <path d="M275 320 Q295 315 315 320" stroke="#5A4A40" strokeWidth="0.5" fill="none" opacity="0.25" />

            {/* Terracotta accent fragment */}
            <path d="M290 195 L310 185 L318 205 L298 215 Z" fill="#C05746" opacity="0.15" />
            <path d="M292 197 L308 188 L315 204 L299 213 Z" fill="#C05746" opacity="0.2" />

            {/* Specular highlight */}
            <ellipse cx="210" cy="130" rx="22" ry="35" fill="#9E8870" opacity="0.12" transform="rotate(-15 210 130)" />
          </svg>

          {/* Corner annotation */}
          <div style={{ position: "absolute", bottom: 32, right: 32, fontSize: 10, color: "rgba(245,242,237,0.2)", letterSpacing: "0.12em", textAlign: "right", zIndex: 3 }}>
            CONTENT_ENGINE<br />
            REV.01 / MATTE
          </div>
        </div>
      </section>

      <BlueprintLine />

      {/* ── OUTPUT NUMBERS ── */}
      <section style={{ padding: "80px 56px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
        {[
          { n: "10", label: "LinkedIn posts", sub: "per generation" },
          { n: "10", label: "X posts", sub: "per generation" },
          { n: "3", label: "Blog outlines", sub: "per generation" },
        ].map((item, i) => (
          <div key={item.label} style={{ padding: "48px 40px", borderRight: i < 2 ? "1px solid rgba(245,242,237,0.08)" : "none" }}>
            <div style={{ ...S.serif, fontSize: "clamp(56px, 6vw, 88px)", fontWeight: 700, color: "#C05746", letterSpacing: "-3px", lineHeight: 1 }}>{item.n}</div>
            <div style={{ fontSize: 14, color: "#F5F2ED", marginTop: 12, letterSpacing: "0.02em" }}>{item.label}</div>
            <div style={{ fontSize: 11, color: "rgba(245,242,237,0.3)", marginTop: 6, letterSpacing: "0.1em" }}>{item.sub.toUpperCase()}</div>
          </div>
        ))}
      </section>

      <BlueprintLine />

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 56px", display: "grid", gridTemplateColumns: "240px 1fr", gap: 80 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(245,242,237,0.3)", marginBottom: 16 }}>PROCESS</p>
          <h2 style={{ ...S.serif, fontSize: 36, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.15, color: "#F5F2ED" }}>Three steps.</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}>
          {[
            { n: "01", title: "Add your content", body: "Paste a transcript, drop a YouTube URL, or upload audio/video from any webinar, podcast, or training session." },
            { n: "02", title: "Set your brand voice", body: "Create a workspace with your tone, style, and audience. ReContent writes in your voice — not generic AI output." },
            { n: "03", title: "Get your pack", body: "Hit generate. In seconds: 23 pieces of ready-to-post content across LinkedIn, X, and your blog pipeline." },
          ].map(item => (
            <div key={item.n}>
              <div style={{ fontSize: 11, color: "#C05746", letterSpacing: "0.15em", marginBottom: 20 }}>{item.n}</div>
              <div style={{ width: 32, height: 1, background: "rgba(245,242,237,0.12)", marginBottom: 20 }} />
              <h3 style={{ ...S.serif, fontSize: 18, fontWeight: 700, color: "#F5F2ED", marginBottom: 14, letterSpacing: "-0.3px" }}>{item.title}</h3>
              <p style={{ fontSize: 13, color: "rgba(245,242,237,0.45)", lineHeight: 1.85, letterSpacing: "0.01em" }}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <BlueprintLine />

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "80px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 80, marginBottom: 56 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(245,242,237,0.3)", marginBottom: 16 }}>PRICING</p>
            <h2 style={{ ...S.serif, fontSize: 36, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.15, color: "#F5F2ED" }}>Start free.<br />Scale up.</h2>
          </div>
          <p style={{ fontSize: 14, color: "rgba(245,242,237,0.45)", lineHeight: 1.9, maxWidth: 480, alignSelf: "end" }}>
            Every plan starts with a free generation. See what 23 pieces of content from one recording feels like before you commit to anything.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid rgba(245,242,237,0.08)" }}>
          {/* Trial */}
          <div style={{ padding: "48px 40px", borderRight: "1px solid rgba(245,242,237,0.08)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(245,242,237,0.3)", marginBottom: 24 }}>TRIAL</div>
            <div style={{ ...S.serif, fontSize: 52, fontWeight: 700, letterSpacing: "-2px", color: "#F5F2ED", marginBottom: 6 }}>$0</div>
            <div style={{ fontSize: 11, color: "rgba(245,242,237,0.3)", letterSpacing: "0.08em", marginBottom: 8 }}>ONE-TIME · NO CARD</div>
            <div style={{ fontSize: 13, color: "rgba(245,242,237,0.5)", marginBottom: 32, lineHeight: 1.7 }}>
              Turn <span style={{ color: "#F5F2ED" }}>1 piece of content</span> into <span style={{ color: "#C05746" }}>23 marketing assets</span>
            </div>
            <div style={{ width: "100%", height: 1, background: "rgba(245,242,237,0.06)", marginBottom: 28 }} />
            {["10 LinkedIn posts", "10 X posts", "3 blog outlines", "1 workspace"].map(f => (
              <div key={f} style={{ fontSize: 12, color: "rgba(245,242,237,0.45)", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, letterSpacing: "0.02em" }}>
                <span style={{ color: "#C05746" }}>—</span> {f}
              </div>
            ))}
            <button onClick={() => navigate("/signup")}
              style={{ marginTop: 36, width: "100%", background: "none", border: "1px solid rgba(245,242,237,0.15)", color: "#F5F2ED", padding: "12px", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
              START FREE
            </button>
          </div>

          {/* Starter */}
          <div style={{ padding: "48px 40px", borderRight: "1px solid rgba(245,242,237,0.08)" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(245,242,237,0.3)", marginBottom: 24 }}>STARTER</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
              <span style={{ ...S.serif, fontSize: 52, fontWeight: 700, letterSpacing: "-2px", color: "#F5F2ED" }}>$39</span>
              <span style={{ fontSize: 12, color: "rgba(245,242,237,0.3)" }}>/mo</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(245,242,237,0.3)", letterSpacing: "0.08em", marginBottom: 8 }}>SOLO OPERATORS</div>
            <div style={{ fontSize: 13, color: "rgba(245,242,237,0.5)", marginBottom: 32, lineHeight: 1.7 }}>
              Turn <span style={{ color: "#F5F2ED" }}>3 pieces of content</span> into <span style={{ color: "#C05746" }}>69 marketing assets</span> every month
            </div>
            <div style={{ width: "100%", height: 1, background: "rgba(245,242,237,0.06)", marginBottom: 28 }} />
            {["30 LinkedIn posts / mo", "30 X posts / mo", "9 blog outlines / mo", "1 workspace", "Standard priority"].map(f => (
              <div key={f} style={{ fontSize: 12, color: "rgba(245,242,237,0.45)", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, letterSpacing: "0.02em" }}>
                <span style={{ color: "#C05746" }}>—</span> {f}
              </div>
            ))}
            <button onClick={() => navigate("/signup")}
              style={{ marginTop: 36, width: "100%", background: "none", border: "1px solid rgba(245,242,237,0.15)", color: "#F5F2ED", padding: "12px", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
              GET STARTED
            </button>
          </div>

          {/* Pro */}
          <div style={{ padding: "48px 40px", background: "rgba(192,87,70,0.06)", position: "relative" }}>
            <div style={{ position: "absolute", top: 20, right: 20, fontSize: 10, letterSpacing: "0.12em", color: "#C05746", border: "1px solid rgba(192,87,70,0.3)", padding: "4px 10px" }}>
              ⭐ MOST POPULAR
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#C05746", marginBottom: 24 }}>PRO</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
              <span style={{ ...S.serif, fontSize: 52, fontWeight: 700, letterSpacing: "-2px", color: "#F5F2ED" }}>$129</span>
              <span style={{ fontSize: 12, color: "rgba(245,242,237,0.3)" }}>/mo</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(245,242,237,0.3)", letterSpacing: "0.08em", marginBottom: 8 }}>SERIOUS OPERATORS</div>
            <div style={{ fontSize: 13, color: "rgba(245,242,237,0.5)", marginBottom: 32, lineHeight: 1.7 }}>
              Turn <span style={{ color: "#F5F2ED" }}>12 pieces of content</span> into <span style={{ color: "#C05746" }}>276 marketing assets</span> every month
            </div>
            <div style={{ width: "100%", height: 1, background: "rgba(192,87,70,0.15)", marginBottom: 28 }} />
            {["120 LinkedIn posts / mo", "120 X posts / mo", "36 blog outlines / mo", "Multiple workspaces", "Faster processing"].map(f => (
              <div key={f} style={{ fontSize: 12, color: "rgba(245,242,237,0.55)", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, letterSpacing: "0.02em" }}>
                <span style={{ color: "#C05746" }}>—</span> {f}
              </div>
            ))}
            <button onClick={() => navigate("/signup")}
              style={{ marginTop: 36, width: "100%", background: "#C05746", border: "none", color: "#F5F2ED", padding: "13px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
              START FREE TRIAL →
            </button>
          </div>
        </div>
      </section>

      <BlueprintLine />

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "100px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
        <h2 style={{ ...S.serif, fontSize: "clamp(36px, 4vw, 58px)", fontWeight: 700, letterSpacing: "-2px", lineHeight: 1.08, color: "#F5F2ED" }}>
          Stop letting great content collect dust.
        </h2>
        <div>
          <p style={{ fontSize: 14, color: "rgba(245,242,237,0.45)", lineHeight: 1.9, marginBottom: 40 }}>
            You're already creating the raw material. Every webinar, podcast, and training session is sitting idle. ReContent turns it into posts you can publish tomorrow.
          </p>
          <button onClick={() => navigate("/signup")}
            style={{ background: "#C05746", border: "none", color: "#F5F2ED", padding: "18px 44px", fontSize: 13, letterSpacing: "0.1em", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
            GET YOUR FREE CONTENT PACK →
          </button>
          <p style={{ fontSize: 11, color: "rgba(245,242,237,0.2)", marginTop: 16, letterSpacing: "0.06em" }}>NO CREDIT CARD · INSTANT ACCESS</p>
        </div>
      </section>

      <BlueprintLine />

      {/* ── FOOTER ── */}
      <footer style={{ padding: "32px 56px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ ...S.serif, fontSize: 16, fontWeight: 700, color: "#F5F2ED" }}>
          Re<span style={{ color: "#C05746" }}>Content</span>
        </span>
        <div style={{ display: "flex", gap: 32, fontSize: 11, color: "rgba(245,242,237,0.25)", letterSpacing: "0.1em" }}>
          <a href="/login" style={{ color: "rgba(245,242,237,0.25)", textDecoration: "none" }}>LOGIN</a>
          <a href="/signup" style={{ color: "rgba(245,242,237,0.25)", textDecoration: "none" }}>SIGN UP</a>
        </div>
      </footer>

      {/* Google Fonts */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}
