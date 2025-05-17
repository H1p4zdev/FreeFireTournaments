import { BellIcon } from "lucide-react";
import { Button } from "./button";
import { useTheme } from "./theme-provider";
import { UserWithWallet } from "@shared/schema";

interface HeaderProps {
  title: string;
  user: UserWithWallet | null;
}

export function Header({ title, user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="lg:hidden bg-muted py-4 px-5 border-b border-border sticky top-0 z-30">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="font-rajdhani font-bold text-xl text-primary">FF<span className="text-foreground">Hub</span></span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary pulse-dot"></span>
          </Button>
          {user && (
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function DesktopHeader({ title, user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="hidden lg:flex justify-between items-center mb-8">
      <h1 className="font-poppins font-bold text-2xl">{title}</h1>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary pulse-dot"></span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg"
        >
          <span className="text-sm text-muted-foreground">{theme === "dark" ? "Dark" : "Light"}</span>
        </Button>
      </div>
    </div>
  );
}
