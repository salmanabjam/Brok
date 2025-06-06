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
  // Core RSI/QQE Parameters
  rsiPeriod: integer("rsi_period").default(14),
  rsiSmaPeriod: integer("rsi_sma_period").default(14),
  triggerHigh: real("trigger_high").default(70),
  triggerLow: real("trigger_low").default(30),
  tolerance: real("tolerance").default(2.0),
  sf: integer("sf").default(5), // RSI Smoothing
  qqeFastFactor: real("qqe_fast_factor").default(4.238),
  
  // ADX/DMI Parameters
  dmiLength: integer("dmi_length").default(14),
  adxSmoothing: integer("adx_smoothing").default(14),
  adxThreshold: real("adx_threshold").default(25),
  
  // Signal Strength Thresholds
  weakThreshold: real("weak_threshold").default(20),
  mediumThreshold: real("medium_threshold").default(50),
  
  // Range Market Detection
  rangeFilterEnabled: boolean("range_filter_enabled").default(true),
  atrPeriod: integer("atr_period").default(14),
  rangeThreshold: real("range_threshold").default(0.5),
  disableSignalsInRange: boolean("disable_signals_in_range").default(true),
  
  // Order Blocks
  showOrderBlocks: boolean("show_order_blocks").default(true),
  obLookback: integer("ob_lookback").default(20),
  obThreshold: real("ob_threshold").default(1.0),
  obMinStrength: real("ob_min_strength").default(1.2),
  
  // Fair Value Gaps
  showFvg: boolean("show_fvg").default(true),
  fvgLookback: integer("fvg_lookback").default(30),
  fvgGapFactor: real("fvg_gap_factor").default(0.5),
  
  // Volume & Trend Filters
  enableVolumeFilter: boolean("enable_volume_filter").default(true),
  volumeThreshold: real("volume_threshold").default(1.5),
  enableTrendFilter: boolean("enable_trend_filter").default(true),
  trendPeriod: integer("trend_period").default(50),
  
  // Display Settings
  showSummaryTable: boolean("show_summary_table").default(true),
  showTimeZones: boolean("show_time_zones").default(true),
  signalStyle: text("signal_style").default("Simple"),
  tablePosition: text("table_position").default("Top-Right"),
  signalLineLength: integer("signal_line_length").default(3),
  signalSize: text("signal_size").default("Normal"),
  buySignalOpacity: integer("buy_signal_opacity").default(70),
  sellSignalOpacity: integer("sell_signal_opacity").default(70),
  qqeSignalOpacity: integer("qqe_signal_opacity").default(50),
  showTrendDots: boolean("show_trend_dots").default(true),
  trendDotsOpacity: integer("trend_dots_opacity").default(30),
  
  // Auto-Adjustment
  autoAdjust: boolean("auto_adjust").default(true),
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
