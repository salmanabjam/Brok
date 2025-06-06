import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertMarketDataSchema, insertTradingSignalSchema, insertIndicatorSettingsSchema } from "@shared/schema";
import { z } from "zod";

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

  const rsi = calculateRSI(closes, settings.rsiPeriod);
  const qqe = calculateQQE(rsi, settings.qqeSmoothing);
  const adx = calculateADX(highs, lows, closes, 14);

  let signalType: string | null = null;
  let strength = 0;

  // Signal generation logic based on BrainIXMagT documentation
  if (rsi < 30 && qqe < 30 && adx > settings.adxThreshold) {
    signalType = "BUY";
    strength = Math.min(95, 60 + (30 - rsi) + (settings.adxThreshold - adx) / 2);
  } else if (rsi > 70 && qqe > 70 && adx > settings.adxThreshold) {
    signalType = "SELL";
    strength = Math.min(95, 60 + (rsi - 70) + (settings.adxThreshold - adx) / 2);
  }

  const calculationTime = Date.now() - startTime;
  const cacheHitRate = totalCalculations > 0 ? (cacheHitCount / totalCalculations) * 100 : 0;

  // Store performance metrics
  storage.insertPerformanceMetrics({
    timestamp: new Date(),
    calculationTime,
    totalCalculations,
    cacheHitRate,
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    cpuUsage: process.cpuUsage().user / 1000, // percentage approximation
    networkLoad: Math.random() * 10, // simulated network load
  });

  return {
    signalType,
    strength,
    indicators: { rsi, qqe, adx },
    calculationTime,
    cacheHitRate
  };
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
        
        const marketData = {
          symbol: 'EURUSD',
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
