import React from 'react';
import { useSalon, getEstimatedWaitMinutes } from '../../context/CustomerContext';
import { LazyFilter } from '@kumbhakaran/shared-types';
import { Zap, Coffee, Clock, Hourglass } from 'lucide-react';

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
      sublabel: 'Quick walk-in',
      icon: Zap,
      accentColor: 'text-emerald-600',
      borderActive: 'border-emerald-400',
      bgActive: 'bg-emerald-50',
      filterFn: (w) => w <= 5
    },
    {
      id: '5-15',
      label: '5–15 min',
      sublabel: 'Short wait',
      icon: Coffee,
      accentColor: 'text-amber-600',
      borderActive: 'border-amber-400',
      bgActive: 'bg-amber-50',
      filterFn: (w) => w > 5 && w <= 15
    },
    {
      id: '15-30',
      label: '15–30 min',
      sublabel: 'Moderate wait',
      icon: Clock,
      accentColor: 'text-[#FF6422]',
      borderActive: 'border-orange-400',
      bgActive: 'bg-orange-50',
      filterFn: (w) => w > 15 && w <= 30
    },
    {
      id: '30+',
      label: '30+ min',
      sublabel: 'Long wait',
      icon: Hourglass,
      accentColor: 'text-rose-600',
      borderActive: 'border-rose-400',
      bgActive: 'bg-rose-50',
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
    <div className="bg-white border border-[#E8E2D8] rounded-2xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-orange-100 text-[#FF6422] flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Wait Time Filter
            </h3>
            <p className="text-[10px] text-stone-500">
              Filter salons by current waiting time
            </p>
          </div>
        </div>

        {lazyFilter !== 'all' && (
          <button
            onClick={() => setLazyFilter('all')}
            className="text-[11px] text-[#FF6422] hover:text-orange-700 font-semibold px-2 py-0.5 rounded bg-orange-50 border border-orange-200 shadow-xs"
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
              className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group shadow-xs ${
                isSelected
                  ? `${opt.borderActive} ${opt.bgActive} shadow-sm ring-1 ring-orange-400/30`
                  : 'border-[#E2DDD5] bg-[#FAF7F2] hover:bg-white hover:border-orange-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${opt.accentColor}`} />
                  <span className={`text-xs font-bold ${isSelected ? 'text-stone-900' : 'text-stone-800'}`}>
                    {opt.label}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold border ${
                  isSelected ? 'bg-white text-stone-900 border-stone-200' : 'bg-white text-stone-500 border-stone-200'
                }`}>
                  {count}
                </span>
              </div>

              <p className="text-[10px] text-stone-500 line-clamp-1">
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
