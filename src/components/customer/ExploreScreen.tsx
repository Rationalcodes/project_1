import React, { useState } from 'react';
import {
  Search,
  Star,
  Users,
  Navigation,
  MapPin,
  CheckCircle2,
  Heart,
  SlidersHorizontal,
  X,
  Store,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  getQueueDisplay,
  matchesGenderFilter,
  getSalonType,
} from '../../context/SalonContext';
import { Salon } from '@kumbhakaran/shared-types';

type SortOption = 'all' | 'queue' | 'distance' | 'rating' | 'open';

export const ExploreScreen: React.FC = () => {
  const {
    salons,
    searchQuery,
    setSearchQuery,
    setSelectedSalonForDetail,
    toggleFavorite,
    userProfile,
    comparisonList,
    setIsCompareOpen,
    genderFilter,
  } = useSalon();

  const [activeFilter, setActiveFilter] = useState<SortOption>('all');
  const isWomen = genderFilter === 'women';

  // Sorting & Filtering for Explore
  const processedSalons = salons
    .filter((salon) => {
      if (!matchesGenderFilter(salon, genderFilter)) return false;
      if (activeFilter === 'open' && !salon.isOpen) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          salon.name.toLowerCase().includes(q) ||
          salon.locality.toLowerCase().includes(q) ||
          salon.city.toLowerCase().includes(q) ||
          (salon.tagline && salon.tagline.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'queue') return a.currentQueue - b.currentQueue;
      if (activeFilter === 'distance') return a.distanceKm - b.distanceKm;
      if (activeFilter === 'rating') return b.rating - a.rating;
      return 0; // 'all' or default
    });

  return (
    <div className="space-y-4 pb-28 text-stone-900">
      {/* 1. Sleek Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className={`w-4 h-4 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isWomen
                ? 'Search parlour name, locality or city...'
                : 'Search salon name, locality or city...'
            }
            className={`w-full pl-10 pr-9 py-2.5 bg-white border ${
              isWomen
                ? 'border-[#FED7CC] focus:border-[#E11D48]'
                : 'border-[#E2DDD5] focus:border-[#FF6422]'
            } rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-xs transition-colors`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Compact Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border ${
              activeFilter === 'all'
                ? isWomen
                  ? 'bg-[#E11D48] text-white border-rose-500 shadow-xs'
                  : 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
            }`}
          >
            All Salons
          </button>

          <button
            onClick={() => setActiveFilter('queue')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
              activeFilter === 'queue'
                ? isWomen
                  ? 'bg-[#E11D48] text-white border-rose-500 shadow-xs'
                  : 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Lowest Queue</span>
          </button>

          <button
            onClick={() => setActiveFilter('distance')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
              activeFilter === 'distance'
                ? isWomen
                  ? 'bg-[#E11D48] text-white border-rose-500 shadow-xs'
                  : 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Nearest</span>
          </button>

          <button
            onClick={() => setActiveFilter('rating')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
              activeFilter === 'rating'
                ? isWomen
                  ? 'bg-[#E11D48] text-white border-rose-500 shadow-xs'
                  : 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Top Rated</span>
          </button>

          <button
            onClick={() => setActiveFilter(activeFilter === 'open' ? 'all' : 'open')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border ${
              activeFilter === 'open'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                activeFilter === 'open' ? 'bg-white' : 'bg-emerald-500'
              }`}
            />
            <span>Open Now</span>
          </button>

          {comparisonList.length > 0 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1 border ml-auto ${
                isWomen
                  ? 'bg-rose-50 text-[#E11D48] border-rose-200'
                  : 'bg-orange-50 text-[#FF6422] border-orange-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Compare ({comparisonList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Results Header Summary */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-0.5">
        <span className="font-semibold text-stone-700">
          Showing {processedSalons.length} {isWomen ? 'studios' : 'salons'}
        </span>
        <span className="text-[11px] text-stone-400">
          Tap card for services & live queue token
        </span>
      </div>

      {/* 3. Salon Cards List (Displaying Basic Details ONLY) */}
      {processedSalons.length === 0 ? (
        <div
          className={`bg-white border rounded-3xl p-8 text-center space-y-3 shadow-xs ${
            isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
              isWomen
                ? 'bg-rose-50 border-rose-200 text-[#E11D48]'
                : 'bg-orange-50 border-orange-200 text-[#FF6422]'
            }`}
          >
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">
            {isWomen ? 'No beauty studios found' : 'No salons found'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? `No salons match "${searchQuery}". Reset search to explore all available salons.`
              : 'No salons currently match this filter. Try viewing all salons.'}
          </p>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs cursor-pointer ${
                isWomen ? 'bg-[#E11D48] hover:bg-rose-700' : 'bg-[#FF723A] hover:bg-orange-600'
              }`}
            >
              Show All Salons
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {processedSalons.map((salon) => {
            const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
            const waitTime = getEstimatedWaitMinutes(
              salon.currentQueue,
              salon.avgServiceTimeMinutes,
              salon.activeBarbers
            );
            const isSaved = userProfile.savedSalons.includes(salon.id);
            const salonType = getSalonType(salon);
            const cover =
              salon.coverImage ||
              salon.posterImage ||
              (salon.images && salon.images[0]) ||
              (salon.locationImages && salon.locationImages[0]) ||
              '';

            return (
              <div
                key={salon.id}
                onClick={() => setSelectedSalonForDetail(salon)}
                className={`group bg-white border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                  isWomen
                    ? 'rounded-2xl border-[#FED7CC] hover:border-rose-400'
                    : 'rounded-2xl border-[#E8E2D8] hover:border-orange-400'
                }`}
              >
                {/* Salon Image with Core Floating Badges */}
                <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-stone-100">
                  {cover ? (
                    <img
                      src={cover}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex flex-col items-center justify-center text-white p-4 text-center">
                      <Store className="w-8 h-8 text-[#FF6422] mb-1" />
                      <span className="text-sm font-black line-clamp-1">{salon.name}</span>
                      <span className="text-xs text-stone-400">{salon.locality}</span>
                    </div>
                  )}

                  {/* Gradient shadow for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Top-Left: Live Queue Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md ${queueInfo.badgeClass}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
                      {salon.currentQueue === 0
                        ? '0 Waiting • Immediate Chair'
                        : `${salon.currentQueue} in line • ~${waitTime}m wait`}
                    </span>
                  </div>

                  {/* Top-Right: Favorite Button */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(salon.id);
                      }}
                      className="p-2 rounded-full bg-white/90 text-stone-600 hover:text-rose-500 border border-stone-200 backdrop-blur-md transition-colors shadow-xs"
                      title={isSaved ? 'Remove from saved' : 'Save salon'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isSaved ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Bottom Image Overlay: Salon Type Badge & Distance */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${
                        salonType === 'men'
                          ? 'bg-blue-900/80 text-blue-100 border-blue-400/40'
                          : salonType === 'women'
                          ? 'bg-rose-900/80 text-rose-100 border-rose-400/40'
                          : 'bg-stone-900/80 text-stone-100 border-stone-400/40'
                      }`}
                    >
                      {salonType === 'men'
                        ? 'Men Only'
                        : salonType === 'women'
                        ? 'Women Only'
                        : 'Unisex Salon'}
                    </span>

                    {salon.distanceKm !== undefined && (
                      <span className="text-xs font-semibold drop-shadow-md text-white/95 flex items-center gap-1">
                        <Navigation className="w-3 h-3 fill-current" />
                        <span>{salon.distanceKm.toFixed(1)} km</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Basic Details ONLY */}
                <div className="p-4 space-y-2">
                  {/* Name and Rating */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-base sm:text-lg font-black text-stone-900 truncate tracking-tight group-hover:text-[#FF6422] transition-colors">
                          {salon.name}
                        </h2>
                        {salon.isVerified && (
                          <CheckCircle2
                            className={`w-4 h-4 shrink-0 ${
                              isWomen ? 'text-rose-500' : 'text-[#FF6422]'
                            }`}
                          />
                        )}
                      </div>

                      {/* Locality & Address */}
                      <p className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          {salon.locality}
                          {salon.city ? `, ${salon.city}` : ''}
                        </span>
                      </p>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-xl text-amber-900 font-extrabold text-xs shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{salon.rating || 5.0}</span>
                      {salon.reviewCount ? (
                        <span className="text-[10px] text-amber-700/80 font-normal">
                          ({salon.reviewCount})
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Bottom Row: Starting Price & Open/Closed Status */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-stone-500">Starts at</span>
                      <span className="text-sm font-black text-stone-900">
                        ₹{salon.startingPrice || 150}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold flex items-center gap-1 ${
                          salon.isOpen !== false
                            ? 'text-emerald-700'
                            : 'text-stone-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            salon.isOpen !== false
                              ? 'bg-emerald-500'
                              : 'bg-stone-300'
                          }`}
                        />
                        {salon.isOpen !== false ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
