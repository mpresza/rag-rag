import React, { useState, useMemo } from 'react';
import { MarketAsset, OrderBook, PriceAlert, MultiChartLayout } from '../types/market';
import { InteractiveChart } from './InteractiveChart';
import { PriceAlertsModal } from './PriceAlertsModal';
import { generateOrderBook } from '../data/mockMarketData';
import { formatPrice } from '../utils/technicalAnalysis';
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Star,
  LayoutGrid,
  Columns,
  Square,
  Bell,
  Target,
  Shield,
  Percent
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
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (id: string) => void;
}

export const SuperChartTerminal: React.FC<SuperChartTerminalProps> = ({
  asset,
  assets,
  onSelectSymbol,
  onExecuteTrade,
  isWatchlisted,
  onToggleWatchlist,
  paperBalance,
  alerts,
  onAddAlert,
  onDeleteAlert
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [shares, setShares] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<number>(asset.price);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'trade' | 'dom' | 'details'>('trade');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Pro features: Multi-chart Layout & Secondary comparison asset
  const [chartLayout, setChartLayout] = useState<MultiChartLayout>('1x1');
  const [secondarySymbol, setSecondarySymbol] = useState<string>('SPX');
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  // Pro Order Execution features: TP / SL inputs
  const [enableTPSL, setEnableTPSL] = useState(false);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(Number((asset.price * 1.05).toFixed(2)));
  const [stopLossPrice, setStopLossPrice] = useState<number>(Number((asset.price * 0.97).toFixed(2)));

  // Generate synthetic orderbook depth ladder for current price
  const orderBook: OrderBook = useMemo(() => {
    return generateOrderBook(asset.price);
  }, [asset.price, asset.symbol]);

  const effectivePrice = orderType === 'market' ? asset.price : limitPrice;
  const orderTotal = effectivePrice * shares;

  // Secondary asset for multi-chart layout
  const secondaryAsset = useMemo(() => {
    return assets.find(a => a.symbol === secondarySymbol) || assets[1] || asset;
  }, [assets, secondarySymbol, asset]);

  // Calculated Risk / Reward
  const riskRewardRatio = useMemo(() => {
    if (!enableTPSL) return null;
    const potentialProfit = Math.abs(takeProfitPrice - effectivePrice);
    const potentialRisk = Math.abs(effectivePrice - stopLossPrice);
    if (potentialRisk <= 0) return 0;
    return Number((potentialProfit / potentialRisk).toFixed(2));
  }, [enableTPSL, takeProfitPrice, stopLossPrice, effectivePrice]);

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

  const handleDOMClickPrice = (price: number) => {
    setOrderType('limit');
    setLimitPrice(price);
    setActiveTab('trade');
  };

  return (
    <div className="w-full flex flex-col gap-4 max-w-[1720px] mx-auto font-sans">
      {/* Top Pro Asset Switcher & Multi-Chart Layout Bar */}
      <div className="flex flex-wrap items-center justify-between bg-[#1e222d] border border-[#2a2e39] rounded-lg p-3 gap-3">
        {/* Left: Star, Symbol, Name, Exchange */}
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
            <span className="text-xs bg-[#2a2e39] text-[#9db2ce] px-2 py-0.5 rounded font-mono font-medium">
              {asset.exchange} · {asset.category.toUpperCase()}
            </span>
          </div>

          {/* Quick symbol picker chips */}
          <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-[#2a2e39]">
            {['NVDA', 'AAPL', 'BTCUSD', 'ETHUSD', 'SPX', 'XAUUSD', 'EURUSD'].map((sym) => (
              <button
                key={sym}
                onClick={() => onSelectSymbol(sym)}
                className={`px-2 py-1 text-xs font-mono font-semibold rounded transition-colors ${
                  asset.symbol === sym
                    ? 'bg-[#2962ff] text-white shadow-xs'
                    : 'text-[#787b86] hover:text-white bg-[#131722]'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Center / Right: Multi-Chart Layout Switcher & Alert Bell */}
        <div className="flex items-center gap-4">
          {/* Multi-Chart Grid Switcher (1x1, 1x2 split) */}
          <div className="hidden sm:flex items-center gap-1 bg-[#131722] p-1 rounded-md border border-[#2a2e39]">
            <button
              onClick={() => setChartLayout('1x1')}
              className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
                chartLayout === '1x1' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'
              }`}
              title="Single Chart View"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-bold">1x1</span>
            </button>
            <button
              onClick={() => setChartLayout('1x2')}
              className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
                chartLayout === '1x2' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'
              }`}
              title="Dual Split Chart Comparison"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-bold">Split</span>
            </button>
          </div>

          {chartLayout === '1x2' && (
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-[#787b86]">Compare:</span>
              <select
                value={secondarySymbol}
                onChange={(e) => setSecondarySymbol(e.target.value)}
                className="bg-[#131722] border border-[#2a2e39] rounded px-2 py-1 text-white focus:outline-none"
              >
                {assets.filter(a => a.symbol !== asset.symbol).map(a => (
                  <option key={a.symbol} value={a.symbol}>{a.symbol}</option>
                ))}
              </select>
            </div>
          )}

          {/* Price Alert Button */}
          <button
            onClick={() => setIsAlertsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-md transition-colors"
            title="Set Price Alert"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Alert ({alerts.filter(a => a.symbol === asset.symbol).length})</span>
          </button>

          {/* Current Price Readout */}
          <div className="text-right">
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

      {/* Main Terminal Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Interactive SuperChart or Dual Split */}
        <div className={`transition-all duration-200 ${isPanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-9'}`}>
          {chartLayout === '1x1' ? (
            <InteractiveChart
              asset={asset}
              onOpenTrade={(actionSide) => {
                setSide(actionSide);
                setIsPanelCollapsed(false);
                setActiveTab('trade');
              }}
              onOpenAlerts={() => setIsAlertsModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <InteractiveChart
                asset={asset}
                onOpenTrade={(actionSide) => {
                  setSide(actionSide);
                  setIsPanelCollapsed(false);
                  setActiveTab('trade');
                }}
                onOpenAlerts={() => setIsAlertsModalOpen(true)}
              />
              <InteractiveChart
                asset={secondaryAsset}
                onOpenTrade={(actionSide) => {
                  onSelectSymbol(secondaryAsset.symbol);
                  setSide(actionSide);
                }}
                onOpenAlerts={() => setIsAlertsModalOpen(true)}
              />
            </div>
          )}

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4">
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

        {/* Right Column: Pro Trade Workstation & Depth of Market Ladder */}
        <div className={`transition-all duration-200 ${isPanelCollapsed ? 'hidden' : 'lg:col-span-4 xl:col-span-3'}`}>
          <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg overflow-hidden flex flex-col shadow-lg">
            {/* Panel Tabs Header */}
            <div className="flex items-center justify-between border-b border-[#2a2e39] bg-[#171b26] p-1.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('trade')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    activeTab === 'trade' ? 'bg-[#2a2e39] text-white shadow-xs' : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  Pro Order
                </button>
                <button
                  onClick={() => setActiveTab('dom')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    activeTab === 'dom' ? 'bg-[#2a2e39] text-white shadow-xs' : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  DOM Ladder
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    activeTab === 'details' ? 'bg-[#2a2e39] text-white shadow-xs' : 'text-[#787b86] hover:text-white'
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

            {/* TAB 1: Pro Order Execution Ticket */}
            {activeTab === 'trade' && (
              <div className="p-4 flex flex-col gap-3.5 text-xs font-sans">
                {orderSuccessMsg && (
                  <div className="flex items-center gap-2 p-2.5 bg-[#089981]/15 border border-[#089981]/40 text-[#089981] rounded-md text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{orderSuccessMsg}</span>
                  </div>
                )}

                {/* Buy / Sell Toggles */}
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

                {/* Order Type */}
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

                {/* Limit Price */}
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

                {/* Quantity */}
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

                {/* Pro Risk Management: Take Profit & Stop Loss */}
                <div className="border border-[#2a2e39] rounded-lg p-2.5 bg-[#131722] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#d1d4dc] flex items-center gap-1.5 text-[11px]">
                      <Target className="w-3.5 h-3.5 text-[#2962ff]" />
                      Bracket Orders (TP / SL)
                    </span>
                    <input
                      type="checkbox"
                      checked={enableTPSL}
                      onChange={(e) => setEnableTPSL(e.target.checked)}
                      className="accent-[#2962ff] rounded cursor-pointer"
                    />
                  </div>

                  {enableTPSL && (
                    <div className="space-y-2 pt-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#089981] font-semibold">Take Profit</span>
                        <input
                          type="number"
                          step="0.01"
                          value={takeProfitPrice}
                          onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
                          className="w-24 bg-[#1e222d] border border-[#2a2e39] rounded px-2 py-1 text-white text-right"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#f23645] font-semibold">Stop Loss</span>
                        <input
                          type="number"
                          step="0.01"
                          value={stopLossPrice}
                          onChange={(e) => setStopLossPrice(Number(e.target.value))}
                          className="w-24 bg-[#1e222d] border border-[#2a2e39] rounded px-2 py-1 text-white text-right"
                        />
                      </div>
                      {riskRewardRatio !== null && (
                        <div className="flex justify-between pt-1 border-t border-[#2a2e39] text-[#787b86]">
                          <span>Risk : Reward</span>
                          <span className="text-white font-bold">1 : {riskRewardRatio}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Cost Summary */}
                <div className="bg-[#131722] p-3 rounded-lg border border-[#2a2e39] space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-[#787b86]">
                    <span>Execution Price</span>
                    <span className="text-white tabular-nums">{formatPrice(effectivePrice)}</span>
                  </div>
                  <div className="flex justify-between text-[#787b86]">
                    <span>Total Value</span>
                    <span className="text-white tabular-nums">{formatPrice(orderTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#787b86] pt-1 border-t border-[#2a2e39]">
                    <span>Buying Power</span>
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
                  Execute {side.toUpperCase()} Order · {formatPrice(orderTotal)}
                </button>
              </div>
            )}

            {/* TAB 2: Institutional Depth of Market (DOM) Ladder */}
            {activeTab === 'dom' && (
              <div className="p-3 font-mono text-xs space-y-2">
                <div className="text-[10px] text-[#787b86] uppercase font-bold flex items-center justify-between pb-1 border-b border-[#2a2e39]">
                  <span>Bid Depth</span>
                  <span>Price (Click to Limit)</span>
                  <span className="text-right">Ask Depth</span>
                </div>

                {/* Asks (Sell orders) */}
                <div className="space-y-1">
                  {orderBook.asks.slice().reverse().map((ask, idx) => (
                    <div
                      key={`ask-${idx}`}
                      onClick={() => handleDOMClickPrice(ask.price)}
                      className="grid grid-cols-3 py-1 px-1.5 rounded cursor-pointer hover:bg-[#f23645]/10 text-xs border border-transparent hover:border-[#f23645]/40 transition-colors"
                    >
                      <span className="text-[#787b86]">-</span>
                      <span className="text-center font-bold text-[#f23645]">{ask.price.toFixed(2)}</span>
                      <span className="text-right text-[#d1d4dc]">{ask.size}</span>
                    </div>
                  ))}
                </div>

                {/* Mid Spread */}
                <div className="py-1.5 px-3 bg-[#131722] rounded border border-[#2a2e39] flex items-center justify-between text-[11px]">
                  <span className="text-[#787b86]">Spread</span>
                  <span className="font-bold text-white">{orderBook.spread.toFixed(2)} ({orderBook.spreadPercent}%)</span>
                </div>

                {/* Bids (Buy orders) */}
                <div className="space-y-1">
                  {orderBook.bids.map((bid, idx) => (
                    <div
                      key={`bid-${idx}`}
                      onClick={() => handleDOMClickPrice(bid.price)}
                      className="grid grid-cols-3 py-1 px-1.5 rounded cursor-pointer hover:bg-[#089981]/10 text-xs border border-transparent hover:border-[#089981]/40 transition-colors"
                    >
                      <span className="text-left text-[#d1d4dc]">{bid.size}</span>
                      <span className="text-center font-bold text-[#089981]">{bid.price.toFixed(2)}</span>
                      <span className="text-right text-[#787b86]">-</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: Symbol Profile */}
            {activeTab === 'details' && (
              <div className="p-4 space-y-4 text-xs font-sans">
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

      {/* Price Alerts Modal */}
      <PriceAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        asset={asset}
        alerts={alerts}
        onAddAlert={onAddAlert}
        onDeleteAlert={onDeleteAlert}
      />
    </div>
  );
};
