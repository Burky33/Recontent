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

const LinkedInIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2" style={{ flexShrink: 0 }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F5F2ED" style={{ flexShrink: 0 }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

function BlueprintLine() {
  return (
    <div style={{ width: "100%", height: 1, background: "rgba(245,242,237,0.08)", margin: "0" }} />
  );
}

function FeatureItem({ text }: { text: string }) {
  const hasLinkedIn = text.toLowerCase().includes("linkedin");
  // FIX: updated to include 150 x, removed 120 x
  const hasX = text.toLowerCase().startsWith("10 x") || text.toLowerCase().startsWith("30 x") || text.toLowerCase().startsWith("150 x");

  return (
    <div style={{ fontSize: 12, color: "rgba(245,242,237,0.45)", marginBottom: 10, display: "flex", alignItems: "center", gap: 10, letterSpacing: "0.02em" }}>
      <span style={{ color: "#C05746", flexShrink: 0 }}>—</span>
      {hasLinkedIn && <LinkedInIcon />}
      {hasX && <XIcon />}
      {text}
    </div>
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
            Paste a transcript, drop a YouTube link, or upload a recording. ReContent generates a full content pack —{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><LinkedInIcon size={12} /> LinkedIn posts</span>,{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><XIcon size={12} /> X posts</span>,{" "}
            blog outlines — in seconds.
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

        {/* RIGHT — stone sculpture SVG */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#141415", position: "relative", overflow: "hidden" }}>
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
            <ellipse cx="240" cy="420" rx="110" ry="18" fill="#0F0E0D" opacity="0.6" />
            <path d="M120 390 L360 390 L340 415 L140 415 Z" fill="#1A1715" />
            <path d="M120 390 L360 390 L355 395 L125 395 Z" fill="#2A2520" />
            <path d="M155 390 L165 120 Q200 80 240 70 Q280 80 315 120 L325 390 Z" fill="url(#stoneLight)" filter="url(#roughness)" />
            <path d="M155 390 L165 120 Q185 95 210 80 L200 390 Z" fill="url(#stoneDark)" opacity="0.7" />
            <ellipse cx="240" cy="72" rx="58" ry="52" fill="url(#stoneLight)" filter="url(#roughness)" />
            <ellipse cx="220" cy="58" rx="28" ry="24" fill="url(#accent)" opacity="0.5" />
            <path d="M200 390 L208 130 Q222 95 235 78" stroke="#8B7060" strokeWidth="1.5" fill="none" opacity="0.4" />
            <path d="M210 280 Q240 265 270 280 L268 310 Q240 298 212 310 Z" fill="#111010" opacity="0.8" />
          </svg>
        </div>
      </section>

      <BlueprintLine />

      {/* ── WHAT YOU GET ── */}
      <section style={{ padding: "80px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 80, marginBottom: 56 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: "0.18em", color: "rgba(245,242,237,0.3)", marginBottom: 16 }}>OUTPUT</p>
            <h2 style={{ ...S.serif, fontSize: 36, fontWeight: 700, letterSpacing: "-1px", lineHeight: 1.15, color: "#F5F2ED" }}>1 recording.<br />23 assets.</h2>
          </div>
          <p style={{ fontSize: 14, color: "rgba(245,242,237,0.45)", lineHeight: 1.9, maxWidth: 480, alignSelf: "end" }}>
            Every generation produces a full content pack across three formats. Edit, copy, and publish whatever fits.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, border: "1px solid rgba(245,242,237,0.08)" }}>
          <div style={{ padding: "40px 36px", borderRight: "1px solid rgba(245,242,237,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <LinkedInIcon size={18} />
              <span style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(245,242,237,0.4)" }}>LINKEDIN</span>
            </div>
            <div style={{ ...S.serif, fontSize: 48, fontWeight: 700, color: "#F5F2ED", marginBottom: 8 }}>10</div>
            <div style={{ fontSize: 13, color: "rgba(245,242,237,0.45)", lineHeight: 1.7 }}>Posts per generation, ready to edit and publish.</div>
          </div>

          <div style={{ padding: "40px 36px", borderRight: "1px solid rgba(245,242,237,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <XIcon size={16} />
              <span style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(245,242,237,0.4)" }}>X / TWITTER</span>
            </div>
            <div style={{ ...S.serif, fontSize: 48, fontWeight: 700, color: "#F5F2ED", marginBottom: 8 }}>10</div>
            <div style={{ fontSize: 13, color: "rgba(245,242,237,0.45)", lineHeight: 1.7 }}>Posts per generation, punchy and platform-ready.</div>
          </div>

          <div style={{ padding: "40px 36px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C05746" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span style={{ fontSize: 11, letterSpacing: "0.14em", color: "rgba(245,242,237,0.4)" }}>BLOG</span>
            </div>
            <div style={{ ...S.serif, fontSize: 48, fontWeight: 700, color: "#F5F2ED", marginBottom: 8 }}>3</div>
            <div style={{ fontSize: 13, color: "rgba(245,242,237,0.45)", lineHeight: 1.7 }}>Blog outlines per generation, structured and SEO-ready.</div>
          </div>
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
              <FeatureItem key={f} text={f} />
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
              <FeatureItem key={f} text={f} />
            ))}
            <button onClick={() => navigate("/signup")}
              style={{ marginTop: 36, width: "100%", background: "none", border: "1px solid rgba(245,242,237,0.15)", color: "#F5F2ED", padding: "12px", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace" }}>
              GET STARTED
            </button>
          </div>

          {/* Pro */}
          <div style={{ padding: "48px 40px", background: "rgba(192,87,70,0.06)", position: "relative" }}>
            <div style={{ position: "absolute", top: 20, right: 20, fontSize: 10, letterSpacing: "0.12em", color: "#C05746", border: "1px solid rgba(192,87,70,0.3)", padding: "4px 10px" }}>
              MOST POPULAR
            </div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#C05746", marginBottom: 24 }}>PRO</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
              <span style={{ ...S.serif, fontSize: 52, fontWeight: 700, letterSpacing: "-2px", color: "#F5F2ED" }}>$129</span>
              <span style={{ fontSize: 12, color: "rgba(245,242,237,0.3)" }}>/mo</span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(245,242,237,0.3)", letterSpacing: "0.08em", marginBottom: 8 }}>SERIOUS OPERATORS</div>
            {/* FIX: was 12 pieces / 276 assets */}
            <div style={{ fontSize: 13, color: "rgba(245,242,237,0.5)", marginBottom: 32, lineHeight: 1.7 }}>
              Turn <span style={{ color: "#F5F2ED" }}>15 pieces of content</span> into <span style={{ color: "#C05746" }}>345 marketing assets</span> every month
            </div>
            <div style={{ width: "100%", height: 1, background: "rgba(192,87,70,0.15)", marginBottom: 28 }} />
            {/* FIX: was 120 LinkedIn, 120 X, 36 blog, Multiple workspaces */}
            {["150 LinkedIn posts / mo", "150 X posts / mo", "45 blog outlines / mo", "5 workspaces", "Faster processing"].map(f => (
              <FeatureItem key={f} text={f} />
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

      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}