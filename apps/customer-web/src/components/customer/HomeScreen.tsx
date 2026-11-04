import React from 'react';
import {
  Search,
  MapPin,
  Star,
  Users,
  Clock,
  Navigation,
  ArrowRight,
  Flame,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Heart,
  SlidersHorizontal,
  Store,
  Compass
} from 'lucide-react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness, POPULAR_LOCATIONS } from '../../context/CustomerContext';
import { LazyModeSelector } from '../common/LazyModeSelector';
import { Salon } from '@kumbhakaran/shared-types';
import { redirectToGoogleMaps } from '@kumbhakaran/ui';

export const HomeScreen: React.FC = () => {
  const {
    salons,
    searchQuery,
    setSearchQuery,
    lazyFilter,
    userLocation,
    setUserLocation,
    clearUserLocation,
    requestDeviceLocation,
    isLoadingSalons,
    userProfile,
    toggleFavorite,
    addToRecentlyViewed,
    setSelectedSalonForDetail,
    setCustomerTab,
    selectedServiceFilter,
    setSelectedServiceFilter,
    comparisonList,
    toggleCompareSalon,
    setIsCompareOpen
  } = useSalon();

  const groomingCategories = [
    { name: 'All', icon: Sparkles },
    { name: 'Hair', icon: Scissors },
    { name: 'Beard', icon: Scissors },
    { name: 'Combos', icon: Flame },
    { name: 'Spa', icon: Sparkles },
    { name: 'Facial', icon: Sparkles }
  ];

  // Filtering logic
  const filteredSalons = salons.filter((salon) => {
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = salon.name.toLowerCase().includes(q);
      const matchLocality = salon.locality.toLowerCase().includes(q);
      const matchServices = salon.services.some(s => s.name.toLowerCase().includes(q));
      const matchStaff = salon.staff.some(st => st.name.toLowerCase().includes(q));
      if (!matchName && !matchLocality && !matchServices && !matchStaff) return false;
    }

    // Category filter
    if (selectedServiceFilter !== 'All') {
      const hasCategory = salon.services.some(s => s.category === selectedServiceFilter);
      if (!hasCategory) return false;
    }

    // Lazy Mode Filter
    const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);
    if (lazyFilter === '0-5' && waitTime > 5) return false;
    if (lazyFilter === '5-15' && (waitTime <= 5 || waitTime > 15)) return false;
    if (lazyFilter === '15-30' && (waitTime <= 15 || waitTime > 30)) return false;
    if (lazyFilter === '30+' && waitTime <= 30) return false;

    return true;
  });

  // Shortest queues (< 3 people)
  const shortestQueueSalons = [...salons]
    .filter(s => s.isOpen)
    .sort((a, b) => a.currentQueue - b.currentQueue)
    .slice(0, 4);

  // Top rated salons
  const topRatedSalons = [...salons]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // Recently viewed
  const recentlyViewedSalons = salons.filter(s => userProfile.recentlyViewed.includes(s.id));

  const handleSalonCardClick = (salon: Salon) => {
    addToRecentlyViewed(salon.id);
    setSelectedSalonForDetail(salon);
  };

  return (
    <div className="space-y-6 pb-24 text-slate-100">
      {/* Hero Branding & Greeting Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1c1c24] via-[#121217] to-[#0a0a0d] border border-zinc-800/80 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Too lazy to call. Too smart to wait.</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-['Syne',sans-serif]">
              Skip the salon crowd today.
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Check live waiting counts at nearby grooming studios. Zero phone calls, 100% walk-in clarity.
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4 text-amber-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find salons, services or stylists..."
            className="w-full pl-10 pr-10 py-3 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Comparison Bar Trigger (if items selected) */}
        {comparisonList.length > 0 && (
          <div className="mt-3 bg-amber-500/15 border border-amber-500/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{comparisonList.length} salons in compare list</span>
            </div>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-400 text-black font-bold text-[11px] hover:bg-amber-300 transition-colors"
            >
              Compare Now
            </button>
          </div>
        )}
      </section>

      {/* Set Location Banner when user hasn't set their location yet */}
      {!userLocation && (
        <div className="mb-5 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-[#121218] border border-amber-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <MapPin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                Set your location to see salons near you
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Take location directly from your device GPS or select your locality for accurate queues and distance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={async () => {
                await requestDeviceLocation();
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 fill-black animate-pulse" />
              <span>Use Current Location</span>
            </button>
          </div>
        </div>
      )}

      {/* Empty State when no salons are in range */}
      {salons.length === 0 && !isLoadingSalons && (
        <section className="bg-gradient-to-b from-[#181822] via-[#121218] to-[#0c0c10] border border-zinc-800/90 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 -mt-16 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
            <Store className="w-8 h-8 text-amber-400" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
            No salons nearby yet.
          </h2>
          <p className="text-sm text-zinc-300 font-semibold mt-1">
            Be the first salon to join Kumbhkaran Salons in your area.
          </p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed">
            Kumbhkaran Salons only displays verified, registered salon partners with genuine real-time walk-in queues. Currently, no active approved studios are registered {userLocation ? `in ${userLocation.name}` : 'in this area'}.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            {userLocation && (
              <button
                type="button"
                onClick={() => clearUserLocation()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 text-black font-extrabold text-xs shadow-xl shadow-amber-500/20 hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4 text-black" />
                <span>Show All Registered Salons in India</span>
              </button>
            )}

            <a
              href="https://project-1-xq1k.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4 fill-amber-400" />
              <span>Register Your Salon Business ↗</span>
            </a>

            <button
              onClick={() => setCustomerTab('map')}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>Explore Map</span>
            </button>
          </div>
        </section>
      )}

      {/* Loading Skeleton */}
      {isLoadingSalons && (
        <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span>Searching for registered salons {userLocation ? `near ${userLocation.name.split(',')[0]}...` : 'on Kumbhkaran Salons...'}</span>
        </div>
      )}

      {/* Dynamic Sections when real salons exist */}
      {salons.length > 0 && (
        <>
          <LazyModeSelector />

          {/* Popular Grooming Services Category Filter */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                Popular Grooming Services
              </h2>
              {selectedServiceFilter !== 'All' && (
                <button
                  onClick={() => setSelectedServiceFilter('All')}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  View All
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {groomingCategories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedServiceFilter === cat.name;

                return (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedServiceFilter(cat.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-amber-400'}`} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

      {/* Salons with Shortest Queues (Quick Walk-Ins) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Shortest Queues Right Now
            </h2>
            <p className="text-[11px] text-zinc-400">
              Walk in and be seated in under 15 minutes
            </p>
          </div>
          <button
            onClick={() => setCustomerTab('explore')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
          >
            Explore all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {shortestQueueSalons.map((salon) => {
            const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
            const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);
            const freshness = getQueueFreshness(salon.lastQueueUpdate);
            const isSaved = userProfile.savedSalons.includes(salon.id);

            return (
              <div
                key={salon.id}
                onClick={() => handleSalonCardClick(salon)}
                className="group bg-[#15151c] hover:bg-[#1a1a23] border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-3.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl relative"
              >
                {/* Favorite & Compare Quick Actions */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompareSalon(salon.id);
                    }}
                    title="Add to side-by-side compare"
                    className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                      comparisonList.includes(salon.id)
                        ? 'bg-amber-400 text-black'
                        : 'bg-black/60 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(salon.id);
                    }}
                    title="Save to favourites"
                    className="p-1.5 rounded-full bg-black/60 text-zinc-400 hover:text-rose-400 backdrop-blur-md transition-colors"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                <div className="flex gap-3">
                  {/* Photo with Live Queue Badge Overlay */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative shrink-0">
                    <img
                      src={salon.coverImage}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${queueInfo.pillClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${queueInfo.dotClass}`} />
                        {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue} waiting
                      </span>
                    </div>
                  </div>

                  {/* Salon Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                          {salon.name}
                        </h3>
                        {salon.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span className="flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {salon.rating}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          ({salon.reviewCount})
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-[11px] text-zinc-400 truncate">
                          {salon.locality}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-zinc-400">Haircut from</div>
                        <div className="font-bold text-amber-400">₹{salon.startingPrice}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-zinc-400">Est. Wait</div>
                        <div className="font-semibold text-emerald-400">~{waitTime} mins</div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-zinc-400">Distance</div>
                        <div className="font-medium text-zinc-300">{salon.distanceKm} km</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Queue Freshness / Stale Warning footer */}
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400 px-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {freshness.text}
                  </span>
                  {freshness.isStale && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                      <AlertTriangle className="w-3 h-3" /> Info may be outdated
                    </span>
                  )}
                  <span className="text-zinc-400">{salon.openingHours.formatted.split('(')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nearby Salons Section (Full 10 data point cards) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              All Nearby Salons ({filteredSalons.length})
            </h2>
            <p className="text-[11px] text-zinc-400">
              {userLocation
                ? `Sorted by distance from ${userLocation.name.split(',')[0]}`
                : 'Showing verified studios (Set location for live distance)'}
            </p>
          </div>
          <button
            onClick={() => setCustomerTab('map')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
          >
            View Map
          </button>
        </div>

        <div className="space-y-3.5">
          {filteredSalons.map((salon) => {
            const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
            const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);
            const freshness = getQueueFreshness(salon.lastQueueUpdate);
            const isSaved = userProfile.savedSalons.includes(salon.id);

            return (
              <div
                key={salon.id}
                onClick={() => handleSalonCardClick(salon)}
                className="group bg-[#15151c] hover:bg-[#1a1a23] border border-zinc-800/80 hover:border-amber-500/40 rounded-3xl p-4 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Photo with overlay */}
                  <div className="sm:w-44 h-40 rounded-2xl overflow-hidden relative shrink-0">
                    <img
                      src={salon.coverImage}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                    {/* Prominent Live Queue Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black shadow-lg backdrop-blur-md ${queueInfo.badgeClass}`}>
                        <Users className="w-3.5 h-3.5" />
                        {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue} Waiting
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareSalon(salon.id);
                        }}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                          comparisonList.includes(salon.id)
                            ? 'bg-amber-400 text-black'
                            : 'bg-black/60 text-zinc-400 hover:text-white'
                        }`}
                        title="Compare"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(salon.id);
                        }}
                        className="p-2 rounded-full bg-black/60 text-zinc-400 hover:text-rose-400 backdrop-blur-md transition-colors"
                        title="Favourite"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        ~{waitTime}m est. wait
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
                            userLocation || undefined,
                          );
                        }}
                        className="text-amber-400 font-bold bg-black/80 hover:bg-black px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 border border-amber-400/30 transition-colors cursor-pointer"
                        title="Get directions in Google Maps"
                      >
                        <Navigation className="w-2.5 h-2.5 fill-amber-400" />
                        <span>{userLocation ? `${salon.distanceKm} km ↗` : 'Directions ↗'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                              {salon.name}
                            </h3>
                            {salon.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                            {salon.tagline}
                          </p>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-xl text-amber-400 font-bold text-xs shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{salon.rating}</span>
                          <span className="text-zinc-500 font-normal">({salon.reviewCount})</span>
                        </div>
                      </div>

                      {/* Services badges preview */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {salon.services.slice(0, 3).map((svc) => (
                          <span
                            key={svc.id}
                            className="text-[10px] font-medium bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded-md"
                          >
                            {svc.name} • ₹{svc.price}
                          </span>
                        ))}
                        {salon.services.length > 3 && (
                          <span className="text-[10px] text-zinc-500 self-center">
                            +{salon.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Status Strip */}
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 font-extrabold text-sm">
                          ₹{salon.startingPrice} <span className="text-[11px] font-normal text-zinc-400">starting</span>
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400 flex items-center gap-1 text-[11px]">
                          <Navigation className="w-3 h-3 text-zinc-500" />
                          {salon.locality}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${freshness.badgeClass}`}>
                          {freshness.text}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSalonCardClick(salon);
                          }}
                          className="px-3 py-1 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Top-Rated Grooming Spots Spotlight */}
      <section className="bg-gradient-to-r from-amber-950/20 via-zinc-900/60 to-zinc-950/40 border border-amber-500/20 rounded-3xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Top Rated Studios in Town
              </h2>
              <p className="text-[11px] text-zinc-400">
                Highest customer satisfaction & hygiene scores
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topRatedSalons.map((salon) => (
            <div
              key={salon.id}
              onClick={() => handleSalonCardClick(salon)}
              className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 hover:border-amber-400/50 transition-all cursor-pointer"
            >
              <div className="h-24 rounded-xl overflow-hidden mb-2 relative">
                <img src={salon.coverImage} alt={salon.name} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/80 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-400" /> {salon.rating}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white truncate">{salon.name}</h4>
              <p className="text-[10px] text-zinc-400 truncate">{salon.locality} • {salon.distanceKm} km</p>
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-zinc-400">{salon.currentQueue} waiting</span>
                <span className="text-amber-400 font-bold">from ₹{salon.startingPrice}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Viewed Salons */}
      {recentlyViewedSalons.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            Recently Viewed Salons
          </h2>
          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {recentlyViewedSalons.map((salon) => (
              <div
                key={salon.id}
                onClick={() => handleSalonCardClick(salon)}
                className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-2.5 flex items-center gap-2.5 min-w-[200px] hover:border-zinc-700 cursor-pointer shrink-0"
              >
                <img src={salon.coverImage} alt={salon.name} className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{salon.name}</div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <span className="text-amber-400 font-semibold">{salon.currentQueue} waiting</span>
                    <span>• {salon.distanceKm} km</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
    )}
    </div>
  );
};
