import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Check, Gauge, ShieldCheck, RefreshCw, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { trackUpgrade } from "@/lib/analytics";

const mono = "'IBM Plex Mono', monospace";
const serif = "'Georgia', 'Times New Roman', serif";

const LinkedInIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#0A66C2" style={{ flexShrink: 0 }}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const XIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="rgba(245,242,237,0.8)" style={{ flexShrink: 0 }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

function FeatureItem({ text }: { text: string }) {
  const hasLinkedIn = text.toLowerCase().includes("linkedin");
  const hasX = /^\d+ x /i.test(text);

  return (
    <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(245,242,237,0.6)", marginBottom: 12, letterSpacing: "0.02em" }}>
      <span style={{ color: "#C05746", flexShrink: 0 }}>—</span>
      {hasLinkedIn && <LinkedInIcon />}
      {hasX && <XIcon />}
      {text}
    </li>
  );
}

export default function Pricing() {
  const { toast } = useToast();
  const [isProModalOpen, setIsProModalOpen] = useState(false);

  const handleAction = async (planKey: string) => {
    try {
      await apiRequest("POST", "/api/plan-intent", { plan: planKey });
    } catch (err) {
      console.error("Failed to log plan intent", err);
    }
  
    if (planKey === "pro" || planKey === "starter") {
      trackUpgrade(planKey);
      setIsProModalOpen(true);
      return;
    }

    if (planKey === "trial") {
      toast({
        title: "Start your free trial",
        description: "Your free trial unlocks after account creation and email verification.",
      });
    }
  };

  const plans = [
    {
      id: "trial",
      name: "Trial",
      price: "$0",
      suffix: "",
      label: "ONE-TIME · NO CARD",
      description: "Try the engine once and see the full output quality before upgrading.",
      features: [
        "1 generation total",
        "1 workspace",
        "10 LinkedIn posts",
        "10 X posts",
        "3 blog outlines",
        "Unlocked after email verification",
      ],
      buttonText: "Start Free Trial",
      popular: false,
      footnote: "No card required to start.",
    },
    {
      id: "starter",
      name: "Starter",
      price: "$39",
      suffix: "/mo",
      label: "SOLO OPERATORS",
      description: "For solo founders and light weekly content creation.",
      features: [
        "3 generations per month",
        "1 workspace",
        "30 LinkedIn posts / mo",
        "30 X posts / mo",
        "9 blog outlines / mo",
        "Standard processing priority",
      ],
      buttonText: "Choose Starter",
      popular: false,
      footnote: "Best for occasional use.",
    },
    {
      id: "pro",
      name: "Pro",
      price: "$129",
      suffix: "/mo",
      label: "SERIOUS OPERATORS",
      description: "For serious weekly operators who want a reliable B2B content engine.",
      features: [
        "15 generations per month",       // FIX: was 12
        "5 workspaces",                    // FIX: was "Multiple workspaces"
        "150 LinkedIn posts / mo",         // FIX: was 120
        "150 X posts / mo",                // FIX: was 120
        "45 blog outlines / mo",           // FIX: was 36
        "Priority processing",
      ],
      buttonText: "Upgrade to Pro",
      popular: true,
      footnote: "Best value for consistent weekly publishing.",
    },
  ];

  const faqs = [
    {
      question: "What counts as a generation?",
      answer: "One generation is one transcript processed into a complete content pack: 10 LinkedIn posts, 10 X posts, and 3 blog outlines.",
    },
    {
      question: "Can I upload webinars and podcasts?",
      answer: "Yes. You can paste a transcript, paste a YouTube URL, or upload video/audio for transcription.",
    },
    {
      question: "What if my webinar is very long?",
      answer: "Long webinars are best split into smaller sections. This usually improves output quality and keeps usage predictable.",
    },
    {
      question: "Do retries count as generations?",
      answer: "Yes. Every generation request counts toward your plan usage, including retries.",
    },
    {
      question: "When does the free trial unlock?",
      answer: "The free trial unlocks after account creation and email verification.",
    },
    {
      question: "Can I upgrade later?",
      answer: "Yes. Paid upgrades will be available as billing is rolled out. The pricing structure is already defined.",
    },
  ];

  return (
    <Layout>
      <div style={{ maxWidth: 960, margin: "0 auto", fontFamily: mono }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 64 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "#C05746", marginBottom: 16 }}>PRICING / PLANS</p>
          <h1 style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, letterSpacing: "-2px", lineHeight: 1.05, color: "#F5F2ED", marginBottom: 16 }}>
            Turn One Webinar Into<br />Weeks of Content
          </h1>
          <p style={{ fontSize: 14, color: "rgba(245,242,237,0.45)", lineHeight: 1.9, maxWidth: 560 }}>
            ReContent turns long-form content into a complete content pack:{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><LinkedInIcon size={12} /><span style={{ color: "#F5F2ED" }}>10 LinkedIn posts</span></span>,{" "}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><XIcon size={12} /><span style={{ color: "#F5F2ED" }}>10 X posts</span></span>, and{" "}
            <span style={{ color: "#F5F2ED" }}>3 blog outlines</span> in one generation.
          </p>
        </div>

        {/* ── OUTPUT BREAKDOWN ── */}
        <div style={{ border: "1px solid rgba(245,242,237,0.08)", marginBottom: 64 }}>
          <div style={{ padding: "28px 32px", borderBottom: "1px solid rgba(245,242,237,0.08)" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.3)" }}>ONE PIECE OF CONTENT → 23 ASSETS</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div style={{ padding: "32px", borderRight: "1px solid rgba(245,242,237,0.08)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <LinkedInIcon size={18} />
                <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(245,242,237,0.4)" }}>LINKEDIN</span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, color: "#F5F2ED" }}>10</div>
              <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", lineHeight: 1.7 }}>Posts per generation</p>
            </div>
            <div style={{ padding: "32px", borderRight: "1px solid rgba(245,242,237,0.08)", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <XIcon size={16} />
                <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(245,242,237,0.4)" }}>X / TWITTER</span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, color: "#F5F2ED" }}>10</div>
              <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", lineHeight: 1.7 }}>Posts per generation</p>
            </div>
            <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C05746" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "rgba(245,242,237,0.4)" }}>BLOG</span>
              </div>
              <div style={{ fontFamily: serif, fontSize: 44, fontWeight: 700, color: "#F5F2ED" }}>3</div>
              <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", lineHeight: 1.7 }}>Outlines per generation</p>
            </div>
          </div>
        </div>

        {/* ── PLANS ── */}
        <div style={{ marginBottom: 64 }}>
          <p style={{ fontSize: 10, letterSpacing: "0.18em", color: "rgba(245,242,237,0.3)", marginBottom: 32 }}>PLANS</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid rgba(245,242,237,0.08)" }}>
            {plans.map((plan, i) => (
              <div key={plan.id} style={{
                padding: "40px 32px",
                borderRight: i < 2 ? "1px solid rgba(245,242,237,0.08)" : "none",
                background: plan.popular ? "rgba(192,87,70,0.05)" : "transparent",
                position: "relative",
                display: "flex", flexDirection: "column",
              }}>
                {plan.popular && (
                  <div style={{ position: "absolute", top: 20, right: 20, fontSize: 9, letterSpacing: "0.14em", color: "#C05746", border: "1px solid rgba(192,87,70,0.3)", padding: "3px 8px" }}>
                    MOST POPULAR
                  </div>
                )}

                <div style={{ fontSize: 11, letterSpacing: "0.18em", color: plan.popular ? "#C05746" : "rgba(245,242,237,0.3)", marginBottom: 20 }}>
                  {plan.name.toUpperCase()}
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, letterSpacing: "-2px", color: "#F5F2ED" }}>{plan.price}</span>
                  <span style={{ fontSize: 12, color: "rgba(245,242,237,0.3)" }}>{plan.suffix}</span>
                </div>

                <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(245,242,237,0.25)", marginBottom: 16 }}>{plan.label}</div>

                <p style={{ fontSize: 12, color: "rgba(245,242,237,0.4)", lineHeight: 1.7, marginBottom: 28 }}>{plan.description}</p>

                <div style={{ width: "100%", height: 1, background: plan.popular ? "rgba(192,87,70,0.15)" : "rgba(245,242,237,0.06)", marginBottom: 24 }} />

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0", flex: 1 }}>
                  {plan.features.map(f => <FeatureItem key={f} text={f} />)}
                </ul>

                <p style={{ fontSize: 11, color: "rgba(245,242,237,0.25)", marginBottom: 24, letterSpacing: "0.02em" }}>{plan.footnote}</p>

                <button
                  onClick={() => handleAction(plan.id)}
                  style={{
                    width: "100%",
                    background: plan.popular ? "#C05746" : "none",
                    border: plan.popular ? "none" : "1px solid rgba(245,242,237,0.15)",
                    color: "#F5F2ED",
                    padding: "13px",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    fontWeight: plan.popular ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: mono,
                  }}
                >
                  {plan.buttonText}{plan.popular ? " →" : ""}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── WHY GENERATIONS ── */}
        <div style={{ border: "1px solid rgba(245,242,237,0.08)", marginBottom: 64 }}>
          <div style={{ padding: "28px 32px", borderBottom: "1px solid rgba(245,242,237,0.08)" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.3)" }}>WHY PRICING IS BASED ON GENERATIONS</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { icon: <Gauge size={16} color="#C05746" />, title: "Predictable usage", body: "One generation always means one complete content pack. You know exactly what you are buying." },
              { icon: <ShieldCheck size={16} color="#C05746" />, title: "Business-grade limits", body: "Plans are structured to match real operational use, with clear limits and clean upgrade paths." },
              { icon: <RefreshCw size={16} color="#C05746" />, title: "Retries count too", body: "Every generation request, including retries, counts toward usage. This keeps the system clear and fair." },
            ].map((item, i) => (
              <div key={item.title} style={{ padding: "32px", borderRight: i < 2 ? "1px solid rgba(245,242,237,0.08)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  {item.icon}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#F5F2ED", letterSpacing: "0.02em" }}>{item.title}</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(245,242,237,0.45)", lineHeight: 1.8 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div style={{ border: "1px solid rgba(245,242,237,0.08)", marginBottom: 64 }}>
          <div style={{ padding: "28px 32px", borderBottom: "1px solid rgba(245,242,237,0.08)" }}>
            <p style={{ fontSize: 10, letterSpacing: "0.14em", color: "rgba(245,242,237,0.3)" }}>FREQUENTLY ASKED QUESTIONS</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            {faqs.map((faq, i) => (
              <div key={faq.question} style={{
                padding: "28px 32px",
                borderRight: i % 2 === 0 ? "1px solid rgba(245,242,237,0.08)" : "none",
                borderBottom: i < faqs.length - 2 ? "1px solid rgba(245,242,237,0.08)" : "none",
              }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#F5F2ED", marginBottom: 10, letterSpacing: "0.02em" }}>{faq.question}</p>
                <p style={{ fontSize: 12, color: "rgba(245,242,237,0.45)", lineHeight: 1.8 }}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ border: "1px solid rgba(192,87,70,0.2)", background: "rgba(192,87,70,0.04)", padding: "56px 48px", textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 24 }}>
            <Mail size={20} color="#C05746" />
          </div>
          <h2 style={{ fontFamily: serif, fontSize: 36, fontWeight: 700, letterSpacing: "-1px", color: "#F5F2ED", marginBottom: 12 }}>
            Start turning webinars into content
          </h2>
          <p style={{ fontSize: 13, color: "rgba(245,242,237,0.45)", marginBottom: 32, lineHeight: 1.8 }}>
            Create your account, verify your email, and unlock your free trial generation.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            <button
              onClick={() => handleAction("trial")}
              style={{ background: "#C05746", border: "none", color: "#F5F2ED", padding: "14px 36px", fontSize: 11, letterSpacing: "0.12em", fontWeight: 600, cursor: "pointer", fontFamily: mono }}
            >
              CREATE FREE ACCOUNT →
            </button>
            <button
              onClick={() => document.getElementById("pricing-plans")?.scrollIntoView({ behavior: "smooth" })}
              style={{ background: "none", border: "1px solid rgba(245,242,237,0.15)", color: "rgba(245,242,237,0.6)", padding: "14px 36px", fontSize: 11, letterSpacing: "0.12em", cursor: "pointer", fontFamily: mono }}
            >
              COMPARE PLANS
            </button>
          </div>
          <p style={{ fontSize: 11, color: "rgba(245,242,237,0.2)", marginTop: 20, letterSpacing: "0.06em" }}>
            YOUR FIRST GENERATION IS FREE AFTER EMAIL VERIFICATION
          </p>
        </div>

      </div>

      <Dialog open={isProModalOpen} onOpenChange={setIsProModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              Early access pricing is set 👋
            </DialogTitle>
            <DialogDescription className="text-base pt-4 space-y-4">
              <p className="text-slate-900 font-medium">Billing is being rolled out soon.</p>
              <p className="text-slate-600">The pricing model is now locked:</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                <div className="space-y-2 text-sm text-slate-700">
                  <p><span className="font-semibold">Trial:</span> 1 generation total</p>
                  <p><span className="font-semibold">Starter:</span> $39/month · 1 workspace · 3 generations</p>
                  <p><span className="font-semibold">Pro:</span> $129/month · 5 workspaces · 15 generations</p>{/* FIX: was 12 */}
                </div>
              </div>
              <p className="text-slate-600">You'll be notified as soon as paid upgrades are enabled.</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setIsProModalOpen(false)} style={{ background: '#C05746', border: 'none', color: '#F5F2ED' }}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}