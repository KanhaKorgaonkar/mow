import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for potential future features like saving progress, custom settings, etc.
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Game progress/save data 
export const gameProgress = pgTable("game_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  totalAreaMowed: integer("total_area_mowed").default(0).notNull(),
  sceneryDiscovered: text("scenery_discovered").array().default([]).notNull(),
  playTimeMinutes: integer("play_time_minutes").default(0).notNull(),
  lastSaved: text("last_saved").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameProgressSchema = createInsertSchema(gameProgress).pick({
  userId: true,
  totalAreaMowed: true,
  sceneryDiscovered: true, 
  playTimeMinutes: true,
  lastSaved: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameProgress = z.infer<typeof insertGameProgressSchema>;
export type GameProgress = typeof gameProgress.$inferSelect;
