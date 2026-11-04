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
      badgeClass: 'bg-stone-100 text-stone-600 border border-stone-200',
      pillClass: 'bg-stone-100 text-stone-600 border-stone-200',
      dotClass: 'bg-stone-400',
    };
  }
  if (currentQueue === 0) {
    return {
      label: 'Zero Wait • Walk Straight In',
      shortLabel: '0 waiting',
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500 animate-pulse',
    };
  }
  if (currentQueue <= 2) {
    return {
      label: 'Low Queue • Quick Turnaround',
      shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500 animate-pulse',
    };
  }
  if (currentQueue <= 6) {
    return {
      label: 'Moderate Queue • Normal Flow',
      shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
      badgeClass: 'bg-orange-50 text-orange-800 border border-orange-200',
      pillClass: 'bg-orange-50 text-orange-700 border-orange-200',
      dotClass: 'bg-orange-500',
    };
  }
  return {
    label: 'High Queue • Extended Wait',
    shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
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
