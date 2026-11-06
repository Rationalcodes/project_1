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
  Ticket,
  Map as MapIcon,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  getQueueDisplay,
  matchesGenderFilter,
  getSalonType,
} from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';
import { LiveQueueTrackerView } from './LiveQueueTrackerView';
import { MapScreen } from './MapScreen';

type ExploreViewMode = 'studios' | 'queue' | 'map';
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
    activeTicket,
  } = useSalon();

  const [viewMode, setViewMode] = useState<ExploreViewMode>('studios');
  const [activeFilter, setActiveFilter] = useState<SortOption>('all');
  const [trackerSalon, setTrackerSalon] = useState<Salon | null>(null);

  const isWomen = genderFilter === 'women';
  const primaryHex = isWomen ? '#E11D48' : '#FF6422';

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
      {/* 1. TOP SEGMENTED CONTROLLER (Dedicated Views for Studios, Live Queue & Tokens, Studio Map) */}
      <div className="sticky top-0 z-30 pt-1 pb-2 bg-[#FAF7F2]/90 backdrop-blur-md">
        <div className="bg-white/90 p-1 rounded-2xl border border-[#E8E2D8] shadow-xs flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('studios')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'studios'
                ? isWomen
                  ? 'bg-[#E11D48] text-white shadow-xs'
                  : 'bg-[#FF6422] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Explore Studios</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('queue')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              viewMode === 'queue'
                ? isWomen
                  ? 'bg-[#E11D48] text-white shadow-xs'
                  : 'bg-[#FF6422] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Live Queue</span>
            {activeTicket ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              viewMode === 'map'
                ? isWomen
                  ? 'bg-[#E11D48] text-white shadow-xs'
                  : 'bg-[#FF6422] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: LIVE QUEUE & TOKENS VIEW (Matches user's screenshot) */}
      {viewMode === 'queue' && (
        <LiveQueueTrackerView
          initialSalon={trackerSalon || processedSalons[0] || null}
          onOpenSalonDetails={(s) => setSelectedSalonForDetail(s)}
          onSwitchToMap={() => setViewMode('map')}
        />
      )}

      {/* VIEW MODE 2: MAP VIEW */}
      {viewMode === 'map' && (
        <div className="rounded-3xl overflow-hidden border border-[#E8E2D8] bg-white shadow-sm min-h-[550px]">
          <MapScreen />
        </div>
      )}

      {/* VIEW MODE 3: STUDIOS DIRECTORY LIST */}
      {viewMode === 'studios' && (
        <>
          {/* Sleek Search & Filter Bar */}
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
                    ? isWomen
                      ? 'bg-[#E11D48] text-white border-rose-500 shadow-xs'
                      : 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Open Now</span>
              </button>
            </div>
          </div>

          {/* Quick Counter Summary with One-Tap Queue Switch */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>
              Showing <strong className="text-stone-900">{processedSalons.length}</strong> studios
            </span>
            <button
              onClick={() => setViewMode('queue')}
              className={`font-bold flex items-center gap-1 text-[11px] ${
                isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'
              } hover:underline`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Track Live Queue & Token →</span>
            </button>
          </div>

          {/* Salons List */}
          {processedSalons.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-xs">
              <Store className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-800 font-bold text-sm">No studios found</p>
              <p className="text-stone-500 text-xs mt-1">
                Try loosening your search query or gender filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {processedSalons.map((salon) => {
                const waitTime = getEstimatedWaitMinutes(
                  salon.currentQueue,
                  salon.avgServiceTimeMinutes || 20,
                  salon.activeBarbers || 2
                );
                const queueInfo = getQueueDisplay(
                  salon.currentQueue,
                  salon.isOpen,
                  salon.queueStatus
                );
                const isFav = userProfile.savedSalons.includes(salon.id);
                const salonType = getSalonType(salon);

                return (
                  <div
                    key={salon.id}
                    onClick={() => setSelectedSalonForDetail(salon)}
                    className="bg-white rounded-2xl border border-[#E8E2D8] hover:border-orange-300 transition-all shadow-xs overflow-hidden cursor-pointer flex flex-col group"
                  >
                    {/* Top Image Banner with Badges */}
                    <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                      <img
                        src={salon.coverImage}
                        alt={salon.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Top Badges: Category & Favorite */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
                              salonType === 'men'
                                ? 'bg-black/60 text-orange-300 border border-orange-400/40'
                                : salonType === 'women'
                                ? 'bg-black/60 text-rose-300 border border-rose-400/40'
                                : 'bg-black/60 text-purple-200 border border-purple-400/40'
                            }`}
                          >
                            {salonType === 'men'
                              ? 'Men Only'
                              : salonType === 'women'
                              ? 'Women Only'
                              : 'Unisex Studio'}
                          </span>

                          {salon.featured && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-stone-950 flex items-center gap-1 shadow-xs">
                              <Sparkles className="w-3 h-3 fill-current" /> Featured
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(salon.id);
                          }}
                          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 active:scale-90 transition-transform"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? 'fill-rose-500 text-rose-500' : 'text-white'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Overlay Queue & Wait Pill at bottom of photo */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold backdrop-blur-md border ${
                              salon.isOpen !== false
                                ? 'bg-black/60 border-white/20'
                                : 'bg-black/70 border-red-500/30'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                salon.isOpen !== false
                                  ? queueInfo.dotClass
                                  : 'bg-stone-400'
                              }`}
                            />
                            <span>
                              {salon.isOpen !== false
                                ? `${salon.currentQueue} in Queue`
                                : 'Closed'}
                            </span>
                          </div>

                          {salon.isOpen !== false && (
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-black/60 backdrop-blur-md border border-white/20">
                              <Clock className="w-3.5 h-3.5 text-amber-300" />
                              <span>~{waitTime}m wait</span>
                            </div>
                          )}
                        </div>

                        {/* Quick 1-tap Live Queue shortcut */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTrackerSalon(salon);
                            setViewMode('queue');
                          }}
                          className={`px-2.5 py-1 rounded-xl text-xs font-black backdrop-blur-md shadow-xs border flex items-center gap-1 transition-transform active:scale-95 ${
                            isWomen
                              ? 'bg-[#E11D48] text-white border-rose-400'
                              : 'bg-[#FF6422] text-white border-orange-400'
                          }`}
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Queue Status</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {/* Salon Name & Verified Icon */}
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-black text-stone-900 truncate">
                              {salon.name}
                            </h3>
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
        </>
      )}
    </div>
  );
};
