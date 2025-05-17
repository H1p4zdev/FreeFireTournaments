import { DesktopHeader } from "@/components/ui/header";
import { TournamentList } from "@/components/tournaments/tournament-list";
import { UserWithWallet } from "@shared/schema";

interface TournamentsProps {
  user: UserWithWallet | null;
}

export default function Tournaments({ user }: TournamentsProps) {
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <DesktopHeader title="Tournaments" user={user} />
      
      {/* Tournament List */}
      <TournamentList />
    </div>
  );
}
