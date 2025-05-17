import { useState } from "react";
import { TournamentCard } from "./tournament-card";
import { Button } from "@/components/ui/button";
import { FilterIcon, SortAscIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Tournament } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface TournamentListProps {
  header?: boolean;
}

export function TournamentList({ header = true }: TournamentListProps) {
  const [mode, setMode] = useState<string | null>(null);
  const [limit, setLimit] = useState(6);
  
  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments', { mode, limit }],
  });
  
  const handleLoadMore = () => {
    setLimit(prev => prev + 6);
  };
  
  return (
    <div>
      {header && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-poppins font-semibold text-lg">All Tournaments</h2>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-sm bg-accent hover:bg-accent/90">
              <FilterIcon className="h-4 w-4 mr-1" /> Filter
            </Button>
            <Button variant="outline" size="sm" className="text-sm bg-accent hover:bg-accent/90">
              <SortAscIcon className="h-4 w-4 mr-1" /> Sort
            </Button>
          </div>
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-border mb-6 overflow-x-auto">
        <button 
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${!mode ? 'tab-active' : 'text-muted-foreground'}`}
          onClick={() => setMode(null)}
        >
          All
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'solo' ? 'tab-active' : 'text-muted-foreground'}`}
          onClick={() => setMode('solo')}
        >
          Solo
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'duo' ? 'tab-active' : 'text-muted-foreground'}`}
          onClick={() => setMode('duo')}
        >
          Duo
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap ${mode === 'squad' ? 'tab-active' : 'text-muted-foreground'}`}
          onClick={() => setMode('squad')}
        >
          Squad
        </button>
        <button 
          className="px-4 py-2 font-medium text-sm text-muted-foreground whitespace-nowrap"
        >
          Custom
        </button>
      </div>
      
      {/* Tournament Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeletons
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-[340px]">
              <Skeleton className="h-40 w-full" />
              <div className="pt-4 px-4">
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-40 mt-2" />
                <div className="flex justify-between mt-4">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-20" />
                </div>
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </div>
          ))
        ) : tournaments?.length ? (
          tournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No tournaments found</h3>
            <p className="text-muted-foreground">Try changing your filters or check back later.</p>
          </div>
        )}
      </div>
      
      {tournaments && tournaments.length >= limit && (
        <div className="flex justify-center mt-8">
          <Button 
            variant="outline" 
            onClick={handleLoadMore}
            className="bg-accent hover:bg-accent/90 transition"
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
