import Layout from "@/components/Layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Rocket, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const { toast } = useToast();

  const handleAction = () => {
    toast({
      title: "Payments coming next",
      description: "We're currently finalizing our payment integration. Stay tuned!",
    });
  };

  const plans = [
    {
      name: "Starter",
      price: "$29",
      description: "Perfect for solo creators and small brands.",
      features: [
        "Up to 5 workspaces",
        "10 generations per month",
        "LinkedIn & X formats",
        "Standard support"
      ],
      buttonText: "Get Started",
      icon: <Rocket className="w-6 h-6 text-indigo-500" />
    },
    {
      name: "Pro",
      price: "$79",
      description: "For agencies and high-volume content creators.",
      features: [
        "Unlimited workspaces",
        "Unlimited generations",
        "All content formats",
        "Priority support",
        "Custom brand voices"
      ],
      buttonText: "Upgrade to Pro",
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      popular: true
    }
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-5 text-xl text-slate-500 max-w-2xl mx-auto">
            Transform your webinars into a month's worth of content in minutes. 
            Choose the plan that fits your growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                plan.popular ? 'border-indigo-600 shadow-lg' : 'border-slate-200'
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
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <CardDescription className="mt-4 text-base">{plan.description}</CardDescription>
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
              </CardContent>
              <CardFooter className="pt-8">
                <Button 
                  onClick={handleAction}
                  className={`w-full h-12 text-lg font-semibold ${
                    plan.popular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="prose prose-slate max-w-none bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-1000">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-8">Why Repurpose.ai?</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Strategy
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Our proprietary AI engine doesn't just summarize; it identifies high-impact hooks and strategic narratives within your long-form video.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-indigo-500" />
                Scale Fast
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Marketing agencies can manage dozens of clients from a single dashboard, maintaining unique brand voices for every single one.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-500" />
                Seamless Workflow
              </h3>
              <p className="text-slate-600 leading-relaxed">
                From YouTube URL to a week of scheduled-ready posts in under 60 seconds. No more manual transcription or tedious editing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
