import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutTemplate, LogOut, Menu, X, CreditCard } from "lucide-react";
import { useState } from "react";

const mono = "'IBM Plex Mono', monospace";
const serif = "'Georgia', 'Times New Roman', serif";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "WORKSPACES", icon: LayoutTemplate },
    { href: "/pricing", label: "PRICING", icon: CreditCard },
  ];

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "RC";

  return (
    <div style={{ minHeight: "100vh", background: "#1A1A1B", display: "flex", flexDirection: "row", fontFamily: mono }}>

      {/* ── MOBILE HEADER ── */}
      <div style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "#141415", borderBottom: "1px solid rgba(245,242,237,0.08)", position: "sticky", top: 0, zIndex: 50 }}
        className="mobile-header">
        <span style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: "#F5F2ED" }}>
          Re<span style={{ color: "#C05746" }}>Content</span>
        </span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ background: "none", border: "none", color: "#F5F2ED", cursor: "pointer" }}>
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: 220, flexShrink: 0, background: "#141415",
        borderRight: "1px solid rgba(245,242,237,0.06)",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
      }}>
        {/* Logo */}
        <div style={{ padding: "32px 28px 28px", borderBottom: "1px solid rgba(245,242,237,0.06)" }}>
          import { Logo } from "./Logo";

<Link href="/">
  <Logo />
</Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: "24px 16px", flex: 1 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.18em", color: "rgba(245,242,237,0.2)", padding: "0 12px", marginBottom: 12 }}>NAVIGATION</p>
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", marginBottom: 4,
                  background: isActive ? "rgba(192,87,70,0.1)" : "transparent",
                  borderLeft: isActive ? "2px solid #C05746" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                  <Icon size={14} color={isActive ? "#C05746" : "rgba(245,242,237,0.35)"} />
                  <span style={{ fontSize: 11, letterSpacing: "0.1em", color: isActive ? "#F5F2ED" : "rgba(245,242,237,0.35)", fontWeight: isActive ? 600 : 400 }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: "20px 16px", borderTop: "1px solid rgba(245,242,237,0.06)" }}>
          <div style={{ padding: "12px", background: "rgba(245,242,237,0.03)", border: "1px solid rgba(245,242,237,0.06)", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, background: "rgba(192,87,70,0.2)", border: "1px solid rgba(192,87,70,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#C05746", fontWeight: 600, flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 11, color: "#F5F2ED", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
                  {user?.email ?? "—"}
                </p>
                <p style={{ fontSize: 9, color: "rgba(245,242,237,0.25)", letterSpacing: "0.1em", marginTop: 2 }}>EARLY ACCESS</p>
              </div>
            </div>
          </div>

          <button onClick={() => logout()}
            style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "rgba(245,242,237,0.25)", cursor: "pointer", fontSize: 10, letterSpacing: "0.12em", padding: "4px 0", fontFamily: mono, width: "100%" }}>
            <LogOut size={12} />
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, overflowY: "auto", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 48px" }}>
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 30 }} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          aside { display: ${isMobileMenuOpen ? "flex" : "none"} !important; position: fixed !important; z-index: 40 !important; height: 100vh !important; }
        }
      `}</style>
    </div>
  );
}
