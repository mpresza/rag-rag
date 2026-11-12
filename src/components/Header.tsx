import React from 'react';
import { Search, Moon, Sun, Clock, TrendingUp } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  onOpenSearch: () => void;
  activeTimezone: string;
  setActiveTimezone: (tz: string) => void;
  watchlistCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  onOpenSearch,
  activeTimezone,
  setActiveTimezone,
  watchlistCount
}) => {
  const navItems = [
    { id: 'overview', label: 'Markets Overview' },
    { id: 'chart', label: 'SuperChart' },
    { id: 'heatmap', label: 'Heatmap' },
    { id: 'screener', label: 'Screener' },
    { id: 'portfolio', label: `Paper Trading (${watchlistCount})` },
    { id: 'news', label: 'News & Calendar' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2a2e39] bg-[#131722]/95 backdrop-blur-md px-4 lg:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-8 max-w-[1720px] mx-auto">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-[#2962ff] flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm group-hover:bg-[#1e53e5] transition-colors">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-extrabold tracking-tight text-white whitespace-nowrap">
                  Trading<span className="text-[#2962ff]">View</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black font-mono tracking-wider uppercase bg-[#2962ff] text-white">
                  PRO+
                </span>
              </div>
              <span className="text-[10px] tracking-widest text-[#787b86] uppercase font-semibold">Institutional Terminal</span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single-Line, clean whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs lg:text-sm font-semibold rounded-md transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'text-white bg-[#2a2e39] shadow-sm'
                    : 'text-[#9db2ce] hover:text-white hover:bg-[#1e222d]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Search, Timezone, Theme, Quick Trade) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#787b86] bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-md transition-colors whitespace-nowrap"
            title="Search symbols (Cmd+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#9db2ce]" />
            <span className="hidden sm:inline text-[#d1d4dc]">Search symbol...</span>
            <kbd className="hidden sm:inline text-[10px] bg-[#131722] text-[#787b86] px-1.5 py-0.5 rounded border border-[#2a2e39] font-mono">⌘K</kbd>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#9db2ce] bg-[#1e222d] border border-[#2a2e39] rounded-md font-mono">
            <Clock className="w-3.5 h-3.5 text-[#787b86]" />
            <select
              value={activeTimezone}
              onChange={(e) => setActiveTimezone(e.target.value)}
              className="bg-transparent text-[#d1d4dc] text-xs focus:outline-none cursor-pointer"
            >
              <option value="EST" className="bg-[#1e222d] text-white">UTC-5 EST</option>
              <option value="UTC" className="bg-[#1e222d] text-white">UTC 00:00</option>
              <option value="CET" className="bg-[#1e222d] text-white">UTC+1 CET</option>
              <option value="JST" className="bg-[#1e222d] text-white">UTC+9 JST</option>
            </select>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 text-[#9db2ce] hover:text-white bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded-md transition-colors"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2962ff] hover:bg-[#1e53e5] rounded-md transition-all shadow-sm whitespace-nowrap shrink-0"
          >
            Launch SuperChart
          </button>
        </div>
      </div>

      {/* Mobile nav scrollbar */}
      <div className="flex md:hidden overflow-x-auto gap-2 pt-2 pb-1 border-t border-[#2a2e39] mt-2 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap shrink-0 ${
              activeTab === item.id ? 'bg-[#2962ff] text-white' : 'text-[#787b86] bg-[#1e222d]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
