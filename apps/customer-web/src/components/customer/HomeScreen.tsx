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
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness, POPULAR_LOCATIONS, matchesGenderFilter, getSalonType } from '../../context/CustomerContext';
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
    setIsCompareOpen,
    genderFilter,
  } = useSalon();

  const isWomen = genderFilter === 'women';

  const groomingCategories = isWomen
    ? [
        { name: 'All', icon: Sparkles },
        { name: 'Hair', icon: Scissors },
        { name: 'Facial', icon: Sparkles },
        { name: 'Spa', icon: Sparkles },
        { name: 'Color', icon: Sparkles },
        { name: 'Combos', icon: Flame },
      ]
    : [
        { name: 'All', icon: Sparkles },
        { name: 'Hair', icon: Scissors },
        { name: 'Beard', icon: Scissors },
        { name: 'Combos', icon: Flame },
        { name: 'Spa', icon: Sparkles },
        { name: 'Facial', icon: Sparkles },
      ];

  // Filtering logic
  const filteredSalons = salons.filter((salon) => {
    // Gender Filter match
    if (!matchesGenderFilter(salon, genderFilter)) return false;

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

  const genderMatchedSalons = salons.filter((s) => matchesGenderFilter(s, genderFilter));

  // Shortest queues (< 3 people)
  const shortestQueueSalons = [...genderMatchedSalons]
    .filter(s => s.isOpen)
    .sort((a, b) => a.currentQueue - b.currentQueue)
    .slice(0, 4);

  // Top rated salons
  const topRatedSalons = [...genderMatchedSalons]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // Recently viewed
  const recentlyViewedSalons = salons.filter(s => userProfile.recentlyViewed.includes(s.id));

  const handleSalonCardClick = (salon: Salon) => {
    addToRecentlyViewed(salon.id);
    setSelectedSalonForDetail(salon);
  };

  return (
    <div className="space-y-6 pb-24 text-stone-900">
      {/* Hero Branding & Greeting Section - Dynamic Dual Visual Experience */}
      <section
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 transition-all duration-300 ${
          isWomen
            ? 'bg-gradient-to-br from-[#FFF0EA] via-[#FFF8F5] to-[#FFEBE5] border border-[#FED7CC] shadow-[0_4px_24px_rgba(225,29,72,0.06)]'
            : 'bg-white border border-[#E8E2D8] shadow-[0_4px_24px_rgba(40,20,10,0.04)]'
        }`}
      >
        <div
          className={`absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full blur-3xl pointer-events-none ${
            isWomen ? 'bg-rose-400/15' : 'bg-orange-400/10'
          }`}
        />

        <div className="flex items-start justify-between">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2 ${
                isWomen
                  ? 'bg-rose-100/80 border border-rose-200 text-[#E11D48]'
                  : 'bg-orange-50 border border-orange-200 text-[#FF6422]'
              }`}
            >
              <Sparkles className={`w-3 h-3 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
              <span>{isWomen ? 'Glow & Glamour. Without the wait.' : 'Too lazy to call. Too smart to wait.'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              {isWomen ? 'Discover beauty & salon suites today.' : 'Skip the salon crowd today.'}
            </h1>
            <p className="text-xs text-stone-600 mt-1 max-w-sm">
              {isWomen
                ? 'Check live walk-in waiting counts at top salons, hair styling lounges & spas near you.'
                : 'Check live waiting counts at nearby grooming studios. Zero phone calls, 100% walk-in clarity.'}
            </p>
          </div>
        </div>

        {/* Comparison Bar Trigger (if items selected) */}
        {comparisonList.length > 0 && (
          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-orange-900 font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF723A]" />
              <span>{comparisonList.length} salons in compare list</span>
            </div>
            <button
              onClick={() => setIsCompareOpen(true)}
              className="px-3 py-1 rounded-lg bg-[#FF723A] text-white font-bold text-[11px] hover:bg-orange-600 transition-colors shadow-xs"
            >
              Compare Now
            </button>
          </div>
        )}
      </section>

      {/* Loading Skeleton */}
      {isLoadingSalons && salons.length === 0 && (
        <div className="py-12 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#FF723A] border-t-transparent rounded-full animate-spin" />
          <span>Loading verified studios on Kumbhkaran Salons...</span>
        </div>
      )}

      {/* Dynamic Sections - Always visible to customers */}
      <>
        <LazyModeSelector />

          {/* Popular Grooming / Beauty Services Category Filter */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
                {isWomen ? 'Popular Beauty & Styling Services' : 'Popular Grooming Services'}
              </h2>
              {selectedServiceFilter !== 'All' && (
                <button
                  onClick={() => setSelectedServiceFilter('All')}
                  className={`text-[11px] hover:underline font-semibold ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`}
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
                        ? isWomen
                          ? 'bg-[#E11D48] text-white font-bold border-rose-500 shadow-md shadow-rose-500/20'
                          : 'bg-[#FF6422] text-white font-bold border-orange-500 shadow-md shadow-orange-500/20'
                        : isWomen
                          ? 'bg-white text-stone-700 border-[#FED7CC] hover:border-rose-300 hover:text-stone-900 shadow-xs'
                          : 'bg-white text-stone-700 border-[#E2DDD5] hover:border-orange-300 hover:text-stone-900 shadow-xs'
                    }`}
                  >
                    <Icon className={`w-3 h-3 ${isSelected ? 'text-white' : isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
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
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Shortest Queues Right Now
                </h2>
                <p className="text-[11px] text-stone-500">
                  Real-time queue tracking • No waiting surprises
                </p>
              </div>
              <button
                onClick={() => setCustomerTab('explore')}
                className="text-xs text-[#FF6422] hover:text-orange-700 flex items-center gap-1 font-semibold"
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
                    className={`group transition-all duration-300 cursor-pointer p-3.5 relative ${
                      isWomen
                        ? 'rounded-3xl bg-white hover:bg-[#FFF8F5] border border-[#FED7CC] hover:border-rose-300 shadow-[0_2px_14px_rgba(225,29,72,0.05)] hover:shadow-xl'
                        : 'rounded-2xl bg-white hover:bg-[#FFFDF9] border border-[#E8E2D8] hover:border-orange-400 shadow-[0_2px_12px_rgba(40,20,10,0.04)] hover:shadow-xl'
                    }`}
                  >
                    {/* Favorite & Compare Quick Actions */}
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompareSalon(salon.id);
                        }}
                        title="Add to side-by-side compare"
                        className={`p-1.5 rounded-full backdrop-blur-md transition-colors border ${
                          comparisonList.includes(salon.id)
                            ? 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                            : 'bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200 shadow-xs'
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
                        className="p-1.5 rounded-full bg-white/90 text-stone-500 hover:text-rose-500 border border-stone-200 backdrop-blur-md transition-colors shadow-xs"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    </div>

                    <div className="flex gap-3">
                      {/* Photo with Live Queue Badge Overlay */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative shrink-0">
                        {salon.coverImage ? (
                          <img
                            src={salon.coverImage}
                            alt={salon.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex flex-col items-center justify-center text-white p-2 text-center">
                            <Store className="w-6 h-6 text-[#FF6422] mb-1" />
                            <span className="text-[10px] font-black line-clamp-1">{salon.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-1.5 left-1.5 right-1.5">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-xs ${queueInfo.pillClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${queueInfo.dotClass}`} />
                            {salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue} in queue
                          </span>
                        </div>
                      </div>

                      {/* Salon Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-stone-900 group-hover:text-[#FF6422] transition-colors truncate">
                              {salon.name}
                            </h3>
                            {salon.isVerified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6422] shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-xs">
                            <span className="flex items-center gap-1 text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              {salon.rating}
                            </span>
                            <span className="text-[11px] text-stone-500">
                              ({salon.reviewCount})
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-[11px] text-stone-500 truncate">
                              {salon.locality}
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                              getSalonType(salon) === 'men'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : getSalonType(salon) === 'women'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}>
                              {getSalonType(salon) === 'men' ? 'Men' : getSalonType(salon) === 'women' ? 'Women' : 'Unisex'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-xs">
                          <div>
                            <div className="text-[10px] text-stone-500">Haircut from</div>
                            <div className="font-extrabold text-stone-900">₹{salon.startingPrice}</div>
                          </div>

                          <div className="text-right">
                            <div className="text-[10px] text-stone-500">Est. Wait</div>
                            <div className="font-bold text-emerald-700">~{waitTime} mins</div>
                          </div>

                          <div className="text-right">
                            <div className="text-[10px] text-stone-500">Distance</div>
                            <div className="font-semibold text-stone-700">{salon.distanceKm} km</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Queue Freshness footer */}
                    <div className="mt-2 flex items-center justify-between text-[10px] text-stone-500 px-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {freshness.text}
                      </span>
                      {freshness.isStale && (
                        <span className="flex items-center gap-0.5 text-orange-700 font-medium">
                          <AlertTriangle className="w-3 h-3 text-[#FF6422]" /> Outdated
                        </span>
                      )}
                      <span className="text-stone-500">{(salon.openingHours?.formatted || '09:00 AM – 09:30 PM').split('(')[0]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Nearby Salons Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#FF6422]" />
                  All Nearby Salons ({filteredSalons.length})
                </h2>
                <p className="text-[11px] text-stone-500">
                  {userLocation
                    ? `Sorted by distance from ${userLocation.name.split(',')[0]}`
                    : 'Showing verified studios (Set location for live distance)'}
                </p>
              </div>
              <button
                onClick={() => setCustomerTab('map')}
                className="text-xs text-[#FF6422] hover:text-orange-700 font-semibold"
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
                    className={`group transition-all duration-300 cursor-pointer p-4 ${
                      isWomen
                        ? 'rounded-3xl bg-white hover:bg-[#FFF8F5] border border-[#FED7CC] hover:border-rose-300 shadow-[0_2px_14px_rgba(225,29,72,0.05)] hover:shadow-xl'
                        : 'rounded-3xl bg-white hover:bg-[#FFFDF9] border border-[#E8E2D8] hover:border-orange-400 shadow-[0_2px_12px_rgba(40,20,10,0.04)] hover:shadow-xl'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Photo with overlay */}
                      <div className="sm:w-44 h-40 rounded-2xl overflow-hidden relative shrink-0">
                        <img
                          src={salon.coverImage}
                          alt={salon.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        {/* Prominent Live Queue Badge */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md ${queueInfo.badgeClass}`}>
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
                            className={`p-2 rounded-full backdrop-blur-md transition-colors border ${
                              comparisonList.includes(salon.id)
                                ? 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                                : 'bg-white/90 text-stone-600 hover:text-stone-900 border-stone-200 shadow-xs'
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
                            className="p-2 rounded-full bg-white/90 text-stone-500 hover:text-rose-500 border border-stone-200 backdrop-blur-md transition-colors shadow-xs"
                            title="Favourite"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </button>
                        </div>

                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs">
                          <span className="font-medium text-emerald-800 bg-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-xs border border-emerald-200 text-[11px]">
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
                            className="text-[#FF6422] font-bold bg-white/95 hover:bg-orange-50 px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1 border border-orange-200 transition-colors cursor-pointer shadow-xs text-[11px]"
                            title="Get directions in Google Maps"
                          >
                            <Navigation className="w-2.5 h-2.5 fill-[#FF6422]" />
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
                                <h3 className="text-base font-bold text-stone-900 group-hover:text-[#FF6422] transition-colors">
                                  {salon.name}
                                </h3>
                                {salon.isVerified && (
                                  <CheckCircle2 className="w-4 h-4 text-[#FF6422] shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                                {salon.tagline}
                              </p>
                            </div>

                            {/* Rating */}
                            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-amber-800 font-bold text-xs shrink-0 shadow-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span>{salon.rating}</span>
                              <span className="text-stone-400 font-normal">({salon.reviewCount})</span>
                            </div>
                          </div>

                          {/* Services badges preview */}
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {salon.services.slice(0, 3).map((svc) => (
                              <span
                                key={svc.id}
                                className="text-[10px] font-medium bg-[#FAF7F2] text-stone-700 border border-[#E2DDD5] px-2 py-0.5 rounded-md"
                              >
                                {svc.name} • ₹{svc.price}
                              </span>
                            ))}
                            {salon.services.length > 3 && (
                              <span className="text-[10px] text-stone-500 self-center">
                                +{salon.services.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Status Strip */}
                        <div className="mt-4 pt-3 border-t border-[#E8E2D8] flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-stone-900 font-extrabold text-sm">
                              ₹{salon.startingPrice} <span className="text-[11px] font-normal text-stone-500">starting</span>
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-600 flex items-center gap-1 text-[11px]">
                              <Navigation className="w-3 h-3 text-[#FF6422]" />
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
                              className="px-3 py-1 rounded-xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 transition-colors flex items-center gap-1 shadow-xs"
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
          <section className="bg-gradient-to-r from-orange-50 via-amber-50/40 to-white border border-orange-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FF6422] flex items-center justify-center">
                  <Star className="w-4 h-4 fill-[#FF6422] text-[#FF6422]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-stone-900">
                    Top Rated Studios in Town
                  </h2>
                  <p className="text-[11px] text-stone-500">
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
                  className="bg-white border border-[#E2DDD5] rounded-2xl p-3 hover:border-orange-400 transition-all cursor-pointer shadow-xs"
                >
                  <div className="h-24 rounded-xl overflow-hidden mb-2 relative">
                    <img src={salon.coverImage} alt={salon.name} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-white/95 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> {salon.rating}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 truncate">{salon.name}</h4>
                  <p className="text-[10px] text-stone-500 truncate">{salon.locality} • {salon.distanceKm} km</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">{salon.currentQueue} waiting</span>
                    <span className="text-stone-900 font-extrabold">from ₹{salon.startingPrice}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recently Viewed Salons */}
          {recentlyViewedSalons.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF6422]" />
                Recently Viewed Salons
              </h2>
              <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                {recentlyViewedSalons.map((salon) => (
                  <div
                    key={salon.id}
                    onClick={() => handleSalonCardClick(salon)}
                    className="bg-white border border-[#E2DDD5] rounded-xl p-2.5 flex items-center gap-2.5 min-w-[200px] hover:border-orange-300 cursor-pointer shrink-0 shadow-xs"
                  >
                    <img src={salon.coverImage} alt={salon.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-900 truncate">{salon.name}</div>
                      <div className="text-[10px] text-stone-500 flex items-center gap-1">
                        <span className="text-[#FF6422] font-semibold">{salon.currentQueue} waiting</span>
                        <span>• {salon.distanceKm} km</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
    </div>
  );
};
