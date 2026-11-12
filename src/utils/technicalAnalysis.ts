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

export function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}
