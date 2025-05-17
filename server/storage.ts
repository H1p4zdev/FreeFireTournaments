import { 
  users, wallets, tournaments, tournamentParticipants, transactions,
  type User, type InsertUser, type Wallet, type Tournament, 
  type InsertTournament, type Transaction, type InsertTransaction,
  type TournamentParticipant, type InsertTournamentParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lt, lte, asc, sql, inArray } from "drizzle-orm";
import { numeric } from "drizzle-orm/pg-core";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet methods
  getWallet(userId: number): Promise<Wallet | undefined>;
  createWallet(userId: number): Promise<Wallet>;
  updateWalletBalance(userId: number, amount: number): Promise<Wallet>;
  
  // Tournament methods
  getTournament(id: number): Promise<Tournament | undefined>;
  getTournaments(filters?: {
    mode?: string;
    status?: string;
    minFee?: number;
    maxFee?: number;
    limit?: number;
    offset?: number;
  }): Promise<Tournament[]>;
  getUpcomingTournament(): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournamentSlots(id: number, slots: number): Promise<Tournament>;
  
  // Tournament Participants methods
  getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]>;
  joinTournament(data: InsertTournamentParticipant): Promise<TournamentParticipant>;
  isUserRegisteredForTournament(userId: number, tournamentId: number): Promise<boolean>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactions(userId: number, limit?: number, offset?: number): Promise<Transaction[]>;
  getTransactionsByStatus(status: string, limit?: number, offset?: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string): Promise<Transaction>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Wallet methods
  async getWallet(userId: number): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    return wallet;
  }

  async createWallet(userId: number): Promise<Wallet> {
    const [wallet] = await db
      .insert(wallets)
      .values({ userId })
      .returning();
    return wallet;
  }

  async updateWalletBalance(userId: number, amount: number): Promise<Wallet> {
    const [wallet] = await db
      .select().from(wallets).where(eq(wallets.userId, userId));
    
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const [updatedWallet] = await db
      .update(wallets)
      .set({ 
        balance: sql`${wallets.balance} + ${amount}` 
      })
      .where(eq(wallets.userId, userId))
      .returning();
    
    return updatedWallet;
  }

  // Tournament methods
  async getTournament(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.id, id));
    return tournament;
  }

  async getTournaments(filters: {
    mode?: string;
    status?: string;
    minFee?: number;
    maxFee?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<Tournament[]> {
    let query = db.select().from(tournaments);
    
    // Apply filters
    if (filters.mode) {
      query = query.where(eq(tournaments.mode, filters.mode));
    }
    
    if (filters.status) {
      query = query.where(eq(tournaments.status, filters.status));
    }
    
    if (filters.minFee !== undefined) {
      query = query.where(gte(tournaments.entryFee, filters.minFee));
    }
    
    if (filters.maxFee !== undefined) {
      query = query.where(lte(tournaments.entryFee, filters.maxFee));
    }
    
    // Sort by start time ascending for upcoming tournaments
    query = query.orderBy(asc(tournaments.startTime));
    
    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getUpcomingTournament(): Promise<Tournament | undefined> {
    const now = new Date();
    
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(and(
        eq(tournaments.status, 'upcoming'),
        gte(tournaments.startTime, now)
      ))
      .orderBy(asc(tournaments.startTime))
      .limit(1);
    
    return tournament;
  }

  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const [newTournament] = await db
      .insert(tournaments)
      .values(tournament)
      .returning();
    
    return newTournament;
  }

  async updateTournamentSlots(id: number, slots: number): Promise<Tournament> {
    const [tournament] = await db
      .select().from(tournaments).where(eq(tournaments.id, id));
    
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    
    // Ensure slots don't exceed maxSlots
    const newSlots = Math.min(slots, tournament.maxSlots);
    
    const [updatedTournament] = await db
      .update(tournaments)
      .set({ filledSlots: newSlots })
      .where(eq(tournaments.id, id))
      .returning();
    
    return updatedTournament;
  }

  // Tournament Participants methods
  async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
    return await db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
  }

  async joinTournament(data: InsertTournamentParticipant): Promise<TournamentParticipant> {
    const [participant] = await db
      .insert(tournamentParticipants)
      .values(data)
      .returning();
    
    // Increment the tournament filled slots
    await this.updateTournamentSlots(data.tournamentId, 
      (await this.getTournament(data.tournamentId))!.filledSlots + 1
    );
    
    return participant;
  }

  async isUserRegisteredForTournament(userId: number, tournamentId: number): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(tournamentParticipants)
      .where(and(
        eq(tournamentParticipants.userId, userId),
        eq(tournamentParticipants.tournamentId, tournamentId)
      ));
    
    return !!participant;
  }

  // Transaction methods
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        updatedAt: new Date()
      })
      .returning();
    
    return newTransaction;
  }

  async getTransactions(userId: number, limit?: number, offset?: number): Promise<Transaction[]> {
    let query = db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    if (offset) {
      query = query.offset(offset);
    }
    
    return await query;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    
    return transaction;
  }
  
  async getTransactionsByStatus(status: string, limit?: number, offset?: number): Promise<Transaction[]> {
    let query = db
      .select()
      .from(transactions)
      .where(eq(transactions.status, status))
      .orderBy(desc(transactions.createdAt));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    if (offset) {
      query = query.offset(offset);
    }
    
    return await query;
  }
  
  async updateTransactionStatus(id: number, status: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id))
      .returning();
    
    return transaction;
  }
}

export const storage = new DatabaseStorage();
