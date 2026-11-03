/**
 * Drizzle şema tanımı — README §3.4'teki 10 tablo (K7).
 * K8: elle SQL migration scripti YAZILMAZ; migration gerektiğinde `drizzle-kit generate` üretir (Faz 1).
 * Bu dosya infra katmanındadır; domain/application Drizzle GÖREMEZ (purity lint, AK-5.4).
 */
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skillCode: text("skill_code").notNull(),
  level: integer("level").notNull().default(1),
  points: integer("points").notNull().default(0),
});

export const profile = pgTable("profile", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  level: integer("level").notNull().default(1),
  totalPoints: integer("total_points").notNull().default(0),
});

export const progress = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameCode: text("game_code").notNull(),
  levelId: text("level_id").notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameCode: text("game_code").notNull(),
  score: integer("score").notNull().default(0),
  durationSec: integer("duration_sec").notNull().default(0),
  playedAt: timestamp("played_at").notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  achievementCode: text("achievement_code").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const hints = pgTable("hints", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coins = pgTable("coins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  subscribedAt: timestamp("subscribed_at").notNull().defaultNow(),
});

export const dailyPuzzle = pgTable("daily_puzzle", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  puzzleDate: text("puzzle_date").notNull(),
  solved: boolean("solved").notNull().default(false),
  streakDays: integer("streak_days").notNull().default(0),
});

/** AK-5.1 test kanıtı için tablo listesi — sıra değişirse test güncellenir. */
export const tableList = [
  users,
  skills,
  profile,
  progress,
  sessions,
  achievements,
  hints,
  coins,
  subscriptions,
  dailyPuzzle,
];
