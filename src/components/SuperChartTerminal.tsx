import React, { useState, useMemo } from 'react';
import { MarketAsset, OrderBook } from '../types/market';
import { InteractiveChart } from './InteractiveChart';
import { generateOrderBook } from '../data/mockMarketData';
import { formatPrice, formatLargeNumber } from '../utils/technicalAnalysis';
import {
  ChevronRight,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ShieldAlert,
  BarChart,
  Star
} from 'lucide-react';

interface SuperChartTerminalProps {
  asset: MarketAsset;
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  onExecuteTrade: (order: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    shares: number;
    price: number;
  }) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  paperBalance: number;
}

export const SuperChartTerminal: React.FC<SuperChartTerminalProps> = ({
  asset,
  assets,
  onSelectSymbol,
  onExecuteTrade,
  isWatchlisted,
  onToggleWatchlist,
  paperBalance
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [shares, setShares] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(asset.price);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'trade' | 'orderbook' | 'details'>('trade');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Generate synthetic orderbook depth ladder for current price
  const orderBook: OrderBook = useMemo(() => {
    return generateOrderBook(asset.price);
  }, [asset.price, asset.symbol]);

  const effectivePrice = orderType === 'market' ? asset.price : limitPrice;
  const orderTotal = effectivePrice * shares;

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shares <= 0) return;

    if (side === 'buy' && orderTotal > paperBalance) {
      alert('Insufficient paper trading cash balance!');
      return;
    }

    onExecuteTrade({
      symbol: asset.symbol,
      side,
      type: orderType,
      shares,
      price: effectivePrice,
    });

    setOrderSuccessMsg(
      `Executed ${side.toUpperCase()} order for ${shares} shares of ${asset.symbol} @ ${formatPrice(effectivePrice)}`
    );
    setTimeout(() => setOrderSuccessMsg(null), 4000);
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-[1720px] mx-auto">
      {/* Top Asset Switcher Bar */}
      <div className="flex items-center justify-between bg-[#1e222d] border border-[#2a2e39] rounded-lg p-3">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onToggleWatchlist(asset.symbol)}
            className={`p-1.5 rounded transition-colors ${
              isWatchlisted ? 'text-amber-400 bg-amber-400/10' : 'text-[#787b86] hover:text-white bg-[#131722]'
            }`}
            title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Star className={`w-4 h-4 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tight">{asset.symbol}</span>
            <span className="text-sm text-[#787b86] font-medium hidden sm:inline">{asset.name}</span>
            <span className="text-xs bg-[#2a2e39] text-[#9db2ce] px-2 py-0.5 rounded font-mono">
              {asset.exchange} · {asset.category.toUpperCase()}
            </span>
          </div>

          {/* Quick symbol picker chips */}
          <div className="hidden md:flex items-center gap-1.5 pl-4 border-l border-[#2a2e39]">
            {['NVDA', 'AAPL', 'BTCUSD', 'ETHUSD', 'SPX', 'XAUUSD', 'EURUSD'].map((sym) => (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`px-2 py-1 text-xs font-mono font-semibold rounded transition-colors ${
                  asset.symbol === sym
                    ? 'bg-[#2962ff] text-white'
                    : 'text-[#787b86] hover:text-white bg-[#131722]'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {formatPrice(asset.price, asset.currency === '%' ? '%' : '$')}
            </div>
            <div
              className={`text-xs font-mono font-semibold tabular-nums flex items-center justify-end ${
                asset.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
              }`}
            >
              {asset.change >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)} ({asset.change >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid: Interactive Chart + Order/Depth Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Full SuperChart */}
        <div className={`transition-all duration-200 ${isPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-9'}`}>
          <InteractiveChart
            asset={asset}
            onOpenTrade={(actionSide) => {
              setSide(actionSide);
              setIsPanelCollapsed(false);
              setActiveTab('trade');
            }}
          />

          {/* Asset Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
            <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#787b86] block">24h High / Low</span>
              <span className="text-xs font-bold text-white font-mono tabular-nums">
                {formatPrice(asset.high24h)} / {formatPrice(asset.low24h)}
              </span>
            </div>
            <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#787b86] block">52W Range</span>
              <span className="text-xs font-bold text-white font-mono tabular-nums">
                {formatPrice(asset.low52w)} - {formatPrice(asset.high52w)}
              </span>
            </div>
            <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#787b86] block">Volume</span>
              <span className="text-xs font-bold text-white font-mono tabular-nums">
                {asset.volumeFormatted}
              </span>
            </div>
            <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#787b86] block">Market Cap</span>
              <span className="text-xs font-bold text-white font-mono tabular-nums">
                {asset.marketCapFormatted}
              </span>
            </div>
            <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#787b86] block">P/E Ratio</span>
              <span className="text-xs font-bold text-white font-mono tabular-nums">
                {asset.peRatio ? asset.peRatio.toFixed(1) : 'N/A'}
              </span>
            </div>
            <div className="bg-[#1e222d] border border-[#2a2e39] p-2.5 rounded-lg">
              <span className="text-[11px] text-[#787b86] block">Technical Rating</span>
              <span className={`text-xs font-bold font-mono ${
                asset.technicalRating.includes('Buy') ? 'text-[#089981]' : asset.technicalRating.includes('Sell') ? 'text-[#f23645]' : 'text-amber-400'
              }`}>
                {asset.technicalRating}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Collapsible Trading Ticket / Order Book / Asset Details */}
        <div className={`transition-all duration-200 ${isPanelCollapsed ? 'hidden' : 'lg:col-span-4 xl:col-span-3'}`}>
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg overflow-hidden flex flex-col">
            {/* Panel Tabs Header */}
            <div className="flex items-center justify-between border-b border-[#2a2e39] bg-[#171b26] p-1.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('trade')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    activeTab === 'trade' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  Paper Trade
                </button>
                <button
                  onClick={() => setActiveTab('orderbook')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    activeTab === 'orderbook' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  Order Book
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    activeTab === 'details' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  Profile
                </button>
              </div>

              <button
                onClick={() => setIsPanelCollapsed(true)}
                className="p-1 text-[#787b86] hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: Paper Trading Ticket */}
            {activeTab === 'trade' && (
              <div className="p-4 flex flex-col gap-4 text-xs font-sans">
                {orderSuccessMsg && (
                  <div className="flex items-center gap-2 p-2.5 bg-[#089981]/15 border border-[#089981]/40 text-[#089981] rounded-md text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{orderSuccessMsg}</span>
                  </div>
                )}

                {/* Buy / Sell Toggle Buttons */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
                  <button
                    onClick={() => setSide('buy')}
                    className={`py-2 text-xs font-bold rounded-md transition-all ${
                      side === 'buy'
                        ? 'bg-[#089981] text-white shadow-sm'
                        : 'text-[#787b86] hover:text-white'
                    }`}
                  >
                    BUY / LONG
                  </button>
                  <button
                    onClick={() => setSide('sell')}
                    className={`py-2 text-xs font-bold rounded-md transition-all ${
                      side === 'sell'
                        ? 'bg-[#f23645] text-white shadow-sm'
                        : 'text-[#787b86] hover:text-white'
                    }`}
                  >
                    SELL / SHORT
                  </button>
                </div>

                {/* Order Type (Market vs Limit) */}
                <div className="flex items-center gap-2">
                  <span className="text-[#787b86] font-medium w-20">Type</span>
                  <div className="flex-1 grid grid-cols-2 gap-1 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
                    <button
                      type="button"
                      onClick={() => setOrderType('market')}
                      className={`py-1 rounded text-xs font-medium ${
                        orderType === 'market' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('limit')}
                      className={`py-1 rounded text-xs font-medium ${
                        orderType === 'limit' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86]'
                      }`}
                    >
                      Limit
                    </button>
                  </div>
                </div>

                {/* Limit Price Input (if limit selected) */}
                {orderType === 'limit' && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#787b86] font-medium w-20">Limit Price</span>
                    <div className="flex-1 relative">
                      <span className="absolute left-2.5 top-2 text-[#787b86] font-mono">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(Number(e.target.value))}
                        className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 pl-6 py-1.5 text-white font-mono focus:border-[#2962ff] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Quantity / Units */}
                <div className="flex items-center gap-2">
                  <span className="text-[#787b86] font-medium w-20">Quantity</span>
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      value={shares}
                      onChange={(e) => setShares(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-white font-mono focus:border-[#2962ff] focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {[10, 50, 100].map((quickQty) => (
                        <button
                          key={quickQty}
                          type="button"
                          onClick={() => setShares(quickQty)}
                          className="px-2 py-1 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded text-[11px] text-[#787b86] hover:text-white"
                        >
                          +{quickQty}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Cost Summary Breakdown */}
                <div className="bg-[#131722] p-3 rounded-lg border border-[#2a2e39] space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-[#787b86]">
                    <span>Execution Price</span>
                    <span className="text-white tabular-nums">{formatPrice(effectivePrice)}</span>
                  </div>
                  <div className="flex justify-between text-[#787b86]">
                    <span>Order Value</span>
                    <span className="text-white tabular-nums">{formatPrice(orderTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#787b86] pt-1.5 border-t border-[#2a2e39]">
                    <span>Virtual Buying Power</span>
                    <span className="text-emerald-400 tabular-nums">{formatPrice(paperBalance)}</span>
                  </div>
                </div>

                {/* Submit Trade Button */}
                <button
                  onClick={handleOrderSubmit}
                  className={`w-full py-2.5 font-bold rounded-lg transition-all text-white shadow-md ${
                    side === 'buy' ? 'bg-[#089981] hover:bg-[#067a67]' : 'bg-[#f23645] hover:bg-[#d42735]'
                  }`}
                >
                  Place {side.toUpperCase()} Order · {formatPrice(orderTotal)}
                </button>

                <p className="text-[11px] text-center text-[#787b86]">
                  Simulated paper execution with zero real-money risk.
                </p>
              </div>
            )}

            {/* TAB 2: Level 2 Order Book Depth */}
            {activeTab === 'orderbook' && (
              <div className="p-3 font-mono text-xs space-y-2">
                <div className="grid grid-cols-3 text-[10px] text-[#787b86] uppercase font-bold pb-1 border-b border-[#2a2e39]">
                  <span>Price (USD)</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Asks (Sell orders - red) */}
                <div className="space-y-0.5">
                  {orderBook.asks.slice().reverse().map((ask, idx) => (
                    <div key={`ask-${idx}`} className="grid grid-cols-3 py-0.5 hover:bg-[#2a2e39]/50 relative text-[#f23645]">
                      <span className="font-semibold">{ask.price.toFixed(2)}</span>
                      <span className="text-right text-[#d1d4dc]">{ask.size}</span>
                      <span className="text-right text-[#787b86]">{ask.total}</span>
                    </div>
                  ))}
                </div>

                {/* Mid Spread Indicator */}
                <div className="py-1.5 px-2 bg-[#131722] rounded border border-[#2a2e39] flex items-center justify-between text-[11px]">
                  <span className="text-[#787b86]">Spread</span>
                  <span className="font-bold text-white">{orderBook.spread.toFixed(2)} ({orderBook.spreadPercent}%)</span>
                </div>

                {/* Bids (Buy orders - green) */}
                <div className="space-y-0.5">
                  {orderBook.bids.map((bid, idx) => (
                    <div key={`bid-${idx}`} className="grid grid-cols-3 py-0.5 hover:bg-[#2a2e39]/50 relative text-[#089981]">
                      <span className="font-semibold">{bid.price.toFixed(2)}</span>
                      <span className="text-right text-[#d1d4dc]">{bid.size}</span>
                      <span className="text-right text-[#787b86]">{bid.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Symbol Profile & About */}
            {activeTab === 'details' && (
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm mb-1">{asset.name} ({asset.symbol})</h4>
                  <p className="text-[#787b86] leading-relaxed">{asset.description}</p>
                </div>

                <div className="space-y-2 border-t border-[#2a2e39] pt-3 font-mono">
                  <div className="flex justify-between text-[#787b86]">
                    <span>Exchange</span>
                    <span className="text-white">{asset.exchange}</span>
                  </div>
                  <div className="flex justify-between text-[#787b86]">
                    <span>Sector</span>
                    <span className="text-white">{asset.sector || 'Financial'}</span>
                  </div>
                  <div className="flex justify-between text-[#787b86]">
                    <span>Country</span>
                    <span className="text-white">{asset.country || 'USA'}</span>
                  </div>
                  <div className="flex justify-between text-[#787b86]">
                    <span>Analyst Consensus</span>
                    <span className="text-[#089981] font-bold">{asset.analystRating || 'Buy'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
