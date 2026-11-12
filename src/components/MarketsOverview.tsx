import React, { useState, useMemo } from 'react';
import { MarketAsset, AssetCategory } from '../types/market';
import { GLOBAL_EXCHANGES } from '../data/mockMarketData';
import { formatPrice } from '../utils/technicalAnalysis';
import {
  TrendingUp,
  TrendingDown,
  Star,
  Globe,
  SlidersHorizontal,
  ArrowUpDown,
  ExternalLink,
  Flame,
  Zap,
  BarChart3
} from 'lucide-react';

interface MarketsOverviewProps {
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
  recentTicks: Record<string, 'up' | 'down'>;
}

type SubFilter = 'mostActive' | 'gainers' | 'losers' | 'highVolume' | '52wHigh';

export const MarketsOverview: React.FC<MarketsOverviewProps> = ({
  assets,
  onSelectSymbol,
  watchlist,
  onToggleWatchlist,
  recentTicks
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [subFilter, setSubFilter] = useState<SubFilter>('mostActive');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof MarketAsset>('volume');
  const [sortAsc, setSortAsc] = useState(false);

  // Key Global Indices for the hero strip
  const heroIndices = useMemo(() => {
    return assets.filter(a => ['SPX', 'NDX', 'DJI', 'DAX', 'NI225', 'BTCUSD'].includes(a.symbol));
  }, [assets]);

  // Market Breadth computation
  const marketBreadth = useMemo(() => {
    const advancers = assets.filter(a => a.change > 0).length;
    const decliners = assets.filter(a => a.change < 0).length;
    const unchanged = assets.filter(a => a.change === 0).length;
    const total = assets.length || 1;
    const advPercent = Math.round((advancers / total) * 100);

    return {
      advancers,
      decliners,
      unchanged,
      advPercent,
      fearAndGreedIndex: 68,
      fearAndGreedLabel: 'Greed' as const,
    };
  }, [assets]);

  // Filter & Sort Assets
  const filteredAssets = useMemo(() => {
    let list = assets;

    // Filter by Category
    if (selectedCategory !== 'all') {
      list = list.filter(a => a.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a =>
        a.symbol.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.sector && a.sector.toLowerCase().includes(q))
      );
    }

    // Apply Sub-Filters
    if (subFilter === 'gainers') {
      list = [...list].sort((a, b) => b.changePercent - a.changePercent);
    } else if (subFilter === 'losers') {
      list = [...list].sort((a, b) => a.changePercent - b.changePercent);
    } else if (subFilter === 'highVolume') {
      list = [...list].sort((a, b) => b.volume - a.volume);
    } else if (subFilter === '52wHigh') {
      list = [...list].sort((a, b) => (b.price / b.high52w) - (a.price / a.high52w));
    } else {
      // most active: volume * price weight
      list = [...list].sort((a, b) => (b.volume * b.price) - (a.volume * a.price));
    }

    // Sort by column header if clicked
    if (sortField) {
      list = [...list].sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return sortAsc ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
      });
    }

    return list;
  }, [assets, selectedCategory, subFilter, searchQuery, sortField, sortAsc]);

  const handleSort = (field: keyof MarketAsset) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="w-full space-y-6 max-w-[1720px] mx-auto">
      {/* 1. Global Major Benchmarks Hero Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-tight">World Markets Pulse</h2>
            <span className="text-xs text-[#787b86]">Real-time index quotes & 24h trajectory</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {heroIndices.map((idxAsset) => {
            const isUp = idxAsset.change >= 0;
            const flash = recentTicks[idxAsset.symbol];

            // Render mini sparkline SVG path
            const sparkPoints = idxAsset.sparklineData;
            const minS = Math.min(...sparkPoints);
            const maxS = Math.max(...sparkPoints);
            const rangeS = maxS - minS || 1;
            const svgWidth = 140;
            const svgHeight = 36;
            const pointsStr = sparkPoints
              .map((p, i) => {
                const x = (i / (sparkPoints.length - 1)) * svgWidth;
                const y = svgHeight - ((p - minS) / rangeS) * (svgHeight - 6) - 3;
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <button
                key={idxAsset.symbol}
                onClick={() => onSelectSymbol(idxAsset.symbol)}
                className={`p-3.5 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-lg text-left transition-all group flex flex-col justify-between ${
                  flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-extrabold text-white group-hover:text-[#2962ff] transition-colors">
                      {idxAsset.symbol}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-semibold flex items-center tabular-nums ${
                        isUp ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {isUp ? '+' : ''}{idxAsset.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-[#787b86] truncate mb-2">{idxAsset.name}</div>
                  <div className="text-lg font-bold font-mono text-white tabular-nums">
                    {formatPrice(idxAsset.price, idxAsset.currency === '%' ? '%' : '$')}
                  </div>
                </div>

                {/* Mini SVG Sparkline */}
                <div className="mt-3 pt-2 border-t border-[#2a2e39]/60">
                  <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
                    <polyline
                      fill="none"
                      stroke={isUp ? '#089981' : '#f23645'}
                      strokeWidth="1.8"
                      points={pointsStr}
                    />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. World Trading Sessions Status Strip & Market Sentiment Gauge */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* World Exchanges Trading Clock */}
        <div className="lg:col-span-8 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-[#2962ff]" />
              <span>Global Exchange Trading Sessions</span>
            </div>
            <span className="text-[11px] text-[#787b86]">Standard market trading hours</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {GLOBAL_EXCHANGES.map((ex) => {
              // Calculate exchange local time
              const now = new Date();
              const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
              let localHour = (utcHours + ex.utcOffset + 24) % 24;
              const isOpen = localHour >= ex.openHour && localHour <= ex.closeHour;

              return (
                <div key={ex.code} className="bg-[#131722] p-2 rounded border border-[#2a2e39]/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-[11px]">{ex.city}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                        isOpen ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#787b86]/20 text-[#787b86]'
                      }`}
                    >
                      {isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#787b86] font-mono">
                    {Math.floor(localHour).toString().padStart(2, '0')}:
                    {now.getMinutes().toString().padStart(2, '0')} {ex.timezone}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Breadth & Sentiment Indicator */}
        <div className="lg:col-span-4 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#2962ff]" />
              Market Breadth & Sentiment
            </span>
            <span className="text-xs font-bold text-[#089981] font-mono">
              {marketBreadth.fearAndGreedLabel} ({marketBreadth.fearAndGreedIndex})
            </span>
          </div>

          {/* Advancers vs Decliners Bar */}
          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-[11px] text-[#787b86]">
              <span className="text-[#089981] font-bold">Advancers: {marketBreadth.advancers}</span>
              <span className="text-[#f23645] font-bold">Decliners: {marketBreadth.decliners}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#f23645] overflow-hidden flex">
              <div
                className="h-full bg-[#089981] transition-all duration-500"
                style={{ width: `${marketBreadth.advPercent}%` }}
              />
            </div>
          </div>

          {/* Fear and Greed Meter mini strip */}
          <div className="mt-2 pt-2 border-t border-[#2a2e39] flex items-center justify-between text-[11px] text-[#787b86]">
            <span>Extreme Fear</span>
            <span className="w-24 h-1.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 inline-block" />
            <span>Extreme Greed</span>
          </div>
        </div>
      </section>

      {/* 3. Comprehensive Category Explorer & Financial Data Table */}
      <section className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4 space-y-4">
        {/* Navigation & Filtering Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-[#2a2e39] pb-3">
          {/* Category Tabs (Segmented control) */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 bg-[#131722] rounded-lg border border-[#2a2e39]">
            {[
              { id: 'all', label: 'All Markets' },
              { id: 'stocks', label: 'Stocks' },
              { id: 'crypto', label: 'Crypto' },
              { id: 'forex', label: 'Forex' },
              { id: 'commodities', label: 'Commodities' },
              { id: 'bonds', label: 'Bonds' },
              { id: 'indices', label: 'Indices' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#2962ff] text-white shadow-sm'
                    : 'text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sub-Filter Presets (Most Active, Top Gainers, Top Losers, 52W High) */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar">
            {[
              { id: 'mostActive', label: 'Most Active', icon: Flame },
              { id: 'gainers', label: 'Top Gainers', icon: TrendingUp },
              { id: 'losers', label: 'Top Losers', icon: TrendingDown },
              { id: 'highVolume', label: 'High Volume', icon: Zap },
              { id: '52wHigh', label: 'Near 52W High', icon: SlidersHorizontal },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setSubFilter(f.id as SubFilter)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors whitespace-nowrap ${
                    subFilter === f.id
                      ? 'bg-[#2a2e39] text-white border-[#2962ff]'
                      : 'bg-[#131722] text-[#787b86] border-[#2a2e39] hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3 text-[#2962ff]" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Search input */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="Filter by symbol, company name, or sector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded-md px-3 py-1.5 text-xs text-white placeholder-[#787b86] focus:border-[#2962ff] focus:outline-none"
            />
          </div>
          <span className="text-xs text-[#787b86] font-mono">
            Showing <strong className="text-white">{filteredAssets.length}</strong> assets
          </span>
        </div>

        {/* High Density Table */}
        <div className="overflow-x-auto rounded-lg border border-[#2a2e39]">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-[#171b26] border-b border-[#2a2e39] text-[#787b86] font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="py-2.5 px-3 w-8 text-center">★</th>
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Symbol & Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('changePercent')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center hidden md:table-cell">52W High / Low Range</th>
                <th className="py-2.5 px-3 text-center hidden lg:table-cell w-32">24h Sparkline</th>
                <th
                  onClick={() => handleSort('volume')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors hidden sm:table-cell"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('marketCap')}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Market Cap</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center hidden xl:table-cell">Technical Rating</th>
                <th className="py-2.5 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]/60 bg-[#131722]/50">
              {filteredAssets.map((asset) => {
                const isWatchlisted = watchlist.includes(asset.symbol);
                const isUp = asset.change >= 0;
                const flash = recentTicks[asset.symbol];

                // 52W range calculation
                const rangeTotal = asset.high52w - asset.low52w || 1;
                const currentPosPercent = Math.max(0, Math.min(100, ((asset.price - asset.low52w) / rangeTotal) * 100));

                // Sparkline
                const sparkPoints = asset.sparklineData;
                const minS = Math.min(...sparkPoints);
                const maxS = Math.max(...sparkPoints);
                const rangeS = maxS - minS || 1;
                const svgWidth = 100;
                const svgHeight = 22;
                const pointsStr = sparkPoints
                  .map((p, i) => {
                    const x = (i / (sparkPoints.length - 1)) * svgWidth;
                    const y = svgHeight - ((p - minS) / rangeS) * (svgHeight - 4) - 2;
                    return `${x},${y}`;
                  })
                  .join(' ');

                return (
                  <tr
                    key={asset.symbol}
                    className={`hover:bg-[#1e222d] transition-colors group ${
                      flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                    }`}
                  >
                    {/* Star / Watchlist */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onToggleWatchlist(asset.symbol)}
                        className={`p-1 rounded transition-colors ${
                          isWatchlisted ? 'text-amber-400' : 'text-[#787b86]/50 hover:text-amber-400'
                        }`}
                        title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>

                    {/* Symbol & Name */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onSelectSymbol(asset.symbol)}
                        className="text-left group-hover:text-[#2962ff] transition-colors"
                      >
                        <div className="font-bold text-white text-xs tracking-tight flex items-center gap-1.5">
                          <span>{asset.symbol}</span>
                          <span className="text-[10px] text-[#787b86] font-mono px-1 py-0.2 bg-[#2a2e39] rounded">
                            {asset.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#787b86] truncate max-w-[180px]">
                          {asset.name}
                        </div>
                      </button>
                    </td>

                    {/* Price */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums text-xs">
                      {formatPrice(asset.price, asset.currency === '%' ? '%' : '$')}
                    </td>

                    {/* 24h Change */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-semibold">
                      <span className={`flex items-center justify-end ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                        {isUp ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-[#787b86] block">
                        {isUp ? '+' : ''}{asset.change.toFixed(2)}
                      </span>
                    </td>

                    {/* 52W Range Bar */}
                    <td className="py-2.5 px-3 hidden md:table-cell">
                      <div className="w-36 mx-auto space-y-1 text-[9px] font-mono text-[#787b86]">
                        <div className="flex justify-between">
                          <span>{formatPrice(asset.low52w)}</span>
                          <span>{formatPrice(asset.high52w)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#2a2e39] rounded-full relative">
                          <div
                            className="absolute top-0 bottom-0 w-2 h-2 -mt-0.25 bg-[#2962ff] rounded-full border border-white"
                            style={{ left: `calc(${currentPosPercent}% - 4px)` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 24h Sparkline */}
                    <td className="py-2.5 px-3 text-center hidden lg:table-cell">
                      <div className="w-24 mx-auto">
                        <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                          <polyline
                            fill="none"
                            stroke={isUp ? '#089981' : '#f23645'}
                            strokeWidth="1.5"
                            points={pointsStr}
                          />
                        </svg>
                      </div>
                    </td>

                    {/* Volume */}
                    <td className="py-2.5 px-3 text-right font-mono text-[#d1d4dc] tabular-nums hidden sm:table-cell text-xs">
                      {asset.volumeFormatted}
                    </td>

                    {/* Market Cap */}
                    <td className="py-2.5 px-3 text-right font-mono text-[#d1d4dc] tabular-nums hidden lg:table-cell text-xs">
                      {asset.marketCapFormatted}
                    </td>

                    {/* Technical Rating */}
                    <td className="py-2.5 px-3 text-center hidden xl:table-cell font-mono text-[11px] font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          asset.technicalRating.includes('Buy')
                            ? 'bg-[#089981]/15 text-[#089981]'
                            : asset.technicalRating.includes('Sell')
                            ? 'bg-[#f23645]/15 text-[#f23645]'
                            : 'bg-amber-400/15 text-amber-400'
                        }`}
                      >
                        {asset.technicalRating}
                      </span>
                    </td>

                    {/* Action: Open in SuperChart */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectSymbol(asset.symbol)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#2962ff] hover:bg-[#1e53e5] rounded transition-colors inline-flex items-center gap-1"
                      >
                        <span>Chart</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
