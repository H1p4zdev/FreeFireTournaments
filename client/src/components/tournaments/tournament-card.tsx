import { Link } from "wouter";
import { Tournament } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TournamentCardProps {
  tournament: Tournament;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  
  const handleJoinTournament = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsJoining(true);
    try {
      await apiRequest('POST', `/api/tournaments/${tournament.id}/join`);
      toast({
        title: "Success!",
        description: `You've successfully joined ${tournament.title}`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallet'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    } catch (error: any) {
      toast({
        title: "Failed to join tournament",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  // Format date
  const tournamentDate = new Date(tournament.startTime);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(tournamentDate);
  
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(tournamentDate);
  
  // Determine time label
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  
  let timeLabel = formattedDate;
  if (tournamentDate.toDateString() === now.toDateString()) {
    timeLabel = "Today";
  } else if (tournamentDate.toDateString() === tomorrow.toDateString()) {
    timeLabel = "Tomorrow";
  } else if (tournamentDate.getDay() === 0 || tournamentDate.getDay() === 6) {
    timeLabel = "Weekend";
  }
  
  return (
    <Link href={`/tournaments/${tournament.id}`}>
      <Card className="tournament-card overflow-hidden shadow-md transition cursor-pointer h-full">
        <div className="h-40 relative">
          <img 
            src={tournament.mode === 'duo' 
              ? "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80"
              : tournament.mode === 'solo'
                ? "https://pixabay.com/get/g51ef7f85f8d1c6013b2c2e8da0f7a29b5e2622d4a70ea2950a3a4c95bc3083e3d719424069ef371f261fb844e7e7ea0abf3ed4fae0f132b95234c4360d3891cd_1280.jpg"
                : "https://images.unsplash.com/photo-1560253023-3ec5d502959f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300&q=80"
            } 
            alt={tournament.title} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          <div className="absolute top-3 left-3">
            <div className={`
              text-white text-xs font-bold uppercase tracking-wider py-1 px-2 rounded
              ${tournament.mode === 'squad' ? 'bg-primary' : 
                tournament.mode === 'duo' ? 'bg-secondary' :
                'bg-destructive'}
            `}>
              {tournament.mode}
            </div>
          </div>
        </div>
        
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-poppins font-semibold">{tournament.title}</h3>
            <span className="text-xs bg-background rounded px-2 py-1">{timeLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {formattedDate} • {formattedTime}
          </p>
          
          <div className="flex justify-between items-center mt-3">
            <div>
              <p className="text-xs text-muted-foreground">Entry Fee</p>
              <p className="font-rajdhani font-bold">৳ {Number(tournament.entryFee)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prize</p>
              <p className="font-rajdhani font-bold">৳ {Number(tournament.prizePool)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Slots</p>
              <p className={`font-rajdhani font-bold ${
                tournament.filledSlots >= tournament.maxSlots ? 'text-destructive' :
                tournament.filledSlots / tournament.maxSlots > 0.7 ? 'text-success' : ''
              }`}>
                {tournament.filledSlots}/{tournament.maxSlots}
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full mt-4"
            onClick={handleJoinTournament}
            disabled={isJoining || tournament.filledSlots >= tournament.maxSlots}
          >
            {isJoining ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-background border-t-primary rounded-full"></div>
                Joining...
              </>
            ) : tournament.filledSlots >= tournament.maxSlots ? (
              'Tournament Full'
            ) : (
              <>Join Now</>
            )}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
