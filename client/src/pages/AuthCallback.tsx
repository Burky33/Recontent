// client/src/pages/AuthCallback.tsx
// Handles the redirect from Supabase email confirmation links
// Supabase redirects to /auth/callback with a token in the URL hash

import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

const mono = "'IBM Plex Mono', monospace";

export default function AuthCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Supabase puts the session in the URL hash after email confirmation
    // onAuthStateChange will pick it up automatically — we just need to
    // wait for the session then redirect to dashboard
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        localStorage.setItem("sb_token", session.access_token);
        // Small delay so the session is fully established
        setTimeout(() => navigate("/dashboard"), 100);
      } else if (event === "SIGNED_OUT") {
        navigate("/login");
      }
    });

    // Also try to get session immediately in case it's already set
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem("sb_token", session.access_token);
        setTimeout(() => navigate("/dashboard"), 100);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={{ fontFamily: mono, background: "#1A1A1B", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 32, height: 32, border: "2px solid rgba(192,87,70,0.3)", borderTop: "2px solid #C05746", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 11, color: "rgba(245,242,237,0.4)", letterSpacing: "0.12em" }}>VERIFYING...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}