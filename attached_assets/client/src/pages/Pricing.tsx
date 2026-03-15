import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  Rocket,
  Zap,
  ArrowRight,
  FileText,
  Gauge,
  ShieldCheck,
  Mail,
  RefreshCw,
} from "lucide-react";
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
      description: "Try the engine once and see the full output quality before upgrading.",
      features: [
        "1 generation total",
        "1 workspace",
        "10 LinkedIn posts",
        "10 X posts",
        "3 blog outlines",
        "Unlocked after account creation + email verification",
      ],
      buttonText: "Start Free Trial",
      icon: <Rocket className="w-6 h-6 text-indigo-500" />,
      footnote: "No card required to start.",
    },
    {
      id: "starter",
      name: "Starter",
      price: "$39",
      suffix: "/mo",
      description: "For solo founders and light weekly content creation.",
      features: [
        "3 generations per month",
        "1 workspace",
        "Full content pack on every generation",
        "Standard processing priority",
        "Clear monthly usage limits",
      ],
      buttonText: "Choose Starter",
      icon: <Sparkles className="w-6 h-6 text-emerald-500" />,
      footnote: "Best for occasional use.",
    },
    {
      id: "pro",
      name: "Pro",
      price: "$129",
      suffix: "/mo",
      description: "For serious weekly operators who want a reliable B2B content engine.",
      features: [
        "12 generations per month",
        "Multiple workspaces",
        "Priority processing",
        "Full content pack on every generation",
        "Built for weekly content operations",
      ],
      buttonText: "Upgrade to Pro",
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      popular: true,
      footnote: "Best value for consistent weekly publishing.",
    },
  ];

  const faqs = [
    {
      question: "What counts as a generation?",
      answer:
        "One generation is one transcript processed into a complete content pack: 10 LinkedIn posts, 10 X posts, and 3 blog outlines.",
    },
    {
      question: "Can I upload webinars and podcasts?",
      answer:
        "Yes. You can paste a transcript, paste a YouTube URL, or upload video/audio for transcription.",
    },
    {
      question: "What if my webinar is very long?",
      answer:
        "Long webinars are best split into smaller sections. This usually improves output quality and keeps usage predictable.",
    },
    {
      question: "Do retries count as generations?",
      answer:
        "Yes. Every generation request counts toward your plan usage, including retries.",
    },
    {
      question: "When does the free trial unlock?",
      answer:
        "The free trial unlocks after account creation and email verification.",
    },
    {
      question: "Can I upgrade later?",
      answer:
        "Yes. Paid upgrades will be available as billing is rolled out. The pricing structure is already defined.",
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-20">
        <section className="text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
            <Sparkles className="h-4 w-4" />
            B2B content infrastructure
          </div>

          <h1 className="mt-6 text-4xl font-extrabold text-slate-900 sm:text-5xl lg:text-6xl tracking-tight">
            Turn One Webinar Into Weeks of Content
          </h1>

          <p className="mt-5 text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed">
            ReContent turns long-form content into a complete content pack:
            <span className="font-semibold text-slate-700"> 10 LinkedIn posts</span>,
            <span className="font-semibold text-slate-700"> 10 X posts</span>, and
            <span className="font-semibold text-slate-700"> 3 blog outlines</span> in one generation.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => handleAction("trial")}
              className="h-12 px-7 text-base font-semibold bg-indigo-600 hover:bg-indigo-700"
            >
              Start Free Trial
            </Button>
            <a href="#pricing-plans">
              <Button variant="outline" className="h-12 px-7 text-base font-semibold">
                See Pricing
              </Button>
            </a>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            No card required. Free trial unlocks after signup and email verification.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">One Piece of Content → 23 Assets</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              ReContent is priced around real marketing output, not vague credits or token math.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Input</h3>
              <p className="mt-2 text-sm text-slate-500">
                Webinar, podcast, interview, transcript, or YouTube video
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                <Sparkles className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">ReContent Engine</h3>
              <p className="mt-2 text-sm text-slate-500">
                One generation transforms the source into a complete multi-format content pack
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
                <ArrowRight className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Output</h3>
              <p className="mt-2 text-sm text-slate-500">
                10 LinkedIn posts, 10 X posts, and 3 blog outlines
              </p>
            </div>
          </div>
        </section>

        <section id="pricing-plans" className="animate-in fade-in duration-700">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Simple pricing built around generations</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              Clear usage, clean upgrade paths, and plans designed for real content operations.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                  plan.popular ? "border-indigo-600 shadow-lg shadow-indigo-100" : "border-slate-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full mr-6">
                    MOST POPULAR
                  </div>
                )}

                <CardHeader className="pb-8">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    {plan.icon}
                  </div>

                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 mb-1">{plan.suffix}</span>
                  </div>

                  <CardDescription className="mt-4 text-base leading-relaxed">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="mt-1 bg-indigo-50 rounded-full p-0.5">
                          <Check className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 text-sm text-slate-500">{plan.footnote}</p>
                </CardContent>

                <CardFooter className="pt-8">
                  <Button
                    onClick={() => handleAction(plan.id)}
                    className={`w-full h-12 text-lg font-semibold ${
                      plan.popular ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-900 hover:bg-slate-800"
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Why pricing is based on generations</h2>
            <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
              ReContent is designed around real output volume, not confusing credit systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Gauge className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-900">Predictable usage</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                One generation always means one complete content pack. You know exactly what you are buying.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-900">Business-grade limits</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Plans are structured to match real operational use, with clear limits and clean upgrade paths.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-900">Retries count too</h3>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Every generation request, including retries, counts toward usage. This keeps the system clear and fair.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Frequently asked questions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h3 className="text-lg font-semibold text-slate-900">{faq.question}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="text-center rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-10 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
            <Mail className="h-7 w-7 text-indigo-600" />
          </div>

          <h2 className="mt-6 text-3xl font-bold text-slate-900">Start turning webinars into content</h2>
          <p className="mt-3 text-slate-500 max-w-2xl mx-auto">
            Create your account, verify your email, and unlock your free trial generation.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => handleAction("trial")}
              className="h-12 px-7 text-base font-semibold bg-indigo-600 hover:bg-indigo-700"
            >
              Create Free Account
            </Button>
            <a href="#pricing-plans">
              <Button variant="outline" className="h-12 px-7 text-base font-semibold">
                Compare Plans
              </Button>
            </a>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Your first generation is free after email verification.
          </p>
        </section>
      </div>

      <Dialog open={isProModalOpen} onOpenChange={setIsProModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              Early access pricing is set 👋
            </DialogTitle>
            <DialogDescription className="text-base pt-4 space-y-4">
              <p className="text-slate-900 font-medium">
                Billing is being rolled out soon.
              </p>
              <p className="text-slate-600">
                The pricing model is now locked:
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
                <div className="space-y-2 text-sm text-slate-700">
                  <p><span className="font-semibold">Trial:</span> 1 generation total</p>
                  <p><span className="font-semibold">Starter:</span> $39/month for 3 generations</p>
                  <p><span className="font-semibold">Pro:</span> $129/month for 12 generations</p>
                </div>
              </div>
              <p className="text-slate-600">
                You’ll be notified as soon as paid upgrades are enabled.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end mt-6">
            <Button onClick={() => setIsProModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
