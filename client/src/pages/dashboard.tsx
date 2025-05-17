import { DesktopHeader } from "@/components/ui/header";
import { WalletWidget } from "@/components/dashboard/wallet-widget";
import { StatsSection } from "@/components/dashboard/stats-section";
import { UpcomingTournament } from "@/components/dashboard/upcoming-tournament";
import { TournamentList } from "@/components/tournaments/tournament-list";
import { UserWithWallet } from "@shared/schema";

interface DashboardProps {
  user: UserWithWallet | null;
}

export default function Dashboard({ user }: DashboardProps) {
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <DesktopHeader title="Dashboard" user={user} />
      
      {/* Wallet Widget */}
      <WalletWidget userId={user.id} />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* Upcoming Tournament */}
      <UpcomingTournament />
      
      {/* Tournament List */}
      <TournamentList />
    </div>
  );
}
