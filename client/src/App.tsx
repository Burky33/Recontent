import Landing from "./pages/Landing";
import AuthCallback from "./pages/AuthCallback";

import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";

import NotFound from "./pages/not-found";
import Dashboard from "./pages/Dashboard";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/signup";

import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1A1A1B" }}>
        <Loader2 className="w-8 h-8 animate-spin" color="#C05746" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/workspaces/:id" component={() => <ProtectedRoute component={WorkspaceDetail} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;