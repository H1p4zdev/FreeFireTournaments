import { createContext, useContext, useEffect, useState } from "react";

// Define WebSocket context types
interface WebSocketContextType {
  subscribe: (tournamentId: number) => void;
  unsubscribe: (tournamentId: number) => void;
  isConnected: boolean;
}

// Create the WebSocket context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  subscribe: () => {},
  unsubscribe: () => {},
  isConnected: false
});

// Provider props interface
interface WebSocketProviderProps {
  children: React.ReactNode;
}

// WebSocket provider component
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Initialize WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket at', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      
      // Try to reconnect after 5 seconds
      setTimeout(() => {
        setSocket(null);
      }, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different message types
        if (data.type === 'tournament_update') {
          // Update tournament data in the app
          // This would typically be handled by invalidating React Query cache
          if (data.tournamentId) {
            // We could update a specific tournament detail
            console.log('Tournament update received:', data);
          }
        } else if (data.type === 'transaction_update') {
          // Update transaction status
          console.log('Transaction update received:', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);
  
  // Subscribe to tournament updates
  const subscribe = (tournamentId: number) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'subscribe',
        tournamentId
      }));
    }
  };
  
  // Unsubscribe from tournament updates
  const unsubscribe = (tournamentId: number) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'unsubscribe',
        tournamentId
      }));
    }
  };
  
  return (
    <WebSocketContext.Provider value={{ subscribe, unsubscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hook to use the WebSocket context
export function useWebSocket() {
  return useContext(WebSocketContext);
}
