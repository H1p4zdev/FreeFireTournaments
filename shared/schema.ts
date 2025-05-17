import { pgTable, text, serial, integer, boolean, timestamp, numeric, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phone: text("phone").notNull().unique(),
  playerID: text("player_id"),
  email: text("email"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  entryFee: numeric("entry_fee", { precision: 10, scale: 2 }).notNull(),
  prizePool: numeric("prize_pool", { precision: 10, scale: 2 }).notNull(),
  maxSlots: integer("max_slots").notNull(),
  filledSlots: integer("filled_slots").notNull().default(0),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  mode: text("mode").notNull(), // solo, duo, squad
  status: text("status").notNull().default("upcoming"), // upcoming, ongoing, completed
  imagePath: text("image_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tournamentParticipants = pgTable("tournament_participants", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  position: integer("position"),
  isPaid: boolean("is_paid").notNull().default(false),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // deposit, withdraw, tournament_entry, tournament_win
  method: text("method"), // bkash, nagad, wallet
  status: text("status").notNull(), // pending, completed, failed
  referenceId: text("reference_id"), // payment gateway reference
  details: text("details"), // Additional info like phone number, tournament ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas for inserts
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertWalletSchema = createInsertSchema(wallets).omit({ id: true });
export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true, filledSlots: true });
export const insertTournamentParticipantSchema = createInsertSchema(tournamentParticipants).omit({ id: true, registeredAt: true, position: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

export type InsertTournamentParticipant = z.infer<typeof insertTournamentParticipantSchema>;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Extended schemas for full records including tournament details
export const userWithWalletSchema = z.object({
  ...insertUserSchema.shape,
  id: z.number(),
  wallet: z.object({
    id: z.number(),
    balance: z.number().or(z.string()), // handle numeric types
  }),
});

export type UserWithWallet = z.infer<typeof userWithWalletSchema>;

export const tournamentWithDetailsSchema = z.object({
  ...insertTournamentSchema.shape,
  id: z.number(),
  filledSlots: z.number(),
});

export type TournamentWithDetails = z.infer<typeof tournamentWithDetailsSchema>;
