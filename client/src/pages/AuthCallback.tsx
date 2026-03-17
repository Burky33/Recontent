// client/src/pages/AuthCallback.tsx
// Handles Supabase email confirmation redirect
// Supabase sends either ?code= (PKCE flow) or #access_token= (implicit flow)

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
        // Check for PKCE code in query params (Supabase default since v2)
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data.session) {
            localStorage.setItem("sb_token", data.session.access_token);
            navigate("/dashboard");
            return;
          }
        }

        // Fallback: check URL hash for implicit flow (#access_token=...)
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

        // No code or hash — check if already have a session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem("sb_token", session.access_token);
          navigate("/dashboard");
          return;
        }

        // Nothing worked — send to login
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