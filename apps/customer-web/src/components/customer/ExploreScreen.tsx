import React, { useState } from 'react';
import {
  Search,
  Filter,
  Star,
  Users,
  Clock,
  Navigation,
  ArrowUpDown,
  Scissors,
  CheckCircle2,
  SlidersHorizontal,
  Heart,
  ArrowRight,
  Store,
  Play,
} from 'lucide-react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness, matchesGenderFilter, getSalonType } from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';
import { redirectToGoogleMaps } from '@kumbhakaran/ui';

type SortOption = 'distance' | 'queue' | 'rating' | 'price';

export const ExploreScreen: React.FC = () => {
  const {
    salons,
    searchQuery,
    setSearchQuery,
    setSelectedSalonForDetail,
    toggleFavorite,
    userProfile,
    comparisonList,
    toggleCompareSalon,
    setIsCompareOpen,
    userLocation,
    genderFilter,
    selectedServiceFilter,
    setSelectedServiceFilter,
  } = useSalon();

  const [sortBy, setSortBy] = useState<SortOption>('queue');
  const [openOnly, setOpenOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  const isWomen = genderFilter === 'women';

  const categories = isWomen
    ? ['All', 'Hair', 'Spa', 'Facial', 'Color', 'Combos']
    : ['All', 'Hair', 'Beard', 'Combos', 'Spa', 'Facial'];

  // Sorting & Filtering
  const processedSalons = salons
    .filter((salon) => {
      if (!matchesGenderFilter(salon, genderFilter)) return false;
      if (openOnly && !salon.isOpen) return false;
      if (salon.startingPrice > maxPrice) return false;

      if (selectedServiceFilter !== 'All') {
        const hasCategory = salon.services.some(s => s.category === selectedServiceFilter);
        if (!hasCategory) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          salon.name.toLowerCase().includes(q) ||
          salon.locality.toLowerCase().includes(q) ||
          salon.services.some(s => s.name.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'queue') return a.currentQueue - b.currentQueue;
      if (sortBy === 'distance') return a.distanceKm - b.distanceKm;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price') return a.startingPrice - b.startingPrice;
      return 0;
    });

  return (
    <div className="space-y-5 pb-28 text-stone-900">
      {/* Header title & search */}
      <div>
        <h1 className="text-xl font-black text-stone-900 tracking-tight">
          {isWomen ? 'Beauty Parlours & Spas' : 'Salons & Barbers'}
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          {isWomen
            ? 'Check live waiting lines and compare salons across Bilaspur'
            : 'Check live waiting lines and compare prices across Bilaspur'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <Search className={`w-4 h-4 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isWomen ? "Search parlour name, beauty service, or locality..." : "Search by salon name, locality or service..."}
          className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
            isWomen
              ? 'border-[#FED7CC] focus:border-[#E11D48]'
              : 'border-[#E2DDD5] focus:border-[#FF6422]'
          } rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-xs transition-colors`}
        />
      </div>

      {/* Quick Sort Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className={`w-3 h-3 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} /> Sort Salons By:
          </span>

          {comparisonList.length > 0 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className={`text-xs font-bold hover:underline flex items-center gap-1 ${
                isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Compare ({comparisonList.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => setSortBy('queue')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'queue'
                ? isWomen
                  ? 'bg-[#E11D48] text-white border-rose-500 shadow-sm shadow-rose-500/20 font-bold'
                  : 'bg-[#FF6422] text-white border-orange-500 shadow-sm shadow-orange-500/20 font-bold'
                : isWomen
                  ? 'bg-white text-stone-700 border-[#FED7CC] hover:border-rose-300'
                  : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Lowest Queue
          </button>

          <button
            onClick={() => setSortBy('distance')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'distance'
                ? isWomen
                  ? 'bg-[#E11D48] text-white border-rose-500 shadow-sm shadow-rose-500/20 font-bold'
                  : 'bg-[#FF6422] text-white border-orange-500 shadow-sm shadow-orange-500/20 font-bold'
                : isWomen
                  ? 'bg-white text-stone-700 border-[#FED7CC] hover:border-rose-300'
                  : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Nearest First
          </button>

          <button
            onClick={() => setSortBy('rating')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'rating'
                ? isWomen
                  ? 'bg-[#E11D48] text-white border-rose-500 shadow-sm shadow-rose-500/20 font-bold'
                  : 'bg-[#FF6422] text-white border-orange-500 shadow-sm shadow-orange-500/20 font-bold'
                : isWomen
                  ? 'bg-white text-stone-700 border-[#FED7CC] hover:border-rose-300'
                  : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Top Rated
          </button>

          <button
            onClick={() => setSortBy('price')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'price'
                ? isWomen
                  ? 'bg-[#E11D48] text-white border-rose-500 shadow-sm shadow-rose-500/20 font-bold'
                  : 'bg-[#FF6422] text-white border-orange-500 shadow-sm shadow-orange-500/20 font-bold'
                : isWomen
                  ? 'bg-white text-stone-700 border-[#FED7CC] hover:border-rose-300'
                  : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
            }`}
          >
            <span>₹</span> Lowest Price
          </button>
        </div>
      </div>

      {/* Filter Row: Service Category chips + Open Now toggle */}
      <div className={`flex flex-wrap items-center justify-between gap-2 pt-1 border-t ${isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'}`}>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedServiceFilter(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all ${
                selectedServiceFilter === cat
                  ? isWomen
                    ? 'bg-[#E11D48] text-white border-rose-500 shadow-xs'
                    : 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                  : isWomen
                    ? 'bg-white text-stone-700 border-[#FED7CC] hover:border-rose-300'
                    : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setOpenOnly(!openOnly)}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-all shadow-xs ${
            openOnly
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-white border-[#E2DDD5] text-stone-600'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${openOnly ? 'bg-emerald-500' : 'bg-stone-300'}`} />
          Open Now Only
        </button>
      </div>

      {/* Results Count & Instructions */}
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>Showing {processedSalons.length} studios</span>
        <span>Tap any card for complete queue & service breakdown</span>
      </div>

      {/* Salon Cards */}
      {processedSalons.length === 0 ? (
        <div className={`bg-white border rounded-3xl p-8 text-center space-y-3 shadow-sm ${
          isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto border ${
            isWomen
              ? 'bg-rose-50 border-rose-200 text-[#E11D48]'
              : 'bg-orange-50 border-orange-200 text-[#FF6422]'
          }`}>
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900">
            {isWomen ? 'No beauty studios found' : 'No registered studios found'}
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {isWomen
              ? 'No ladies or unisex beauty studios match your active search filters. Reset your filters to explore all verified studios.'
              : 'No studios match your active search filters. Reset your filters to explore all verified studios.'}
          </p>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedServiceFilter('All');
                setOpenOnly(false);
              }}
              className={`px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs ${
                isWomen ? 'bg-[#E11D48] hover:bg-rose-700' : 'bg-[#FF723A] hover:bg-orange-600'
              }`}
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
        {processedSalons.map((salon) => {
          const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
          const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);
          const freshness = getQueueFreshness(salon.lastQueueUpdate);
          const isSaved = userProfile.savedSalons.includes(salon.id);
          const isComparing = comparisonList.includes(salon.id);
          const salonType = getSalonType(salon);

          return (
            <div
              key={salon.id}
              onClick={() => setSelectedSalonForDetail(salon)}
              className={`group bg-white border overflow-hidden shadow-[0_4px_20px_rgba(40,20,10,0.04)] hover:shadow-xl transition-all duration-300 cursor-pointer ${
                isWomen
                  ? 'rounded-3xl border-[#FED7CC] hover:border-rose-400 hover:bg-[#FFFDFB]'
                  : 'rounded-2xl border-[#E8E2D8] hover:border-orange-400 hover:bg-[#FFFDF9]'
              }`}
            >
              {/* Large Salon Photograph with overlays */}
              <div className="h-48 sm:h-56 w-full relative overflow-hidden">
                {salon.loopVideoUrl ? (
                  <video
                    src={salon.loopVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={salon.coverImage || salon.posterImage}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (salon.coverImage || salon.posterImage || (salon.images && salon.images[0]) || (salon.locationImages && salon.locationImages[0])) ? (
                  <img
                    src={salon.coverImage || salon.posterImage || (salon.images && salon.images[0]) || (salon.locationImages && salon.locationImages[0])}
                    alt={salon.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex flex-col items-center justify-center text-white p-4 text-center">
                    <Store className="w-10 h-10 text-[#FF6422] mb-1.5" />
                    <span className="text-sm font-black line-clamp-1">{salon.name}</span>
                    <span className="text-xs text-stone-400">{salon.locality}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 pointer-events-none" />
                {salon.loopVideoUrl && (
                  <span className="absolute top-3 right-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 shadow-md pointer-events-none">
                    <Play className="w-2.5 h-2.5 fill-white" />
                    <span>Video</span>
                  </span>
                )}

                {/* Top overlay badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md ${queueInfo.badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
                    {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue} in queue
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareSalon(salon.id);
                      }}
                      className={`p-2 rounded-full backdrop-blur-md transition-colors border ${
                        isComparing
                          ? isWomen
                            ? 'bg-[#E11D48] text-white border-rose-500 shadow-xs'
                            : 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                          : 'bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200 shadow-xs'
                      }`}
                      title={isComparing ? 'Remove from compare' : 'Add to compare'}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(salon.id);
                      }}
                      className="p-2 rounded-full bg-white/90 text-stone-500 hover:text-rose-500 border border-stone-200 backdrop-blur-md transition-colors shadow-xs"
                      title="Save"
                    >
                      <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Bottom of photo details */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                        {salon.name}
                      </h2>
                      {salon.isVerified && (
                        <CheckCircle2 className={`w-4 h-4 ${isWomen ? 'text-rose-400' : 'text-[#FF6422]'}`} />
                      )}
                      {/* Salon Type Pill Badge */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-xs ${
                        salonType === 'men'
                          ? 'bg-blue-900/80 text-blue-100 border-blue-400/40 backdrop-blur-md'
                          : salonType === 'women'
                          ? 'bg-rose-900/80 text-rose-100 border-rose-400/40 backdrop-blur-md'
                          : 'bg-stone-900/80 text-stone-100 border-stone-400/40 backdrop-blur-md'
                      }`}>
                        {salonType === 'men' ? 'Men' : salonType === 'women' ? 'Women' : 'Unisex'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          redirectToGoogleMaps(
                            {
                              lat: salon.coordinates.lat,
                              lng: salon.coordinates.lng,
                              name: salon.name,
                              address: salon.address,
                            },
                            userLocation || undefined,
                          );
                        }}
                        className={`inline-flex items-center gap-1 text-xs font-semibold drop-shadow-sm transition-colors ${
                          isWomen
                            ? 'text-rose-100 hover:text-white'
                            : 'text-orange-100 hover:text-white'
                        }`}
                        title="Open directions in Google Maps"
                        aria-label={`Navigate to ${salon.name}, ${salon.distanceKm.toFixed(2)} km away`}
                      >
                        <Navigation className="w-3 h-3 fill-current" />
                        <span>{salon.distanceKm.toFixed(2)} km</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-amber-800 font-bold text-xs border border-amber-200 shadow-xs shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{salon.rating}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 pt-3">
                {/* Available services chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {salon.services.slice(0, 4).map((s) => (
                    <span
                      key={s.id}
                      className={`text-[11px] font-medium border px-2.5 py-1 rounded-lg ${
                        isWomen
                          ? 'bg-[#FFF9F6] text-stone-700 border-[#FED7CC]'
                          : 'bg-[#FAF7F2] text-stone-700 border-[#E2DDD5]'
                      }`}
                    >
                      {s.name} <span className={`font-semibold ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`}>₹{s.price}</span>
                    </span>
                  ))}
                  {salon.services.length > 4 && (
                    <span className="text-[11px] text-stone-500 self-center">
                      +{salon.services.length - 4} more services
                    </span>
                  )}
                </div>

                {/* Bottom info strip */}
                <div className={`pt-3 border-t flex items-center justify-between text-xs ${isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'}`}>
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-[10px] text-stone-500">Starting at</div>
                      <div className="font-extrabold text-stone-900 text-sm">₹{salon.startingPrice}</div>
                    </div>
                    <div className="h-6 w-px bg-stone-200" />
                    <div>
                      <div className="text-[10px] text-stone-500">Estimated wait</div>
                      <div className="font-bold text-emerald-700">~{waitTime} mins</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${freshness.badgeClass}`}>
                      {freshness.text}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSalonForDetail(salon);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-xs ${
                        isWomen
                          ? 'bg-[#E11D48] hover:bg-rose-700'
                          : 'bg-[#FF6422] hover:bg-orange-600'
                      }`}
                    >
                      View Details <ArrowRight className="w-3 h-3" />
                    </button>
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
