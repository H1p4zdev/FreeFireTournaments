import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import * as crypto from "crypto";
import { insertUserSchema, insertTournamentSchema, insertTransactionSchema, insertTournamentParticipantSchema } from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";

// WebSocket connections store
interface Connection {
  ws: WebSocket;
  userId?: number;
}

// Tournament room subscriptions
interface TournamentSubscription {
  tournamentId: number;
  connections: Set<WebSocket>;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Session setup
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "free-fire-tournament-hub-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: app.get("env") === "production", maxAge: 86400000 }, // 1 day
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections and tournament subscriptions
  const connections: Connection[] = [];
  const tournamentSubscriptions: Map<number, Set<WebSocket>> = new Map();
  
  wss.on('connection', (ws) => {
    const conn: Connection = { ws };
    connections.push(conn);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Message handling
        if (data.type === 'auth') {
          // Authenticate the connection
          const userId = data.userId;
          conn.userId = userId;
        } else if (data.type === 'subscribe') {
          // Subscribe to tournament updates
          const tournamentId = data.tournamentId;
          if (!tournamentSubscriptions.has(tournamentId)) {
            tournamentSubscriptions.set(tournamentId, new Set());
          }
          tournamentSubscriptions.get(tournamentId)?.add(ws);
        } else if (data.type === 'unsubscribe') {
          // Unsubscribe from tournament updates
          const tournamentId = data.tournamentId;
          tournamentSubscriptions.get(tournamentId)?.delete(ws);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove connection from all subscriptions
      tournamentSubscriptions.forEach((subs) => {
        subs.delete(ws);
      });
      
      // Remove from connections
      const index = connections.findIndex((c) => c.ws === ws);
      if (index !== -1) {
        connections.splice(index, 1);
      }
    });
  });
  
  // Utility to broadcast tournament updates
  const broadcastTournamentUpdate = (tournamentId: number, data: any) => {
    const subscribers = tournamentSubscriptions.get(tournamentId);
    if (subscribers) {
      const message = JSON.stringify({
        type: 'tournament_update',
        tournamentId,
        data
      });
      
      subscribers.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  };
  
  // Authentication endpoints
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username) || 
                           await storage.getUserByPhone(userData.phone);
      
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this username or phone' });
      }
      
      // Create the user
      const user = await storage.createUser(userData);
      
      // Create a wallet for the user
      const wallet = await storage.createWallet(user.id);
      
      // Set session
      req.session.userId = user.id;
      
      res.status(201).json({ 
        id: user.id,
        username: user.username,
        phone: user.phone,
        playerID: user.playerID,
        wallet: {
          id: wallet.id,
          balance: wallet.balance
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Error creating user' });
    }
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Get user wallet
      const wallet = await storage.getWallet(user.id);
      
      if (!wallet) {
        return res.status(500).json({ message: 'User wallet not found' });
      }
      
      // Set session
      req.session.userId = user.id;
      
      res.json({ 
        id: user.id,
        username: user.username,
        phone: user.phone,
        playerID: user.playerID,
        wallet: {
          id: wallet.id,
          balance: wallet.balance
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error during login' });
    }
  });
  
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
  
  // User endpoints
  app.get('/api/user', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get user wallet
      const wallet = await storage.getWallet(user.id);
      
      if (!wallet) {
        return res.status(500).json({ message: 'User wallet not found' });
      }
      
      res.json({ 
        id: user.id,
        username: user.username,
        phone: user.phone,
        playerID: user.playerID,
        wallet: {
          id: wallet.id,
          balance: wallet.balance
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching user data' });
    }
  });
  
  // Tournament endpoints
  app.get('/api/tournaments', async (req: Request, res: Response) => {
    try {
      const mode = req.query.mode as string | undefined;
      const status = req.query.status as string | undefined;
      const minFee = req.query.minFee ? Number(req.query.minFee) : undefined;
      const maxFee = req.query.maxFee ? Number(req.query.maxFee) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;
      
      const tournaments = await storage.getTournaments({
        mode,
        status,
        minFee,
        maxFee,
        limit,
        offset
      });
      
      res.json(tournaments);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tournaments' });
    }
  });
  
  app.get('/api/tournaments/upcoming', async (req: Request, res: Response) => {
    try {
      const tournament = await storage.getUpcomingTournament();
      
      if (!tournament) {
        return res.status(404).json({ message: 'No upcoming tournaments found' });
      }
      
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching upcoming tournament' });
    }
  });
  
  app.get('/api/tournaments/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const tournament = await storage.getTournament(id);
      
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      res.json(tournament);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching tournament' });
    }
  });
  
  app.post('/api/tournaments/:id/join', async (req: Request, res: Response) => {
    try {
      const tournamentId = Number(req.params.id);
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Get tournament details
      const tournament = await storage.getTournament(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Check if tournament is full
      if (tournament.filledSlots >= tournament.maxSlots) {
        return res.status(400).json({ message: 'Tournament is full' });
      }
      
      // Check if user is already registered
      const isRegistered = await storage.isUserRegisteredForTournament(userId, tournamentId);
      
      if (isRegistered) {
        return res.status(400).json({ message: 'You are already registered for this tournament' });
      }
      
      // Check if user has enough balance
      const wallet = await storage.getWallet(userId);
      
      if (!wallet) {
        return res.status(500).json({ message: 'Wallet not found' });
      }
      
      if (Number(wallet.balance) < Number(tournament.entryFee)) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Create transaction for entry fee
      const transaction = await storage.createTransaction({
        userId,
        amount: -Number(tournament.entryFee),
        type: 'tournament_entry',
        method: 'wallet',
        status: 'completed',
        details: `Joined tournament: ${tournament.title} (ID: ${tournament.id})`
      });
      
      // Update wallet balance
      await storage.updateWalletBalance(userId, -Number(tournament.entryFee));
      
      // Register user for tournament
      const participant = await storage.joinTournament({
        tournamentId,
        userId,
        isPaid: true
      });
      
      // Broadcast tournament update to subscribers
      broadcastTournamentUpdate(tournamentId, {
        filledSlots: tournament.filledSlots + 1,
        maxSlots: tournament.maxSlots
      });
      
      res.status(201).json({ 
        success: true, 
        message: 'Successfully joined tournament',
        participant
      });
    } catch (error) {
      res.status(500).json({ message: 'Error joining tournament' });
    }
  });
  
  // Wallet endpoints
  app.get('/api/wallet', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const wallet = await storage.getWallet(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching wallet' });
    }
  });
  
  app.post('/api/wallet/deposit', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const schema = z.object({
        amount: z.number().positive(),
        method: z.enum(['bkash', 'nagad']),
        phone: z.string().min(11).max(11)
      });
      
      const { amount, method, phone } = schema.parse(req.body);
      
      // In a real app, this would interact with bKash/Nagad APIs
      // For demo purposes, we'll create a pending transaction
      const referenceId = crypto.randomUUID();
      
      const transaction = await storage.createTransaction({
        userId,
        amount,
        type: 'deposit',
        method,
        status: 'pending',
        referenceId,
        details: `Deposit via ${method} from ${phone}`
      });
      
      // In a real application, this would redirect to the payment gateway
      // For demo purposes, we'll simulate a successful payment
      setTimeout(async () => {
        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, 'completed');
        
        // Update wallet balance
        await storage.updateWalletBalance(userId, amount);
        
        // Notify connected user via WebSocket
        const userConnection = connections.find(c => c.userId === userId);
        if (userConnection && userConnection.ws.readyState === WebSocket.OPEN) {
          userConnection.ws.send(JSON.stringify({
            type: 'transaction_update',
            transactionId: transaction.id,
            status: 'completed',
            walletUpdate: {
              amount,
              new_balance: Number((await storage.getWallet(userId))?.balance)
            }
          }));
        }
      }, 3000);
      
      res.status(202).json({ 
        message: 'Deposit initiated',
        transaction: {
          id: transaction.id,
          status: transaction.status,
          referenceId: transaction.referenceId
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Error processing deposit' });
    }
  });
  
  app.post('/api/wallet/withdraw', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const schema = z.object({
        amount: z.number().positive(),
        method: z.enum(['bkash', 'nagad']),
        phone: z.string().min(11).max(11)
      });
      
      const { amount, method, phone } = schema.parse(req.body);
      
      // Check if user has enough balance
      const wallet = await storage.getWallet(userId);
      
      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }
      
      if (Number(wallet.balance) < amount) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }
      
      // Create withdrawal transaction
      const referenceId = crypto.randomUUID();
      
      const transaction = await storage.createTransaction({
        userId,
        amount: -amount, // Negative amount for withdrawal
        type: 'withdraw',
        method,
        status: 'pending',
        referenceId,
        details: `Withdraw via ${method} to ${phone}`
      });
      
      // Update wallet balance immediately (in real app might wait for confirmation)
      await storage.updateWalletBalance(userId, -amount);
      
      // Simulate processing
      setTimeout(async () => {
        // Update transaction status
        await storage.updateTransactionStatus(transaction.id, 'completed');
        
        // Notify connected user via WebSocket
        const userConnection = connections.find(c => c.userId === userId);
        if (userConnection && userConnection.ws.readyState === WebSocket.OPEN) {
          userConnection.ws.send(JSON.stringify({
            type: 'transaction_update',
            transactionId: transaction.id,
            status: 'completed'
          }));
        }
      }, 5000);
      
      res.status(202).json({ 
        message: 'Withdrawal initiated',
        transaction: {
          id: transaction.id,
          status: transaction.status,
          referenceId: transaction.referenceId
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Error processing withdrawal' });
    }
  });
  
  app.get('/api/transactions', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      
      if (!userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;
      
      const transactions = await storage.getTransactions(userId, limit, offset);
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching transactions' });
    }
  });

  return httpServer;
}
