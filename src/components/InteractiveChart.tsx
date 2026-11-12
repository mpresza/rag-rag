import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MarketAsset, CandleData, Timeframe, ChartType, IndicatorConfig, DrawingTool, DrawingItem } from '../types/market';
import { generateCandles } from '../data/mockMarketData';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
  calculateSupertrend,
  calculateVolumeProfile,
  toHeikinAshi,
  formatPrice
} from '../utils/technicalAnalysis';
import { DrawingToolbar } from './DrawingToolbar';
import { BarReplayControls } from './BarReplayControls';
import {
  TrendingUp,
  BarChart2,
  LineChart as LineChartIcon,
  Layers,
  Activity,
  Maximize2,
  Minimize2,
  Bell,
  Camera,
  PlaySquare,
  Check
} from 'lucide-react';

interface InteractiveChartProps {
  asset: MarketAsset;
  onOpenTrade?: (side: 'buy' | 'sell') => void;
  onOpenAlerts?: () => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  asset,
  onOpenTrade,
  onOpenAlerts
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Indicators State
  const [indicators, setIndicators] = useState<IndicatorConfig>({
    showSMA20: true,
    showEMA50: false,
    showEMA200: false,
    showBollingerBands: false,
    showRSI: true,
    showMACD: false,
    showVolume: true,
    showVWAP: true,
    showSupertrend: false,
    showVolumeProfile: true
  });

  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);

  // Drawing Tools State
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>('cursor');
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [drawingDraft, setDrawingDraft] = useState<DrawingItem | null>(null);
  const [isDrawingsLocked, setIsDrawingsLocked] = useState(false);
  const [showDrawings, setShowDrawings] = useState(true);

  // Bar Replay State
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [replayIndex, setReplayIndex] = useState<number>(45);
  const [isReplayPlaying, setIsReplayPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  // Generate historical candles
  const rawCandles = useMemo(() => {
    return generateCandles(asset.price, timeframe, 64);
  }, [asset.symbol, asset.price, timeframe]);

  // Truncate candles if in Bar Replay Mode
  const activeCandleSet = useMemo(() => {
    if (isReplayMode) {
      return rawCandles.slice(0, Math.min(rawCandles.length, Math.max(10, replayIndex)));
    }
    return rawCandles;
  }, [rawCandles, isReplayMode, replayIndex]);

  // Transform candles if Heikin-Ashi is selected
  const candles = useMemo(() => {
    if (chartType === 'heikinAshi') {
      return toHeikinAshi(activeCandleSet);
    }
    return activeCandleSet;
  }, [activeCandleSet, chartType]);

  // Compute Technical Indicators
  const sma20 = useMemo(() => calculateSMA(candles, 20), [candles]);
  const ema50 = useMemo(() => calculateEMA(candles, 50), [candles]);
  const ema200 = useMemo(() => calculateEMA(candles, 20), [candles]);
  const bb = useMemo(() => calculateBollingerBands(candles, 20, 2), [candles]);
  const rsi = useMemo(() => calculateRSI(candles, 14), [candles]);
  const macd = useMemo(() => calculateMACD(candles), [candles]);
  const vwap = useMemo(() => calculateVWAP(candles), [candles]);
  const supertrend = useMemo(() => calculateSupertrend(candles, 10, 3), [candles]);
  const volumeProfile = useMemo(() => calculateVolumeProfile(candles, 20), [candles]);

  // Bar Replay Timer loop
  useEffect(() => {
    if (!isReplayMode || !isReplayPlaying) return;
    const intervalMs = 1200 / replaySpeed;
    const timer = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= rawCandles.length) {
          setIsReplayPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isReplayMode, isReplayPlaying, replaySpeed, rawCandles.length]);

  // Geometry dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 850, height: 500 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 500,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // Sizing math
  const chartWidth = dimensions.width - 40; // accommodate left drawing toolbar
  const paddingRight = 65; // Price axis width
  const paddingBottom = 28; // Time axis height
  const paddingTop = 20;
  const paddingLeft = 10;

  const subChartHeight = (indicators.showRSI || indicators.showMACD) ? 90 : 0;
  const mainChartHeight = dimensions.height - paddingTop - paddingBottom - subChartHeight;
  const plotWidth = Math.max(100, chartWidth - paddingLeft - paddingRight);

  // Price range calculation
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let mv = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > mv) mv = c.volume;
    });

    if (indicators.showBollingerBands) {
      bb.upper.forEach(u => { if (u !== null && u > max) max = u; });
      bb.lower.forEach(l => { if (l !== null && l < min) min = l; });
    }

    const priceBuffer = (max - min) * 0.08 || 1;
    return {
      minPrice: min - priceBuffer,
      maxPrice: max + priceBuffer,
      maxVol: mv || 1000
    };
  }, [candles, indicators.showBollingerBands, bb]);

  const priceRange = maxPrice - minPrice || 1;
  const getY = (price: number) => {
    return paddingTop + mainChartHeight - ((price - minPrice) / priceRange) * mainChartHeight;
  };
  const getPriceFromY = (y: number) => {
    const ratio = (paddingTop + mainChartHeight - y) / mainChartHeight;
    return minPrice + ratio * priceRange;
  };

  const candleSpacing = plotWidth / (candles.length || 1);
  const candleBodyWidth = Math.max(2, candleSpacing * 0.65);
  const getX = (index: number) => paddingLeft + index * candleSpacing + candleSpacing / 2;

  // Active Candle
  const activeCandleIndex = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candles.length
    ? hoverIndex
    : candles.length - 1;
  const activeCandle = candles[activeCandleIndex] || candles[0];

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= paddingLeft && x <= paddingLeft + plotWidth && y >= paddingTop && y <= dimensions.height - paddingBottom) {
      setMousePos({ x, y });
      const index = Math.floor((x - paddingLeft) / candleSpacing);
      const clampedIndex = Math.max(0, Math.min(candles.length - 1, index));
      setHoverIndex(clampedIndex);

      // Handle ongoing drawing draft
      if (drawingDraft && activeDrawingTool !== 'cursor') {
        const currentPrice = getPriceFromY(y);
        setDrawingDraft({
          ...drawingDraft,
          points: [
            drawingDraft.points[0],
            { index: clampedIndex, price: currentPrice, timeLabel: candles[clampedIndex]?.timeLabel }
          ]
        });
      }
    } else {
      setMousePos(null);
      setHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoverIndex(null);
  };

  // Drawing Click Engine
  const handleChartClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeDrawingTool === 'cursor' || isDrawingsLocked) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < paddingLeft || x > paddingLeft + plotWidth || y < paddingTop || y > paddingTop + mainChartHeight) {
      return;
    }

    const clickedIndex = Math.max(0, Math.min(candles.length - 1, Math.floor((x - paddingLeft) / candleSpacing)));
    const clickedPrice = getPriceFromY(y);

    if (activeDrawingTool === 'horizontal') {
      // Single-click tool: creates full horizontal level
      const newDrawing: DrawingItem = {
        id: `draw-${Date.now()}`,
        type: 'horizontal',
        points: [{ index: clickedIndex, price: clickedPrice }],
        color: '#fbbf24',
        text: `Support / Resistance (${formatPrice(clickedPrice)})`
      };
      setDrawings((prev) => [...prev, newDrawing]);
      setActiveDrawingTool('cursor');
      return;
    }

    if (!drawingDraft) {
      // First click: Start draft
      setDrawingDraft({
        id: `draw-${Date.now()}`,
        type: activeDrawingTool as any,
        points: [{ index: clickedIndex, price: clickedPrice, timeLabel: candles[clickedIndex]?.timeLabel }],
        color: activeDrawingTool === 'fibonacci' ? '#a855f7' : activeDrawingTool === 'position' ? '#089981' : '#2962ff'
      });
    } else {
      // Second click: Complete drawing
      const completed: DrawingItem = {
        ...drawingDraft,
        points: [
          drawingDraft.points[0],
          { index: clickedIndex, price: clickedPrice, timeLabel: candles[clickedIndex]?.timeLabel }
        ]
      };
      setDrawings((prev) => [...prev, completed]);
      setDrawingDraft(null);
      setActiveDrawingTool('cursor');
    }
  };

  // Snapshot / Screenshot download
  const handleTakeSnapshot = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 2000);

    // Export SVG as file
    const svgElem = containerRef.current?.querySelector('svg');
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tradingview_${asset.symbol}_${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Price Grid Levels
  const priceGridLevels = useMemo(() => {
    const levels = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const price = minPrice + (priceRange * i) / (count - 1);
      const y = getY(price);
      levels.push({ price, y });
    }
    return levels;
  }, [minPrice, priceRange, mainChartHeight]);

  // Line & Area Path strings
  const linePath = useMemo(() => {
    if (candles.length === 0) return '';
    return candles.map((c, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(c.close)}`).join(' ');
  }, [candles, candleSpacing, minPrice, priceRange, mainChartHeight]);

  const areaPath = useMemo(() => {
    if (!linePath || candles.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(candles.length - 1);
    const baselineY = paddingTop + mainChartHeight;
    return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [linePath, candles, candleSpacing, mainChartHeight]);

  return (
    <div
      ref={containerRef}
      className={`w-full bg-[#131722] border border-[#2a2e39] rounded-lg overflow-hidden flex flex-col font-sans transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-[#131722] p-4' : ''
      }`}
    >
      {/* 1. Pro Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#2a2e39] bg-[#1e222d] px-3 py-2 gap-2 select-none text-xs">
        {/* Left: Symbol Info, Price, and Interval Quick-Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm text-white tracking-tight">{asset.symbol}</span>
            <span className="text-[10px] bg-[#2962ff]/20 text-[#2962ff] px-1.5 py-0.5 rounded font-mono font-bold">
              PRO+
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-[#2a2e39] pl-3">
            <span className="text-white font-mono font-bold text-sm tabular-nums">
              {formatPrice(asset.price, asset.currency === '%' ? '%' : '$')}
            </span>
            <span
              className={`font-mono text-xs font-semibold tabular-nums flex items-center ${
                asset.change >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
              }`}
            >
              {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)} ({asset.change >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%)
            </span>
          </div>

          {/* Timeframe intervals */}
          <div className="hidden sm:flex items-center gap-0.5 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
            {(['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-[#2962ff] text-white shadow-xs'
                    : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Replay Controls (if active) */}
        {isReplayMode && (
          <BarReplayControls
            isPlaying={isReplayPlaying}
            onTogglePlay={() => setIsReplayPlaying(!isReplayPlaying)}
            onStepForward={() => setReplayIndex((prev) => Math.min(rawCandles.length, prev + 1))}
            onResetToLive={() => setReplayIndex(20)}
            currentBarIndex={candles.length}
            totalBars={rawCandles.length}
            speed={replaySpeed}
            onSpeedChange={setReplaySpeed}
            onExitReplay={() => {
              setIsReplayMode(false);
              setIsReplayPlaying(false);
            }}
          />
        )}

        {/* Right Tools: Bar Replay Trigger, Indicators, Snapshot, Alert, Trade */}
        <div className="flex items-center gap-2">
          {/* Bar Replay Trigger */}
          <button
            onClick={() => {
              setIsReplayMode(!isReplayMode);
              if (!isReplayMode) setReplayIndex(40);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
              isReplayMode
                ? 'bg-amber-400/20 text-amber-400 border-amber-400/50'
                : 'bg-[#131722] text-[#787b86] border-[#2a2e39] hover:text-white'
            }`}
            title="Bar Replay Strategy Simulator"
          >
            <PlaySquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Replay</span>
          </button>

          {/* Indicators Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#d1d4dc] bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded transition-colors whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 text-[#2962ff]" />
              <span>Indicators ({(Object.values(indicators) as boolean[]).filter(Boolean).length})</span>
            </button>

            {showIndicatorsMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-2xl z-50 p-2.5 text-xs space-y-1">
                <div className="text-[11px] font-bold text-[#787b86] px-2 py-1 uppercase tracking-wider">
                  Overlays & Pro Indicators
                </div>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    SMA (20)
                  </span>
                  <input
                    type="checkbox"
                    checked={indicators.showSMA20}
                    onChange={(e) => setIndicators({ ...indicators, showSMA20: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                    EMA (50)
                  </span>
                  <input
                    type="checkbox"
                    checked={indicators.showEMA50}
                    onChange={(e) => setIndicators({ ...indicators, showEMA50: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                    EMA (200)
                  </span>
                  <input
                    type="checkbox"
                    checked={indicators.showEMA200}
                    onChange={(e) => setIndicators({ ...indicators, showEMA200: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                    Bollinger Bands
                  </span>
                  <input
                    type="checkbox"
                    checked={indicators.showBollingerBands}
                    onChange={(e) => setIndicators({ ...indicators, showBollingerBands: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] inline-block" />
                    VWAP (Institutional)
                  </span>
                  <input
                    type="checkbox"
                    checked={indicators.showVWAP}
                    onChange={(e) => setIndicators({ ...indicators, showVWAP: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#089981] inline-block" />
                    Supertrend (10, 3)
                  </span>
                  <input
                    type="checkbox"
                    checked={indicators.showSupertrend}
                    onChange={(e) => setIndicators({ ...indicators, showSupertrend: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] inline-block" />
                    Volume Profile (VPVR)
                  </span>
                  <input
                    type="checkbox"
                    checked={indicators.showVolumeProfile}
                    onChange={(e) => setIndicators({ ...indicators, showVolumeProfile: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>

                <div className="border-t border-[#2a2e39] my-1.5" />
                <div className="text-[11px] font-bold text-[#787b86] px-2 py-1 uppercase tracking-wider">
                  Oscillators
                </div>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span>RSI (14)</span>
                  <input
                    type="checkbox"
                    checked={indicators.showRSI}
                    onChange={(e) => setIndicators({ ...indicators, showRSI: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>
                <label className="flex items-center justify-between px-2 py-1.5 hover:bg-[#2a2e39] rounded cursor-pointer text-[#d1d4dc]">
                  <span>MACD (12, 26, 9)</span>
                  <input
                    type="checkbox"
                    checked={indicators.showMACD}
                    onChange={(e) => setIndicators({ ...indicators, showMACD: e.target.checked })}
                    className="accent-[#2962ff] rounded"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Chart Style Switcher */}
          <div className="flex items-center gap-0.5 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
            <button
              onClick={() => setChartType('candles')}
              className={`p-1 rounded ${chartType === 'candles' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'}`}
              title="Candlesticks"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1 rounded ${chartType === 'line' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'}`}
              title="Line Chart"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1 rounded ${chartType === 'area' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'}`}
              title="Area Chart"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Price Alert Button */}
          {onOpenAlerts && (
            <button
              onClick={onOpenAlerts}
              className="p-1.5 text-amber-400 hover:text-amber-300 bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded transition-colors"
              title="Set Price Alert"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Snapshot Export */}
          <button
            onClick={handleTakeSnapshot}
            className="p-1.5 text-[#787b86] hover:text-white bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded transition-colors"
            title="Download Chart Snapshot"
          >
            {snapshotTaken ? <Check className="w-3.5 h-3.5 text-[#089981]" /> : <Camera className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Trade */}
          {onOpenTrade && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenTrade('buy')}
                className="px-2.5 py-1 text-xs font-bold text-white bg-[#089981] hover:bg-[#067a67] rounded transition-colors"
              >
                Buy
              </button>
              <button
                onClick={() => onOpenTrade('sell')}
                className="px-2.5 py-1 text-xs font-bold text-white bg-[#f23645] hover:bg-[#d42735] rounded transition-colors"
              >
                Sell
              </button>
            </div>
          )}

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-[#787b86] hover:text-white bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. Dynamic Legend Banner */}
      {activeCandle && (
        <div className="flex items-center gap-4 px-3 py-1 bg-[#131722] text-[11px] font-mono text-[#787b86] border-b border-[#2a2e39]/50 overflow-x-auto no-scrollbar">
          <span className="text-[#d1d4dc] font-semibold">{activeCandle.timeLabel}</span>
          <span>O: <strong className="text-white tabular-nums">{formatPrice(activeCandle.open, asset.currency === '%' ? '%' : '$')}</strong></span>
          <span>H: <strong className="text-white tabular-nums">{formatPrice(activeCandle.high, asset.currency === '%' ? '%' : '$')}</strong></span>
          <span>L: <strong className="text-white tabular-nums">{formatPrice(activeCandle.low, asset.currency === '%' ? '%' : '$')}</strong></span>
          <span>C: <strong className={`tabular-nums ${activeCandle.close >= activeCandle.open ? 'text-[#089981]' : 'text-[#f23645]'}`}>
            {formatPrice(activeCandle.close, asset.currency === '%' ? '%' : '$')}
          </strong></span>
          {indicators.showVWAP && vwap[activeCandleIndex] !== null && (
            <span className="text-[#f43f5e]">VWAP: <strong className="tabular-nums">${vwap[activeCandleIndex]}</strong></span>
          )}
          {indicators.showSupertrend && supertrend.supertrendLine[activeCandleIndex] !== null && (
            <span className={supertrend.trend[activeCandleIndex] === 'bullish' ? 'text-[#089981]' : 'text-[#f23645]'}>
              ST: <strong className="tabular-nums">${supertrend.supertrendLine[activeCandleIndex]}</strong>
            </span>
          )}
          {indicators.showSMA20 && sma20[activeCandleIndex] !== null && (
            <span className="text-amber-400">SMA(20): <strong className="tabular-nums">${sma20[activeCandleIndex]}</strong></span>
          )}
          {indicators.showRSI && rsi[activeCandleIndex] !== null && (
            <span className="text-purple-400">RSI(14): <strong className="tabular-nums">{rsi[activeCandleIndex]}</strong></span>
          )}
        </div>
      )}

      {/* 3. Main Chart Viewport with Left Drawing Rail */}
      <div className="flex flex-1 relative bg-[#131722] overflow-hidden">
        {/* Left Drawing Toolbar */}
        <DrawingToolbar
          activeTool={activeDrawingTool}
          setActiveTool={setActiveDrawingTool}
          drawingsCount={drawings.length}
          onClearAll={() => setDrawings([])}
          onUndo={() => setDrawings(drawings.slice(0, -1))}
          isLocked={isDrawingsLocked}
          setIsLocked={setIsDrawingsLocked}
          showDrawings={showDrawings}
          setShowDrawings={setShowDrawings}
        />

        {/* SVG Drawing & Chart Canvas */}
        <div className="relative flex-1 cursor-crosshair select-none bg-[#131722] overflow-hidden">
          <svg
            width={chartWidth}
            height={dimensions.height}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleChartClick}
            className="w-full h-full block"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2962ff" stopOpacity="0.45" />
                <stop offset="90%" stopColor="#2962ff" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00bcd4" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#00bcd4" stopOpacity="0.12" />
              </linearGradient>
            </defs>

            {/* Price Grid Lines */}
            {priceGridLevels.map((lvl, idx) => (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={lvl.y}
                  x2={plotWidth + paddingLeft}
                  y2={lvl.y}
                  stroke="#2a2e39"
                  strokeDasharray="3 3"
                  strokeWidth={0.8}
                />
                <text
                  x={plotWidth + paddingLeft + 8}
                  y={lvl.y + 3.5}
                  fill="#787b86"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatPrice(lvl.price, asset.currency === '%' ? '%' : '$')}
                </text>
              </g>
            ))}

            {/* Time Grid Lines */}
            {candles.filter((_, idx) => idx % 8 === 0).map((c, idx) => {
              const index = candles.indexOf(c);
              const x = getX(index);
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + mainChartHeight}
                    stroke="#2a2e39"
                    strokeDasharray="3 3"
                    strokeWidth={0.8}
                  />
                  <text
                    x={x}
                    y={paddingTop + mainChartHeight + 16}
                    fill="#787b86"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {c.timeLabel}
                  </text>
                </g>
              );
            })}

            {/* Pro Feature: Volume Profile (VPVR) Histogram along the right side */}
            {indicators.showVolumeProfile && (
              <g opacity={0.65}>
                {(() => {
                  const maxVP = Math.max(...volumeProfile.bins.map(b => b.totalVolume)) || 1;
                  const vpWidth = plotWidth * 0.18; // 18% width on right
                  const rightEdge = plotWidth + paddingLeft;

                  return volumeProfile.bins.map((bin, i) => {
                    const y = getY(bin.priceLevel);
                    const binH = Math.max(3, (mainChartHeight / volumeProfile.bins.length) - 1.5);
                    const totalW = (bin.totalVolume / maxVP) * vpWidth;
                    const buyW = (bin.buyVolume / (bin.totalVolume || 1)) * totalW;
                    const sellW = totalW - buyW;

                    return (
                      <g key={`vp-${i}`}>
                        {/* Buy Vol bar (blue) */}
                        <rect
                          x={rightEdge - totalW}
                          y={y - binH / 2}
                          width={buyW}
                          height={binH}
                          fill="rgba(41, 98, 255, 0.45)"
                        />
                        {/* Sell Vol bar (yellow) */}
                        <rect
                          x={rightEdge - sellW}
                          y={y - binH / 2}
                          width={sellW}
                          height={binH}
                          fill="rgba(234, 179, 8, 0.45)"
                        />
                        {/* Point of Control (POC) Line */}
                        {bin.isPOC && (
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={rightEdge}
                            y2={y}
                            stroke="#ef4444"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                          />
                        )}
                      </g>
                    );
                  });
                })()}
              </g>
            )}

            {/* Bollinger Bands */}
            {indicators.showBollingerBands && (
              <g>
                <polyline
                  fill="none"
                  stroke="#00bcd4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  points={candles
                    .map((_, i) => bb.upper[i] !== null ? `${getX(i)},${getY(bb.upper[i] as number)}` : null)
                    .filter(Boolean)
                    .join(' ')}
                />
                <polyline
                  fill="none"
                  stroke="#00bcd4"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  points={candles
                    .map((_, i) => bb.lower[i] !== null ? `${getX(i)},${getY(bb.lower[i] as number)}` : null)
                    .filter(Boolean)
                    .join(' ')}
                />
              </g>
            )}

            {/* Volume Bars */}
            {indicators.showVolume && candles.map((c, i) => {
              const x = getX(i) - candleBodyWidth / 2;
              const volHeight = Math.max(2, (c.volume / maxVol) * (mainChartHeight * 0.20));
              const y = paddingTop + mainChartHeight - volHeight;
              const isUp = c.close >= c.open;
              return (
                <rect
                  key={`vol-${i}`}
                  x={x}
                  y={y}
                  width={candleBodyWidth}
                  height={volHeight}
                  fill={isUp ? 'rgba(8, 153, 129, 0.25)' : 'rgba(242, 54, 69, 0.25)'}
                />
              );
            })}

            {/* Area or Line Chart */}
            {chartType === 'area' && (
              <g>
                <path d={areaPath} fill="url(#areaGradient)" />
                <path d={linePath} fill="none" stroke="#2962ff" strokeWidth={2} />
              </g>
            )}
            {chartType === 'line' && (
              <path d={linePath} fill="none" stroke="#2962ff" strokeWidth={2} />
            )}

            {/* Candlesticks & Heikin Ashi */}
            {(chartType === 'candles' || chartType === 'heikinAshi') && (
              <g>
                {candles.map((c, i) => {
                  const x = getX(i);
                  const isBullish = c.close >= c.open;
                  const candleColor = isBullish ? '#089981' : '#f23645';

                  const wickTop = getY(c.high);
                  const wickBottom = getY(c.low);
                  const bodyTop = getY(Math.max(c.open, c.close));
                  const bodyBottom = getY(Math.min(c.open, c.close));
                  const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);

                  return (
                    <g key={`candle-${i}`}>
                      <line
                        x1={x}
                        y1={wickTop}
                        x2={x}
                        y2={wickBottom}
                        stroke={candleColor}
                        strokeWidth={1.2}
                      />
                      <rect
                        x={x - candleBodyWidth / 2}
                        y={bodyTop}
                        width={candleBodyWidth}
                        height={bodyHeight}
                        fill={candleColor}
                        stroke={candleColor}
                        strokeWidth={1}
                        rx={0.5}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* VWAP Institutional Indicator */}
            {indicators.showVWAP && (
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth={1.8}
                points={candles
                  .map((_, i) => vwap[i] !== null ? `${getX(i)},${getY(vwap[i] as number)}` : null)
                  .filter(Boolean)
                  .join(' ')}
              />
            )}

            {/* Supertrend Indicator */}
            {indicators.showSupertrend && (
              <polyline
                fill="none"
                stroke={supertrend.trend[supertrend.trend.length - 1] === 'bullish' ? '#089981' : '#f23645'}
                strokeWidth={2}
                strokeDasharray="2 1"
                points={candles
                  .map((_, i) => supertrend.supertrendLine[i] !== null ? `${getX(i)},${getY(supertrend.supertrendLine[i] as number)}` : null)
                  .filter(Boolean)
                  .join(' ')}
              />
            )}

            {/* Moving Averages */}
            {indicators.showSMA20 && (
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth={1.5}
                points={candles
                  .map((_, i) => sma20[i] !== null ? `${getX(i)},${getY(sma20[i] as number)}` : null)
                  .filter(Boolean)
                  .join(' ')}
              />
            )}
            {indicators.showEMA50 && (
              <polyline
                fill="none"
                stroke="#38bdf8"
                strokeWidth={1.5}
                points={candles
                  .map((_, i) => ema50[i] !== null ? `${getX(i)},${getY(ema50[i] as number)}` : null)
                  .filter(Boolean)
                  .join(' ')}
              />
            )}

            {/* Interactive Drawings Rendering */}
            {showDrawings && (
              <g>
                {[...drawings, ...(drawingDraft ? [drawingDraft] : [])].map((item) => {
                  if (item.type === 'horizontal') {
                    const y = getY(item.points[0].price);
                    return (
                      <g key={item.id}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={plotWidth + paddingLeft}
                          y2={y}
                          stroke={item.color || '#fbbf24'}
                          strokeWidth={1.5}
                          strokeDasharray="4 2"
                        />
                        <rect
                          x={plotWidth + paddingLeft}
                          y={y - 9}
                          width={paddingRight}
                          height={18}
                          fill="#fbbf24"
                          rx={2}
                        />
                        <text
                          x={plotWidth + paddingLeft + 4}
                          y={y + 3.5}
                          fill="#000"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {formatPrice(item.points[0].price)}
                        </text>
                      </g>
                    );
                  }

                  if (item.type === 'trendline' && item.points.length >= 2) {
                    const x1 = getX(item.points[0].index);
                    const y1 = getY(item.points[0].price);
                    const x2 = getX(item.points[1].index);
                    const y2 = getY(item.points[1].price);
                    return (
                      <g key={item.id}>
                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2962ff" strokeWidth={2} />
                        <circle cx={x1} cy={y1} r={3} fill="#2962ff" stroke="#fff" strokeWidth={1} />
                        <circle cx={x2} cy={y2} r={3} fill="#2962ff" stroke="#fff" strokeWidth={1} />
                      </g>
                    );
                  }

                  if (item.type === 'fibonacci' && item.points.length >= 2) {
                    const p1 = item.points[0].price;
                    const p2 = item.points[1].price;
                    const highP = Math.max(p1, p2);
                    const lowP = Math.min(p1, p2);
                    const diff = highP - lowP;
                    const fibLevels = [
                      { ratio: 0.0, color: '#787b86' },
                      { ratio: 0.236, color: '#f87171' },
                      { ratio: 0.382, color: '#fb923c' },
                      { ratio: 0.5, color: '#4ade80' },
                      { ratio: 0.618, color: '#2dd4bf' },
                      { ratio: 0.786, color: '#38bdf8' },
                      { ratio: 1.0, color: '#787b86' },
                    ];

                    return (
                      <g key={item.id}>
                        {fibLevels.map((lvl) => {
                          const levelPrice = lowP + diff * lvl.ratio;
                          const y = getY(levelPrice);
                          return (
                            <g key={lvl.ratio}>
                              <line
                                x1={paddingLeft}
                                y1={y}
                                x2={plotWidth + paddingLeft}
                                y2={y}
                                stroke={lvl.color}
                                strokeWidth={1}
                                strokeDasharray="3 2"
                              />
                              <text
                                x={paddingLeft + 6}
                                y={y - 3}
                                fill={lvl.color}
                                fontSize="9"
                                fontFamily="JetBrains Mono, monospace"
                              >
                                Fib {lvl.ratio} ({formatPrice(levelPrice)})
                              </text>
                            </g>
                          );
                        })}
                      </g>
                    );
                  }

                  if (item.type === 'position' && item.points.length >= 2) {
                    const entryP = item.points[0].price;
                    const targetP = item.points[1].price;
                    const isLong = targetP >= entryP;
                    const stopP = isLong ? entryP - (targetP - entryP) * 0.5 : entryP + (entryP - targetP) * 0.5;

                    const yEntry = getY(entryP);
                    const yTarget = getY(targetP);
                    const yStop = getY(stopP);

                    const xStart = getX(item.points[0].index);
                    const boxW = 120;

                    return (
                      <g key={item.id}>
                        {/* Target Green Box */}
                        <rect
                          x={xStart}
                          y={Math.min(yEntry, yTarget)}
                          width={boxW}
                          height={Math.abs(yEntry - yTarget)}
                          fill="rgba(8, 153, 129, 0.2)"
                          stroke="#089981"
                          strokeWidth={1}
                        />
                        {/* Stop Loss Red Box */}
                        <rect
                          x={xStart}
                          y={Math.min(yEntry, yStop)}
                          width={boxW}
                          height={Math.abs(yEntry - yStop)}
                          fill="rgba(242, 54, 69, 0.2)"
                          stroke="#f23645"
                          strokeWidth={1}
                        />
                        <text
                          x={xStart + 6}
                          y={Math.min(yEntry, yTarget) + 14}
                          fill="#089981"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          Target: {formatPrice(targetP)} (R:R 2.00)
                        </text>
                        <text
                          x={xStart + 6}
                          y={Math.max(yEntry, yStop) - 6}
                          fill="#f23645"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          Stop: {formatPrice(stopP)}
                        </text>
                      </g>
                    );
                  }

                  if (item.type === 'ruler' && item.points.length >= 2) {
                    const x1 = getX(item.points[0].index);
                    const y1 = getY(item.points[0].price);
                    const x2 = getX(item.points[1].index);
                    const y2 = getY(item.points[1].price);

                    const priceDelta = item.points[1].price - item.points[0].price;
                    const percentDelta = (priceDelta / item.points[0].price) * 100;
                    const barCount = Math.abs(item.points[1].index - item.points[0].index);

                    return (
                      <g key={item.id}>
                        <rect
                          x={Math.min(x1, x2)}
                          y={Math.min(y1, y2)}
                          width={Math.abs(x1 - x2)}
                          height={Math.abs(y1 - y2)}
                          fill="rgba(41, 98, 255, 0.12)"
                          stroke="#2962ff"
                          strokeWidth={1}
                          strokeDasharray="2 2"
                        />
                        <rect
                          x={x2 + 4}
                          y={y2 - 20}
                          width={110}
                          height={28}
                          fill="#1e222d"
                          stroke="#2962ff"
                          rx={3}
                        />
                        <text
                          x={x2 + 8}
                          y={y2 - 8}
                          fill="#fff"
                          fontSize="9"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {priceDelta >= 0 ? '+' : ''}{percentDelta.toFixed(2)}% ({formatPrice(priceDelta)})
                        </text>
                        <text
                          x={x2 + 8}
                          y={y2 + 2}
                          fill="#787b86"
                          fontSize="8"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {barCount} bars
                        </text>
                      </g>
                    );
                  }

                  return null;
                })}
              </g>
            )}

            {/* Current Price Marker */}
            {candles.length > 0 && (() => {
              const lastCandle = candles[candles.length - 1];
              const y = getY(lastCandle.close);
              const isBullish = lastCandle.close >= lastCandle.open;
              return (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={plotWidth + paddingLeft}
                    y2={y}
                    stroke={isBullish ? '#089981' : '#f23645'}
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />
                  <rect
                    x={plotWidth + paddingLeft}
                    y={y - 9}
                    width={paddingRight}
                    height={18}
                    fill={isBullish ? '#089981' : '#f23645'}
                    rx={2}
                  />
                  <text
                    x={plotWidth + paddingLeft + 6}
                    y={y + 3.5}
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {formatPrice(lastCandle.close, asset.currency === '%' ? '%' : '$')}
                  </text>
                </g>
              );
            })()}

            {/* Sub-Chart: RSI */}
            {indicators.showRSI && (
              <g transform={`translate(0, ${paddingTop + mainChartHeight + paddingBottom})`}>
                <line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#2a2e39" strokeWidth={1} />
                {(() => {
                  const rsiH = subChartHeight - 20;
                  const getYRSI = (val: number) => rsiH - (val / 100) * rsiH;
                  const y70 = getYRSI(70);
                  const y30 = getYRSI(30);

                  return (
                    <g>
                      <rect x={paddingLeft} y={y70} width={plotWidth} height={y30 - y70} fill="rgba(168, 85, 247, 0.08)" />
                      <line x1={paddingLeft} y1={y70} x2={plotWidth + paddingLeft} y2={y70} stroke="#a855f7" strokeDasharray="2 2" strokeWidth={0.8} />
                      <text x={plotWidth + paddingLeft + 6} y={y70 + 3} fill="#a855f7" fontSize="9" fontFamily="JetBrains Mono, monospace">70</text>
                      <line x1={paddingLeft} y1={y30} x2={plotWidth + paddingLeft} y2={y30} stroke="#a855f7" strokeDasharray="2 2" strokeWidth={0.8} />
                      <text x={plotWidth + paddingLeft + 6} y={y30 + 3} fill="#a855f7" fontSize="9" fontFamily="JetBrains Mono, monospace">30</text>
                      <text x={paddingLeft + 6} y={14} fill="#a855f7" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono, monospace">RSI (14)</text>

                      <polyline
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth={1.5}
                        points={candles
                          .map((_, i) => rsi[i] !== null ? `${getX(i)},${getYRSI(rsi[i] as number)}` : null)
                          .filter(Boolean)
                          .join(' ')}
                      />
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Sub-Chart: MACD */}
            {!indicators.showRSI && indicators.showMACD && (
              <g transform={`translate(0, ${paddingTop + mainChartHeight + paddingBottom})`}>
                <line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#2a2e39" strokeWidth={1} />
                <text x={paddingLeft + 6} y={14} fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
                  MACD (12, 26, 9)
                </text>
                {(() => {
                  const macdH = subChartHeight - 20;
                  const zeroY = macdH / 2;
                  return (
                    <g>
                      <line x1={paddingLeft} y1={zeroY} x2={plotWidth + paddingLeft} y2={zeroY} stroke="#2a2e39" strokeWidth={1} />
                      {candles.map((_, i) => {
                        const h = macd.histogram[i];
                        if (h === null) return null;
                        const x = getX(i) - 2;
                        const barH = Math.min(zeroY - 2, Math.abs(h * 3));
                        const y = h >= 0 ? zeroY - barH : zeroY;
                        return (
                          <rect
                            key={`macd-hist-${i}`}
                            x={x}
                            y={y}
                            width={4}
                            height={barH}
                            fill={h >= 0 ? '#089981' : '#f23645'}
                          />
                        );
                      })}
                    </g>
                  );
                })()}
              </g>
            )}

            {/* Crosshairs & Axis Readouts */}
            {mousePos && (
              <g>
                <line
                  x1={mousePos.x}
                  y1={paddingTop}
                  x2={mousePos.x}
                  y2={dimensions.height - paddingBottom}
                  stroke="#787b86"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <line
                  x1={paddingLeft}
                  y1={mousePos.y}
                  x2={plotWidth + paddingLeft}
                  y2={mousePos.y}
                  stroke="#787b86"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <rect
                  x={plotWidth + paddingLeft}
                  y={mousePos.y - 9}
                  width={paddingRight}
                  height={18}
                  fill="#2a2e39"
                  stroke="#787b86"
                  strokeWidth={0.5}
                  rx={2}
                />
                <text
                  x={plotWidth + paddingLeft + 6}
                  y={mousePos.y + 3.5}
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {formatPrice(getPriceFromY(mousePos.y), asset.currency === '%' ? '%' : '$')}
                </text>

                {activeCandle && (
                  <g>
                    <rect
                      x={mousePos.x - 35}
                      y={paddingTop + mainChartHeight + 4}
                      width={70}
                      height={16}
                      fill="#2a2e39"
                      stroke="#787b86"
                      strokeWidth={0.5}
                      rx={2}
                    />
                    <text
                      x={mousePos.x}
                      y={paddingTop + mainChartHeight + 15}
                      fill="#ffffff"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {activeCandle.timeLabel}
                    </text>
                  </g>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};
