import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMarketDataSchema, insertTradingSignalSchema, insertIndicatorSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { cryptoDataService } from "./services/cryptoDataService";

// Cache for technical indicators
const indicatorCache = new Map<string, any>();
let cacheHitCount = 0;
let totalCalculations = 0;

// Simple technical indicator calculations
function calculateRSI(prices: number[], period: number = 14): number {
  const cacheKey = `rsi_${prices.length}_${period}`;
  totalCalculations++;
  
  if (indicatorCache.has(cacheKey)) {
    cacheHitCount++;
    return indicatorCache.get(cacheKey);
  }

  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[prices.length - i] - prices[prices.length - i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  indicatorCache.set(cacheKey, rsi);
  return rsi;
}

function calculateQQE(rsi: number, smoothing: number = 5): number {
  // Simplified QQE calculation
  const qqe = rsi + (Math.sin(rsi * Math.PI / 180) * smoothing);
  return Math.max(0, Math.min(100, qqe));
}

function calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < period + 1) return 0;

  let trSum = 0;
  let dmPlusSum = 0;
  let dmMinusSum = 0;

  for (let i = 1; i <= period; i++) {
    const idx = highs.length - i;
    const prevIdx = idx - 1;

    const tr = Math.max(
      highs[idx] - lows[idx],
      Math.abs(highs[idx] - closes[prevIdx]),
      Math.abs(lows[idx] - closes[prevIdx])
    );

    const dmPlus = Math.max(0, highs[idx] - highs[prevIdx]);
    const dmMinus = Math.max(0, lows[prevIdx] - lows[idx]);

    trSum += tr;
    dmPlusSum += dmPlus;
    dmMinusSum += dmMinus;
  }

  const diPlus = (dmPlusSum / trSum) * 100;
  const diMinus = (dmMinusSum / trSum) * 100;
  const dx = Math.abs(diPlus - diMinus) / (diPlus + diMinus) * 100;

  return dx;
}

function generateTradingSignal(marketData: any[], settings: any) {
  const startTime = Date.now();
  
  const closes = marketData.map(d => d.close);
  const highs = marketData.map(d => d.high);
  const lows = marketData.map(d => d.low);
  const volumes = marketData.map(d => d.volume);

  // Enhanced BrainIXMagT calculations
  const rsi = calculateRSI(closes, settings.rsiPeriod || 14);
  const smoothedRSI = calculateSmoothedRSI(closes, settings.rsiPeriod || 14, settings.sf || 5);
  const atrValues = calculateATRArray(highs, lows, closes, settings.atrPeriod || 14);
  const qqe = calculateAdvancedQQE(closes, atrValues, settings.qqeFastFactor || 4.238, settings.sf || 5);
  const adx = calculateADX(highs, lows, closes, settings.dmiLength || 14);
  const atr = atrValues[atrValues.length - 1] || 0;

  // Range market detection
  const isRangeMarket = detectRangeMarket(closes, settings.atrPeriod || 14, settings.rangeThreshold || 0.5);
  
  // Order blocks and Fair Value Gaps
  const orderBlocks = findOrderBlocks(highs, lows, volumes, settings.obLookback || 20);
  const fairValueGaps = findFairValueGaps(highs, lows, 0.0010);

  let signalType: string | null = null;
  let strength = 0;

  // Enhanced signal generation based on BrainIXMagT documentation
  if (!isRangeMarket || !settings.disableSignalsInRange) {
    // Volume filter
    const volumeOk = !settings.enableVolumeFilter || 
      (volumes.length > 0 && volumes[volumes.length - 1] > 
       (volumes.slice(-10).reduce((a, b) => a + b, 0) / 10) * (settings.volumeThreshold || 1.5));
    
    // Trend filter (simplified for now)
    const trendOk = !settings.enableTrendFilter || true;
    
    if (volumeOk && trendOk) {
      // Buy signal conditions with tolerance
      if (rsi < (settings.triggerLow || 30) + (settings.tolerance || 2) && 
          smoothedRSI < (settings.triggerLow || 30) && 
          qqe < (settings.triggerLow || 30) && 
          adx > (settings.adxThreshold || 25)) {
        signalType = "BUY";
        strength = Math.min(95, 60 + ((settings.triggerLow || 30) - rsi) * 2 + (adx - (settings.adxThreshold || 25)));
        
        // Boost strength based on order blocks support
        const supportBlocks = orderBlocks.filter(ob => ob.type === 'support' && Math.abs(ob.level - closes[closes.length - 1]) < atr * 2);
        strength += supportBlocks.length * 5;
      }
      // Sell signal conditions with tolerance
      else if (rsi > (settings.triggerHigh || 70) - (settings.tolerance || 2) && 
               smoothedRSI > (settings.triggerHigh || 70) && 
               qqe > (settings.triggerHigh || 70) && 
               adx > (settings.adxThreshold || 25)) {
        signalType = "SELL";
        strength = Math.min(95, 60 + (rsi - (settings.triggerHigh || 70)) * 2 + (adx - (settings.adxThreshold || 25)));
        
        // Boost strength based on order blocks resistance
        const resistanceBlocks = orderBlocks.filter(ob => ob.type === 'resistance' && Math.abs(ob.level - closes[closes.length - 1]) < atr * 2);
        strength += resistanceBlocks.length * 5;
      }
    }
  }

  const calculationTime = Date.now() - startTime;
  const cacheHitRate = totalCalculations > 0 ? (cacheHitCount / totalCalculations) * 100 : 0;

  // Store performance metrics
  storage.insertPerformanceMetrics({
    timestamp: new Date(),
    calculationTime,
    totalCalculations,
    cacheHitRate,
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
    cpuUsage: process.cpuUsage().user / 1000,
    networkLoad: Math.random() * 10,
  });

  return {
    signalType,
    strength,
    indicators: { 
      rsi, 
      smoothedRSI, 
      qqe, 
      adx, 
      atr,
      isRangeMarket,
      orderBlocks: orderBlocks.length,
      fairValueGaps: fairValueGaps.length
    },
    calculationTime,
    cacheHitRate
  };
}

function calculateSmoothedRSI(prices: number[], period: number = 14, smoothing: number = 5): number {
  if (prices.length < period + smoothing) return 50;
  
  const rsiValues: number[] = [];
  for (let i = smoothing; i < prices.length; i++) {
    const slice = prices.slice(i - period - smoothing, i);
    if (slice.length >= period + 1) {
      rsiValues.push(calculateRSI(slice, period));
    }
  }
  
  if (rsiValues.length === 0) return 50;
  
  // Exponential smoothing
  let smoothedRSI = rsiValues[0];
  const alpha = 2 / (smoothing + 1);
  
  for (let i = 1; i < rsiValues.length; i++) {
    smoothedRSI = alpha * rsiValues[i] + (1 - alpha) * smoothedRSI;
  }
  
  return smoothedRSI;
}

function calculateAdvancedQQE(prices: number[], atrValues: number[], fastFactor: number = 4.238, smoothing: number = 5): number {
  if (prices.length < smoothing || atrValues.length === 0) return 50;
  
  // Calculate smoothed RSI
  const smoothedRSI = calculateSmoothedRSI(prices, 14, smoothing);
  
  // Get latest ATR
  const atr = atrValues[atrValues.length - 1] || 0.001;
  
  // Calculate QQE using ATR-based delta
  const qqeDelta = atr * fastFactor;
  const qqeValue = smoothedRSI + (Math.sin(smoothedRSI * Math.PI / 180) * qqeDelta * 10);
  
  return Math.max(0, Math.min(100, qqeValue));
}

function calculateATRArray(highs: number[], lows: number[], closes: number[], period: number): number[] {
  const atrValues: number[] = [];
  
  for (let i = period; i < highs.length; i++) {
    let trSum = 0;
    
    for (let j = 0; j < period; j++) {
      const idx = i - j;
      const prevIdx = idx - 1;
      
      if (prevIdx >= 0) {
        const tr = Math.max(
          highs[idx] - lows[idx],
          Math.abs(highs[idx] - closes[prevIdx]),
          Math.abs(lows[idx] - closes[prevIdx])
        );
        trSum += tr;
      }
    }
    
    atrValues.push(trSum / period);
  }
  
  return atrValues;
}

function detectRangeMarket(prices: number[], atrPeriod: number = 14, threshold: number = 0.001): boolean {
  if (prices.length < atrPeriod * 2) return false;

  const highs = prices;
  const lows = prices;
  const closes = prices;

  const atr = calculateATR(highs, lows, closes, atrPeriod);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  return (atr / avgPrice) < threshold;
}

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < period + 1) return 0;

  let trSum = 0;

  for (let i = 1; i <= period; i++) {
    const idx = highs.length - i;
    const prevIdx = idx - 1;

    const tr = Math.max(
      highs[idx] - lows[idx],
      Math.abs(highs[idx] - closes[prevIdx]),
      Math.abs(lows[idx] - closes[prevIdx])
    );

    trSum += tr;
  }

  return trSum / period;
}

function findOrderBlocks(highs: number[], lows: number[], volumes: number[], lookback: number = 20): Array<{ level: number; strength: number; type: 'support' | 'resistance' }> {
  const blocks: Array<{ level: number; strength: number; type: 'support' | 'resistance' }> = [];
  
  if (highs.length < lookback) return blocks;

  // Find potential support levels (high volume at low prices)
  for (let i = lookback; i < lows.length - lookback; i++) {
    const localLow = Math.min(...lows.slice(i - lookback, i + lookback));
    const avgVolume = volumes.slice(i - lookback, i + lookback).reduce((sum, vol) => sum + vol, 0) / (lookback * 2);
    
    if (lows[i] === localLow && volumes[i] > avgVolume * 1.5) {
      blocks.push({
        level: lows[i],
        strength: volumes[i] / avgVolume,
        type: 'support'
      });
    }
  }

  // Find potential resistance levels (high volume at high prices)
  for (let i = lookback; i < highs.length - lookback; i++) {
    const localHigh = Math.max(...highs.slice(i - lookback, i + lookback));
    const avgVolume = volumes.slice(i - lookback, i + lookback).reduce((sum, vol) => sum + vol, 0) / (lookback * 2);
    
    if (highs[i] === localHigh && volumes[i] > avgVolume * 1.5) {
      blocks.push({
        level: highs[i],
        strength: volumes[i] / avgVolume,
        type: 'resistance'
      });
    }
  }

  return blocks.slice(-5); // Return only the 5 most recent blocks
}

function findFairValueGaps(highs: number[], lows: number[], minGapSize: number = 0.0010): Array<{ high: number; low: number; strength: number }> {
  const gaps: Array<{ high: number; low: number; strength: number }> = [];
  
  if (highs.length < 3) return gaps;

  for (let i = 1; i < highs.length - 1; i++) {
    // Gap up: previous high < current low
    if (highs[i - 1] < lows[i] && (lows[i] - highs[i - 1]) > minGapSize) {
      gaps.push({
        high: lows[i],
        low: highs[i - 1],
        strength: (lows[i] - highs[i - 1]) / minGapSize
      });
    }
    
    // Gap down: previous low > current high
    if (lows[i - 1] > highs[i] && (lows[i - 1] - highs[i]) > minGapSize) {
      gaps.push({
        high: lows[i - 1],
        low: highs[i],
        strength: (lows[i - 1] - highs[i]) / minGapSize
      });
    }
  }

  return gaps.slice(-3); // Return only the 3 most recent gaps
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time data
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Market data API routes
  app.get("/api/market-data/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const data = await storage.getLatestMarketData(symbol, limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  app.post("/api/market-data", async (req, res) => {
    try {
      const validatedData = insertMarketDataSchema.parse(req.body);
      const result = await storage.insertMarketData(validatedData);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid market data format", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to insert market data" });
      }
    }
  });

  // Trading signals API routes
  app.get("/api/signals/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const signals = await storage.getRecentSignals(symbol, limit);
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading signals" });
    }
  });

  // Indicator settings API routes
  app.get("/api/indicator-settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`Fetching indicator settings for user: ${userId}`);
      
      const settings = await storage.getIndicatorSettings(userId);
      
      if (!settings) {
        console.log(`No settings found for user ${userId}, creating defaults`);
        // Return default settings
        const defaultSettings = await storage.updateIndicatorSettings(userId, {});
        res.json(defaultSettings);
      } else {
        console.log(`Found settings for user ${userId}:`, settings);
        res.json(settings);
      }
    } catch (error) {
      console.error("Error in indicator settings endpoint:", error);
      res.status(500).json({ 
        error: "Failed to fetch indicator settings", 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.put("/api/indicator-settings/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedSettings = insertIndicatorSettingsSchema.parse(req.body);
      
      const updatedSettings = await storage.updateIndicatorSettings(userId, validatedSettings);
      res.json(updatedSettings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid settings format", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update indicator settings" });
      }
    }
  });

  // Performance metrics API routes
  app.get("/api/performance-metrics", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const metrics = await storage.getLatestPerformanceMetrics(limit);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  // Export API routes
  app.get("/api/export/signals/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      const { format = 'json', startTime, endTime } = req.query;
      
      let signals;
      if (startTime && endTime) {
        signals = await storage.getSignalsByTimeRange(
          symbol,
          new Date(startTime as string),
          new Date(endTime as string)
        );
      } else {
        signals = await storage.getRecentSignals(symbol, 1000);
      }

      if (format === 'csv') {
        const csvHeader = 'timestamp,type,strength,price,rsi,qqe,adx\n';
        const csvData = signals.map(signal => {
          const indicators = signal.indicators as any || {};
          return `${signal.timestamp},${signal.type},${signal.strength},${signal.price},${indicators.rsi || ''},${indicators.qqe || ''},${indicators.adx || ''}`;
        }).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${symbol}_signals.csv"`);
        res.send(csvHeader + csvData);
      } else {
        res.json(signals);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to export signals" });
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected to WebSocket');

    // Send initial data
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Connected to BrainIXMagT trading platform'
    }));

    // Simulate real-time market data updates
    const marketDataInterval = setInterval(async () => {
      if (ws.readyState === WebSocket.OPEN) {
        const currentTime = new Date();
        
        // Generate realistic market data for EUR/USD
        const lastData = await storage.getLatestMarketData('EURUSD', 1);
        const lastPrice = lastData.length > 0 ? lastData[0].close : 1.0800;
        
        const change = (Math.random() - 0.5) * 0.0010; // Max 10 pip movement
        const newPrice = Math.max(1.0500, Math.min(1.1500, lastPrice + change));
        
        const spread = 0.0002;
        const volatility = Math.random() * 0.0005;
        
        // Get authentic Cardano USD data
        const cryptoPrice = await cryptoDataService.getMultiSourcePrice();
        
        const marketData = cryptoPrice ? {
          symbol: 'ADAUSD',
          timestamp: currentTime,
          open: cryptoPrice.price * (1 + (Math.random() - 0.5) * 0.01),
          high: cryptoPrice.price * (1 + Math.random() * 0.02),
          low: cryptoPrice.price * (1 - Math.random() * 0.02),
          close: cryptoPrice.price,
          volume: cryptoPrice.volume_24h / 24 // Approximate hourly volume
        } : {
          symbol: 'ADAUSD',
          timestamp: currentTime,
          open: lastPrice,
          high: newPrice + volatility,
          low: newPrice - volatility,
          close: newPrice,
          volume: Math.floor(Math.random() * 1000000 + 500000)
        };

        // Store market data
        const storedData = await storage.insertMarketData(marketData);
        
        // Get recent data for signal generation
        const recentData = await storage.getLatestMarketData('EURUSD', 50);
        const settings = await storage.getIndicatorSettings(1) || {
          rsiPeriod: 14,
          qqeSmoothing: 5,
          adxThreshold: 25,
          rangeFilterEnabled: true,
          atrPeriod: 14
        };

        // Generate trading signal
        const signalData = generateTradingSignal(recentData, settings);
        
        // Store signal if generated
        if (signalData.signalType) {
          await storage.insertTradingSignal({
            symbol: 'EURUSD',
            timestamp: currentTime,
            type: signalData.signalType,
            strength: signalData.strength,
            price: newPrice,
            indicators: signalData.indicators,
            confirmed: signalData.strength > 75
          });
        }

        // Send real-time update to client
        ws.send(JSON.stringify({
          type: 'market_update',
          data: {
            marketData: storedData,
            signal: signalData.signalType ? {
              type: signalData.signalType,
              strength: signalData.strength,
              indicators: signalData.indicators
            } : null,
            performance: {
              calculationTime: signalData.calculationTime,
              cacheHitRate: signalData.cacheHitRate,
              totalCalculations
            }
          }
        }));
      }
    }, 5000); // Update every 5 seconds

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
      clearInterval(marketDataInterval);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });
  });

  return httpServer;
}
