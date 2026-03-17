// client/src/pages/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

const mono = "'IBM Plex Mono', monospace";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token_hash = params.get("token_hash");
        const type = params.get("type");
        const code = params.get("code");

        // token_hash flow — what your Supabase email template sends
        if (token_hash && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          if (error) throw error;
          if (data.session) {
            localStorage.setItem("sb_token", data.session.access_token);
            navigate("/dashboard");
            return;
          }
        }

        // PKCE code flow fallback
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.session) {
            localStorage.setItem("sb_token", data.session.access_token);
            navigate("/dashboard");
            return;
          }
        }

        // Implicit hash flow fallback
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
              localStorage.setItem("sb_token", session.access_token);
              navigate("/dashboard");
              subscription.unsubscribe();
            }
          });
          return;
        }

        // Already have a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem("sb_token", session.access_token);
          navigate("/dashboard");
          return;
        }

        setError("Verification link has expired or is invalid. Please log in.");
        setTimeout(() => navigate("/login"), 3000);

      } catch (err: any) {
        console.error("Auth callback error:", err);
        setError(err.message || "Verification failed. Please try logging in.");
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div style={{ fontFamily: mono, background: "#1A1A1B", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      {error ? (
        <>
          <p style={{ fontSize: 12, color: "#C05746", letterSpacing: "0.08em", maxWidth: 360, textAlign: "center", lineHeight: 1.7 }}>{error}</p>
          <p style={{ fontSize: 10, color: "rgba(245,242,237,0.3)", letterSpacing: "0.1em" }}>REDIRECTING TO LOGIN...</p>
        </>
      ) : (
        <>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(192,87,70,0.3)", borderTop: "2px solid #C05746", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 11, color: "rgba(245,242,237,0.4)", letterSpacing: "0.12em" }}>VERIFYING YOUR EMAIL...</p>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}