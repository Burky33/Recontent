// client/src/pages/Login.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error("No session returned");
      localStorage.setItem("sb_token", data.session.access_token);
      navigate("/");
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Login</h2>
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
      <button onClick={handleLogin} disabled={loading} style={{ width: "100%" }}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      <p style={{ marginTop: 16, textAlign: "center" }}>
        Don't have an account? <a href="/signup" style={{ color: "#4f46e5" }}>Sign up</a>
      </p>
    </div>
  );
}