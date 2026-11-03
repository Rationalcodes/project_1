import React from 'react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/SalonContext';
import { X, Star, Users, Clock, Navigation, IndianRupee, Scissors } from 'lucide-react';

export const CompareModal: React.FC = () => {
  const {
    comparisonList,
    toggleCompareSalon,
    clearComparison,
    isCompareOpen,
    setIsCompareOpen,
    salons,
    setSelectedSalonForDetail
  } = useSalon();

  if (!isCompareOpen || comparisonList.length === 0) return null;

  const compareSalons = salons.filter(s => comparisonList.includes(s.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#121217] border border-zinc-800 rounded-3xl max-w-4xl w-full p-5 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Salon Comparison ({compareSalons.length}/3)
            </h2>
            <p className="text-xs text-zinc-400">
              Evaluate real-time queues, distance, and pricing side-by-side before leaving
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearComparison}
              className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsCompareOpen(false)}
              className="p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {compareSalons.map((salon) => {
            const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
            const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);
            const freshness = getQueueFreshness(salon.lastQueueUpdate);

            return (
              <div key={salon.id} className="bg-[#181820] border border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between relative group">
                <button
                  onClick={() => toggleCompareSalon(salon.id)}
                  title="Remove from comparison"
                  className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/60 text-zinc-400 hover:text-white backdrop-blur-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div>
                  <div className="h-32 rounded-xl overflow-hidden mb-3 relative">
                    <img
                      src={salon.coverImage}
                      alt={salon.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate drop-shadow">
                        {salon.name}
                      </span>
                      <span className="flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {salon.rating}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Live Queue Badge */}
                  <div className={`p-3 rounded-xl border mb-3 text-center ${queueInfo.badgeClass}`}>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-0.5">
                      Waiting Right Now
                    </div>
                    <div className="text-2xl font-extrabold text-white flex items-center justify-center gap-1.5">
                      <Users className="w-5 h-5 text-amber-400" />
                      {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue}
                      <span className="text-xs font-normal text-zinc-400">People</span>
                    </div>
                    <div className="text-[11px] font-semibold mt-1">
                      ~{waitTime} min wait time
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {freshness.text}
                    </div>
                  </div>

                  {/* Attributes comparison */}
                  <div className="space-y-2 text-xs divide-y divide-zinc-800/60">
                    <div className="flex items-center justify-between pt-1 text-zinc-300">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Navigation className="w-3 h-3" /> Distance
                      </span>
                      <span className="font-semibold text-white">{salon.distanceKm} km away</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-zinc-300">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" /> Starting Price
                      </span>
                      <span className="font-semibold text-amber-400">₹{salon.startingPrice}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-zinc-300">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Scissors className="w-3 h-3" /> Active Barbers
                      </span>
                      <span className="font-semibold text-white">{salon.activeBarbers} Stylists</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-zinc-300">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Hours
                      </span>
                      <span className="font-semibold text-zinc-300 text-[11px] truncate max-w-[120px]">
                        {salon.openingHours.open} - {salon.openingHours.close}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => {
                      setIsCompareOpen(false);
                      setSelectedSalonForDetail(salon);
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors"
                  >
                    View Salon Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
