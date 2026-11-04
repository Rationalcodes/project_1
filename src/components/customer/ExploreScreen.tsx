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
  Flame,
  Sparkles,
  Heart,
  ArrowRight
} from 'lucide-react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness, matchesGenderFilter } from '../../context/SalonContext';
import { Salon } from '../../types';

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
  } = useSalon();

  const [sortBy, setSortBy] = useState<SortOption>('queue');
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  const categories =
    genderFilter === 'women'
      ? ['All', 'Hair', 'Spa', 'Facial', 'Color', 'Combos']
      : ['All', 'Hair', 'Beard', 'Combos', 'Spa', 'Facial'];

  // Sorting & Filtering
  const processedSalons = salons
    .filter((salon) => {
      if (!matchesGenderFilter(salon, genderFilter)) return false;
      if (openOnly && !salon.isOpen) return false;
      if (salon.startingPrice > maxPrice) return false;

      if (selectedCategory !== 'All') {
        const hasCategory = salon.services.some(s => s.category === selectedCategory);
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
        <h1 className="text-xl font-black text-stone-900 tracking-tight font-['Syne',sans-serif]">
          Browse & Compare Studios
        </h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Find the ideal salon match with real-time walk-in visibility
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
          <Search className="w-4 h-4 text-[#FF6422]" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by salon name, locality or service..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] shadow-xs"
        />
      </div>

      {/* Quick Sort Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-[#FF6422]" /> Sort Salons By:
          </span>

          {comparisonList.length > 0 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="text-xs text-[#FF6422] font-bold hover:underline flex items-center gap-1"
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
                ? 'bg-[#FF6422] text-white border-orange-500 shadow-sm shadow-orange-500/20 font-bold'
                : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Lowest Queue
          </button>

          <button
            onClick={() => setSortBy('distance')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'distance'
                ? 'bg-[#FF6422] text-white border-orange-500 shadow-sm shadow-orange-500/20 font-bold'
                : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Nearest First
          </button>

          <button
            onClick={() => setSortBy('rating')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'rating'
                ? 'bg-[#FF6422] text-white border-orange-500 shadow-sm shadow-orange-500/20 font-bold'
                : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Top Rated
          </button>

          <button
            onClick={() => setSortBy('price')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'price'
                ? 'bg-[#FF6422] text-white border-orange-500 shadow-sm shadow-orange-500/20 font-bold'
                : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300'
            }`}
          >
            <span>₹</span> Lowest Price
          </button>
        </div>
      </div>

      {/* Filter Row: Service Category chips + Open Now toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#E8E2D8]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all ${
                selectedCategory === cat
                  ? 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
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
        <div className="bg-white border border-[#E8E2D8] rounded-3xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-[#FF6422] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6 text-[#FF6422]" />
          </div>
          <h3 className="text-base font-bold text-stone-900">No registered studios found</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            No approved salons match your search or filters in this locality. Try searching another area or register your own salon studio.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setOpenOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 shadow-xs"
            >
              Reset Filters
            </button>
            <a
              href="https://project-1-xq1k.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-white border border-[#E2DDD5] text-[#FF6422] font-bold text-xs hover:border-[#FF6422] shadow-xs"
            >
              Register Your Salon Business ↗
            </a>
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

          return (
            <div
              key={salon.id}
              onClick={() => setSelectedSalonForDetail(salon)}
              className="group bg-white hover:bg-[#FFFDF9] border border-[#E8E2D8] hover:border-orange-400 rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(40,20,10,0.04)] hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {/* Large Salon Photograph with overlays */}
              <div className="h-48 sm:h-56 w-full relative overflow-hidden">
                <img
                  src={salon.coverImage}
                  alt={salon.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                {/* Top overlay badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md ${queueInfo.badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
                    {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue} People Waiting
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareSalon(salon.id);
                      }}
                      className={`p-2 rounded-full backdrop-blur-md transition-colors border ${
                        isComparing ? 'bg-[#FF6422] text-white border-orange-500 shadow-xs' : 'bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200 shadow-xs'
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
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                        {salon.name}
                      </h2>
                      {salon.isVerified && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF6422]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone-200 drop-shadow line-clamp-1">
                        {salon.locality} • {salon.distanceKm} km
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/90 text-[10px] font-bold text-[#FF6422] border border-orange-200 backdrop-blur-sm shadow-xs">
                        {salon.distanceKm} km
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl text-amber-800 font-bold text-xs border border-amber-200 shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{salon.rating}</span>
                    <span className="text-stone-400 font-normal">({salon.reviewCount})</span>
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
                      className="text-[11px] font-medium bg-[#FAF7F2] text-stone-700 border border-[#E2DDD5] px-2.5 py-1 rounded-lg"
                    >
                      {s.name} <span className="text-[#FF6422] font-semibold">₹{s.price}</span>
                    </span>
                  ))}
                  {salon.services.length > 4 && (
                    <span className="text-[11px] text-stone-500 self-center">
                      +{salon.services.length - 4} more services
                    </span>
                  )}
                </div>

                {/* Bottom info strip */}
                <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between text-xs">
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
                      className="px-3.5 py-1.5 rounded-xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 transition-colors flex items-center gap-1 shadow-xs"
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
