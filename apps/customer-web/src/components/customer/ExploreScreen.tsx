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
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/CustomerContext';
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
    userLocation
  } = useSalon();

  const [sortBy, setSortBy] = useState<SortOption>('queue');
  const [openOnly, setOpenOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(1000);

  const categories = ['All', 'Hair', 'Beard', 'Combos', 'Spa', 'Facial'];

  // Sorting & Filtering
  const processedSalons = salons
    .filter((salon) => {
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
    <div className="space-y-5 pb-28 text-slate-100">
      {/* Header title & search */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight font-['Syne',sans-serif]">
          Browse & Compare Studios
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Find the ideal salon match with real-time walk-in visibility
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
          <Search className="w-4 h-4 text-amber-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by salon name, locality or service..."
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 shadow-inner"
        />
      </div>

      {/* Quick Sort Options */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-amber-400" /> Sort Salons By:
          </span>

          {comparisonList.length > 0 && (
            <button
              onClick={() => setIsCompareOpen(true)}
              className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1"
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
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Lowest Queue
          </button>

          <button
            onClick={() => setSortBy('distance')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'distance'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Nearest First
          </button>

          <button
            onClick={() => setSortBy('rating')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'rating'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Top Rated
          </button>

          <button
            onClick={() => setSortBy('price')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              sortBy === 'price'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <span>₹</span> Lowest Price
          </button>
        </div>
      </div>

      {/* Filter Row: Service Category chips + Open Now toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all ${
                selectedCategory === cat
                  ? 'bg-zinc-100 text-black border-white'
                  : 'bg-zinc-900/70 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setOpenOnly(!openOnly)}
          className={`px-3 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 transition-all ${
            openOnly
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
              : 'bg-zinc-900/80 border-zinc-800 text-zinc-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${openOnly ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          Open Now Only
        </button>
      </div>

      {/* Results Count & Comparison banner */}
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Showing {processedSalons.length} studios</span>
        <span>Tap any card for complete queue & service breakdown</span>
      </div>

      {/* Large Photographic Salon Cards (Inspired by Reference Screen 2) */}
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
              className="group bg-[#15151d] hover:bg-[#1a1a24] border border-zinc-800/90 hover:border-amber-500/50 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 cursor-pointer"
            >
              {/* Large Salon Photograph with overlays */}
              <div className="h-48 sm:h-56 w-full relative overflow-hidden">
                <img
                  src={salon.coverImage}
                  alt={salon.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#15151d] via-black/40 to-black/20" />

                {/* Top overlay badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xl backdrop-blur-md ${queueInfo.badgeClass}`}>
                    <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
                    {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue} People Waiting
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareSalon(salon.id);
                      }}
                      className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                        isComparing ? 'bg-amber-400 text-black' : 'bg-black/60 text-zinc-400 hover:text-white'
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
                      className="p-2 rounded-full bg-black/60 text-zinc-400 hover:text-rose-400 backdrop-blur-md transition-colors"
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
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-zinc-300 drop-shadow line-clamp-1">
                        {salon.locality} • {salon.distanceKm} km
                      </span>
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
                            userLocation,
                          );
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 hover:bg-black text-[10px] font-bold text-amber-400 border border-amber-400/30 backdrop-blur-sm transition-colors"
                        title="Open directions in Google Maps"
                      >
                        <Navigation className="w-2.5 h-2.5 fill-amber-400" />
                        <span>Directions ↗</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-amber-400 font-bold text-xs border border-amber-400/30">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{salon.rating}</span>
                    <span className="text-zinc-400 font-normal">({salon.reviewCount})</span>
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
                      className="text-[11px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-800 px-2.5 py-1 rounded-lg"
                    >
                      {s.name} <span className="text-amber-400 font-semibold">₹{s.price}</span>
                    </span>
                  ))}
                  {salon.services.length > 4 && (
                    <span className="text-[11px] text-zinc-500 self-center">
                      +{salon.services.length - 4} more services
                    </span>
                  )}
                </div>

                {/* Bottom info strip */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-[10px] text-zinc-500">Starting at</div>
                      <div className="font-extrabold text-amber-400 text-sm">₹{salon.startingPrice}</div>
                    </div>
                    <div className="h-6 w-px bg-zinc-800" />
                    <div>
                      <div className="text-[10px] text-zinc-500">Estimated wait</div>
                      <div className="font-bold text-emerald-400">~{waitTime} mins</div>
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
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1 shadow-lg shadow-amber-500/20"
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
    </div>
  );
};
