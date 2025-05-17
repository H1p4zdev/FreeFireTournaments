import { MobileBottomNav } from "@/components/ui/mobile-bottom-nav";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { UserWithWallet } from "@shared/schema";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const [title, setTitle] = useState("Dashboard");
  
  const { data: user } = useQuery<UserWithWallet>({
    queryKey: ['/api/user'],
    enabled: !location.startsWith('/login') && !location.startsWith('/register')
  });
  
  // Set page title based on location
  useEffect(() => {
    if (location === "/") {
      setTitle("Dashboard");
    } else if (location === "/tournaments") {
      setTitle("Tournaments");
    } else if (location === "/wallet") {
      setTitle("Wallet");
    } else if (location === "/profile") {
      setTitle("Profile");
    } else if (location.startsWith("/tournaments/")) {
      setTitle("Tournament Details");
    }
  }, [location]);
  
  // Don't show layout on login/register pages
  if (location.startsWith('/login') || location.startsWith('/register')) {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <Header title={title} user={user || null} />
      
      {/* Desktop Sidebar & Main Content */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <Sidebar user={user || null} />
        
        {/* Main Content */}
        <main className="flex-1 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
