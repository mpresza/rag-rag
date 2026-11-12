import { CandleData } from '../types/market';

export function calculateSMA(candles: CandleData[], period: number = 20): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      result.push(Number((sum / period).toFixed(2)));
    }
  }
  return result;
}

export function calculateEMA(candles: CandleData[], period: number = 50): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);

  let prevEMA: number | null = null;
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      prevEMA = sum / period;
      result.push(Number(prevEMA.toFixed(2)));
    } else {
      const currentClose = candles[i].close;
      const prevVal = prevEMA !== null ? prevEMA : currentClose;
      const emaVal: number = currentClose * k + prevVal * (1 - k);
      prevEMA = emaVal;
      result.push(Number(emaVal.toFixed(2)));
    }
  }
  return result;
}

export interface BollingerBandsResult {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
}

export function calculateBollingerBands(candles: CandleData[], period: number = 20, multiplier: number = 2): BollingerBandsResult {
  const middle = calculateSMA(candles, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    const sma = middle[i];
    if (sma === null) {
      upper.push(null);
      lower.push(null);
    } else {
      let sumSquareDiff = 0;
      for (let j = 0; j < period; j++) {
        const diff = candles[i - j].close - sma;
        sumSquareDiff += diff * diff;
      }
      const stdDev = Math.sqrt(sumSquareDiff / period);
      upper.push(Number((sma + multiplier * stdDev).toFixed(2)));
      lower.push(Number((sma - multiplier * stdDev).toFixed(2)));
    }
  }

  return { upper, middle, lower };
}

export function calculateRSI(candles: CandleData[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (candles.length <= period) {
    return candles.map(() => null);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // First values are null
  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  result.push(Number(rsi.toFixed(1)));

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    result.push(Number(rsi.toFixed(1)));
  }

  return result;
}

export interface MACDResult {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
}

export function calculateMACD(candles: CandleData[]): MACDResult {
  const ema12 = calculateEMA(candles, 12);
  const ema26 = calculateEMA(candles, 26);
  
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (ema12[i] !== null && ema26[i] !== null) {
      macdLine.push(Number(((ema12[i] as number) - (ema26[i] as number)).toFixed(2)));
    } else {
      macdLine.push(null);
    }
  }

  // Calculate 9-period EMA of macdLine for signal line
  const signalLine: (number | null)[] = [];
  const validMacdValues: { index: number; val: number }[] = [];
  macdLine.forEach((val, idx) => {
    if (val !== null) validMacdValues.push({ index: idx, val });
  });

  const k = 2 / (9 + 1);
  let prevSignal: number | null = null;
  const signalMap = new Map<number, number>();

  for (let i = 0; i < validMacdValues.length; i++) {
    if (i < 8) {
      // not enough
    } else if (i === 8) {
      let sum = 0;
      for (let j = 0; j < 9; j++) sum += validMacdValues[i - j].val;
      prevSignal = sum / 9;
      signalMap.set(validMacdValues[i].index, prevSignal);
    } else {
      const currentVal = validMacdValues[i].val;
      const prevSigVal = prevSignal !== null ? prevSignal : currentVal;
      const sigVal: number = currentVal * k + prevSigVal * (1 - k);
      prevSignal = sigVal;
      signalMap.set(validMacdValues[i].index, sigVal);
    }
  }

  const histogram: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    const sig = signalMap.get(i) ?? null;
    signalLine.push(sig !== null ? Number(sig.toFixed(2)) : null);
    if (macdLine[i] !== null && sig !== null) {
      histogram.push(Number(((macdLine[i] as number) - sig).toFixed(2)));
    } else {
      histogram.push(null);
    }
  }

  return { macdLine, signalLine, histogram };
}

export function toHeikinAshi(candles: CandleData[]): CandleData[] {
  if (candles.length === 0) return [];
  const haCandles: CandleData[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    let haOpen = c.open;
    if (i > 0) {
      haOpen = (haCandles[i - 1].open + haCandles[i - 1].close) / 2;
    }
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    haCandles.push({
      time: c.time,
      timeLabel: c.timeLabel,
      open: Number(haOpen.toFixed(2)),
      high: Number(haHigh.toFixed(2)),
      low: Number(haLow.toFixed(2)),
      close: Number(haClose.toFixed(2)),
      volume: c.volume
    });
  }

  return haCandles;
}

export function formatPrice(price: number, currency: string = '$'): string {
  if (currency === '%') return `${price.toFixed(2)}%`;
  if (price < 0.01) return `${currency}${price.toFixed(4)}`;
  if (price < 2) return `${currency}${price.toFixed(4)}`;
  return `${currency}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateVWAP(candles: CandleData[]): (number | null)[] {
  let cumVolume = 0;
  let cumTypicalVolume = 0;
  const result: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumVolume += c.volume;
    cumTypicalVolume += typicalPrice * c.volume;
    const vwap = cumVolume > 0 ? cumTypicalVolume / cumVolume : typicalPrice;
    result.push(Number(vwap.toFixed(2)));
  }

  return result;
}

export interface SupertrendResult {
  trend: ('bullish' | 'bearish')[];
  supertrendLine: (number | null)[];
}

export function calculateSupertrend(candles: CandleData[], period: number = 10, multiplier: number = 3): SupertrendResult {
  const trend: ('bullish' | 'bearish')[] = [];
  const supertrendLine: (number | null)[] = [];

  if (candles.length < period) {
    return {
      trend: candles.map(() => 'bullish'),
      supertrendLine: candles.map(() => null)
    };
  }

  // Calculate True Range
  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  // ATR Simple Moving Average
  const atr: number[] = [];
  let sumTR = 0;
  for (let i = 0; i < tr.length; i++) {
    sumTR += tr[i];
    if (i >= period) {
      sumTR -= tr[i - period];
      atr.push(sumTR / period);
    } else {
      atr.push(sumTR / (i + 1));
    }
  }

  let currentTrend: 'bullish' | 'bearish' = 'bullish';
  let prevUpper = candles[0].close + atr[0] * multiplier;
  let prevLower = candles[0].close - atr[0] * multiplier;

  for (let i = 0; i < candles.length; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    const basicUpper = hl2 + multiplier * atr[i];
    const basicLower = hl2 - multiplier * atr[i];

    let upper = basicUpper;
    let lower = basicLower;

    if (i > 0) {
      if (candles[i - 1].close < prevUpper) {
        upper = Math.min(basicUpper, prevUpper);
      }
      if (candles[i - 1].close > prevLower) {
        lower = Math.max(basicLower, prevLower);
      }

      if (candles[i].close > prevUpper) {
        currentTrend = 'bullish';
      } else if (candles[i].close < prevLower) {
        currentTrend = 'bearish';
      }
    }

    prevUpper = upper;
    prevLower = lower;

    trend.push(currentTrend);
    supertrendLine.push(Number((currentTrend === 'bullish' ? lower : upper).toFixed(2)));
  }

  return { trend, supertrendLine };
}

export interface VolumeProfileBin {
  priceLevel: number;
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  isPOC: boolean; // Point of Control
}

export function calculateVolumeProfile(candles: CandleData[], binCount: number = 24): { bins: VolumeProfileBin[]; pocPrice: number } {
  if (candles.length === 0) return { bins: [], pocPrice: 0 };

  let minP = Infinity;
  let maxP = -Infinity;
  candles.forEach(c => {
    if (c.low < minP) minP = c.low;
    if (c.high > maxP) maxP = c.high;
  });

  const step = (maxP - minP) / binCount || 1;
  const bins: VolumeProfileBin[] = [];

  for (let b = 0; b < binCount; b++) {
    bins.push({
      priceLevel: minP + (b + 0.5) * step,
      buyVolume: 0,
      sellVolume: 0,
      totalVolume: 0,
      isPOC: false
    });
  }

  candles.forEach(c => {
    const binIdx = Math.min(binCount - 1, Math.max(0, Math.floor((c.close - minP) / step)));
    const isBull = c.close >= c.open;
    const halfVol = c.volume / 2;
    bins[binIdx].buyVolume += isBull ? halfVol * 1.5 : halfVol * 0.5;
    bins[binIdx].sellVolume += isBull ? halfVol * 0.5 : halfVol * 1.5;
    bins[binIdx].totalVolume += c.volume;
  });

  let maxVol = 0;
  let pocPrice = minP;
  bins.forEach(b => {
    if (b.totalVolume > maxVol) {
      maxVol = b.totalVolume;
      pocPrice = b.priceLevel;
    }
  });

  bins.forEach(b => {
    if (Math.abs(b.priceLevel - pocPrice) < step / 2) {
      b.isPOC = true;
    }
  });

  return { bins, pocPrice };
}

export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}
