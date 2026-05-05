// client/src/pages/signup.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { trackSignUp, trackStartTrial } from "@/lib/analytics";

const mono = "'IBM Plex Mono', monospace";
const serif = "'Georgia', 'Times New Roman', serif";

export default function Signup() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else if (data.session) {
      localStorage.setItem("sb_token", data.session.access_token);
      trackSignUp();
      trackStartTrial();
      // Sync to Loops
      fetch("/api/auth/sync-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ firstName: "" }),
      }).catch(() => {});
      navigate("/dashboard");
    } else {
      trackSignUp();
      trackStartTrial();
      setSuccessMsg("Check your email to confirm your account, then log in.");
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(245,242,237,0.04)", border: "1px solid rgba(245,242,237,0.12)",
    padding: "12px 16px", fontSize: 13, color: "#F5F2ED", outline: "none",
    boxSizing: "border-box", fontFamily: mono, letterSpacing: "0.02em",
  };

  return (
    <div style={{ fontFamily: mono, background: "#1A1A1B", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(192,87,70,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <a href="/" style={{ textDecoration: "none", marginBottom: 48, position: "relative", zIndex: 1 }}>
        <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: "#F5F2ED" }}>Re<span style={{ color: "#C05746" }}>Content</span></span>
      </a>

      {/* Free trial callout */}
      <div style={{ width: "100%", maxWidth: 400, marginBottom: 0, position: "relative", zIndex: 1 }}>
        <div style={{ background: "rgba(192,87,70,0.08)", border: "1px solid rgba(192,87,70,0.2)", borderBottom: "none", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, letterSpacing: "0.14em", color: "#C05746" }}>FREE TRIAL INCLUDES</span>
          <span style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(245,242,237,0.4)" }}>10 LI · 10 X · 3 BLOGS</span>
        </div>

        <div style={{ height: 1, background: "rgba(245,242,237,0.08)" }} />

        <div style={{ border: "1px solid rgba(245,242,237,0.08)", borderTop: "none", padding: "40px 36px" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "#C05746", marginBottom: 28 }}>ACCOUNT / CREATE</p>

          <h1 style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: "#F5F2ED", marginBottom: 8, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            Start turning content<br />into posts.
          </h1>
          <p style={{ fontSize: 12, color: "rgba(245,242,237,0.35)", marginBottom: 32, letterSpacing: "0.02em", lineHeight: 1.7 }}>
            Your first content pack is free — no card needed.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.35)", marginBottom: 8 }}>EMAIL_ADDRESS</label>
            <input type="email" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              style={inputStyle} />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.35)", marginBottom: 8 }}>PASSWORD</label>
            <input type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignup()}
              style={inputStyle} />
          </div>

          {errorMsg && (
            <div style={{ border: "1px solid rgba(192,87,70,0.3)", background: "rgba(192,87,70,0.08)", padding: "10px 14px", fontSize: 12, color: "#C05746", marginBottom: 20, letterSpacing: "0.02em" }}>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ border: "1px solid rgba(245,242,237,0.15)", background: "rgba(245,242,237,0.04)", padding: "10px 14px", fontSize: 12, color: "#F5F2ED", marginBottom: 20, letterSpacing: "0.02em", lineHeight: 1.6 }}>
              {successMsg}
            </div>
          )}

          <button onClick={handleSignup} disabled={loading}
            style={{ width: "100%", background: loading ? "rgba(192,87,70,0.5)" : "#C05746", border: "none", color: "#F5F2ED", padding: "14px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: mono, marginBottom: 28 }}>
            {loading ? "CREATING ACCOUNT..." : "GET FIRST PACK FREE →"}
          </button>

          {/* What you get */}
          <div style={{ border: "1px solid rgba(245,242,237,0.06)", padding: "16px", marginBottom: 24 }}>
            <p style={{ fontSize: 10, letterSpacing: "0.12em", color: "rgba(245,242,237,0.25)", marginBottom: 12 }}>YOUR FREE GENERATION PRODUCES</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {["10 LinkedIn posts", "10 X posts", "3 blog outlines", "1 workspace"].map(item => (
                <div key={item} style={{ fontSize: 11, color: "rgba(245,242,237,0.5)", display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.02em" }}>
                  <span style={{ color: "#C05746" }}>—</span> {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: "rgba(245,242,237,0.06)", marginBottom: 24 }} />

          <div style={{ textAlign: "center", fontSize: 11, color: "rgba(245,242,237,0.3)", letterSpacing: "0.06em" }}>
            HAVE AN ACCOUNT?{" "}
            <a href="/login" style={{ color: "#C05746", textDecoration: "none", fontWeight: 600 }}>LOG IN →</a>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}
