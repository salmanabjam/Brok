import {
  users,
  marketData,
  tradingSignals,
  indicatorSettings,
  performanceMetrics,
  type User,
  type InsertUser,
  type MarketData,
  type InsertMarketData,
  type TradingSignal,
  type InsertTradingSignal,
  type IndicatorSettings,
  type InsertIndicatorSettings,
  type PerformanceMetrics,
  type InsertPerformanceMetrics,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Market data operations
  getLatestMarketData(symbol: string, limit?: number): Promise<MarketData[]>;
  insertMarketData(data: InsertMarketData): Promise<MarketData>;
  getMarketDataInRange(symbol: string, startTime: Date, endTime: Date): Promise<MarketData[]>;

  // Trading signals operations
  getRecentSignals(symbol: string, limit?: number): Promise<TradingSignal[]>;
  insertTradingSignal(signal: InsertTradingSignal): Promise<TradingSignal>;
  getSignalsByTimeRange(symbol: string, startTime: Date, endTime: Date): Promise<TradingSignal[]>;

  // Indicator settings operations
  getIndicatorSettings(userId: number): Promise<IndicatorSettings | undefined>;
  updateIndicatorSettings(userId: number, settings: Partial<InsertIndicatorSettings>): Promise<IndicatorSettings>;

  // Performance metrics operations
  insertPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics>;
  getLatestPerformanceMetrics(limit?: number): Promise<PerformanceMetrics[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLatestMarketData(symbol: string, limit = 100): Promise<MarketData[]> {
    const data = await db
      .select()
      .from(marketData)
      .where(eq(marketData.symbol, symbol))
      .orderBy(desc(marketData.timestamp))
      .limit(limit);
    return data.reverse(); // Return in chronological order
  }

  async insertMarketData(data: InsertMarketData): Promise<MarketData> {
    const [inserted] = await db
      .insert(marketData)
      .values(data)
      .returning();
    return inserted;
  }

  async getMarketDataInRange(symbol: string, startTime: Date, endTime: Date): Promise<MarketData[]> {
    const data = await db
      .select()
      .from(marketData)
      .where(
        and(
          eq(marketData.symbol, symbol),
          gte(marketData.timestamp, startTime),
          lte(marketData.timestamp, endTime)
        )
      )
      .orderBy(marketData.timestamp);
    return data;
  }

  async getRecentSignals(symbol: string, limit = 50): Promise<TradingSignal[]> {
    const signals = await db
      .select()
      .from(tradingSignals)
      .where(eq(tradingSignals.symbol, symbol))
      .orderBy(desc(tradingSignals.timestamp))
      .limit(limit);
    return signals.reverse(); // Return in chronological order
  }

  async insertTradingSignal(signal: InsertTradingSignal): Promise<TradingSignal> {
    const [inserted] = await db
      .insert(tradingSignals)
      .values(signal)
      .returning();
    return inserted;
  }

  async getSignalsByTimeRange(symbol: string, startTime: Date, endTime: Date): Promise<TradingSignal[]> {
    const signals = await db
      .select()
      .from(tradingSignals)
      .where(
        and(
          eq(tradingSignals.symbol, symbol),
          gte(tradingSignals.timestamp, startTime),
          lte(tradingSignals.timestamp, endTime)
        )
      )
      .orderBy(tradingSignals.timestamp);
    return signals;
  }

  async getIndicatorSettings(userId: number): Promise<IndicatorSettings | undefined> {
    const [settings] = await db
      .select()
      .from(indicatorSettings)
      .where(eq(indicatorSettings.userId, userId));
    return settings || undefined;
  }

  async updateIndicatorSettings(userId: number, settings: Partial<InsertIndicatorSettings>): Promise<IndicatorSettings> {
    // Check if settings exist
    const existing = await this.getIndicatorSettings(userId);
    
    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(indicatorSettings)
        .set(settings)
        .where(eq(indicatorSettings.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new settings with defaults
      const defaultSettings = {
        userId,
        rsiPeriod: 14,
        qqeSmoothing: 5,
        adxThreshold: 25,
        rangeFilterEnabled: true,
        atrPeriod: 14,
        signalStyle: "dots",
        opacity: 85,
        trendDotsEnabled: true,
        ...settings,
      };
      
      const [created] = await db
        .insert(indicatorSettings)
        .values(defaultSettings)
        .returning();
      return created;
    }
  }

  async insertPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const [inserted] = await db
      .insert(performanceMetrics)
      .values(metrics)
      .returning();
    return inserted;
  }

  async getLatestPerformanceMetrics(limit = 10): Promise<PerformanceMetrics[]> {
    const metrics = await db
      .select()
      .from(performanceMetrics)
      .orderBy(desc(performanceMetrics.timestamp))
      .limit(limit);
    return metrics.reverse(); // Return in chronological order
  }
}

export const storage = new DatabaseStorage();
