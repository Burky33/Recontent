// client/src/pages/Login.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

const mono = "'IBM Plex Mono', monospace";
const serif = "'Georgia', 'Times New Roman', serif";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error("No session returned from Supabase");

      localStorage.setItem("sb_token", data.session.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
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

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div style={{ border: "1px solid rgba(245,242,237,0.08)", padding: "40px 36px" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "#C05746", marginBottom: 28 }}>ACCOUNT / LOGIN</p>

          <h1 style={{ fontFamily: serif, fontSize: 28, fontWeight: 700, color: "#F5F2ED", marginBottom: 8, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: 12, color: "rgba(245,242,237,0.35)", marginBottom: 32, letterSpacing: "0.02em", lineHeight: 1.7 }}>
            Log in to access your workspaces and content.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.35)", marginBottom: 8 }}>EMAIL_ADDRESS</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.35)", marginBottom: 8 }}>PASSWORD</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={inputStyle}
            />
          </div>

          {errorMsg && (
            <div style={{ border: "1px solid rgba(192,87,70,0.3)", background: "rgba(192,87,70,0.08)", padding: "10px 14px", fontSize: 12, color: "#C05746", marginBottom: 20, letterSpacing: "0.02em" }}>
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", background: loading ? "rgba(192,87,70,0.5)" : "#C05746", border: "none", color: "#F5F2ED", padding: "14px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: mono, marginBottom: 28 }}
          >
            {loading ? "LOGGING IN..." : "LOG IN →"}
          </button>

          <div style={{ height: 1, background: "rgba(245,242,237,0.06)", marginBottom: 24 }} />

          <div style={{ textAlign: "center", fontSize: 11, color: "rgba(245,242,237,0.3)", letterSpacing: "0.06em" }}>
            NO ACCOUNT?{" "}
            <a href="/signup" style={{ color: "#C05746", textDecoration: "none", fontWeight: 600 }}>SIGN UP FREE →</a>
          </div>
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}