// client/src/pages/Login.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { workspaces } from "@shared/schema";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);

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

      const token = data.session.access_token;
      localStorage.setItem("sb_token", token);

      const res = await fetch("/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Backend request failed");
      const user = await res.json();
      setUserInfo(user);

      if (user && user.id) navigate("/dashboard");
      else setErrorMsg("Backend could not identify user");
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />
      <button onClick={handleLogin} disabled={loading} style={{ width: "100%" }}>
        {loading ? "Logging in..." : "Login"}
      </button>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      {userInfo && <pre>{JSON.stringify(userInfo, null, 2)}</pre>}
    </div>
  );
}