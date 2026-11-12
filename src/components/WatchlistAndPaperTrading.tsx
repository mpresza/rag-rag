import React from 'react';
import { MarketAsset, PaperTradePosition, PaperTradeOrder } from '../types/market';
import { formatPrice } from '../utils/technicalAnalysis';
import {
  Wallet,
  Star,
  Trash2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Receipt,
  CheckCircle2
} from 'lucide-react';

interface WatchlistAndPaperTradingProps {
  assets: MarketAsset[];
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  onSelectSymbol: (symbol: string) => void;
  paperBalance: number;
  positions: PaperTradePosition[];
  orders: PaperTradeOrder[];
  onClosePosition: (symbol: string) => void;
  onResetPortfolio: () => void;
}

export const WatchlistAndPaperTrading: React.FC<WatchlistAndPaperTradingProps> = ({
  assets,
  watchlist,
  onToggleWatchlist,
  onSelectSymbol,
  paperBalance,
  positions,
  orders,
  onClosePosition,
  onResetPortfolio
}) => {
  // Watchlisted assets objects
  const watchlistedAssets = assets.filter(a => watchlist.includes(a.symbol));

  // Compute total portfolio value
  const totalPositionsValue = positions.reduce((acc, p) => acc + p.marketValue, 0);
  const totalPortfolioValue = paperBalance + totalPositionsValue;
  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const totalCostBasis = positions.reduce((acc, p) => acc + p.costBasis, 0);
  const totalPnlPercent = totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0;

  return (
    <div className="w-full space-y-6 max-w-[1720px] mx-auto font-sans">
      {/* 1. Paper Trading Portfolio Overview Cards */}
      <section className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#2a2e39] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2962ff]/10 text-[#2962ff] rounded-lg">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Paper Trading Simulation Workstation</h2>
              <p className="text-xs text-[#787b86]">Real-time risk-free virtual trading with live market pricing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetPortfolio}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] text-[#787b86] hover:text-white rounded text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to $100,000</span>
            </button>
          </div>
        </div>

        {/* Metric KPI Strips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="bg-[#131722] p-3.5 rounded-lg border border-[#2a2e39]">
            <span className="text-[11px] text-[#787b86] block">Total Account Value</span>
            <span className="text-xl font-black text-white tabular-nums">
              {formatPrice(totalPortfolioValue)}
            </span>
          </div>

          <div className="bg-[#131722] p-3.5 rounded-lg border border-[#2a2e39]">
            <span className="text-[11px] text-[#787b86] block">Available Cash</span>
            <span className="text-xl font-black text-emerald-400 tabular-nums">
              {formatPrice(paperBalance)}
            </span>
          </div>

          <div className="bg-[#131722] p-3.5 rounded-lg border border-[#2a2e39]">
            <span className="text-[11px] text-[#787b86] block">Open Positions Value</span>
            <span className="text-xl font-black text-[#d1d4dc] tabular-nums">
              {formatPrice(totalPositionsValue)}
            </span>
          </div>

          <div className="bg-[#131722] p-3.5 rounded-lg border border-[#2a2e39]">
            <span className="text-[11px] text-[#787b86] block">Total Unrealized P&L</span>
            <span
              className={`text-xl font-black tabular-nums flex items-center ${
                totalUnrealizedPnl >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
              }`}
            >
              {totalUnrealizedPnl >= 0 ? '+' : ''}{formatPrice(totalUnrealizedPnl)} ({totalPnlPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </section>

      {/* 2. Open Positions Table */}
      <section className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">Active Holdings & Open Positions</h3>
            <span className="text-xs text-[#787b86]">({positions.length} active)</span>
          </div>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center bg-[#131722] rounded-lg border border-[#2a2e39] text-[#787b86] text-xs space-y-2">
            <p className="font-semibold text-white">No active trading positions.</p>
            <p>Go to SuperChart or Markets Overview to execute simulated Buy or Sell orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-[#2a2e39]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#171b26] border-b border-[#2a2e39] text-[#787b86] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3 text-right">Shares</th>
                  <th className="py-2.5 px-3 text-right">Avg Entry</th>
                  <th className="py-2.5 px-3 text-right">Current Price</th>
                  <th className="py-2.5 px-3 text-right">Cost Basis</th>
                  <th className="py-2.5 px-3 text-right">Market Value</th>
                  <th className="py-2.5 px-3 text-right">Unrealized P&L</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e39]/60 bg-[#131722]/50">
                {positions.map((pos) => {
                  const isProfit = pos.unrealizedPnl >= 0;
                  return (
                    <tr key={pos.symbol} className="hover:bg-[#1e222d] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">
                        <button
                          onClick={() => onSelectSymbol(pos.symbol)}
                          className="hover:text-[#2962ff] transition-colors"
                        >
                          {pos.symbol}
                        </button>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            pos.side === 'buy' ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
                          }`}
                        >
                          {pos.side === 'buy' ? 'LONG' : 'SHORT'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-white tabular-nums">{pos.shares}</td>
                      <td className="py-2.5 px-3 text-right text-[#d1d4dc] tabular-nums">{formatPrice(pos.avgPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums">{formatPrice(pos.currentPrice)}</td>
                      <td className="py-2.5 px-3 text-right text-[#787b86] tabular-nums">{formatPrice(pos.costBasis)}</td>
                      <td className="py-2.5 px-3 text-right text-white tabular-nums">{formatPrice(pos.marketValue)}</td>
                      <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isProfit ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {isProfit ? '+' : ''}{formatPrice(pos.unrealizedPnl)} ({isProfit ? '+' : ''}{pos.unrealizedPnlPercent.toFixed(2)}%)
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onClosePosition(pos.symbol)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-600 rounded transition-colors"
                        >
                          Close Position
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3. Custom Saved Watchlist & Order History side-by-side */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Watchlist Table */}
        <div className="lg:col-span-7 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Pinned Watchlist</h3>
              <span className="text-xs text-[#787b86]">({watchlistedAssets.length} symbols)</span>
            </div>
          </div>

          {watchlistedAssets.length === 0 ? (
            <div className="p-6 text-center bg-[#131722] rounded-lg border border-[#2a2e39] text-[#787b86] text-xs">
              Your watchlist is currently empty. Star symbols in the table to pin them here for instant tracking.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-[#2a2e39]">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-[#171b26] border-b border-[#2a2e39] text-[#787b86] text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">24h Change</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2e39]/60 bg-[#131722]/50">
                  {watchlistedAssets.map((asset) => {
                    const isUp = asset.changePercent >= 0;
                    return (
                      <tr key={asset.symbol} className="hover:bg-[#1e222d] transition-colors">
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => onSelectSymbol(asset.symbol)}
                            className="font-bold text-white hover:text-[#2962ff] transition-colors"
                          >
                            {asset.symbol}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums">
                          {formatPrice(asset.price, asset.currency === '%' ? '%' : '$')}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                          {isUp ? '+' : ''}{asset.changePercent.toFixed(2)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#787b86] tabular-nums">
                          {asset.volumeFormatted}
                        </td>
                        <td className="py-2.5 px-3 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectSymbol(asset.symbol)}
                            className="p-1 text-[#2962ff] hover:text-white hover:bg-[#2962ff] rounded transition-colors"
                            title="Open SuperChart"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onToggleWatchlist(asset.symbol)}
                            className="p-1 text-[#787b86] hover:text-rose-400 rounded transition-colors"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Executed Orders Ledger */}
        <div className="lg:col-span-5 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#2962ff]" />
              <h3 className="text-sm font-bold text-white tracking-tight">Order Execution Ledger</h3>
              <span className="text-xs text-[#787b86]">({orders.length} executed)</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {orders.length === 0 ? (
              <div className="p-6 text-center bg-[#131722] rounded-lg border border-[#2a2e39] text-[#787b86] text-xs">
                No orders placed yet.
              </div>
            ) : (
              orders.slice().reverse().map((order) => {
                const isBuy = order.side === 'buy';
                return (
                  <div
                    key={order.id}
                    className="p-2.5 bg-[#131722] border border-[#2a2e39] rounded flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-bold uppercase text-[10px] px-1 py-0.2 rounded ${
                            isBuy ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#f23645]/20 text-[#f23645]'
                          }`}
                        >
                          {order.side}
                        </span>
                        <strong className="text-white">{order.symbol}</strong>
                        <span className="text-[#787b86]">· {order.shares} shs @ {formatPrice(order.price)}</span>
                      </div>
                      <div className="text-[10px] text-[#787b86] mt-0.5">{order.executedAt}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white tabular-nums">{formatPrice(order.totalValue)}</div>
                      <div className="text-[10px] text-[#089981] flex items-center justify-end gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Filled</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
