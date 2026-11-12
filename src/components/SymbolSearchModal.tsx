import React, { useState, useEffect, useRef } from 'react';
import { MarketAsset, AssetCategory } from '../types/market';
import { formatPrice } from '../utils/technicalAnalysis';
import { Search, X, TrendingUp, TrendingDown, Star } from 'lucide-react';

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
}

export const SymbolSearchModal: React.FC<SymbolSearchModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSelectSymbol,
  watchlist,
  onToggleWatchlist
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AssetCategory | 'all'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global keydown listener for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          // parent should open
        }
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredAssets = assets.filter((asset) => {
    if (category !== 'all' && asset.category !== category) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      asset.symbol.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      (asset.sector && asset.sector.toLowerCase().includes(q))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2e39] bg-[#171b26]">
          <Search className="w-5 h-5 text-[#2962ff] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search any ticker symbol, stock, crypto, forex pair..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-white placeholder-[#787b86] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-[#787b86] hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#131722] border-b border-[#2a2e39] overflow-x-auto no-scrollbar text-xs">
          {[
            { id: 'all', label: 'All Symbols' },
            { id: 'stocks', label: 'Stocks' },
            { id: 'crypto', label: 'Crypto' },
            { id: 'forex', label: 'Forex' },
            { id: 'commodities', label: 'Commodities' },
            { id: 'bonds', label: 'Bonds' },
            { id: 'indices', label: 'Indices' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id as any);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                category === cat.id
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-white bg-[#1e222d]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#2a2e39]/60">
          {filteredAssets.length === 0 ? (
            <div className="p-8 text-center text-[#787b86] text-xs">
              No symbols matched your query "{query}".
            </div>
          ) : (
            filteredAssets.map((asset, idx) => {
              const isSelected = idx === selectedIndex;
              const isWatchlisted = watchlist.includes(asset.symbol);
              const isUp = asset.changePercent >= 0;

              return (
                <div
                  key={asset.symbol}
                  onClick={() => {
                    onSelectSymbol(asset.symbol);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#2a2e39]' : 'hover:bg-[#131722]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(asset.symbol);
                      }}
                      className={`p-1 rounded ${
                        isWatchlisted ? 'text-amber-400' : 'text-[#787b86] hover:text-amber-400'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-xs">{asset.symbol}</span>
                        <span className="text-[10px] text-[#787b86] font-mono px-1 py-0.2 bg-[#131722] rounded">
                          {asset.category.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#787b86] truncate max-w-[280px]">
                        {asset.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-white tabular-nums">
                      {formatPrice(asset.price, asset.currency === '%' ? '%' : '$')}
                    </div>
                    <div
                      className={`text-[11px] font-semibold tabular-nums flex items-center justify-end ${
                        isUp ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {isUp ? '+' : ''}{asset.changePercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2 bg-[#171b26] border-t border-[#2a2e39] flex items-center justify-between text-[11px] text-[#787b86]">
          <span>Select with click · Esc to exit</span>
          <span className="font-mono">TradingView Symbol Directory</span>
        </div>
      </div>
    </div>
  );
};
