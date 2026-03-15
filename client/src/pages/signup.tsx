// client/src/pages/signup.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

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
      navigate("/dashboard");
    } else {
      setSuccessMsg("Check your email to confirm your account, then log in.");
    }
  };

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#0a0a0f", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

      {/* Background glow */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <a href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", color: "#fff" }}>Re<span style={{ color: "#6366f1" }}>Content</span></span>
      </a>

      {/* Free trial badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 100, padding: "6px 16px", marginBottom: 24, fontSize: 13, color: "#a5b4fc", position: "relative", zIndex: 1 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
        Free trial · 10 LinkedIn + 10 X posts + 3 blog outlines
      </div>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "40px 36px", position: "relative", zIndex: 1 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: "-0.5px" }}>Create your account</h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>Get your first content pack free — no credit card needed</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>Email</label>
          <input
            type="email" placeholder="you@example.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", fontSize: 15, color: "#fff", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 8 }}>Password</label>
          <input
            type="password" placeholder="••••••••" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignup()}
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", fontSize: 15, color: "#fff", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {errorMsg && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171", marginBottom: 20 }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#4ade80", marginBottom: 20 }}>
            {successMsg}
          </div>
        )}

        <button onClick={handleSignup} disabled={loading}
          style={{ width: "100%", background: loading ? "rgba(99,102,241,0.5)" : "#6366f1", border: "none", color: "#fff", padding: "13px", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px", marginBottom: 20 }}>
          {loading ? "Creating account..." : "Start free trial →"}
        </button>

        {/* What you get */}
        <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Your free trial includes</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {["10 LinkedIn posts", "10 X posts", "3 blog outlines", "1 workspace"].map(item => (
              <div key={item} style={{ fontSize: 13, color: "#a5b4fc", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#6366f1" }}>✓</span> {item}
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 24, textAlign: "center" }}>
          <span style={{ fontSize: 14, color: "#4b5563" }}>Already have an account? </span>
          <a href="/login" style={{ fontSize: 14, color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>Log in</a>
        </div>
      </div>

      <p style={{ marginTop: 32, fontSize: 13, color: "#374151", textAlign: "center" }}>
        By signing up you agree to our terms of service
      </p>
    </div>
  );
}
