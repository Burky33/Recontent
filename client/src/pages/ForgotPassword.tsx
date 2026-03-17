// client/src/pages/ForgotPassword.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const mono = "'IBM Plex Mono', monospace";
const serif = "'Georgia', 'Times New Roman', serif";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong");
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
          <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "#C05746", marginBottom: 28 }}>ACCOUNT / RESET PASSWORD</p>

          {sent ? (
            <>
              <h1 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: "#F5F2ED", marginBottom: 12, lineHeight: 1.1 }}>
                Check your email.
              </h1>
              <p style={{ fontSize: 12, color: "rgba(245,242,237,0.45)", lineHeight: 1.8, marginBottom: 32 }}>
                If an account exists for <span style={{ color: "#EDEAE4" }}>{email}</span>, a password reset link has been sent from <span style={{ color: "#EDEAE4" }}>noreply@recontent.online</span>.
              </p>
              <a href="/login" style={{ display: "block", textAlign: "center", fontSize: 11, color: "rgba(245,242,237,0.35)", letterSpacing: "0.08em", textDecoration: "none" }}>
                ← BACK TO LOGIN
              </a>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: "#F5F2ED", marginBottom: 8, lineHeight: 1.1 }}>
                Forgot your password?
              </h1>
              <p style={{ fontSize: 12, color: "rgba(245,242,237,0.35)", marginBottom: 32, letterSpacing: "0.02em", lineHeight: 1.7 }}>
                Enter your email and we'll send you a reset link.
              </p>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.35)", marginBottom: 8 }}>EMAIL_ADDRESS</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                disabled={loading || !email}
                style={{ width: "100%", background: loading || !email ? "rgba(192,87,70,0.4)" : "#C05746", border: "none", color: "#F5F2ED", padding: "14px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600, cursor: loading || !email ? "not-allowed" : "pointer", fontFamily: mono, marginBottom: 24 }}
              >
                {loading ? "SENDING..." : "SEND RESET LINK →"}
              </button>

              <div style={{ textAlign: "center" }}>
                <a href="/login" style={{ fontSize: 11, color: "rgba(245,242,237,0.35)", letterSpacing: "0.08em", textDecoration: "none" }}>
                  ← BACK TO LOGIN
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}