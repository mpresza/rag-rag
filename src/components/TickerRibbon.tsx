import React from 'react';
import { MarketAsset } from '../types/market';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice } from '../utils/technicalAnalysis';

interface TickerRibbonProps {
  assets: MarketAsset[];
  onSelectSymbol: (symbol: string) => void;
  recentTicks: Record<string, 'up' | 'down'>;
}

export const TickerRibbon: React.FC<TickerRibbonProps> = ({
  assets,
  onSelectSymbol,
  recentTicks
}) => {
  // Select key representative benchmarks
  const marqueeAssets = assets.filter(a => 
    ['SPX', 'NDX', 'BTCUSD', 'ETHUSD', 'XAUUSD', 'USOIL', 'EURUSD', 'US10Y', 'NVDA', 'AAPL'].includes(a.symbol)
  );

  return (
    <div className="w-full bg-[#171b26] border-b border-[#2a2e39] overflow-hidden select-none py-1.5 px-4 text-xs font-mono">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
        {marqueeAssets.map((asset) => {
          const isPositive = asset.change >= 0;
          const flash = recentTicks[asset.symbol];

          return (
            <button
              key={asset.symbol}
              onClick={() => onSelectSymbol(asset.symbol)}
              className={`flex items-center gap-2 px-2 py-0.5 rounded hover:bg-[#2a2e39]/60 transition-colors whitespace-nowrap shrink-0 group ${
                flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
              }`}
            >
              <span className="font-bold text-[#d1d4dc] group-hover:text-white transition-colors">
                {asset.symbol}
              </span>
              <span className="text-white font-semibold tabular-nums">
                {formatPrice(asset.price, asset.currency === '%' ? '%' : '$')}
              </span>
              <span
                className={`flex items-center text-[11px] font-medium tabular-nums ${
                  isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                {isPositive ? '+' : ''}{asset.changePercent.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
