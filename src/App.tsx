import React, { useState, useEffect, useCallback } from 'react';
import { INITIAL_MARKET_ASSETS } from './data/mockMarketData';
import { MarketAsset, PaperTradePosition, PaperTradeOrder, PriceAlert } from './types/market';
import { Header } from './components/Header';
import { TickerRibbon } from './components/TickerRibbon';
import { MarketsOverview } from './components/MarketsOverview';
import { SuperChartTerminal } from './components/SuperChartTerminal';
import { MarketHeatmap } from './components/MarketHeatmap';
import { MarketScreener } from './components/MarketScreener';
import { WatchlistAndPaperTrading } from './components/WatchlistAndPaperTrading';
import { NewsAndCalendar } from './components/NewsAndCalendar';
import { SymbolSearchModal } from './components/SymbolSearchModal';
import { Bell, X } from 'lucide-react';

const DEFAULT_WATCHLIST = ['NVDA', 'AAPL', 'BTCUSD', 'SPX', 'XAUUSD', 'ETHUSD'];
const INITIAL_PAPER_CASH = 100000;

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('NVDA');
  const [assets, setAssets] = useState<MarketAsset[]>(INITIAL_MARKET_ASSETS);
  const [recentTicks, setRecentTicks] = useState<Record<string, 'up' | 'down'>>({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTimezone, setActiveTimezone] = useState<string>('EST');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [triggeredAlertMessage, setTriggeredAlertMessage] = useState<string | null>(null);

  // Price Alerts state
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('tv_price_alerts');
      return saved ? JSON.parse(saved) : [
        {
          id: 'alt-1',
          symbol: 'NVDA',
          targetPrice: 142.50,
          condition: 'above',
          note: 'Breakout above 142.50 resistance',
          createdAt: '2026-11-12 08:30 EST',
          triggered: false
        },
        {
          id: 'alt-2',
          symbol: 'BTCUSD',
          targetPrice: 70000.00,
          condition: 'above',
          note: 'Psychological $70k milestone',
          createdAt: '2026-11-12 09:00 EST',
          triggered: false
        }
      ];
    } catch {
      return [];
    }
  });

  // Watchlist state with localStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tv_markets_watchlist');
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch {
      return DEFAULT_WATCHLIST;
    }
  });

  // Paper Trading Account with localStorage
  const [paperBalance, setPaperBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tv_paper_balance');
      return saved ? Number(saved) : INITIAL_PAPER_CASH;
    } catch {
      return INITIAL_PAPER_CASH;
    }
  });

  const [positions, setPositions] = useState<PaperTradePosition[]>(() => {
    try {
      const saved = localStorage.getItem('tv_paper_positions');
      return saved ? JSON.parse(saved) : [
        {
          symbol: 'NVDA',
          side: 'buy',
          shares: 50,
          avgPrice: 135.20,
          currentPrice: 141.54,
          costBasis: 6760.00,
          marketValue: 7077.00,
          unrealizedPnl: 317.00,
          unrealizedPnlPercent: 4.69,
          openedAt: '2026-11-10 09:35 EST'
        },
        {
          symbol: 'BTCUSD',
          side: 'buy',
          shares: 0.25,
          avgPrice: 65400.00,
          currentPrice: 68420.00,
          costBasis: 16350.00,
          marketValue: 17105.00,
          unrealizedPnl: 755.00,
          unrealizedPnlPercent: 4.62,
          openedAt: '2026-11-11 14:20 EST'
        }
      ];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<PaperTradeOrder[]>(() => {
    try {
      const saved = localStorage.getItem('tv_paper_orders');
      return saved ? JSON.parse(saved) : [
        {
          id: 'ord-101',
          symbol: 'NVDA',
          side: 'buy',
          type: 'market',
          shares: 50,
          price: 135.20,
          status: 'filled',
          executedAt: '2026-11-10 09:35:12 EST',
          totalValue: 6760.00
        },
        {
          id: 'ord-102',
          symbol: 'BTCUSD',
          side: 'buy',
          type: 'market',
          shares: 0.25,
          price: 65400.00,
          status: 'filled',
          executedAt: '2026-11-11 14:20:45 EST',
          totalValue: 16350.00
        }
      ];
    } catch {
      return [];
    }
  });

  // Persist Watchlist & Paper Trading
  useEffect(() => {
    localStorage.setItem('tv_markets_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('tv_paper_balance', paperBalance.toString());
  }, [paperBalance]);

  useEffect(() => {
    localStorage.setItem('tv_paper_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('tv_price_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Alert management handlers
  const handleAddAlert = useCallback((newAlertData: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    const alertItem: PriceAlert = {
      ...newAlertData,
      id: `alt-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      triggered: false
    };
    setAlerts(prev => [alertItem, ...prev]);
  }, []);

  const handleDeleteAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Handle Dark / Light Mode HTML class
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Keyboard shortcut for Cmd+K Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time market tick simulation: subtly updates quotes every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((prevAssets) => {
        // Pick 1-2 random assets to tick
        const randomIndex = Math.floor(Math.random() * prevAssets.length);
        const target = prevAssets[randomIndex];
        if (!target) return prevAssets;

        const isPositiveTick = Math.random() > 0.48;
        const tickDelta = (target.price * (Math.random() * 0.002)) * (isPositiveTick ? 1 : -1);
        const newPrice = Number((target.price + tickDelta).toFixed(target.price < 2 ? 4 : 2));
        const newChange = Number((target.change + tickDelta).toFixed(target.price < 2 ? 4 : 2));
        const newChangePercent = Number(((newChange / (target.price - target.change)) * 100).toFixed(2));

        const updatedSparkline = [...target.sparklineData.slice(1), newPrice];

        // Trigger visual flash
        setRecentTicks((prev) => ({
          ...prev,
          [target.symbol]: isPositiveTick ? 'up' : 'down'
        }));

        setTimeout(() => {
          setRecentTicks((prev) => {
            const next = { ...prev };
            delete next[target.symbol];
            return next;
          });
        }, 850);

        const newAssets = [...prevAssets];
        newAssets[randomIndex] = {
          ...target,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          sparklineData: updatedSparkline
        };

        // Check if any price alert was triggered
        setAlerts((prevAlerts) => {
          return prevAlerts.map(alt => {
            if (alt.symbol === target.symbol && !alt.triggered) {
              const triggered = (alt.condition === 'above' && newPrice >= alt.targetPrice) ||
                                (alt.condition === 'below' && newPrice <= alt.targetPrice);
              if (triggered) {
                setTriggeredAlertMessage(`PRICE ALERT: ${alt.symbol} reached $${newPrice} (${alt.note || alt.condition})`);
                setTimeout(() => setTriggeredAlertMessage(null), 5000);
                return { ...alt, triggered: true };
              }
            }
            return alt;
          });
        });

        return newAssets;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Update position current prices when asset prices change
  useEffect(() => {
    setPositions((prevPositions) => {
      let changed = false;
      const nextPositions = prevPositions.map((pos) => {
        const found = assets.find(a => a.symbol === pos.symbol);
        if (found && found.price !== pos.currentPrice) {
          changed = true;
          const currentPrice = found.price;
          const marketValue = currentPrice * pos.shares;
          const unrealizedPnl = pos.side === 'buy'
            ? marketValue - pos.costBasis
            : pos.costBasis - marketValue;
          const unrealizedPnlPercent = pos.costBasis > 0 ? (unrealizedPnl / pos.costBasis) * 100 : 0;

          return {
            ...pos,
            currentPrice,
            marketValue,
            unrealizedPnl,
            unrealizedPnlPercent
          };
        }
        return pos;
      });
      return changed ? nextPositions : prevPositions;
    });
  }, [assets]);

  // Watchlist toggle handler
  const handleToggleWatchlist = useCallback((symbol: string) => {
    setWatchlist((prev) => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      } else {
        return [...prev, symbol];
      }
    });
  }, []);

  // Symbol selector navigation handler
  const handleSelectSymbol = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveTab('chart');
  }, []);

  // Order Execution handler
  const handleExecuteTrade = useCallback((order: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    shares: number;
    price: number;
  }) => {
    const totalCost = order.shares * order.price;

    // Deduct / add cash
    setPaperBalance((prev) => {
      return order.side === 'buy' ? prev - totalCost : prev + totalCost;
    });

    // Record order in ledger
    const newOrder: PaperTradeOrder = {
      id: `ord-${Date.now().toString().slice(-5)}`,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      shares: order.shares,
      price: order.price,
      status: 'filled',
      executedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      totalValue: totalCost
    };
    setOrders((prev) => [...prev, newOrder]);

    // Update positions
    setPositions((prev) => {
      const existing = prev.find(p => p.symbol === order.symbol);
      if (!existing) {
        return [
          ...prev,
          {
            symbol: order.symbol,
            side: order.side,
            shares: order.shares,
            avgPrice: order.price,
            currentPrice: order.price,
            costBasis: totalCost,
            marketValue: totalCost,
            unrealizedPnl: 0,
            unrealizedPnlPercent: 0,
            openedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })
          }
        ];
      } else {
        if (existing.side === order.side) {
          // Increase position size
          const totalShares = existing.shares + order.shares;
          const totalCostBasis = existing.costBasis + totalCost;
          const avgPrice = totalCostBasis / totalShares;
          return prev.map(p => p.symbol === order.symbol ? {
            ...p,
            shares: totalShares,
            costBasis: totalCostBasis,
            avgPrice,
            marketValue: totalShares * p.currentPrice,
            unrealizedPnl: (totalShares * p.currentPrice) - totalCostBasis,
            unrealizedPnlPercent: ((totalShares * p.currentPrice - totalCostBasis) / totalCostBasis) * 100
          } : p);
        } else {
          // Close or reduce position
          if (existing.shares <= order.shares) {
            return prev.filter(p => p.symbol !== order.symbol);
          } else {
            const remainingShares = existing.shares - order.shares;
            const newCostBasis = remainingShares * existing.avgPrice;
            return prev.map(p => p.symbol === order.symbol ? {
              ...p,
              shares: remainingShares,
              costBasis: newCostBasis,
              marketValue: remainingShares * p.currentPrice,
              unrealizedPnl: (remainingShares * p.currentPrice) - newCostBasis,
              unrealizedPnlPercent: ((remainingShares * p.currentPrice - newCostBasis) / newCostBasis) * 100
            } : p);
          }
        }
      }
    });
  }, []);

  // Close position handler
  const handleClosePosition = useCallback((symbol: string) => {
    const pos = positions.find(p => p.symbol === symbol);
    if (!pos) return;

    // Credit back current market value
    setPaperBalance(prev => prev + pos.marketValue);
    setPositions(prev => prev.filter(p => p.symbol !== symbol));

    const newOrder: PaperTradeOrder = {
      id: `ord-cls-${Date.now().toString().slice(-4)}`,
      symbol: pos.symbol,
      side: pos.side === 'buy' ? 'sell' : 'buy',
      type: 'market',
      shares: pos.shares,
      price: pos.currentPrice,
      status: 'filled',
      executedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      totalValue: pos.marketValue
    };
    setOrders(prev => [...prev, newOrder]);
  }, [positions]);

  // Reset portfolio
  const handleResetPortfolio = useCallback(() => {
    setPaperBalance(INITIAL_PAPER_CASH);
    setPositions([]);
    setOrders([]);
  }, []);

  // Currently active asset for the SuperChart
  const currentAsset = assets.find(a => a.symbol === selectedSymbol) || assets[0];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      isDark ? 'bg-[#131722] text-[#d1d4dc]' : 'bg-[#f0f3fa] text-[#131722]'
    }`}>
      {/* 1. Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        onOpenSearch={() => setIsSearchOpen(true)}
        activeTimezone={activeTimezone}
        setActiveTimezone={setActiveTimezone}
        watchlistCount={watchlist.length}
      />

      {/* Pro Alert Trigger Toast Banner */}
      {triggeredAlertMessage && (
        <div className="bg-amber-500 text-black px-4 py-2 text-xs font-bold font-mono flex items-center justify-between shadow-lg sticky top-12 z-50 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 animate-bounce" />
            <span>{triggeredAlertMessage}</span>
          </div>
          <button
            onClick={() => setTriggeredAlertMessage(null)}
            className="p-1 hover:bg-black/10 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Streaming Real-Time Marquee Ticker Tape */}
      <TickerRibbon
        assets={assets}
        onSelectSymbol={handleSelectSymbol}
        recentTicks={recentTicks}
      />

      {/* 3. Main Workstation Body Viewport */}
      <main className="flex-1 w-full p-4 lg:p-6">
        {activeTab === 'overview' && (
          <MarketsOverview
            assets={assets}
            onSelectSymbol={handleSelectSymbol}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            recentTicks={recentTicks}
          />
        )}

        {activeTab === 'chart' && (
          <SuperChartTerminal
            asset={currentAsset}
            assets={assets}
            onSelectSymbol={setSelectedSymbol}
            onExecuteTrade={handleExecuteTrade}
            isWatchlisted={watchlist.includes(currentAsset.symbol)}
            onToggleWatchlist={handleToggleWatchlist}
            paperBalance={paperBalance}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onDeleteAlert={handleDeleteAlert}
          />
        )}

        {activeTab === 'heatmap' && (
          <MarketHeatmap
            assets={assets}
            onSelectSymbol={handleSelectSymbol}
          />
        )}

        {activeTab === 'screener' && (
          <MarketScreener
            assets={assets}
            onSelectSymbol={handleSelectSymbol}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        {activeTab === 'portfolio' && (
          <WatchlistAndPaperTrading
            assets={assets}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectSymbol={handleSelectSymbol}
            paperBalance={paperBalance}
            positions={positions}
            orders={orders}
            onClosePosition={handleClosePosition}
            onResetPortfolio={handleResetPortfolio}
          />
        )}

        {activeTab === 'news' && (
          <NewsAndCalendar
            onSelectSymbol={handleSelectSymbol}
          />
        )}
      </main>

      {/* 4. Global Search Modal */}
      <SymbolSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        assets={assets}
        onSelectSymbol={handleSelectSymbol}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
      />

      {/* 5. Minimal Editorial Footer */}
      <footer className="border-t border-[#2a2e39] bg-[#171b26] px-6 py-4 text-xs text-[#787b86] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">TradingView Markets</span>
          <span>·</span>
          <span>Global Financial Market Data & SuperCharts</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Real-time quotes with simulated WebSocket latency (12ms)</span>
          <span>·</span>
          <span>All rights reserved</span>
        </div>
      </footer>
    </div>
  );
}
