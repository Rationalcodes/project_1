import React from 'react';

export interface QueueBadgeProps {
  currentQueue: number;
  isOpen: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const getQueueStatus = (currentQueue: number, isOpen: boolean) => {
  if (!isOpen) {
    return {
      label: 'Closed',
      shortLabel: 'Closed',
      badgeClass: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700',
      pillClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      dotClass: 'bg-zinc-500',
    };
  }
  if (currentQueue === 0) {
    return {
      label: 'Zero Wait • Walk Straight In',
      shortLabel: '0 waiting',
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30',
      pillClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-400 animate-pulse',
    };
  }
  if (currentQueue <= 2) {
    return {
      label: 'Low Queue • Quick Turnaround',
      shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30',
      pillClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-400 animate-pulse',
    };
  }
  if (currentQueue <= 6) {
    return {
      label: 'Moderate Queue • Normal Flow',
      shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
      badgeClass: 'bg-amber-950/70 text-amber-300 border border-amber-500/30',
      pillClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      dotClass: 'bg-amber-400',
    };
  }
  return {
    label: 'High Queue • Extended Wait',
    shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
    badgeClass: 'bg-rose-950/70 text-rose-300 border border-rose-500/30',
    pillClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-500',
  };
};

export const QueueBadge: React.FC<QueueBadgeProps> = ({ currentQueue, isOpen, size = 'md' }) => {
  const status = getQueueStatus(currentQueue, isOpen);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1.5 text-sm font-bold' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${status.badgeClass} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
      <span>{status.label}</span>
    </span>
  );
};
