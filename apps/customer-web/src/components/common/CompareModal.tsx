import React from 'react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/CustomerContext';
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
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-[#E8E2D8] rounded-3xl max-w-4xl w-full p-5 shadow-2xl relative text-stone-900">
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FF6422]" />
              Salon Comparison ({compareSalons.length}/3)
            </h2>
            <p className="text-xs text-stone-500">
              Evaluate real-time queues, distance, and pricing side-by-side before leaving
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearComparison}
              className="text-xs text-stone-600 hover:text-stone-900 px-2 py-1 rounded bg-stone-100 border border-stone-200"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsCompareOpen(false)}
              className="p-1 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900"
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
              <div key={salon.id} className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-4 flex flex-col justify-between relative group">
                <button
                  onClick={() => toggleCompareSalon(salon.id)}
                  title="Remove from comparison"
                  className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/90 text-stone-600 hover:text-stone-900 border border-stone-200 shadow-xs backdrop-blur-sm"
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
                      <span className="flex items-center gap-1 bg-white/95 px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-800 border border-amber-200 shadow-xs">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {salon.rating}
                      </span>
                    </div>
                  </div>

                  {/* Prominent Live Queue Badge */}
                  <div className={`p-3 rounded-xl border mb-3 text-center ${queueInfo.badgeClass}`}>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-0.5">
                      Waiting Right Now
                    </div>
                    <div className="text-2xl font-extrabold text-stone-900 flex items-center justify-center gap-1.5">
                      <Users className="w-5 h-5 text-[#FF6422]" />
                      {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue}
                      <span className="text-xs font-normal text-stone-500">People</span>
                    </div>
                    <div className="text-[11px] font-semibold mt-1">
                      ~{waitTime} min wait time
                    </div>
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      {freshness.text}
                    </div>
                  </div>

                  {/* Attributes comparison */}
                  <div className="space-y-2 text-xs divide-y divide-[#E8E2D8]">
                    <div className="flex items-center justify-between pt-1 text-stone-700">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-[#FF6422]" /> Distance
                      </span>
                      <span className="font-semibold text-stone-900">{salon.distanceKm} km away</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-stone-700">
                      <span className="text-stone-500 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3 text-[#FF6422]" /> Starting Price
                      </span>
                      <span className="font-extrabold text-stone-900">₹{salon.startingPrice}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-stone-700">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Scissors className="w-3 h-3 text-[#FF6422]" /> Active Barbers
                      </span>
                      <span className="font-semibold text-stone-900">{salon.activeBarbers} Stylists</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-stone-700">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#FF6422]" /> Hours
                      </span>
                      <span className="font-semibold text-stone-700 text-[11px] truncate max-w-[120px]">
                        {salon.openingHours?.open || '09:00 AM'} - {salon.openingHours?.close || '09:30 PM'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E2D8]">
                  <button
                    onClick={() => {
                      setIsCompareOpen(false);
                      setSelectedSalonForDetail(salon);
                    }}
                    className="w-full py-2 rounded-xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 transition-colors shadow-xs"
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
