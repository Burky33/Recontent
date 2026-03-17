// client/src/pages/ResetPassword.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

const mono = "'IBM Plex Mono', monospace";
const serif = "'Georgia', 'Times New Roman', serif";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async () => {
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirm) {
      setErrorMsg("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(245,242,237,0.04)",
    border: "1px solid rgba(245,242,237,0.12)",
    padding: "12px 16px",
    fontSize: 13,
    color: "#F5F2ED",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: mono,
    letterSpacing: "0.02em",
  };

  return (
    <div style={{ fontFamily: mono, background: "#1A1A1B", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(192,87,70,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <a href="/" style={{ textDecoration: "none", marginBottom: 48, position: "relative", zIndex: 1 }}>
        <span style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: "#F5F2ED" }}>Re<span style={{ color: "#C05746" }}>Content</span></span>
      </a>

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        <div style={{ border: "1px solid rgba(245,242,237,0.08)", padding: "40px 36px" }}>
          <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "#C05746", marginBottom: 28 }}>ACCOUNT / NEW PASSWORD</p>

          {done ? (
            <>
              <h1 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: "#F5F2ED", marginBottom: 12, lineHeight: 1.1 }}>
                Password updated.
              </h1>
              <p style={{ fontSize: 12, color: "rgba(245,242,237,0.45)", lineHeight: 1.8 }}>
                You're all set. Taking you to your dashboard...
              </p>
              <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
                <div style={{ width: 24, height: 24, border: "2px solid rgba(192,87,70,0.3)", borderTop: "2px solid #C05746", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: "#F5F2ED", marginBottom: 8, lineHeight: 1.1 }}>
                Set a new password.
              </h1>
              <p style={{ fontSize: 12, color: "rgba(245,242,237,0.35)", marginBottom: 32, lineHeight: 1.7 }}>
                Choose something strong. At least 8 characters.
              </p>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.35)", marginBottom: 8 }}>NEW_PASSWORD</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.35)", marginBottom: 8 }}>CONFIRM_PASSWORD</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  style={inputStyle}
                />
              </div>

              {errorMsg && (
                <div style={{ border: "1px solid rgba(192,87,70,0.3)", background: "rgba(192,87,70,0.08)", padding: "10px 14px", fontSize: 12, color: "#C05746", marginBottom: 20, letterSpacing: "0.02em" }}>
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleReset}
                disabled={loading || !password || !confirm}
                style={{ width: "100%", background: loading || !password || !confirm ? "rgba(192,87,70,0.4)" : "#C05746", border: "none", color: "#F5F2ED", padding: "14px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600, cursor: loading || !password || !confirm ? "not-allowed" : "pointer", fontFamily: mono }}
              >
                {loading ? "UPDATING..." : "UPDATE PASSWORD →"}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}