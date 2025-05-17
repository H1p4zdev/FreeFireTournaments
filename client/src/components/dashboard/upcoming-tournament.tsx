import { Link } from "wouter";
import { Trophy, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Tournament } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function UpcomingTournament() {
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const { subscribe } = useWebSocket();
  
  const { data: tournament, isLoading, isError } = useQuery<Tournament>({
    queryKey: ['/api/tournaments/upcoming'],
  });
  
  // Subscribe to tournament updates via WebSocket
  useState(() => {
    if (tournament?.id) {
      subscribe(tournament.id);
    }
    
    return () => {
      if (tournament?.id) {
        // Would unsubscribe here if needed
      }
    };
  });
  
  const handleJoinTournament = async () => {
    if (!tournament) return;
    
    setIsJoining(true);
    try {
      await apiRequest('POST', `/api/tournaments/${tournament.id}/join`);
      toast({
        title: "Success!",
        description: `You've successfully joined ${tournament.title}`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments/upcoming'] });
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
  
  if (isLoading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded mb-4"></div>
        <div className="bg-muted rounded-xl overflow-hidden shadow-lg relative">
          <div className="h-48 bg-accent"></div>
          <div className="p-5">
            <div className="h-24"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError || !tournament) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-poppins font-semibold text-lg">Upcoming Tournament</h2>
          <Link href="/tournaments" className="text-sm text-muted-foreground hover:text-primary">
            View All
          </Link>
        </div>
        
        <div className="bg-muted rounded-xl p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-poppins font-semibold text-xl">No Upcoming Tournaments</h3>
          <p className="text-muted-foreground mt-2">Check back later for new tournaments or browse all available ones.</p>
          <Button className="mt-4" asChild>
            <Link href="/tournaments">Browse Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Format date and time
  const tournamentDate = new Date(tournament.startTime);
  const formattedDate = formatDate(tournamentDate);
  const formattedTime = formatTime(tournamentDate);
  
  // Calculate slots percentage
  const slotsPercentage = (tournament.filledSlots / tournament.maxSlots) * 100;
  
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-poppins font-semibold text-lg">Upcoming Tournament</h2>
        <Link href="/tournaments" className="text-sm text-muted-foreground hover:text-primary">
          View All
        </Link>
      </div>
      
      <div className="bg-muted rounded-xl overflow-hidden shadow-lg relative">
        <div className="h-48 w-full relative">
          <img 
            src="https://pixabay.com/get/g4feaca5312c8089efccb7bac4402e686bcabe628180c3bb3c90661da4aba2d5c2d272bbe2fd5a034291e87c8711b7184bf0dc9e7574c1c4ed3ef303c3e7cfdf1_1280.jpg" 
            alt={tournament.title} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-5">
            <div className={`
              text-white text-xs font-bold uppercase tracking-wider py-1 px-2 rounded inline-block mb-2
              ${tournament.mode === 'squad' ? 'bg-primary' : 
                tournament.mode === 'duo' ? 'bg-secondary' :
                'bg-destructive'}
            `}>
              {tournament.mode}
            </div>
            <h3 className="font-poppins font-bold text-xl text-white">{tournament.title}</h3>
            <p className="text-gray-200 text-sm">{formattedDate} • {formattedTime}</p>
          </div>
        </div>
        
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="bg-accent rounded-lg p-3">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Prize Pool</p>
                <p className="font-rajdhani font-bold text-xl">৳ {Number(tournament.prizePool).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-accent rounded-lg p-3">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Entry Fee</p>
                <p className="font-rajdhani font-bold text-xl">৳ {Number(tournament.entryFee).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-background rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground text-sm">Slots Filled</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-full bg-border rounded-full h-2 max-w-xs">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${slotsPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {tournament.filledSlots}/{tournament.maxSlots}
                  </span>
                </div>
              </div>
              
              {slotsPercentage > 70 && (
                <div className="flex items-center space-x-1 text-success">
                  <span className="h-2 w-2 rounded-full bg-success pulse-dot"></span>
                  <span className="text-xs font-medium">Filling Fast</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            className="w-full"
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
              <>Join Tournament</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
