import { useState, useEffect } from 'react';
import { MarketData, TradingSignal, PerformanceMetrics } from '@/types/trading';
import { useWebSocket } from './useWebSocket';

export function useMarketData(symbol: string) {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  
  const { isConnected, lastMessage } = useWebSocket('/ws');

  useEffect(() => {
    // Fetch initial market data
    const fetchInitialData = async () => {
      try {
        const [marketResponse, signalsResponse] = await Promise.all([
          fetch(`/api/market-data/${symbol}?limit=100`),
          fetch(`/api/signals/${symbol}?limit=50`)
        ]);

        if (marketResponse.ok) {
          const marketDataResult = await marketResponse.json();
          setMarketData(marketDataResult);
          if (marketDataResult.length > 0) {
            const latest = marketDataResult[marketDataResult.length - 1];
            setCurrentPrice(latest.close);
          }
        }

        if (signalsResponse.ok) {
          const signalsResult = await signalsResponse.json();
          setSignals(signalsResult);
        }
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };

    fetchInitialData();
  }, [symbol]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'market_update' && lastMessage.data) {
      const { marketData: newMarketData, signal, performance: perfData } = lastMessage.data;

      if (newMarketData) {
        setMarketData(prev => {
          const updated = [...prev, newMarketData];
          // Keep only last 500 data points
          return updated.slice(-500);
        });

        // Update current price and calculate change
        const previousPrice = currentPrice;
        setCurrentPrice(newMarketData.close);
        setPriceChange(newMarketData.close - previousPrice);
      }

      if (signal) {
        const newSignal: TradingSignal = {
          id: Date.now(),
          symbol,
          timestamp: new Date(),
          type: signal.type,
          strength: signal.strength,
          price: currentPrice,
          indicators: signal.indicators,
          confirmed: signal.strength > 75
        };

        setSignals(prev => {
          const updated = [...prev, newSignal];
          return updated.slice(-100); // Keep only last 100 signals
        });
      }

      if (perfData) {
        const newPerformance: PerformanceMetrics = {
          id: Date.now(),
          timestamp: new Date(),
          calculationTime: perfData.calculationTime,
          totalCalculations: perfData.totalCalculations,
          cacheHitRate: perfData.cacheHitRate,
          memoryUsage: 12.4, // Default values for demo
          cpuUsage: 23,
          networkLoad: 5.2
        };

        setPerformance(newPerformance);
      }
    }
  }, [lastMessage, symbol, currentPrice]);

  return {
    marketData,
    signals,
    performance,
    currentPrice,
    priceChange,
    isConnected
  };
}
