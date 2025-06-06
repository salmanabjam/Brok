export interface MarketData {
  id: number;
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingSignal {
  id: number;
  symbol: string;
  timestamp: Date;
  type: 'BUY' | 'SELL';
  strength: number;
  price: number;
  indicators?: {
    rsi?: number;
    qqe?: number;
    adx?: number;
  };
  confirmed: boolean;
}

export interface IndicatorSettings {
  id: number;
  userId: number;
  rsiPeriod: number;
  qqeSmoothing: number;
  adxThreshold: number;
  rangeFilterEnabled: boolean;
  atrPeriod: number;
  signalStyle: string;
  opacity: number;
  trendDotsEnabled: boolean;
}

export interface PerformanceMetrics {
  id: number;
  timestamp: Date;
  calculationTime: number;
  totalCalculations: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLoad: number;
}

export interface WebSocketMessage {
  type: 'connected' | 'market_update' | 'ping' | 'pong';
  data?: {
    marketData?: MarketData;
    signal?: {
      type: 'BUY' | 'SELL';
      strength: number;
      indicators: {
        rsi?: number;
        qqe?: number;
        adx?: number;
      };
    };
    performance?: {
      calculationTime: number;
      cacheHitRate: number;
      totalCalculations: number;
    };
  };
  message?: string;
}
