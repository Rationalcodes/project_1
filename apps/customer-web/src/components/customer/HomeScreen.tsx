import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  Star,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Store,
  Compass,
} from 'lucide-react';
import { useCustomer, matchesGenderFilter } from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';
import { getTheme } from '../../theme';
import { SalonCard } from '../common/SalonCard';

export const HomeScreen: React.FC = () => {
  const {
    salons,
    genderFilter,
    setCustomerTab,
    setSelectedSalonForDetail,
    addToRecentlyViewed,
    toggleFavorite,
    userProfile,
    lazyFilter,
    setLazyFilter,
    selectedServiceFilter,
    setSelectedServiceFilter,
    searchQuery,
  } = useCustomer();

  const isWomen = genderFilter === 'women';
  const theme = getTheme(genderFilter);
  const isLazyActive = lazyFilter === '0-5';

  // Filter salons by gender support, search query, and service
  const filteredSalons = useMemo(() => {
    return salons.filter((salon) => {
      // 1. Gender check using unified matcher
      if (!matchesGenderFilter(salon, genderFilter)) return false;

      // 2. Search query check
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = salon.name?.toLowerCase().includes(query);
        const matchesLocality = salon.locality?.toLowerCase().includes(query);
        const matchesCity = salon.city?.toLowerCase().includes(query);
        const matchesServices = salon.services?.some((s) => s.name?.toLowerCase().includes(query));
        if (!matchesName && !matchesLocality && !matchesCity && !matchesServices) return false;
      }

      // 3. Category service filter
      if (selectedServiceFilter && selectedServiceFilter !== 'All') {
        const matchesCategory = salon.services?.some(
          (s) => s.name?.toLowerCase().includes(selectedServiceFilter.toLowerCase())
        );
        if (!matchesCategory) return false;
      }

      // 4. Lazy Mode (No current queue)
      if (isLazyActive) {
        if (salon.currentQueue > 0 || !salon.isOpen) return false;
      }

      return true;
    });
  }, [salons, genderFilter, searchQuery, selectedServiceFilter, isLazyActive]);

  // Specific segments
  const nearbySalons = useMemo(() => {
    return [...filteredSalons].sort((a, b) => (a.distanceKm || 99) - (b.distanceKm || 99));
  }, [filteredSalons]);

  const immediateChairs = useMemo(() => {
    return filteredSalons.filter((s) => s.isOpen !== false && s.currentQueue <= 2);
  }, [filteredSalons]);

  const topRated = useMemo(() => {
    return [...filteredSalons].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [filteredSalons]);

  const recentlyViewedSalons = useMemo(() => {
    if (!userProfile?.recentlyViewed?.length) return [];
    return userProfile.recentlyViewed
      .map((id) => salons.find((s) => s.id === id))
      .filter((s): s is Salon => Boolean(s));
  }, [salons, userProfile?.recentlyViewed]);

  const handleSelectSalon = (salon: Salon) => {
    addToRecentlyViewed(salon.id);
    setSelectedSalonForDetail(salon);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. EDITORIAL HERO SHOWCASE */}
      <section
        className={`relative rounded-3xl overflow-hidden border transition-all ${
          isWomen
            ? 'bg-gradient-to-br from-[#FFF5F2] via-[#FFFBF9] to-[#FFEAE3] border-rose-200/80 shadow-[0_4px_24px_rgba(225,29,72,0.04)]'
            : 'bg-gradient-to-br from-[#FFF4EE] via-[#FAF7F2] to-[#FFE7DC] border-orange-200/80 shadow-[0_4px_24px_rgba(255,100,34,0.04)]'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 p-6 sm:p-8 lg:p-10">
          <div className="md:col-span-7 space-y-3.5">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{theme.heroTagline}</span>
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight leading-tight">
              {theme.heroHeadline}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed max-w-xl">
              {theme.heroSubheadline}
            </p>

            <div className="pt-2 flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setCustomerTab('explore')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-all cursor-pointer flex items-center gap-2 ${
                  isWomen
                    ? 'bg-[#E11D48] hover:bg-[#BE123C] shadow-rose-500/25'
                    : 'bg-[#FF6422] hover:bg-[#E05316] shadow-orange-500/25'
                }`}
              >
                <span>Browse Neighbourhood Studios</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCustomerTab('map')}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-stone-800 bg-white border border-stone-200 hover:bg-stone-50 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-stone-600" />
                <span>Locate on Map</span>
              </button>
            </div>
          </div>

          <div className="md:col-span-5 hidden md:block">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl border border-white">
              <img
                src={theme.heroImage}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <span className="text-[10px] font-black uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                  Physical Queues Tracked Live
                </span>
                <p className="text-xs font-bold mt-1 drop-shadow-sm">
                  Verified waiting counts updated by studio front desks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. GROOMING CATEGORY CAROUSEL */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">
              {isWomen ? 'Beauty & Salon Services' : 'Grooming Categories'}
            </h2>
            <p className="text-xs text-stone-500">
              Filter studios by service specialties and transparent rate cards
            </p>
          </div>

          {selectedServiceFilter && (
            <button
              type="button"
              onClick={() => setSelectedServiceFilter(null)}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Clear filter
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
          {theme.categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedServiceFilter === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedServiceFilter(isSelected ? null : cat.id)}
                className={`group shrink-0 w-32 sm:w-36 rounded-2xl p-2.5 border transition-all text-left cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? isWomen
                      ? 'bg-rose-50/90 border-[#E11D48] shadow-xs'
                      : 'bg-orange-50/90 border-[#FF6422] shadow-xs'
                    : 'bg-white border-stone-200/80 hover:border-stone-400 hover:shadow-xs'
                }`}
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden mb-2 relative bg-stone-100">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div
                    className={`absolute bottom-1.5 right-1.5 p-1 rounded-lg backdrop-blur-md ${
                      isSelected
                        ? isWomen
                          ? 'bg-[#E11D48] text-white'
                          : 'bg-[#FF6422] text-white'
                        : 'bg-black/60 text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-black text-stone-900 truncate">
                    {cat.name}
                  </span>
                  <span className="block text-[10px] text-stone-500 truncate mt-0.5">
                    {cat.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. LAZY MODE / IMMEDIATE CHAIR FILTER */}
      <section
        className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          lazyFilter
            ? isWomen
              ? 'bg-rose-50/80 border-rose-300'
              : 'bg-orange-50/80 border-orange-300'
            : 'bg-white border-stone-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              lazyFilter
                ? isWomen
                  ? 'bg-[#E11D48] text-white'
                  : 'bg-[#FF6422] text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-stone-900">Lazy Mode</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Zero Wait Only
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Only display neighbourhood salons with an empty waiting area right now
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setLazyFilter(isLazyActive ? 'all' : '0-5')}
          className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 ${
            isLazyActive
              ? isWomen
                ? 'bg-[#E11D48] text-white shadow-xs'
                : 'bg-[#FF6422] text-white shadow-xs'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          {isLazyActive ? '✓ Showing 0-Wait Salons' : 'Enable Zero-Wait Filter'}
        </button>
      </section>

      {/* 4. IMMEDIATE WALK-IN CHAIRS (0-2 WAITING) */}
      {immediateChairs.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="text-lg font-black text-stone-900 tracking-tight">
                  Chairs Available Right Now
                </h2>
                <p className="text-xs text-stone-500">
                  Studios with 0 to 2 customers waiting. Walk straight in without long queues.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {immediateChairs.slice(0, 3).map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                onSelect={handleSelectSalon}
                isSaved={userProfile?.savedSalons?.includes(salon.id)}
                onToggleFavorite={toggleFavorite}
                experience={genderFilter}
              />
            ))}
          </div>
        </section>
      )}

      {/* 5. NEARBY SALONS (PRIMARY FEED) */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">
              Nearby Studios in Your Area
            </h2>
            <p className="text-xs text-stone-500">
              Ranked by proximity to your current location
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCustomerTab('explore')}
            className={`text-xs font-black transition-colors flex items-center gap-1 cursor-pointer ${
              isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'
            }`}
          >
            <span>View All ({filteredSalons.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {nearbySalons.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nearbySalons.slice(0, 6).map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                onSelect={handleSelectSalon}
                isSaved={userProfile?.savedSalons?.includes(salon.id)}
                onToggleFavorite={toggleFavorite}
                experience={genderFilter}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white rounded-3xl text-center border border-stone-200">
            <Store className="w-10 h-10 text-stone-300 mx-auto mb-2" />
            <h3 className="text-sm font-black text-stone-900">No studios match your filter</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Try adjusting your category selection or turn off Lazy Mode to discover all nearby salons.
            </p>
            {isLazyActive && (
              <button
                type="button"
                onClick={() => setLazyFilter('all')}
                className="mt-3 px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Disable Lazy Mode
              </button>
            )}
          </div>
        )}
      </section>

      {/* 6. TOP RATED STUDIOS */}
      {topRated.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <div>
                <h2 className="text-lg font-black text-stone-900 tracking-tight">
                  Top-Rated Neighbourhood Studios
                </h2>
                <p className="text-xs text-stone-500">
                  Highest customer reviews and verified styling quality
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topRated.slice(0, 3).map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                onSelect={handleSelectSalon}
                isSaved={userProfile?.savedSalons?.includes(salon.id)}
                onToggleFavorite={toggleFavorite}
                experience={genderFilter}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. RECENTLY VIEWED STUDIOS */}
      {recentlyViewedSalons.length > 0 && (
        <section className="space-y-3.5 pt-4 border-t border-stone-200">
          <div>
            <h2 className="text-base font-black text-stone-900 tracking-tight">
              Recently Viewed Studios
            </h2>
            <p className="text-xs text-stone-500">
              Quickly re-check physical waiting counts for studios you previously viewed
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentlyViewedSalons.slice(0, 3).map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                onSelect={handleSelectSalon}
                isSaved={userProfile?.savedSalons?.includes(salon.id)}
                onToggleFavorite={toggleFavorite}
                experience={genderFilter}
              />
            ))}
          </div>
        </section>
      )}

      {/* 8. SLOON CONFIDENCE GUARANTEE BANNER */}
      <section className="bg-stone-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Walk-In Confidence</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            Too lazy to call. Too smart to wait.
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 font-normal leading-relaxed">
            SLOON is your neighbourhood salon network. We provide live queue counts, transparent pricing, and verified staff availability so you never wait blindly again.
          </p>
        </div>
      </section>
    </div>
  );
};
