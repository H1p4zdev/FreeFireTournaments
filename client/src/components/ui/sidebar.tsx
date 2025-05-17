import { Link, useLocation } from "wouter";
import { 
  Home, Trophy, Wallet, BarChart3, User, LogOut, ShieldCheck
} from "lucide-react";
import { Button } from "./button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserWithWallet } from "@shared/schema";

interface SidebarProps {
  user: UserWithWallet | null;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  
  let navItems: NavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Dashboard",
      href: "/"
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Tournaments",
      href: "/tournaments"
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      label: "Wallet",
      href: "/wallet"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "History",
      href: "/history"
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Profile",
      href: "/profile"
    }
  ];
  
  // Add Admin link if user is an admin
  if (user?.isAdmin) {
    navItems.push({
      icon: <ShieldCheck className="h-5 w-5" />,
      label: "Admin",
      href: "/admin"
    });
  }
  
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      queryClient.clear();
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-muted border-r border-border h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <span className="font-rajdhani font-bold text-2xl text-primary">Free Fire<span className="text-foreground">Hub</span></span>
      </div>
      
      <nav className="flex-1 py-6 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium ${
                    location === item.href 
                      ? 'bg-accent text-primary' 
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground transition'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-border">
        {user && (
          <div className="flex items-center space-x-3 p-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">
                {user.playerID ? `Player ID: ${user.playerID}` : 'No Player ID set'}
              </p>
            </div>
          </div>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full mt-2 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </div>
    </aside>
  );
}
