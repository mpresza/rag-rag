import React from 'react';
import { DrawingTool } from '../types/market';
import {
  Crosshair,
  TrendingUp,
  Minus,
  Percent,
  Sliders,
  Ruler,
  Trash2,
  Undo2,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';

interface DrawingToolbarProps {
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  drawingsCount: number;
  onClearAll: () => void;
  onUndo: () => void;
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
  showDrawings: boolean;
  setShowDrawings: (v: boolean) => void;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  setActiveTool,
  drawingsCount,
  onClearAll,
  onUndo,
  isLocked,
  setIsLocked,
  showDrawings,
  setShowDrawings
}) => {
  const tools: { id: DrawingTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cursor', label: 'Crosshair (Pointer)', icon: Crosshair },
    { id: 'trendline', label: 'Trendline Ray', icon: TrendingUp },
    { id: 'horizontal', label: 'Horizontal Support / Resistance', icon: Minus },
    { id: 'fibonacci', label: 'Fibonacci Retracement (Golden Ratio)', icon: Percent },
    { id: 'position', label: 'Long / Short Risk-Reward Projection', icon: Sliders },
    { id: 'ruler', label: 'Price & Bar Measurement Ruler', icon: Ruler },
  ];

  return (
    <div className="flex flex-col items-center bg-[#1e222d] border-r border-[#2a2e39] py-2 px-1 gap-1 select-none z-20 shrink-0">
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;

        return (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`p-2 rounded-md transition-all group relative ${
              isActive
                ? 'bg-[#2962ff] text-white shadow-sm'
                : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#2a2e39]'
            }`}
            title={t.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      <div className="w-6 h-px bg-[#2a2e39] my-1" />

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={drawingsCount === 0}
        className={`p-2 rounded-md transition-colors ${
          drawingsCount > 0 ? 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]' : 'text-[#787b86]/30 cursor-not-allowed'
        }`}
        title="Undo last drawing"
      >
        <Undo2 className="w-4 h-4" />
      </button>

      {/* Lock drawings */}
      <button
        onClick={() => setIsLocked(!isLocked)}
        className={`p-2 rounded-md transition-colors ${
          isLocked ? 'text-amber-400 bg-amber-400/10' : 'text-[#787b86] hover:text-white hover:bg-[#2a2e39]'
        }`}
        title={isLocked ? 'Unlock drawings' : 'Lock drawings in place'}
      >
        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>

      {/* Hide / Show drawings */}
      <button
        onClick={() => setShowDrawings(!showDrawings)}
        className="p-2 text-[#787b86] hover:text-white hover:bg-[#2a2e39] rounded-md transition-colors"
        title={showDrawings ? 'Hide drawings' : 'Show drawings'}
      >
        {showDrawings ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-400" />}
      </button>

      {/* Clear all */}
      <button
        onClick={onClearAll}
        disabled={drawingsCount === 0}
        className={`p-2 rounded-md transition-colors ${
          drawingsCount > 0 ? 'text-[#787b86] hover:text-rose-400 hover:bg-[#2a2e39]' : 'text-[#787b86]/30 cursor-not-allowed'
        }`}
        title={`Clear all drawings (${drawingsCount})`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
