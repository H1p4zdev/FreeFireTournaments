import { Link, useLocation } from "wouter";
import { 
  Home, Trophy, Wallet, User
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

export function MobileBottomNav() {
  const [location] = useLocation();
  
  const navItems: NavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Home",
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
      icon: <User className="h-5 w-5" />,
      label: "Profile",
      href: "/profile"
    }
  ];
  
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-muted border-t border-border z-30">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <Link 
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center py-3 px-5 ${location === item.href ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
