import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  open: real("open").notNull(),
  high: real("high").notNull(),
  low: real("low").notNull(),
  close: real("close").notNull(),
  volume: real("volume").notNull(),
});

export const tradingSignals = pgTable("trading_signals", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  type: text("type").notNull(), // 'BUY' | 'SELL'
  strength: real("strength").notNull(),
  price: real("price").notNull(),
  indicators: jsonb("indicators"), // RSI, QQE, ADX values
  confirmed: boolean("confirmed").default(false),
});

export const indicatorSettings = pgTable("indicator_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  rsiPeriod: integer("rsi_period").default(14),
  qqeSmoothing: integer("qqe_smoothing").default(5),
  adxThreshold: integer("adx_threshold").default(25),
  rangeFilterEnabled: boolean("range_filter_enabled").default(true),
  atrPeriod: integer("atr_period").default(14),
  signalStyle: text("signal_style").default("dots"),
  opacity: integer("opacity").default(85),
  trendDotsEnabled: boolean("trend_dots_enabled").default(true),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  calculationTime: real("calculation_time").notNull(),
  totalCalculations: integer("total_calculations").notNull(),
  cacheHitRate: real("cache_hit_rate").notNull(),
  memoryUsage: real("memory_usage").notNull(),
  cpuUsage: real("cpu_usage").notNull(),
  networkLoad: real("network_load").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
});

export const insertTradingSignalSchema = createInsertSchema(tradingSignals).omit({
  id: true,
});

export const insertIndicatorSettingsSchema = createInsertSchema(indicatorSettings).omit({
  id: true,
  userId: true,
});

export const insertPerformanceMetricsSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
export type MarketData = typeof marketData.$inferSelect;

export type InsertTradingSignal = z.infer<typeof insertTradingSignalSchema>;
export type TradingSignal = typeof tradingSignals.$inferSelect;

export type InsertIndicatorSettings = z.infer<typeof insertIndicatorSettingsSchema>;
export type IndicatorSettings = typeof indicatorSettings.$inferSelect;

export type InsertPerformanceMetrics = z.infer<typeof insertPerformanceMetricsSchema>;
export type PerformanceMetrics = typeof performanceMetrics.$inferSelect;
