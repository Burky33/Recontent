import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg("");

    // 1️⃣ Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    if (data.session) {
      const token = data.session.access_token;

      // 2️⃣ Store token in localStorage (optional)
      localStorage.setItem("sb_token", token);

      // 3️⃣ Call backend to get user info
      try {
        const res = await fetch("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = await res.json();
        setUserInfo(user);

        if (user && user.id) {
          // User is logged in
          router.push("/dashboard"); // redirect to your app dashboard
        } else {
          setErrorMsg("Backend could not identify user");
        }
      } catch (err: any) {
        setErrorMsg("Backend request failed: " + err.message);
      }
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