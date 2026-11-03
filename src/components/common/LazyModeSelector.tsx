import React from 'react';
import { useSalon, getEstimatedWaitMinutes } from '../../context/SalonContext';
import { LazyFilter } from '../../types';
import { Zap, Coffee, Clock, Coffee as Hourglass, Sparkles } from 'lucide-react';

export const LazyModeSelector: React.FC = () => {
  const { lazyFilter, setLazyFilter, salons } = useSalon();

  const options: {
    id: LazyFilter;
    label: string;
    sublabel: string;
    icon: React.FC<{ className?: string }>;
    accentColor: string;
    borderActive: string;
    bgActive: string;
    filterFn: (waitMins: number) => boolean;
  }[] = [
    {
      id: '0-5',
      label: '0–5 min',
      sublabel: 'No time to waste',
      icon: Zap,
      accentColor: 'text-emerald-400',
      borderActive: 'border-emerald-500/50',
      bgActive: 'bg-emerald-500/15',
      filterFn: (w) => w <= 5
    },
    {
      id: '5-15',
      label: '5–15 min',
      sublabel: 'Just chilling',
      icon: Coffee,
      accentColor: 'text-amber-400',
      borderActive: 'border-amber-500/50',
      bgActive: 'bg-amber-500/15',
      filterFn: (w) => w > 5 && w <= 15
    },
    {
      id: '15-30',
      label: '15–30 min',
      sublabel: 'A little patience',
      icon: Clock,
      accentColor: 'text-orange-400',
      borderActive: 'border-orange-500/50',
      bgActive: 'bg-orange-500/15',
      filterFn: (w) => w > 15 && w <= 30
    },
    {
      id: '30+',
      label: '30+ min',
      sublabel: 'Maybe somewhere else!',
      icon: Hourglass,
      accentColor: 'text-rose-400',
      borderActive: 'border-rose-500/50',
      bgActive: 'bg-rose-500/15',
      filterFn: (w) => w > 30
    }
  ];

  const getCount = (filterFn: (w: number) => boolean) => {
    return salons.filter(s => {
      const wait = getEstimatedWaitMinutes(s.currentQueue, s.avgServiceTimeMinutes, s.activeBarbers);
      return s.isOpen && filterFn(wait);
    }).length;
  };

  return (
    <div className="bg-gradient-to-b from-[#14141a] to-[#0e0e13] border border-zinc-800/80 rounded-2xl p-3.5 shadow-xl">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Lazy Mode Filter
            </h3>
            <p className="text-[10px] text-zinc-400">
              Filter by your exact patience limit right now
            </p>
          </div>
        </div>

        {lazyFilter !== 'all' && (
          <button
            onClick={() => setLazyFilter('all')}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20"
          >
            Reset
          </button>
        )}
      </div>

      {/* Grid of 4 patience options */}
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = lazyFilter === opt.id;
          const count = getCount(opt.filterFn);

          return (
            <button
              key={opt.id}
              onClick={() => setLazyFilter(isSelected ? 'all' : opt.id)}
              className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? `${opt.borderActive} ${opt.bgActive} shadow-lg shadow-black/40`
                  : 'border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/60 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${opt.accentColor}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                    {opt.label}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-black/60 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {count}
                </span>
              </div>

              <p className="text-[10px] text-zinc-400 line-clamp-1">
                {opt.sublabel}
              </p>

              {isSelected && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${opt.accentColor.replace('text', 'bg')}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
