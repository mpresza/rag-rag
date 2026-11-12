import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MarketAsset, CandleData, Timeframe, ChartType, IndicatorConfig } from '../types/market';
import { generateCandles } from '../data/mockMarketData';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  toHeikinAshi,
  formatPrice
} from '../utils/technicalAnalysis';
import {
  TrendingUp,
  BarChart2,
  LineChart as LineChartIcon,
  Layers,
  Activity,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface InteractiveChartProps {
  asset: MarketAsset;
  onOpenTrade?: (side: 'buy' | 'sell') => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({ asset, onOpenTrade }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const [indicators, setIndicators] = useState<IndicatorConfig>({
    showSMA20: true,
    showEMA50: false,
    showEMA200: false,
    showBollingerBands: false,
    showRSI: true,
    showMACD: false,
    showVolume: true,
  });

  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);

  // Generate historical candles based on asset price & chosen timeframe
  const rawCandles = useMemo(() => {
    return generateCandles(asset.price, timeframe, 64);
  }, [asset.symbol, asset.price, timeframe]);

  // Transform candles if Heikin-Ashi is selected
  const candles = useMemo(() => {
    if (chartType === 'heikinAshi') {
      return toHeikinAshi(rawCandles);
    }
    return rawCandles;
  }, [rawCandles, chartType]);

  // Compute Technical Indicators
  const sma20 = useMemo(() => calculateSMA(candles, 20), [candles]);
  const ema50 = useMemo(() => calculateEMA(candles, 50), [candles]);
  const ema200 = useMemo(() => calculateEMA(candles, 20), [candles]);
  const bb = useMemo(() => calculateBollingerBands(candles, 20, 2), [candles]);
  const rsi = useMemo(() => calculateRSI(candles, 14), [candles]);
  const macd = useMemo(() => calculateMACD(candles), [candles]);

  // Geometry dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 120 : 500,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // Layout sizing
  const chartWidth = dimensions.width;
  const paddingRight = 65; // Price axis width
  const paddingBottom = 28; // Time axis height
  const paddingTop = 20;
  const paddingLeft = 10;

  // Split height if RSI or MACD are enabled
  const subChartHeight = (indicators.showRSI || indicators.showMACD) ? 90 : 0;
  const mainChartHeight = dimensions.height - paddingTop - paddingBottom - subChartHeight;
  const plotWidth = Math.max(100, chartWidth - paddingLeft - paddingRight);

  // Min and Max prices for the visible candle range
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let mv = 0;

    candles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > mv) mv = c.volume;
    });

    // Also include BB bounds if visible
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

  // Scaling helpers
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

  // Active Candle for Legend (hovered or last)
  const activeCandleIndex = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < candles.length
    ? hoverIndex
    : candles.length - 1;
  const activeCandle = candles[activeCandleIndex] || candles[0];

  // Mouse move handler for crosshairs
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= paddingLeft && x <= paddingLeft + plotWidth && y >= paddingTop && y <= dimensions.height - paddingBottom) {
      setMousePos({ x, y });
      const index = Math.floor((x - paddingLeft) / candleSpacing);
      const clampedIndex = Math.max(0, Math.min(candles.length - 1, index));
      setHoverIndex(clampedIndex);
    } else {
      setMousePos(null);
      setHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoverIndex(null);
  };

  // Price Grid Lines (4 horizontal intervals)
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
      {/* Top Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#2a2e39] bg-[#1e222d] px-3 py-2 gap-2 select-none text-xs">
        {/* Left: Symbol info & Price header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-white tracking-tight">{asset.symbol}</span>
            <span className="text-[11px] text-[#787b86] hidden sm:inline">{asset.name}</span>
            <span className="text-[10px] bg-[#2a2e39] text-[#9db2ce] px-1.5 py-0.5 rounded font-mono font-medium">
              {asset.exchange}
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
        </div>

        {/* Center: Timeframe selector (1D, 5D, 1M, 3M, 6M, 1Y, ALL) */}
        <div className="flex items-center gap-0.5 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
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

        {/* Right: Chart styles, Indicators toggle, Fullscreen, Quick Trade */}
        <div className="flex items-center gap-2">
          {/* Chart Type */}
          <div className="flex items-center gap-0.5 bg-[#131722] p-0.5 rounded border border-[#2a2e39]">
            <button
              onClick={() => setChartType('candles')}
              title="Candlesticks"
              className={`p-1 rounded ${chartType === 'candles' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'}`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Line Chart"
              className={`p-1 rounded ${chartType === 'line' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'}`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('area')}
              title="Area Chart"
              className={`p-1 rounded ${chartType === 'area' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'}`}
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('heikinAshi')}
              title="Heikin Ashi"
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${chartType === 'heikinAshi' ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white'}`}
            >
              HA
            </button>
          </div>

          {/* Indicators Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#d1d4dc] bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded transition-colors whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5 text-[#2962ff]" />
              <span>Indicators</span>
            </button>

            {showIndicatorsMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-xl z-50 p-2 text-xs space-y-1">
                <div className="text-[11px] font-bold text-[#787b86] px-2 py-1 uppercase tracking-wider">
                  Overlays & Signals
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

                <div className="border-t border-[#2a2e39] my-1" />
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

          {/* Quick Trade Buttons */}
          {onOpenTrade && (
            <div className="flex items-center gap-1.5">
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

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-[#787b86] hover:text-white bg-[#131722] hover:bg-[#2a2e39] border border-[#2a2e39] rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Dynamic Candle OHLCV Readout Banner */}
      {activeCandle && (
        <div className="flex items-center gap-4 px-3 py-1 bg-[#131722] text-[11px] font-mono text-[#787b86] border-b border-[#2a2e39]/50 overflow-x-auto no-scrollbar">
          <span className="text-[#d1d4dc] font-semibold">{activeCandle.timeLabel}</span>
          <span>O: <strong className="text-white tabular-nums">{formatPrice(activeCandle.open, asset.currency === '%' ? '%' : '$')}</strong></span>
          <span>H: <strong className="text-white tabular-nums">{formatPrice(activeCandle.high, asset.currency === '%' ? '%' : '$')}</strong></span>
          <span>L: <strong className="text-white tabular-nums">{formatPrice(activeCandle.low, asset.currency === '%' ? '%' : '$')}</strong></span>
          <span>C: <strong className={`tabular-nums ${activeCandle.close >= activeCandle.open ? 'text-[#089981]' : 'text-[#f23645]'}`}>
            {formatPrice(activeCandle.close, asset.currency === '%' ? '%' : '$')}
          </strong></span>
          {indicators.showVolume && (
            <span>Vol: <strong className="text-[#9db2ce] tabular-nums">{activeCandle.volume.toLocaleString()}</strong></span>
          )}
          {indicators.showSMA20 && sma20[activeCandleIndex] !== null && (
            <span className="text-amber-400">SMA(20): <strong className="tabular-nums">${sma20[activeCandleIndex]}</strong></span>
          )}
          {indicators.showRSI && rsi[activeCandleIndex] !== null && (
            <span className="text-purple-400">RSI(14): <strong className="tabular-nums">{rsi[activeCandleIndex]}</strong></span>
          )}
        </div>
      )}

      {/* Main Interactive SVG Canvas */}
      <div className="relative flex-1 cursor-crosshair select-none bg-[#131722]">
        <svg
          width={chartWidth}
          height={dimensions.height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        >
          <defs>
            {/* Area Chart Gradient */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2962ff" stopOpacity="0.45" />
              <stop offset="90%" stopColor="#2962ff" stopOpacity="0.0" />
            </linearGradient>

            {/* Bollinger Band Shading Gradient */}
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00bcd4" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#00bcd4" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* Grid Lines - Horizontal Price */}
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

          {/* Grid Lines - Vertical Time */}
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

          {/* Bollinger Bands Shaded Area & Lines */}
          {indicators.showBollingerBands && (
            <g>
              {/* Shaded band */}
              {(() => {
                const upperPoints: string[] = [];
                const lowerPoints: string[] = [];
                for (let i = 0; i < candles.length; i++) {
                  const u = bb.upper[i];
                  const l = bb.lower[i];
                  if (u !== null && l !== null) {
                    upperPoints.push(`${getX(i)} ${getY(u)}`);
                    lowerPoints.unshift(`${getX(i)} ${getY(l)}`);
                  }
                }
                if (upperPoints.length > 0) {
                  return (
                    <polygon
                      points={`${upperPoints.join(', ')}, ${lowerPoints.join(', ')}`}
                      fill="url(#bbGradient)"
                    />
                  );
                }
                return null;
              })()}
              {/* Upper Line */}
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
              {/* Lower Line */}
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

          {/* Volume Bars (at bottom of main chart) */}
          {indicators.showVolume && candles.map((c, i) => {
            const x = getX(i) - candleBodyWidth / 2;
            const volHeight = Math.max(2, (c.volume / maxVol) * (mainChartHeight * 0.22));
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

          {/* Area Chart Rendering */}
          {chartType === 'area' && (
            <g>
              <path d={areaPath} fill="url(#areaGradient)" />
              <path d={linePath} fill="none" stroke="#2962ff" strokeWidth={2} />
            </g>
          )}

          {/* Line Chart Rendering */}
          {chartType === 'line' && (
            <path d={linePath} fill="none" stroke="#2962ff" strokeWidth={2} />
          )}

          {/* Candlesticks & Heikin Ashi Rendering */}
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
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={wickTop}
                      x2={x}
                      y2={wickBottom}
                      stroke={candleColor}
                      strokeWidth={1.2}
                    />
                    {/* Candle Body */}
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

          {/* Indicator Lines: SMA20 (amber) */}
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

          {/* Indicator Lines: EMA50 (blue) */}
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

          {/* Indicator Lines: EMA200 (purple) */}
          {indicators.showEMA200 && (
            <polyline
              fill="none"
              stroke="#a855f7"
              strokeWidth={1.5}
              points={candles
                .map((_, i) => ema200[i] !== null ? `${getX(i)},${getY(ema200[i] as number)}` : null)
                .filter(Boolean)
                .join(' ')}
            />
          )}

          {/* Current Last Price Horizontal Marker on Right Axis */}
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

          {/* Sub-Chart: RSI Panel */}
          {indicators.showRSI && (
            <g transform={`translate(0, ${paddingTop + mainChartHeight + paddingBottom})`}>
              {/* Divider */}
              <line x1={0} y1={0} x2={chartWidth} y2={0} stroke="#2a2e39" strokeWidth={1} />
              
              {/* RSI Background Zone 30-70 */}
              {(() => {
                const rsiH = subChartHeight - 20;
                const getYRSI = (val: number) => rsiH - (val / 100) * rsiH;
                const y70 = getYRSI(70);
                const y30 = getYRSI(30);

                return (
                  <g>
                    <rect x={paddingLeft} y={y70} width={plotWidth} height={y30 - y70} fill="rgba(168, 85, 247, 0.08)" />
                    {/* 70 Level */}
                    <line x1={paddingLeft} y1={y70} x2={plotWidth + paddingLeft} y2={y70} stroke="#a855f7" strokeDasharray="2 2" strokeWidth={0.8} />
                    <text x={plotWidth + paddingLeft + 6} y={y70 + 3} fill="#a855f7" fontSize="9" fontFamily="JetBrains Mono, monospace">70</text>
                    {/* 30 Level */}
                    <line x1={paddingLeft} y1={y30} x2={plotWidth + paddingLeft} y2={y30} stroke="#a855f7" strokeDasharray="2 2" strokeWidth={0.8} />
                    <text x={plotWidth + paddingLeft + 6} y={y30 + 3} fill="#a855f7" fontSize="9" fontFamily="JetBrains Mono, monospace">30</text>
                    {/* RSI Title */}
                    <text x={paddingLeft + 6} y={14} fill="#a855f7" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono, monospace">RSI (14)</text>

                    {/* RSI Polyline */}
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

          {/* Sub-Chart: MACD Panel (if RSI disabled & MACD enabled) */}
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
                    {/* Histogram */}
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

          {/* Crosshair Cursor Guideline & Axis badges */}
          {mousePos && (
            <g>
              {/* Vertical line */}
              <line
                x1={mousePos.x}
                y1={paddingTop}
                x2={mousePos.x}
                y2={dimensions.height - paddingBottom}
                stroke="#787b86"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              {/* Horizontal line */}
              <line
                x1={paddingLeft}
                y1={mousePos.y}
                x2={plotWidth + paddingLeft}
                y2={mousePos.y}
                stroke="#787b86"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              {/* Hover Price Tag on Right Axis */}
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

              {/* Hover Date Tag on Bottom Axis */}
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
  );
};
