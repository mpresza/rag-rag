import React, { useState } from 'react';
import { NewsItem, EconomicEvent } from '../types/market';
import { MOCK_NEWS, MOCK_ECONOMIC_EVENTS } from '../data/mockMarketData';
import {
  Newspaper,
  Calendar,
  ExternalLink,
  Flame,
  AlertCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface NewsAndCalendarProps {
  onSelectSymbol: (symbol: string) => void;
}

export const NewsAndCalendar: React.FC<NewsAndCalendarProps> = ({ onSelectSymbol }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newsList] = useState<NewsItem[]>(MOCK_NEWS);
  const [eventsList] = useState<EconomicEvent[]>(MOCK_ECONOMIC_EVENTS);

  const filteredNews = selectedCategory === 'All'
    ? newsList
    : newsList.filter(n => n.category === selectedCategory);

  return (
    <div className="w-full space-y-6 max-w-[1720px] mx-auto font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Breaking Financial News Stream */}
        <section className="lg:col-span-7 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a2e39] pb-3">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#2962ff]" />
              <h2 className="text-sm font-bold text-white tracking-tight">Market News & Analysis Wire</h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-[#131722] rounded-md border border-[#2a2e39] text-xs">
              {['All', 'Equities', 'Crypto', 'Macro', 'Commodities'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedCategory === cat ? 'bg-[#2962ff] text-white' : 'text-[#787b86] hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* News Cards List */}
          <div className="space-y-3">
            {filteredNews.map((news) => {
              const isBull = news.sentiment === 'bullish';
              const isBear = news.sentiment === 'bearish';

              return (
                <article
                  key={news.id}
                  className="p-3.5 bg-[#131722] hover:bg-[#171b26] border border-[#2a2e39] rounded-lg transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-[#787b86] mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#9db2ce]">{news.source}</span>
                      <span>·</span>
                      <span>{news.timeAgo}</span>
                    </div>

                    <span
                      className={`font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 rounded flex items-center gap-1 ${
                        isBull
                          ? 'bg-[#089981]/15 text-[#089981]'
                          : isBear
                          ? 'bg-[#f23645]/15 text-[#f23645]'
                          : 'bg-[#787b86]/15 text-[#787b86]'
                      }`}
                    >
                      {isBull && <TrendingUp className="w-3 h-3" />}
                      {isBear && <TrendingDown className="w-3 h-3" />}
                      {news.sentiment}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-[#2962ff] transition-colors leading-snug mb-1.5">
                    {news.title}
                  </h3>

                  <p className="text-xs text-[#787b86] leading-relaxed mb-3">
                    {news.snippet}
                  </p>

                  {/* Related Symbols Ticker Chips */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#2a2e39]/60">
                    <span className="text-[10px] text-[#787b86] font-mono">Related:</span>
                    {news.relatedSymbols.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => onSelectSymbol(sym)}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold text-[#d1d4dc] bg-[#2a2e39] hover:bg-[#2962ff] hover:text-white rounded transition-colors"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Right Column: High-Impact Macro Economic Calendar */}
        <section className="lg:col-span-5 bg-[#1e222d] border border-[#2a2e39] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2a2e39] pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2962ff]" />
              <h2 className="text-sm font-bold text-white tracking-tight">Economic Calendar</h2>
            </div>
            <span className="text-xs text-[#787b86]">Key Macro Releases</span>
          </div>

          <div className="overflow-x-auto rounded border border-[#2a2e39]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#171b26] border-b border-[#2a2e39] text-[#787b86] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Cur</th>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3 text-right">Actual</th>
                  <th className="py-2.5 px-3 text-right">Fcst</th>
                  <th className="py-2.5 px-3 text-right">Prev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2e39]/60 bg-[#131722]/50">
                {eventsList.map((evt) => {
                  const isHighImpact = evt.importance === 'high';
                  return (
                    <tr key={evt.id} className="hover:bg-[#1e222d] transition-colors">
                      <td className="py-2.5 px-3 text-[#d1d4dc] whitespace-nowrap">
                        {evt.time}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        <span className="px-1 py-0.2 bg-[#2a2e39] rounded text-[10px]">
                          {evt.currency}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-1.5">
                          {isHighImpact && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" title="High Impact Event" />
                          )}
                          <span className="text-white font-medium text-xs leading-tight">
                            {evt.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400 tabular-nums">
                        {evt.actual || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#787b86] tabular-nums">
                        {evt.forecast || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#787b86] tabular-nums">
                        {evt.previous || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#131722] rounded-lg border border-[#2a2e39] text-[11px] text-[#787b86] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Red markers indicate high volatility impact on equity index futures and bond yields.</span>
          </div>
        </section>
      </div>
    </div>
  );
};
