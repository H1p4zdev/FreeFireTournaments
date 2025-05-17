import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Tournaments from "@/pages/tournaments";
import TournamentDetails from "@/pages/tournament-details";
import Wallet from "@/pages/wallet";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import AppLayout from "@/components/layouts/app-layout";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useEffect, useState } from "react";
import { apiRequest } from "./lib/queryClient";
import { UserWithWallet } from "@shared/schema";
import { WebSocketProvider } from "./lib/websocket";

function AuthenticatedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, [x: string]: any }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<UserWithWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiRequest('GET', '/api/user');
        const userData = await res.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }

  return <Component user={user} {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <AuthenticatedRoute component={Dashboard} />
      </Route>
      <Route path="/tournaments">
        <AuthenticatedRoute component={Tournaments} />
      </Route>
      <Route path="/tournaments/:id">
        {params => <AuthenticatedRoute component={TournamentDetails} id={params.id} />}
      </Route>
      <Route path="/wallet">
        <AuthenticatedRoute component={Wallet} />
      </Route>
      <Route path="/profile">
        <AuthenticatedRoute component={Profile} />
      </Route>
      <Route path="/admin">
        <AuthenticatedRoute component={Admin} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="free-fire-hub-theme">
      <QueryClientProvider client={queryClient}>
        <WebSocketProvider>
          <TooltipProvider>
            <AppLayout>
              <Toaster />
              <Router />
            </AppLayout>
          </TooltipProvider>
        </WebSocketProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
