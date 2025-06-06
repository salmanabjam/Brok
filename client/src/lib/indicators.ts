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
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function calculateQQE(rsi: number, smoothing: number = 5): number {
  // Simplified QQE calculation
  const qqe = rsi + (Math.sin(rsi * Math.PI / 180) * smoothing);
  return Math.max(0, Math.min(100, qqe));
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
