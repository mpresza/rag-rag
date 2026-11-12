import React, { useState, useMemo } from 'react';
import { MarketAsset, AssetCategory, TechnicalRating } from '../types/market';
import { formatPrice } from '../utils/technicalAnalysis';
import {
  Filter,
  Download,
  RotateCcw,
  Star,
  ExternalLink,
  ArrowUpDown,
  Search
} from 'lucide-react';

interface MarketScreenerProps {
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
}

export const MarketScreener: React.FC<MarketScreenerProps> = ({
  assets,
  onSelectSymbol,
  watchlist,
  onToggleWatchlist
}) => {
  const [category, setCategory] = useState<AssetCategory | 'all'>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minChangePercent, setMinChangePercent] = useState<string>('');
  const [maxChangePercent, setMaxChangePercent] = useState<string>('');
  const [selectedRating, setSelectedRating] = useState<TechnicalRating | 'all'>('all');
  const [minMarketCap, setMinMarketCap] = useState<number>(0);
  const [search, setSearch] = useState<string>('');

  const [sortField, setSortField] = useState<keyof MarketAsset>('volume');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Screener Presets
  const applyPreset = (preset: string) => {
    resetFilters();
    if (preset === 'oversold') {
      setSelectedRating('all');
      setMaxChangePercent('-1.0');
    } else if (preset === 'megacaps') {
      setMinMarketCap(1e12); // $1T+
    } else if (preset === 'strongBuy') {
      setSelectedRating('Strong Buy');
    } else if (preset === 'gainers') {
      setMinChangePercent('2.0');
    }
  };

  const resetFilters = () => {
    setCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setMinChangePercent('');
    setMaxChangePercent('');
    setSelectedRating('all');
    setMinMarketCap(0);
    setSearch('');
  };

  // Filter Assets
  const screenedAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (category !== 'all' && asset.category !== category) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!asset.symbol.toLowerCase().includes(q) && !asset.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (minPrice !== '' && asset.price < Number(minPrice)) return false;
      if (maxPrice !== '' && asset.price > Number(maxPrice)) return false;
      if (minChangePercent !== '' && asset.changePercent < Number(minChangePercent)) return false;
      if (maxChangePercent !== '' && asset.changePercent > Number(maxChangePercent)) return false;
      if (selectedRating !== 'all' && asset.technicalRating !== selectedRating) return false;
      if (minMarketCap > 0 && asset.marketCap < minMarketCap) return false;
      return true;
    }).sort((a, b) => {
      const valA = a[sortField] ?? 0;
      const valB = b[sortField] ?? 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (Number(valA) - Number(valB)) : (Number(valB) - Number(valA));
    });
  }, [assets, category, search, minPrice, maxPrice, minChangePercent, maxChangePercent, selectedRating, minMarketCap, sortField, sortAsc]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Symbol', 'Name', 'Category', 'Price', 'Change%', 'Volume', 'MarketCap', 'Rating'];
    const rows = screenedAssets.map(a => [
      a.symbol,
      `"${a.name}"`,
      a.category,
      a.price,
      a.changePercent,
      a.volume,
      a.marketCap,
      a.technicalRating
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradingview_screener_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-4 max-w-[1720px] mx-auto font-sans">
      {/* Screener Filter Control Panel */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2e39] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#2962ff]" />
            <h2 className="text-sm font-bold text-white tracking-tight">Market Screener & Scanner</h2>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto no-scrollbar">
            <span className="text-[#787b86] text-[11px] mr-1">Presets:</span>
            <button
              onClick={() => applyPreset('strongBuy')}
              className="px-2.5 py-1 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded text-[#d1d4dc] hover:text-white"
            >
              Strong Buy
            </button>
            <button
              onClick={() => applyPreset('gainers')}
              className="px-2.5 py-1 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded text-[#d1d4dc] hover:text-white"
            >
              Surging (&gt;2%)
            </button>
            <button
              onClick={() => applyPreset('megacaps')}
              className="px-2.5 py-1 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded text-[#d1d4dc] hover:text-white"
            >
              Mega-Caps (&gt;$1T)
            </button>
            <button
              onClick={() => applyPreset('oversold')}
              className="px-2.5 py-1 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded text-[#d1d4dc] hover:text-white"
            >
              Dip Opportunities
            </button>
            <button
              onClick={resetFilters}
              className="p-1 text-[#787b86] hover:text-white transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {/* Asset Category */}
          <div>
            <label className="block text-[11px] text-[#787b86] mb-1 font-medium">Asset Class</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#2962ff]"
            >
              <option value="all">All Classes</option>
              <option value="stocks">Stocks</option>
              <option value="crypto">Crypto</option>
              <option value="forex">Forex</option>
              <option value="commodities">Commodities</option>
              <option value="bonds">Bonds</option>
              <option value="indices">Indices</option>
            </select>
          </div>

          {/* Technical Consensus */}
          <div>
            <label className="block text-[11px] text-[#787b86] mb-1 font-medium">Technical Rating</label>
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value as any)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#2962ff]"
            >
              <option value="all">Any Rating</option>
              <option value="Strong Buy">Strong Buy</option>
              <option value="Buy">Buy</option>
              <option value="Neutral">Neutral</option>
              <option value="Sell">Sell</option>
            </select>
          </div>

          {/* Min Market Cap */}
          <div>
            <label className="block text-[11px] text-[#787b86] mb-1 font-medium">Min Market Cap</label>
            <select
              value={minMarketCap}
              onChange={(e) => setMinMarketCap(Number(e.target.value))}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#2962ff]"
            >
              <option value={0}>Any Size</option>
              <option value={1e10}>&gt; $10 Billion</option>
              <option value={1e11}>&gt; $100 Billion</option>
              <option value={1e12}>&gt; $1 Trillion</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-[11px] text-[#787b86] mb-1 font-medium">Price (Min - Max)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 bg-[#131722] border border-[#2a2e39] rounded px-2 py-1.5 text-white focus:outline-none focus:border-[#2962ff]"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 bg-[#131722] border border-[#2a2e39] rounded px-2 py-1.5 text-white focus:outline-none focus:border-[#2962ff]"
              />
            </div>
          </div>

          {/* 24h Change Range */}
          <div>
            <label className="block text-[11px] text-[#787b86] mb-1 font-medium">24h Change % (Min - Max)</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Min %"
                value={minChangePercent}
                onChange={(e) => setMinChangePercent(e.target.value)}
                className="w-1/2 bg-[#131722] border border-[#2a2e39] rounded px-2 py-1.5 text-white focus:outline-none focus:border-[#2962ff]"
              />
              <input
                type="number"
                placeholder="Max %"
                value={maxChangePercent}
                onChange={(e) => setMaxChangePercent(e.target.value)}
                className="w-1/2 bg-[#131722] border border-[#2a2e39] rounded px-2 py-1.5 text-white focus:outline-none focus:border-[#2962ff]"
              />
            </div>
          </div>

          {/* Symbol Search */}
          <div>
            <label className="block text-[11px] text-[#787b86] mb-1 font-medium">Keyword / Symbol</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#787b86] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#131722] border border-[#2a2e39] rounded pl-8 pr-2.5 py-1.5 text-white focus:outline-none focus:border-[#2962ff]"
              />
            </div>
          </div>
        </div>

        {/* Results Counter & CSV Export */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2a2e39] text-xs">
          <span className="text-[#787b86] font-mono">
            Matches found: <strong className="text-white">{screenedAssets.length}</strong>
          </span>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded text-white text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#2962ff]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Screened Assets Table */}
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-[#171b26] border-b border-[#2a2e39] text-[#787b86] font-bold uppercase text-[10px] tracking-wider select-none">
                <th className="py-2.5 px-3 w-8 text-center">★</th>
                <th
                  onClick={() => { setSortField('symbol'); setSortAsc(!sortAsc); }}
                  className="py-2.5 px-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Symbol</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Company / Asset</th>
                <th
                  onClick={() => { setSortField('price'); setSortAsc(!sortAsc); }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => { setSortField('changePercent'); setSortAsc(!sortAsc); }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>24h Change</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => { setSortField('volume'); setSortAsc(!sortAsc); }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Volume</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => { setSortField('marketCap'); setSortAsc(!sortAsc); }}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Market Cap</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Technical Consensus</th>
                <th className="py-2.5 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2e39]/60 bg-[#131722]/50">
              {screenedAssets.map((asset) => {
                const isWatchlisted = watchlist.includes(asset.symbol);
                const isUp = asset.changePercent >= 0;

                return (
                  <tr key={asset.symbol} className="hover:bg-[#1e222d] transition-colors">
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onToggleWatchlist(asset.symbol)}
                        className={`p-1 rounded transition-colors ${
                          isWatchlisted ? 'text-amber-400' : 'text-[#787b86]/50 hover:text-amber-400'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white font-mono">
                      {asset.symbol}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="text-white font-medium">{asset.name}</div>
                      <div className="text-[10px] text-[#787b86]">{asset.sector || asset.category}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white tabular-nums">
                      {formatPrice(asset.price, asset.currency === '%' ? '%' : '$')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold">
                      <span className={isUp ? 'text-[#089981]' : 'text-[#f23645]'}>
                        {isUp ? '+' : ''}{asset.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#d1d4dc] tabular-nums">
                      {asset.volumeFormatted}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#d1d4dc] tabular-nums">
                      {asset.marketCapFormatted}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
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
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onSelectSymbol(asset.symbol)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#2962ff] hover:bg-[#1e53e5] rounded transition-colors inline-flex items-center gap-1"
                      >
                        <span>Trade</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
