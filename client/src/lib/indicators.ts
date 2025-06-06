export function calculateRSI(prices: number[], period: number = 14): number {
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
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateSmoothedRSI(prices: number[], period: number = 14, smoothing: number = 5): number {
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

export function calculateQQE(rsiValues: number[], atrValues: number[], fastFactor: number = 4.238, smoothing: number = 5): number {
  if (rsiValues.length < smoothing || atrValues.length < smoothing) return 50;
  
  // Calculate smoothed RSI
  const smoothedRSI = calculateSmoothedRSI(rsiValues, 14, smoothing);
  
  // Get latest ATR
  const atr = atrValues[atrValues.length - 1] || 0.001;
  
  // Calculate QQE using ATR-based delta
  const qqeDelta = atr * fastFactor;
  const qqeValue = smoothedRSI + (Math.sin(smoothedRSI * Math.PI / 180) * qqeDelta);
  
  return Math.max(0, Math.min(100, qqeValue));
}

export function calculateBrainIXMagTSignal(
  prices: number[], 
  highs: number[], 
  lows: number[], 
  volumes: number[], 
  settings: any
): {
  rsi: number;
  smoothedRSI: number;
  qqe: number;
  adx: number;
  atr: number;
  signalType: 'BUY' | 'SELL' | null;
  strength: number;
  isRangeMarket: boolean;
  orderBlocks: Array<{ level: number; strength: number; type: 'support' | 'resistance' }>;
  fairValueGaps: Array<{ high: number; low: number; strength: number }>;
} {
  const rsi = calculateRSI(prices, settings.rsiPeriod || 14);
  const smoothedRSI = calculateSmoothedRSI(prices, settings.rsiPeriod || 14, settings.sf || 5);
  const atrValues = calculateATRArray(highs, lows, prices, settings.atrPeriod || 14);
  const qqe = calculateQQE(prices, atrValues, settings.qqeFastFactor || 4.238, settings.sf || 5);
  const adx = calculateADX(highs, lows, prices, settings.dmiLength || 14);
  const atr = atrValues[atrValues.length - 1] || 0;
  
  // Range market detection
  const isRangeMarket = detectRangeMarket(prices, settings.atrPeriod || 14, settings.rangeThreshold || 0.5);
  
  // Order blocks and Fair Value Gaps
  const orderBlocks = findOrderBlocks(highs, lows, volumes, settings.obLookback || 20);
  const fairValueGaps = findFairValueGaps(highs, lows, settings.fvgGapFactor || 0.0010);
  
  // Signal generation logic
  let signalType: 'BUY' | 'SELL' | null = null;
  let strength = 0;
  
  // Enhanced signal detection based on BrainIXMagT logic
  if (!isRangeMarket || !settings.disableSignalsInRange) {
    // Volume filter
    const volumeOk = !settings.enableVolumeFilter || 
      (volumes.length > 0 && volumes[volumes.length - 1] > 
       (volumes.slice(-10).reduce((a, b) => a + b, 0) / 10) * (settings.volumeThreshold || 1.5));
    
    // Trend filter
    const trendOk = !settings.enableTrendFilter || true; // Simplified for now
    
    if (volumeOk && trendOk) {
      // Buy signal conditions
      if (rsi < (settings.triggerLow || 30) && 
          smoothedRSI < (settings.triggerLow || 30) && 
          qqe < (settings.triggerLow || 30) && 
          adx > (settings.adxThreshold || 25)) {
        signalType = 'BUY';
        strength = Math.min(95, 60 + ((settings.triggerLow || 30) - rsi) * 2 + (adx - (settings.adxThreshold || 25)));
      }
      // Sell signal conditions
      else if (rsi > (settings.triggerHigh || 70) && 
               smoothedRSI > (settings.triggerHigh || 70) && 
               qqe > (settings.triggerHigh || 70) && 
               adx > (settings.adxThreshold || 25)) {
        signalType = 'SELL';
        strength = Math.min(95, 60 + (rsi - (settings.triggerHigh || 70)) * 2 + (adx - (settings.adxThreshold || 25)));
      }
    }
  }
  
  return {
    rsi,
    smoothedRSI,
    qqe,
    adx,
    atr,
    signalType,
    strength,
    isRangeMarket,
    orderBlocks,
    fairValueGaps
  };
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

export function calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number {
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

export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
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

export function detectRangeMarket(prices: number[], atrPeriod: number = 14, threshold: number = 0.001): boolean {
  if (prices.length < atrPeriod * 2) return false;

  const highs = prices;
  const lows = prices;
  const closes = prices;

  const atr = calculateATR(highs, lows, closes, atrPeriod);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  return (atr / avgPrice) < threshold;
}

export function findOrderBlocks(highs: number[], lows: number[], volumes: number[], lookback: number = 20): Array<{ level: number; strength: number; type: 'support' | 'resistance' }> {
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

export function findFairValueGaps(highs: number[], lows: number[], minGapSize: number = 0.0010): Array<{ high: number; low: number; strength: number }> {
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
