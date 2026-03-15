import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

export default function Signup() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignup = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { data, error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else if (data.session) {
      localStorage.setItem("sb_token", data.session.access_token);
      navigate("/");
    } else {
      setSuccessMsg("Check your email to confirm your account, then log in.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Sign Up</h2>
      <input type="email" placeholder="Email" value={email}
        onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
      <input type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", marginBottom: 10 }} />
      <button onClick={handleSignup} disabled={loading} style={{ width: "100%" }}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>
      {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}
      <p style={{ marginTop: 16, textAlign: "center" }}>
        Already have an account? <a href="/login" style={{ color: "#4f46e5" }}>Log in</a>
      </p>
    </div>
  );
}