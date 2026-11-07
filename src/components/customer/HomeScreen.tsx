import React, { useState, useEffect } from 'react';
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
  PhoneOff,
  ChevronLeft,
  ChevronRight,
  Store,
  Info,
} from 'lucide-react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness, matchesGenderFilter, getSalonType } from '../../context/SalonContext';
import { LazyModeSelector } from '../common/LazyModeSelector';
import { Salon } from '../../types';

export const HomeScreen: React.FC = () => {
  const {
    salons,
    searchQuery,
    setSearchQuery,
    lazyFilter,
    userLocation,
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

  // Banner carousel state & touch/swipe handlers
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const totalSlides = 4;
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  // Auto-switch carousel every 4.5s
  useEffect(() => {
    if (isSwiping) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4500);
    return () => clearInterval(timer);
  }, [isSwiping, totalSlides]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setTouchDeltaX(e.touches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX !== null) {
      if (touchDeltaX < -40) {
        nextSlide();
      } else if (touchDeltaX > 40) {
        prevSlide();
      }
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
    setIsSwiping(false);
  };

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
      {/* 1. TOP PROMOTIONAL CAROUSEL (Auto-switching & Swipeable) */}
      <section className="relative">
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs border border-stone-200/70 group select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding Track */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {/* SLIDE 0: Compact "Too lazy to call. Too smart to wait." */}
            <div className="w-full shrink-0 flex-none min-h-[135px] sm:min-h-[150px] bg-[#FAF6EF] p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="space-y-1.5 sm:space-y-2 max-w-sm sm:max-w-md z-10">
                <div className="space-y-0.5 leading-tight">
                  <h1 className="text-base sm:text-xl md:text-2xl font-serif font-black text-stone-900 tracking-tight leading-tight">
                    Too lazy to call.
                  </h1>
                  <h2 className="text-base sm:text-xl md:text-2xl font-serif italic font-bold text-[#E05326] tracking-tight leading-tight">
                    Too smart to wait.
                  </h2>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-600 font-medium leading-snug line-clamp-2">
                  Know the waiting crowd before stepping out, and walk straight into your chair.
                </p>
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const targetSalon = shortestQueueSalons[0] || salons[0];
                      if (targetSalon) {
                        handleSalonCardClick(targetSalon);
                      } else {
                        setCustomerTab('explore');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#18181b] hover:bg-black text-white text-[11px] sm:text-xs font-bold shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Get your pass</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Orbit Rings & Phone-Off Badge */}
              <div className="shrink-0 flex items-center justify-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-[#EBDCCB]/90" />
                  <div className="absolute inset-2 sm:inset-2.5 rounded-full border border-[#F0E6D8]" />
                  <div className="absolute top-2 left-2.5 sm:top-2.5 sm:left-3 w-1.5 h-1.5 rounded-full bg-stone-900 shadow-2xs" />
                  <div className="absolute bottom-2 right-2.5 sm:bottom-2.5 sm:right-3 w-2 h-2 rounded-full border border-stone-800" />
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#E05326] flex items-center justify-center shadow-md shadow-orange-500/25">
                    <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white stroke-[2.2]" />
                  </div>
                </div>
              </div>
            </div>

            {/* SLIDE 1: Book now, pay at the salon */}
            <div
              className={`w-full shrink-0 flex-none min-h-[135px] sm:min-h-[150px] p-4 sm:p-5 text-white relative overflow-hidden flex items-center justify-between ${
                isWomen
                  ? 'bg-gradient-to-br from-[#E11D48] via-[#BE123C] to-[#9F1239]'
                  : 'bg-gradient-to-br from-[#1E40AF] via-[#2563EB] to-[#1D4ED8]'
              }`}
            >
              <div className="absolute -right-4 -bottom-6 w-36 h-36 text-white/10 pointer-events-none transform rotate-3">
                <Store className="w-full h-full stroke-1" />
              </div>
              <div className="relative z-10 max-w-sm sm:max-w-md space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase text-white">
                  <span>HOW IT WORKS</span>
                  <Info className="w-2.5 h-2.5" />
                </div>
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
                  Book now, pay at the salon
                </h3>
                <p className="text-[11px] sm:text-xs text-white/90 font-medium leading-snug">
                  No card needed — cash or card at the counter.
                </p>
                <button
                  type="button"
                  onClick={() => setCustomerTab('explore')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white underline hover:text-white/80 transition-colors pt-0.5 cursor-pointer"
                >
                  <span>Explore nearby</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* SLIDE 2: Chair-Side Real-Time Tracker */}
            <div
              className={`w-full shrink-0 flex-none min-h-[135px] sm:min-h-[150px] p-4 sm:p-5 text-white relative overflow-hidden flex items-center justify-between ${
                isWomen
                  ? 'bg-gradient-to-br from-[#BE123C] via-[#9F1239] to-[#881337]'
                  : 'bg-gradient-to-br from-[#1D4ED8] via-[#1E40AF] to-[#1E3A8A]'
              }`}
            >
              <div className="relative z-10 max-w-sm sm:max-w-md space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase text-white">
                  <span>REAL-TIME TRACKER</span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
                  Know the wait before you step out
                </h3>
                <p className="text-[11px] sm:text-xs text-white/90 font-medium leading-snug">
                  Chair counts updated directly by your barber.
                </p>
                <button
                  type="button"
                  onClick={() => setCustomerTab('explore')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white underline hover:text-white/80 transition-colors pt-0.5 cursor-pointer"
                >
                  <span>Browse studios nearby</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* SLIDE 3: Instant Walk-In Pass */}
            <div className="w-full shrink-0 flex-none min-h-[135px] sm:min-h-[150px] p-4 sm:p-5 text-white relative overflow-hidden flex items-center justify-between bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
              <div className="relative z-10 max-w-sm sm:max-w-md space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase text-white">
                  <span>INSTANT PASS</span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
                  Grab your pass from home
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-300 font-medium leading-snug">
                  Take pass #01, #02... and walk right into your chair.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const targetSalon = shortestQueueSalons[0] || salons[0];
                    if (targetSalon) {
                      handleSalonCardClick(targetSalon);
                    } else {
                      setCustomerTab('explore');
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 underline hover:text-orange-300 transition-colors pt-0.5 cursor-pointer"
                >
                  <span>Get in line now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Prev / Next Slide Arrows (Hover/Tap) */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous poster"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-stone-900/40 hover:bg-stone-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next poster"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-stone-900/40 hover:bg-stone-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx
                  ? idx === 0
                    ? 'w-6 bg-[#E05326]'
                    : isWomen
                    ? 'w-6 bg-rose-600'
                    : 'w-6 bg-blue-600'
                  : 'w-1.5 bg-stone-300 hover:bg-stone-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Lazy Mode Filter Bar */}
      <LazyModeSelector />

      {/* Popular Grooming Services Category Filter */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-[#FF6422]" />
            Popular Grooming Services
          </h2>
          {selectedServiceFilter !== 'All' && (
            <button
              onClick={() => setSelectedServiceFilter('All')}
              className="text-[11px] text-[#FF6422] hover:underline font-semibold"
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
                    <img
                      src={salon.coverImage}
                      alt={salon.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
                  <span className="text-stone-500">{salon.openingHours.formatted.split('(')[0]}</span>
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
            onClick={() => setCustomerTab('explore')}
            className="text-xs text-[#FF6422] hover:text-orange-700 font-semibold"
          >
            Explore all
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
                className="group bg-white hover:bg-[#FFFDF9] border border-[#E8E2D8] hover:border-orange-400 rounded-3xl p-4 transition-all duration-300 cursor-pointer shadow-[0_2px_12px_rgba(40,20,10,0.04)] hover:shadow-xl"
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
                      <span className="text-[#FF6422] font-bold bg-white/95 px-2 py-0.5 rounded-full backdrop-blur-sm border border-orange-200 shadow-xs text-[11px]">
                        {salon.distanceKm} km
                      </span>
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
    </div>
  );
};
