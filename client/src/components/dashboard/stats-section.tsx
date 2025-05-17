import { Trophy, CreditCard, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading?: boolean;
}

function StatsCard({ title, value, icon, loading = false }: StatsCardProps) {
  if (loading) {
    return (
      <div className="bg-muted rounded-xl p-5 shadow-md animate-pulse">
        <div className="h-16"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-muted rounded-xl p-5 shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted-foreground text-sm">{title}</p>
          <p className="font-rajdhani font-bold text-2xl mt-1">{value}</p>
        </div>
        <div className="bg-accent p-2 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsSection() {
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });
  
  // Calculate stats from transactions
  const tournamentsPlayed = transactions?.filter(t => t.type === 'tournament_entry').length || 0;
  
  // Calculate winnings (tournament_win transactions sum)
  const winnings = transactions
    ?.filter(t => t.type === 'tournament_win' && t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  
  // Calculate win rate (wins / tournaments played)
  const wins = transactions?.filter(t => t.type === 'tournament_win').length || 0;
  const winRate = tournamentsPlayed > 0 ? ((wins / tournamentsPlayed) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatsCard
        title="Tournaments Played"
        value={tournamentsPlayed}
        icon={<Trophy className="h-5 w-5 text-primary" />}
        loading={isTransactionsLoading}
      />
      <StatsCard
        title="Winnings"
        value={`৳ ${winnings.toLocaleString()}`}
        icon={<CreditCard className="h-5 w-5 text-success" />}
        loading={isTransactionsLoading}
      />
      <StatsCard
        title="Win Rate"
        value={`${winRate}%`}
        icon={<BarChart2 className="h-5 w-5 text-warning" />}
        loading={isTransactionsLoading}
      />
    </div>
  );
}
