import React from 'react';
import { Play, Pause, StepForward, RotateCcw, X, FastForward } from 'lucide-react';

interface BarReplayControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onResetToLive: () => void;
  currentBarIndex: number;
  totalBars: number;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onExitReplay: () => void;
}

export const BarReplayControls: React.FC<BarReplayControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onResetToLive,
  currentBarIndex,
  totalBars,
  speed,
  onSpeedChange,
  onExitReplay
}) => {
  return (
    <div className="flex items-center gap-2 bg-[#171b26] border border-[#2962ff]/50 px-3 py-1.5 rounded-lg text-xs font-mono select-none shadow-lg">
      <div className="flex items-center gap-1.5 pr-2 border-r border-[#2a2e39]">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-bold text-amber-400 text-[11px] uppercase tracking-wider">
          Bar Replay
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePlay}
          className="p-1.5 bg-[#2962ff] hover:bg-[#1e53e5] text-white rounded transition-colors"
          title={isPlaying ? 'Pause Replay' : 'Play Replay'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onStepForward}
          disabled={currentBarIndex >= totalBars}
          className="p-1.5 bg-[#1e222d] hover:bg-[#2a2e39] text-[#d1d4dc] disabled:text-[#787b86]/40 rounded transition-colors"
          title="Step forward 1 candle"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetToLive}
          className="p-1.5 bg-[#1e222d] hover:bg-[#2a2e39] text-[#d1d4dc] rounded transition-colors"
          title="Reset to first bar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1 pl-2 border-l border-[#2a2e39]">
        <span className="text-[#787b86] text-[10px]">Speed:</span>
        {[1, 3, 5].map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              speed === s ? 'bg-[#2a2e39] text-[#2962ff]' : 'text-[#787b86] hover:text-white'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="text-[11px] text-[#787b86] pl-2 border-l border-[#2a2e39] tabular-nums">
        Bar <strong className="text-white">{currentBarIndex}</strong>/{totalBars}
      </div>

      <button
        onClick={onExitReplay}
        className="p-1 ml-1 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded transition-colors"
        title="Exit Replay Mode"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
