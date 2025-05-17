import { useQuery } from "@tanstack/react-query";
import { DesktopHeader } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, CreditCard, Users, Calendar, Clock, MapPin, AlertCircle } from "lucide-react";
import { Tournament, UserWithWallet } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWebSocket } from "@/lib/websocket";

interface TournamentDetailsProps {
  user: UserWithWallet | null;
  id: string;
}

export default function TournamentDetails({ user, id }: TournamentDetailsProps) {
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const tournamentId = parseInt(id);
  const { subscribe } = useWebSocket();
  
  const { data: tournament, isLoading, isError } = useQuery<Tournament>({
    queryKey: [`/api/tournaments/${tournamentId}`],
  });
  
  // Subscribe to tournament updates
  useState(() => {
    if (tournamentId) {
      subscribe(tournamentId);
    }
    
    return () => {
      // Would unsubscribe here if needed
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
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}`] });
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <DesktopHeader title="Tournament Details" user={user} />
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded-xl"></div>
          <div className="h-8 w-64 bg-muted rounded"></div>
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-3/4 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }
  
  if (isError || !tournament) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <DesktopHeader title="Tournament Details" user={user} />
        <Card className="p-8 text-center">
          <CardContent className="pt-6">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="font-poppins font-semibold text-xl">Tournament Not Found</h3>
            <p className="text-muted-foreground mt-2">The tournament you're looking for doesn't exist or has been removed.</p>
            <Button className="mt-4" asChild>
              <a href="/tournaments">Browse Tournaments</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Format date and time
  const tournamentDate = new Date(tournament.startTime);
  const formattedDate = tournamentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedTime = tournamentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Calculate slots percentage
  const slotsPercentage = (tournament.filledSlots / tournament.maxSlots) * 100;
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <DesktopHeader title="Tournament Details" user={user} />
      
      <div className="mb-8">
        <div className="rounded-xl overflow-hidden shadow-lg relative">
          <div className="h-48 md:h-64 w-full relative">
            <img 
              src={tournament.mode === 'duo' 
                ? "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80"
                : tournament.mode === 'solo'
                  ? "https://pixabay.com/get/g51ef7f85f8d1c6013b2c2e8da0f7a29b5e2622d4a70ea2950a3a4c95bc3083e3d719424069ef371f261fb844e7e7ea0abf3ed4fae0f132b95234c4360d3891cd_1280.jpg"
                  : "https://images.unsplash.com/photo-1560253023-3ec5d502959f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80"
              } 
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
              <h1 className="font-poppins font-bold text-2xl md:text-3xl text-white">{tournament.title}</h1>
              <p className="text-gray-200 text-sm md:text-base">{formattedDate} • {formattedTime}</p>
            </div>
          </div>
          
          <div className="p-5 md:p-8 bg-muted">
            {tournament.description && (
              <div className="mb-6">
                <h2 className="font-semibold text-lg mb-2">About This Tournament</h2>
                <p className="text-muted-foreground">{tournament.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-5 flex items-center space-x-4">
                  <div className="bg-accent p-3 rounded-lg">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Prize Pool</p>
                    <p className="font-rajdhani font-bold text-2xl">৳ {Number(tournament.prizePool).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-5 flex items-center space-x-4">
                  <div className="bg-accent p-3 rounded-lg">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Entry Fee</p>
                    <p className="font-rajdhani font-bold text-2xl">৳ {Number(tournament.entryFee).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-5 flex items-center space-x-4">
                  <div className="bg-accent p-3 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Max Players</p>
                    <p className="font-rajdhani font-bold text-2xl">{tournament.maxSlots}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h2 className="font-semibold text-lg mb-4">Tournament Details</h2>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-muted-foreground">{formattedDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-muted-foreground">{formattedTime}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Match Type</p>
                      <p className="text-muted-foreground capitalize">{tournament.mode}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="font-semibold text-lg mb-4">Registration</h2>
                <Card className="bg-background p-4 mb-4">
                  <div>
                    <p className="text-muted-foreground text-sm mb-1">Slots Filled</p>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-full bg-border rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${slotsPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">
                        {tournament.filledSlots}/{tournament.maxSlots} slots filled
                      </span>
                      {slotsPercentage > 70 && (
                        <div className="flex items-center space-x-1 text-success">
                          <span className="h-2 w-2 rounded-full bg-success pulse-dot"></span>
                          <span className="text-xs font-medium">Filling Fast</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
                
                {user && (
                  <div className="text-muted-foreground text-sm mb-4">
                    <p>
                      By joining this tournament, you agree to follow the rules and guidelines. 
                      Entry fee of <span className="font-bold text-foreground">৳ {Number(tournament.entryFee)}</span> will 
                      be deducted from your wallet.
                    </p>
                  </div>
                )}
                
                <Button 
                  className="w-full"
                  size="lg"
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
            
            <div className="border-t border-border pt-6">
              <h2 className="font-semibold text-lg mb-4">Rules & Regulations</h2>
              <div className="text-muted-foreground space-y-2">
                <p>1. All participants must be registered with their valid Free Fire IDs.</p>
                <p>2. Tournament will start exactly at the scheduled time. Please join 15 minutes before.</p>
                <p>3. Room ID and password will be shared 10 minutes before the match.</p>
                <p>4. Any form of teaming or cheating will result in immediate disqualification.</p>
                <p>5. Tournament results are final and cannot be contested.</p>
                <p>6. Prize money will be distributed within 24 hours after the tournament ends.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
