import React, { useState } from 'react';
import { PriceAlert, MarketAsset } from '../types/market';
import { formatPrice } from '../utils/technicalAnalysis';
import { Bell, Plus, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PriceAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MarketAsset;
  alerts: PriceAlert[];
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => void;
  onDeleteAlert: (id: string) => void;
}

export const PriceAlertsModal: React.FC<PriceAlertsModalProps> = ({
  isOpen,
  onClose,
  asset,
  alerts,
  onAddAlert,
  onDeleteAlert
}) => {
  const [targetPrice, setTargetPrice] = useState<number>(Number((asset.price * 1.02).toFixed(2)));
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [note, setNote] = useState<string>('Breakout resistance level');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) return;
    onAddAlert({
      symbol: asset.symbol,
      targetPrice,
      condition,
      note
    });
    setNote('');
  };

  const assetAlerts = alerts.filter(a => a.symbol === asset.symbol);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#1e222d] border border-[#2a2e39] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2e39] bg-[#171b26]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Create Alert · {asset.symbol} ({formatPrice(asset.price)})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#787b86] hover:text-white rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Alert Form */}
        <form onSubmit={handleSubmit} className="p-5 border-b border-[#2a2e39] space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#787b86] mb-1 font-medium">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-white font-medium focus:border-[#2962ff] focus:outline-none"
              >
                <option value="above">Crossing Above</option>
                <option value="below">Crossing Below</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#787b86] mb-1 font-medium">Target Price</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-white font-mono focus:border-[#2962ff] focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#787b86] mb-1 font-medium">Alert Note / Trigger Message</label>
            <input
              type="text"
              placeholder="e.g. Major resistance breakout target"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-[#131722] border border-[#2a2e39] rounded px-3 py-1.5 text-white focus:border-[#2962ff] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#2962ff] hover:bg-[#1e53e5] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Set Real-Time Price Alert</span>
          </button>
        </form>

        {/* Existing Alerts List */}
        <div className="p-5 space-y-2 max-h-56 overflow-y-auto">
          <h4 className="text-[11px] font-bold text-[#787b86] uppercase tracking-wider mb-2">
            Active Alerts for {asset.symbol} ({assetAlerts.length})
          </h4>

          {assetAlerts.length === 0 ? (
            <div className="p-4 text-center text-[#787b86] text-xs bg-[#131722] rounded border border-[#2a2e39]">
              No active alerts configured for {asset.symbol}.
            </div>
          ) : (
            assetAlerts.map((alt) => (
              <div
                key={alt.id}
                className="p-3 bg-[#131722] border border-[#2a2e39] rounded-lg flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{alt.symbol}</span>
                    <span className="text-[#787b86]">
                      {alt.condition === 'above' ? '≥' : '≤'} {formatPrice(alt.targetPrice)}
                    </span>
                    {alt.triggered && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-[#089981]/20 text-[#089981]">
                        Triggered
                      </span>
                    )}
                  </div>
                  {alt.note && <div className="text-[11px] text-[#787b86] font-sans mt-0.5">{alt.note}</div>}
                </div>

                <button
                  onClick={() => onDeleteAlert(alt.id)}
                  className="p-1.5 text-[#787b86] hover:text-rose-400 rounded transition-colors"
                  title="Delete alert"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
