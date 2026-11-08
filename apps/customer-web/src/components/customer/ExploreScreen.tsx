import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  Users,
  Navigation,
  X,
  Store,
  Map as MapIcon,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  useSalon,
  matchesGenderFilter,
} from '../../context/CustomerContext';
import { getTheme } from '../../theme';
import { SalonCard } from '../common/SalonCard';
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

  const theme = getTheme(genderFilter);
  const isWomen = genderFilter === 'women';

  // Filtered & Sorted Salon Records
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
    <div className="space-y-4 pb-28 text-stone-900 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* 1. TOP HEADER & TWO-WAY TOGGLE: [ 🏢 Explore Studios | 🗺️ Map ] */}
      <header className="sticky top-0 z-30 pt-2 pb-3 bg-[#FAF7F2]/95 backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-stone-950">
                Explore Studios
              </h1>
              <span
                className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: theme.primary }}
              >
                {isWomen ? 'Women' : 'Men'}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Discover neighbourhood salons, compare verified rates & check physical waiting lines.
            </p>
          </div>

          {/* Segmented Control */}
          <div className="bg-stone-200/80 p-1 rounded-2xl flex items-center gap-1 self-start sm:self-auto shrink-0 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('studios')}
              className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'studios'
                  ? 'bg-white text-stone-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <Store className="w-3.5 h-3.5" style={viewMode === 'studios' ? { color: theme.primary } : {}} />
              <span>Studios ({processedSalons.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`py-2 px-3.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white text-stone-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-950'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" style={viewMode === 'map' ? { color: theme.primary } : {}} />
              <span>Map View</span>
            </button>
          </div>
        </div>
      </header>

      {/* VIEW MODE 1: DEDICATED MAP VIEW ONLY */}
      {viewMode === 'map' && (
        <div className="animate-in fade-in duration-200">
          <MapScreen />
        </div>
      )}

      {/* VIEW MODE 2: STUDIOS DIRECTORY LIST */}
      {viewMode === 'studios' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search className="w-4 h-4" style={{ color: theme.primary }} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isWomen
                  ? 'Search salons by name, locality or city...'
                  : 'Search barbershops & studios by name, locality or city...'
              }
              className="w-full pl-10 pr-9 py-3 bg-white border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-2xs transition-all focus:border-stone-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border cursor-pointer ${
                activeFilter === 'all'
                  ? 'text-white shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
              style={activeFilter === 'all' ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
            >
              All Studios
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('queue')}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                activeFilter === 'queue'
                  ? 'text-white shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
              style={activeFilter === 'queue' ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Lowest Queue</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('distance')}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                activeFilter === 'distance'
                  ? 'text-white shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
              style={activeFilter === 'distance' ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Nearest</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('rating')}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                activeFilter === 'rating'
                  ? 'text-white shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
              style={activeFilter === 'rating' ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Top Rated</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'open' ? 'all' : 'open')}
              className={`px-3.5 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                activeFilter === 'open'
                  ? 'text-white shadow-2xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
              }`}
              style={activeFilter === 'open' ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Open Now</span>
            </button>
          </div>

          {/* Subheader: Salon count */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>
              Showing <strong className="text-stone-900">{processedSalons.length}</strong> neighbourhood studios
            </span>
          </div>

          {/* Salon Card Grid */}
          {processedSalons.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-2xs">
              <Store className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-900 font-extrabold text-sm">No studios found</p>
              <p className="text-stone-500 text-xs mt-1">
                Try loosening your search terms or clearing the current filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-4 px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                style={{ backgroundColor: theme.primary }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {processedSalons.map((salon) => (
                <SalonCard
                  key={salon.id}
                  salon={salon}
                  onSelect={setSelectedSalonForDetail}
                  isSaved={userProfile.savedSalons.includes(salon.id)}
                  onToggleFavorite={toggleFavorite}
                  experience={genderFilter}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
