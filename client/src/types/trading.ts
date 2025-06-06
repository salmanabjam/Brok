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
  rsiSmaPeriod: number;
  triggerHigh: number;
  triggerLow: number;
  tolerance: number;
  sf: number;
  qqeFastFactor: number;
  dmiLength: number;
  adxSmoothing: number;
  adxThreshold: number;
  weakThreshold: number;
  mediumThreshold: number;
  rangeFilterEnabled: boolean;
  atrPeriod: number;
  rangeThreshold: number;
  disableSignalsInRange: boolean;
  showOrderBlocks: boolean;
  obLookback: number;
  obThreshold: number;
  obMinStrength: number;
  showFvg: boolean;
  fvgLookback: number;
  fvgGapFactor: number;
  enableVolumeFilter: boolean;
  volumeThreshold: number;
  enableTrendFilter: boolean;
  trendPeriod: number;
  showSummaryTable: boolean;
  showTimeZones: boolean;
  signalStyle: string;
  tablePosition: string;
  signalLineLength: number;
  signalSize: string;
  buySignalOpacity: number;
  sellSignalOpacity: number;
  qqeSignalOpacity: number;
  buySignalColor: string;
  sellSignalColor: string;
  neutralSignalColor: string;
  signalIconSize: number;
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  showSignalStrength: boolean;
  strengthDisplayType: string;
  strongSignalThreshold: number;
  showTrendDots: boolean;
  trendDotsOpacity: number;
  cryptoSymbol: string;
  enableCryptoNews: boolean;
  autoAdjust: boolean;
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
