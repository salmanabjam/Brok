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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private marketDataStore: Map<string, MarketData[]>;
  private tradingSignalsStore: Map<string, TradingSignal[]>;
  private indicatorSettingsStore: Map<number, IndicatorSettings>;
  private performanceMetricsStore: PerformanceMetrics[];
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.marketDataStore = new Map();
    this.tradingSignalsStore = new Map();
    this.indicatorSettingsStore = new Map();
    this.performanceMetricsStore = [];
    this.currentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getLatestMarketData(symbol: string, limit = 100): Promise<MarketData[]> {
    const data = this.marketDataStore.get(symbol) || [];
    return data.slice(-limit);
  }

  async insertMarketData(data: InsertMarketData): Promise<MarketData> {
    const id = this.currentId++;
    const marketDataEntry: MarketData = { ...data, id };
    
    if (!this.marketDataStore.has(data.symbol)) {
      this.marketDataStore.set(data.symbol, []);
    }
    
    const symbolData = this.marketDataStore.get(data.symbol)!;
    symbolData.push(marketDataEntry);
    
    // Keep only last 1000 entries per symbol
    if (symbolData.length > 1000) {
      symbolData.splice(0, symbolData.length - 1000);
    }
    
    return marketDataEntry;
  }

  async getMarketDataInRange(symbol: string, startTime: Date, endTime: Date): Promise<MarketData[]> {
    const data = this.marketDataStore.get(symbol) || [];
    return data.filter(
      (entry) => entry.timestamp >= startTime && entry.timestamp <= endTime
    );
  }

  async getRecentSignals(symbol: string, limit = 50): Promise<TradingSignal[]> {
    const signals = this.tradingSignalsStore.get(symbol) || [];
    return signals.slice(-limit);
  }

  async insertTradingSignal(signal: InsertTradingSignal): Promise<TradingSignal> {
    const id = this.currentId++;
    const tradingSignal: TradingSignal = { 
      ...signal, 
      id,
      indicators: signal.indicators || null,
      confirmed: signal.confirmed || false
    };
    
    if (!this.tradingSignalsStore.has(signal.symbol)) {
      this.tradingSignalsStore.set(signal.symbol, []);
    }
    
    const symbolSignals = this.tradingSignalsStore.get(signal.symbol)!;
    symbolSignals.push(tradingSignal);
    
    // Keep only last 500 signals per symbol
    if (symbolSignals.length > 500) {
      symbolSignals.splice(0, symbolSignals.length - 500);
    }
    
    return tradingSignal;
  }

  async getSignalsByTimeRange(symbol: string, startTime: Date, endTime: Date): Promise<TradingSignal[]> {
    const signals = this.tradingSignalsStore.get(symbol) || [];
    return signals.filter(
      (signal) => signal.timestamp >= startTime && signal.timestamp <= endTime
    );
  }

  async getIndicatorSettings(userId: number): Promise<IndicatorSettings | undefined> {
    return this.indicatorSettingsStore.get(userId);
  }

  async updateIndicatorSettings(userId: number, settings: Partial<InsertIndicatorSettings>): Promise<IndicatorSettings> {
    const existing = this.indicatorSettingsStore.get(userId);
    const id = existing?.id || this.currentId++;
    
    const updatedSettings: IndicatorSettings = {
      id,
      userId,
      rsiPeriod: 14,
      qqeSmoothing: 5,
      adxThreshold: 25,
      rangeFilterEnabled: true,
      atrPeriod: 14,
      signalStyle: "dots",
      opacity: 85,
      trendDotsEnabled: true,
      ...existing,
      ...settings,
    };
    
    this.indicatorSettingsStore.set(userId, updatedSettings);
    return updatedSettings;
  }

  async insertPerformanceMetrics(metrics: InsertPerformanceMetrics): Promise<PerformanceMetrics> {
    const id = this.currentId++;
    const performanceMetric: PerformanceMetrics = { ...metrics, id };
    
    this.performanceMetricsStore.push(performanceMetric);
    
    // Keep only last 1000 metrics
    if (this.performanceMetricsStore.length > 1000) {
      this.performanceMetricsStore.splice(0, this.performanceMetricsStore.length - 1000);
    }
    
    return performanceMetric;
  }

  async getLatestPerformanceMetrics(limit = 10): Promise<PerformanceMetrics[]> {
    return this.performanceMetricsStore.slice(-limit);
  }
}

export const storage = new MemStorage();
