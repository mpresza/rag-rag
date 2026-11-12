import React, { useState, useMemo } from 'react';
import { MarketAsset } from '../types/market';
import { formatPrice } from '../utils/technicalAnalysis';
import { Layers, ZoomIn, TrendingUp, TrendingDown } from 'lucide-react';

interface MarketHeatmapProps {
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
}

export const MarketHeatmap: React.FC<MarketHeatmapProps> = ({ assets, onSelectSymbol }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'stocks' | 'crypto'>('all');
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  // Filter assets that have marketCap > 0
  const relevantAssets = useMemo(() => {
    let list = assets.filter(a => a.marketCap > 0);
    if (selectedFilter === 'stocks') list = list.filter(a => a.category === 'stocks');
    if (selectedFilter === 'crypto') list = list.filter(a => a.category === 'crypto');
    return list;
  }, [assets, selectedFilter]);

  // Group by sector
  const sectors = useMemo(() => {
    const map = new Map<string, MarketAsset[]>();
    relevantAssets.forEach((a) => {
      const sec = a.sector || 'Other';
      if (!map.has(sec)) map.set(sec, []);
      map.get(sec)!.push(a);
    });
    return Array.from(map.entries());
  }, [relevantAssets]);

  // Helper for background color intensity based on % change
  const getTileBg = (changePercent: number) => {
    if (changePercent >= 3.0) return 'bg-[#089981] text-white';
    if (changePercent >= 1.5) return 'bg-[#067a67] text-white';
    if (changePercent > 0) return 'bg-[#065b4c] text-emerald-100';
    if (changePercent <= -3.0) return 'bg-[#f23645] text-white';
    if (changePercent <= -1.5) return 'bg-[#c92534] text-white';
    if (changePercent < 0) return 'bg-[#8c1d27] text-rose-100';
    return 'bg-[#2a2e39] text-[#787b86]';
  };

  const hoveredAsset = useMemo(() => {
    return assets.find(a => a.symbol === hoveredSymbol) || null;
  }, [assets, hoveredSymbol]);

  return (
    <div className="w-full space-y-4 max-w-[1720px] mx-auto font-sans">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1e222d] border border-[#2a2e39] p-3.5 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#2962ff]/10 text-[#2962ff] rounded-md">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Market Capitalization Heatmap</h2>
            <p className="text-xs text-[#787b86]">Visualizing market performance grouped by sectors and weighted by size</p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#131722] rounded-md border border-[#2a2e39] text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 font-semibold rounded ${
              selectedFilter === 'all' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
            }`}
          >
            All Markets
          </button>
          <button
            onClick={() => setSelectedFilter('stocks')}
            className={`px-3 py-1 font-semibold rounded ${
              selectedFilter === 'stocks' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
            }`}
          >
            Stocks (Equities)
          </button>
          <button
            onClick={() => setSelectedFilter('crypto')}
            className={`px-3 py-1 font-semibold rounded ${
              selectedFilter === 'crypto' ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
            }`}
          >
            Crypto Assets
          </button>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#787b86]">
          <span>-3%</span>
          <div className="flex h-3 w-32 rounded overflow-hidden">
            <span className="flex-1 bg-[#f23645]" />
            <span className="flex-1 bg-[#c92534]" />
            <span className="flex-1 bg-[#8c1d27]" />
            <span className="flex-1 bg-[#2a2e39]" />
            <span className="flex-1 bg-[#065b4c]" />
            <span className="flex-1 bg-[#067a67]" />
            <span className="flex-1 bg-[#089981]" />
          </div>
          <span>+3%</span>
        </div>
      </div>

      {/* Main Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sectors.map(([sectorName, sectorAssets]) => {
          return (
            <div
              key={sectorName}
              className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-3 flex flex-col"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#d1d4dc] border-b border-[#2a2e39] pb-2 mb-2">
                <span>{sectorName}</span>
                <span className="text-[11px] text-[#787b86] font-mono">
                  {sectorAssets.length} assets
                </span>
              </div>

              {/* Tiles inside Sector */}
              <div className="grid grid-cols-2 gap-2 flex-1 auto-rows-fr">
                {sectorAssets.map((asset) => {
                  const isUp = asset.changePercent >= 0;
                  const bgClass = getTileBg(asset.changePercent);

                  return (
                    <button
                      key={asset.symbol}
                      onClick={() => onSelectSymbol(asset.symbol)}
                      onMouseEnter={() => setHoveredSymbol(asset.symbol)}
                      onMouseLeave={() => setHoveredSymbol(null)}
                      className={`p-3 rounded-md transition-transform hover:scale-[1.02] flex flex-col justify-between text-left shadow-sm ${bgClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm tracking-tight">{asset.symbol}</span>
                        <span className="text-[11px] font-mono font-bold">
                          {isUp ? '+' : ''}{asset.changePercent.toFixed(2)}%
                        </span>
                      </div>
                      <div className="mt-2 text-[11px] truncate opacity-90">{asset.name}</div>
                      <div className="mt-1 flex items-center justify-between text-[11px] font-mono opacity-85">
                        <span>{formatPrice(asset.price)}</span>
                        <span>{asset.marketCapFormatted}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hovered Asset Quick Tooltip Inspection Bar */}
      {hoveredAsset && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#171b26]/95 border border-[#2962ff] shadow-2xl rounded-lg px-5 py-2.5 z-50 flex items-center gap-6 text-xs text-white backdrop-blur-md">
          <div>
            <strong className="text-sm font-black mr-1">{hoveredAsset.symbol}</strong>
            <span className="text-[#787b86]">{hoveredAsset.name}</span>
          </div>
          <div className="font-mono">
            Price: <strong>{formatPrice(hoveredAsset.price)}</strong>
          </div>
          <div className="font-mono">
            Change: <strong className={hoveredAsset.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'}>
              {hoveredAsset.change >= 0 ? '+' : ''}{hoveredAsset.changePercent.toFixed(2)}%
            </strong>
          </div>
          <div className="font-mono text-[#9db2ce]">
            Cap: {hoveredAsset.marketCapFormatted}
          </div>
          <button
            onClick={() => onSelectSymbol(hoveredAsset.symbol)}
            className="px-2.5 py-1 bg-[#2962ff] hover:bg-[#1e53e5] rounded text-white font-semibold transition-colors flex items-center gap-1"
          >
            <span>Open Chart</span>
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
