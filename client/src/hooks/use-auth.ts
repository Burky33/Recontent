import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export type AuthUser = {
  id: string;
  email?: string | null;
} | null;

export function useAuth() {
  const [user, setUser] = useState<AuthUser>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setIsLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setIsLoading(false);

      // Keep localStorage token in sync for backend API calls
      if (session?.access_token) {
        localStorage.setItem("sb_token", session.access_token);
      } else {
        localStorage.removeItem("sb_token");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("sb_token");
  };

  return {
    user,
    isLoading,
    logout,
  };
}

// Helper to get auth headers for backend API calls
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("sb_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}