export type AssetCategory = 'indices' | 'stocks' | 'crypto' | 'forex' | 'commodities' | 'bonds';

export type TechnicalRating = 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';

export interface MarketAsset {
  symbol: string;
  name: string;
  category: AssetCategory;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  high24h: number;
  low24h: number;
  volume: number;
  volumeFormatted: string;
  marketCap: number;
  marketCapFormatted: string;
  peRatio?: number;
  dividendYield?: number;
  sector?: string;
  technicalRating: TechnicalRating;
  analystRating?: 'Strong Buy' | 'Buy' | 'Hold' | 'Underperform' | 'Sell';
  sparklineData: number[]; // 24 hourly/daily points for mini chart
  description: string;
  country?: string;
  currency: string;
}

export interface CandleData {
  time: number; // timestamp in ms or formatted date
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type ChartType = 'candles' | 'line' | 'area' | 'heikinAshi';

export interface IndicatorConfig {
  showSMA20: boolean;
  showEMA50: boolean;
  showEMA200: boolean;
  showBollingerBands: boolean;
  showRSI: boolean;
  showMACD: boolean;
  showVolume: boolean;
  showVWAP: boolean;
  showSupertrend: boolean;
  showVolumeProfile: boolean;
}

export type DrawingTool = 'cursor' | 'trendline' | 'horizontal' | 'fibonacci' | 'position' | 'ruler' | 'eraser';

export interface DrawingPoint {
  index: number;
  price: number;
  timeLabel?: string;
}

export interface DrawingItem {
  id: string;
  type: 'trendline' | 'horizontal' | 'fibonacci' | 'position' | 'ruler';
  points: DrawingPoint[];
  color?: string;
  text?: string;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  note: string;
  createdAt: string;
  triggered?: boolean;
}

export type MultiChartLayout = '1x1' | '1x2' | '2x2';


export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPercent: number;
}

export interface PaperTradePosition {
  symbol: string;
  side: 'buy' | 'sell';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  openedAt: string;
}

export interface PaperTradeOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  shares: number;
  price: number;
  status: 'filled' | 'pending' | 'cancelled';
  executedAt: string;
  totalValue: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  category: 'Equities' | 'Crypto' | 'Macro' | 'Forex' | 'Commodities';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  relatedSymbols: string[];
  snippet: string;
  url?: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  currency: string;
  country: string;
  countryCode: string;
  title: string;
  importance: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface MarketBreadth {
  advancers: number;
  decliners: number;
  unchanged: number;
  totalVolume: string;
  fearAndGreedIndex: number;
  fearAndGreedLabel: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
}
