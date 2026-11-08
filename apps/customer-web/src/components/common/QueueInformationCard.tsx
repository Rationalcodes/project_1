import React from 'react';
import { Users, Clock, AlertCircle, Wifi, Store } from 'lucide-react';
import { getQueuePresentation, getQueueFreshnessText, GenderExperience } from '../../theme';

interface QueueInformationCardProps {
  queueCount: number;
  isOpen?: boolean;
  queueStatus?: 'open' | 'paused' | 'closed';
  lastQueueUpdate?: string | null;
  experience?: GenderExperience;
  compact?: boolean;
  className?: string;
}

export const QueueInformationCard: React.FC<QueueInformationCardProps> = ({
  queueCount,
  isOpen = true,
  queueStatus = 'open',
  lastQueueUpdate,
  experience = 'men',
  compact = false,
  className = '',
}) => {
  const isWomen = experience === 'women';
  const queueMeta = getQueuePresentation(queueCount, isOpen, queueStatus);
  const freshness = getQueueFreshnessText(lastQueueUpdate);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition-all ${queueMeta.badgeBg} ${queueMeta.badgeText} ${queueMeta.badgeBorder} ${className}`}
      >
        <span className={`w-2 h-2 rounded-full ${queueMeta.dotColor} ${queueMeta.statusType === 'zero' || queueMeta.statusType === 'low' ? 'animate-pulse' : ''}`} />
        <span>
          {queueMeta.statusType === 'closed'
            ? 'Closed'
            : queueMeta.statusType === 'paused'
            ? 'Paused'
            : `${queueCount < 10 ? '0' + queueCount : queueCount} Waiting`}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl p-5 border transition-all relative overflow-hidden bg-white ${
        isWomen ? 'border-rose-200/80 shadow-[0_4px_24px_rgba(225,29,72,0.06)]' : 'border-orange-200/80 shadow-[0_4px_24px_rgba(255,100,34,0.06)]'
      } ${className}`}
    >
      {/* Background glow accent */}
      <div
        className={`absolute -right-8 -top-8 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isWomen ? 'bg-rose-400' : 'bg-orange-400'
        }`}
      />

      {/* Header Row: Status tag + Synced indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${queueMeta.dotColor} ${queueMeta.statusType === 'zero' || queueMeta.statusType === 'low' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-black uppercase tracking-wider text-stone-900">
            Live Queue Status
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500">
          <Wifi className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>Synced live with salon</span>
        </div>
      </div>

      {/* Main Counter Display */}
      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500 mb-1">
            Current Physical Waiting Count
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-stone-950 tracking-tight">
              {queueMeta.statusType === 'closed'
                ? 'Closed'
                : queueCount < 10
                ? `0${queueCount}`
                : queueCount}
            </span>
            <span className="text-sm sm:text-base font-semibold text-stone-500 uppercase tracking-wider">
              {queueCount === 1 ? 'Person Waiting' : 'People Waiting'}
            </span>
          </div>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border border-stone-200 bg-stone-50 text-stone-800">
            <Users className="w-3.5 h-3.5 text-stone-600" />
            <span>{queueMeta.label}</span>
          </div>
        </div>

        {/* Studio Observation Summary Box */}
        <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-4 sm:w-64 shrink-0">
          <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-stone-700" />
            Walk-in Insight
          </div>
          <p className="text-xs text-stone-800 font-semibold mt-1.5 leading-snug">
            {queueMeta.detailLabel}
          </p>
          <p className="text-[10px] text-stone-500 mt-2 leading-relaxed">
            Maintained directly by studio staff. Check queue and walk in at your convenience.
          </p>
        </div>
      </div>

      {/* Footer Timestamp / Freshness Guard */}
      <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-stone-500 font-medium">
          <Clock className="w-3.5 h-3.5 text-stone-400" />
          <span>{freshness.text}</span>
        </div>

        {freshness.isStale && (
          <div className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px] font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Count may have changed recently</span>
          </div>
        )}
      </div>
    </div>
  );
};
