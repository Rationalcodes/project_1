import { InstagramGradientIcon } from '../common/InstagramIcon';
import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  Users,
  Navigation,
  MapPin,
  Phone,
  CheckCircle2,
  Heart,
  X,
  Store,
  Clock,
  Sparkles,
  Map as MapIcon,
  ArrowRight,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  formatDuration,
  formatWaitTime,
  getQueueDisplay,
  matchesGenderFilter,
  getSalonType,
} from '../../context/CustomerContext';
import { MapScreen } from './MapScreen';

type ExploreViewMode = 'studios' | 'map';
type SortOption = 'all' | 'queue' | 'distance' | 'rating' | 'open';

export const ExploreScreen: React.FC = () => {
  const {
    salons,
    searchQuery,
    setSearchQuery,
    setSelectedSalonForDetail,
    toggleFavorite,
    userProfile,
    genderFilter,
  } = useSalon();

  const [viewMode, setViewMode] = useState<ExploreViewMode>('studios');
  const [activeFilter, setActiveFilter] = useState<SortOption>('all');

  const isWomen = genderFilter === 'women';

  // Filtered & Sorted Salon Records (Memoized for Phase 4 Optimization)
  const processedSalons = useMemo(() => {
    return salons
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
        return 0;
      });
  }, [salons, genderFilter, activeFilter, searchQuery]);

  return (
    <div className="space-y-4 pb-28 text-stone-900 max-w-5xl mx-auto">
      {/* 1. TOP HEADER & TWO-WAY TOGGLE: [ 🏢 Explore Studios | 🗺️ Map ] */}
      <header className="sticky top-0 z-30 pt-1 pb-2 bg-[var(--bg-main,#FAF7F2)]/95 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-black tracking-tight text-stone-950 flex items-center gap-2">
              <span>Explore Salons</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                {genderFilter === 'women' ? 'Women' : 'Men'}
              </span>
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">
              Browse salons, see current wait times, or tap Map to see what is around you.
            </p>
          </div>
        </div>

        {/* Clean 2-Way Segmented Control: [ Explore Studios | 🗺️ Map ] */}
        <div className="bg-stone-200/70 p-1 rounded-2xl flex items-center gap-1 max-w-md">
          <button
            type="button"
            onClick={() => setViewMode('studios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'studios'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <Store className="w-4 h-4 text-[#FF6422]" />
            <span>List View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <MapIcon className="w-4 h-4 text-emerald-600" />
            <span>Map</span>
          </button>
        </div>
      </header>

      {/* VIEW MODE 1: DEDICATED MAP VIEW ONLY */}
      {viewMode === 'map' && (
        <MapScreen onClose={() => setViewMode('studios')} isFullScreen={true} />
      )}

      {/* VIEW MODE 2: STUDIOS DIRECTORY LIST */}
      {viewMode === 'studios' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search className={`w-4 h-4 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isWomen
                  ? 'Search parlours by name, locality or city...'
                  : 'Search salons by name, locality or city...'
              }
              className={`w-full pl-10 pr-9 py-2.5 bg-white border ${
                isWomen
                  ? 'border-[#F1DDE3] focus:border-[#F47B70]'
                  : 'border-[#E7DED5] focus:border-[#FF6422]'
              } rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-xs transition-colors`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border cursor-pointer ${
                activeFilter === 'all'
                  ? isWomen
                    ? 'bg-[#F47B70] text-white border-[#F47B70] shadow-xs'
                    : 'bg-[#FF6422] text-white border-[#FF6422] shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              All Salons
            </button>

            <button
              onClick={() => setActiveFilter('queue')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                activeFilter === 'queue'
                  ? isWomen
                    ? 'bg-[#F47B70] text-white border-[#F47B70] shadow-xs'
                    : 'bg-[#FF6422] text-white border-[#FF6422] shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Shortest Wait</span>
            </button>

            <button
              onClick={() => setActiveFilter('distance')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                activeFilter === 'distance'
                  ? isWomen
                    ? 'bg-[#F47B70] text-white border-[#F47B70] shadow-xs'
                    : 'bg-[#FF6422] text-white border-[#FF6422] shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Closest to Me</span>
            </button>

            <button
              onClick={() => setActiveFilter('rating')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                activeFilter === 'rating'
                  ? isWomen
                    ? 'bg-[#F47B70] text-white border-[#F47B70] shadow-xs'
                    : 'bg-[#FF6422] text-white border-[#FF6422] shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Top Rated</span>
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === 'open' ? 'all' : 'open')}
              className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                activeFilter === 'open'
                  ? isWomen
                    ? 'bg-[#F47B70] text-white border-[#F47B70] shadow-xs'
                    : 'bg-[#FF6422] text-white border-[#FF6422] shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Open Now</span>
            </button>
          </div>

          {/* Subheader: Salon counter */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1 pt-1">
            <span>
              Showing <strong className="text-stone-900">{processedSalons.length}</strong> studios
            </span>
          </div>

          {/* Salon Card Directory */}
          {processedSalons.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-xs">
              <Store className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-800 font-bold text-sm">No studios found</p>
              <p className="text-stone-500 text-xs mt-1">
                Try loosening your search query or filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
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
                const isFav = userProfile.savedSalons.includes(salon.id);
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
                    className={`group bg-white rounded-3xl border ${
                      isWomen ? 'border-[#F1DDE3] hover:border-[#E9A0AA]' : 'border-[#E7DED5] hover:border-[#D97706]/40'
                    } overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col`}
                  >
                    {/* Clean Salon Photography */}
                    <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-stone-100">
                      {cover ? (
                        <img
                          src={cover}
                          alt={salon.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-white p-4 text-center">
                          <Store className="w-8 h-8 text-stone-400 mb-1" />
                          <span className="text-sm font-bold tracking-wider">{salon.name}</span>
                        </div>
                      )}

                      {/* Top-Left: Clean Live Status Pill */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-stone-900 shadow-sm backdrop-blur-md border border-stone-200/60">
                          <span className={`w-2 h-2 rounded-full ${
                            !salon.isOpen || salon.queueStatus === 'closed'
                              ? 'bg-stone-400'
                              : salon.queueStatus === 'paused'
                              ? 'bg-amber-400'
                              : salon.currentQueue === 0
                              ? 'bg-emerald-500'
                              : salon.currentQueue <= 3
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`} />
                          <span>
                            {!salon.isOpen || salon.queueStatus === 'closed'
                              ? 'Closed'
                              : salon.queueStatus === 'paused'
                              ? 'Queue Paused'
                              : salon.currentQueue === 0
                              ? '0 in line • Open now'
                              : `${salon.currentQueue} in line • ~${formatDuration(waitTime)}`}
                          </span>
                        </span>
                      </div>

                      {/* Top-Right: Action buttons (Instagram link + Heart Save) */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        {(salon.instagramUrl || salon.instagramHandle) && (
                          <a
                            href={
                              salon.instagramUrl?.startsWith('http')
                                ? salon.instagramUrl
                                : `https://instagram.com/${(salon.instagramHandle || salon.instagramUrl || '').replace(/^@/, '')}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 rounded-full bg-white/95 text-stone-700 hover:text-pink-600 border border-stone-200/60 backdrop-blur-md flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
                            title={`Visit ${salon.name} on Instagram`}
                          >
                            <InstagramGradientIcon className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(salon.id);
                          }}
                          className="w-9 h-9 rounded-full bg-white/95 text-stone-700 hover:text-rose-500 border border-stone-200/60 backdrop-blur-md flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
                          title={isFav ? 'Remove from saved' : 'Save salon'}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Bottom-Left subtle salon type tag */}
                      <div className="absolute bottom-2.5 left-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
                          {salonType === 'men' ? "Men's Studio" : salonType === 'women' ? "Women's Parlour" : 'Unisex'}
                        </span>
                      </div>
                    </div>

                    {/* Clean Human Card Details (Like Airbnb/Fresha) */}
                    <div className="p-4 sm:p-4.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="text-base font-black text-stone-900 tracking-tight leading-snug truncate group-hover:text-stone-950">
                              {salon.name}
                            </h3>
                            {salon.isVerified && (
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 ${
                                  isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'
                                }`}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-stone-900">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{salon.rating.toFixed(1)}</span>
                            <span className="text-stone-400 font-normal">({salon.reviewCount})</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 mt-1 text-xs text-stone-500">
                          <p className="flex items-center gap-1 truncate">
                            <Navigation className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{salon.locality}</span>
                            <span>•</span>
                            <span className="font-medium text-stone-600">{salon.distanceKm.toFixed(1)} km away</span>
                          </p>
                          {salon.phone && (
                            <a
                              href={`tel:${salon.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-[11px] font-bold text-stone-700 hover:text-emerald-700 shrink-0 bg-stone-50 hover:bg-emerald-50 px-2 py-0.5 rounded-lg border border-stone-200/60 transition-colors"
                              title="Call salon"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-600 font-medium">
                          Haircuts from <strong className="text-stone-900 font-black">₹{salon.startingPrice}</strong>
                        </span>

                        <span className={`font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
                          isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'
                        }`}>
                          <span>View chairs</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
