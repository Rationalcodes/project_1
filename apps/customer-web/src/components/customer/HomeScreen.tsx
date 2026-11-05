import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Star,
  Users,
  Clock,
  Navigation,
  ArrowRight,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  Heart,
  SlidersHorizontal,
  Store,
  Compass,
  ShieldCheck,
  Zap,
  PhoneCall,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgePercent,
  Building2,
  Coffee,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  getQueueDisplay,
  getQueueFreshness,
  matchesGenderFilter,
  getSalonType,
} from '../../context/CustomerContext';
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
    isLoadingSalons,
    userProfile,
    toggleFavorite,
    addToRecentlyViewed,
    setSelectedSalonForDetail,
    setCustomerTab,
    comparisonList,
    toggleCompareSalon,
    setIsCompareOpen,
    genderFilter,
  } = useSalon();

  const isWomen = genderFilter === 'women';

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showFullTerms, setShowFullTerms] = useState(false);

  // Filter salons by gender, search, and wait time
  const filteredSalons = salons.filter((salon) => {
    if (!matchesGenderFilter(salon, genderFilter)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = salon.name.toLowerCase().includes(q);
      const matchLocality = salon.locality.toLowerCase().includes(q);
      const matchServices = salon.services.some((s) => s.name.toLowerCase().includes(q));
      const matchStaff = salon.staff.some((st) => st.name.toLowerCase().includes(q));
      if (!matchName && !matchLocality && !matchServices && !matchStaff) return false;
    }

    const waitTime = getEstimatedWaitMinutes(
      salon.currentQueue,
      salon.avgServiceTimeMinutes,
      salon.activeBarbers
    );
    if (lazyFilter === '0-5' && waitTime > 5) return false;
    if (lazyFilter === '5-15' && (waitTime <= 5 || waitTime > 15)) return false;
    if (lazyFilter === '15-30' && (waitTime <= 15 || waitTime > 30)) return false;
    if (lazyFilter === '30+' && waitTime <= 30) return false;

    return true;
  });

  const genderMatchedSalons = salons.filter((s) => matchesGenderFilter(s, genderFilter));

  // Featured shop spotlight
  const featuredShop = genderMatchedSalons.find((s) => s.isVerified) || genderMatchedSalons[0];

  // Shortest queues (< 3 people)
  const shortestQueueSalons = [...genderMatchedSalons]
    .filter((s) => s.isOpen)
    .sort((a, b) => a.currentQueue - b.currentQueue)
    .slice(0, 4);

  // Top rated salons
  const topRatedSalons = [...genderMatchedSalons]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  // Recently viewed
  const recentlyViewedSalons = salons.filter((s) =>
    userProfile.recentlyViewed.includes(s.id)
  );

  const handleSalonCardClick = (salon: Salon) => {
    addToRecentlyViewed(salon.id);
    setSelectedSalonForDetail(salon);
  };

  const faqs = [
    {
      q: 'Is Kumbhkaran free to use?',
      a: 'Yes, 100% free. You only pay your salon directly at the counter for your haircut or styling. There are no platform fees or booking charges.',
    },
    {
      q: 'How are waiting times tracked?',
      a: 'Salons update their waiting list live from their phone whenever a customer arrives or finishes. Each salon card shows exactly when the counter was last updated.',
    },
    {
      q: 'Do I need to book an appointment?',
      a: 'No appointments needed. Kumbhkaran is made for walk-ins. Check the crowd from home, head over when wait times are low, and walk right in.',
    },
    {
      q: 'Can I get in line from home?',
      a: 'Yes! Tap any salon to view details, then tap "Join Walk-In Queue" to grab a digital ticket (#01, #02...). You can time your visit so a chair is ready when you arrive.',
    },
    {
      q: 'What if a salon has not updated recently?',
      a: 'If a queue hasn\'t been updated in over 30 minutes, we clearly tag it as "Outdated" so you know to tap "Call Studio" and check with the barber before heading out.',
    },
    {
      q: 'How can a salon get listed?',
      a: 'Salon owners can register for free at partner.kumbhkaransalons.in. It takes less than two minutes to list your shop and start updating queues.',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-7 pb-24 text-stone-900">
      {/* 1. HERO SECTION */}
      <section
        className={`relative overflow-hidden rounded-3xl p-4 sm:p-6 transition-all duration-300 ${
          isWomen
            ? 'bg-gradient-to-br from-[#FFF0EA] via-[#FFF8F5] to-[#FFEBE5] border border-[#FED7CC] shadow-[0_4px_24px_rgba(225,29,72,0.06)]'
            : 'bg-white border border-[#E8E2D8] shadow-[0_4px_24px_rgba(40,20,10,0.04)]'
        }`}
      >
        <div
          className={`absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 rounded-full blur-3xl pointer-events-none ${
            isWomen ? 'bg-rose-400/15' : 'bg-orange-400/15'
          }`}
        />

        <div className="relative z-10">
          <div>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${
                isWomen
                  ? 'bg-rose-100/90 border border-rose-200 text-[#E11D48]'
                  : 'bg-orange-50 border border-orange-200 text-[#FF6422]'
              }`}
            >
              {isWomen ? (
                <Sparkles className="w-3 h-3 text-[#E11D48]" />
              ) : (
                <Scissors className="w-3 h-3 text-[#FF6422]" />
              )}
              <span>{isWomen ? 'Beauty Parlours & Spas' : 'Bilaspur Salon Network'}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
              {isWomen ? (
                <>Know the wait <span className="text-[#E11D48]">before you visit.</span></>
              ) : (
                <>Know the wait <span className="text-[#FF6422]">before you visit.</span></>
              )}
            </h1>

            <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
              {isWomen
                ? 'Check live waiting lines at top beauty parlours and hair lounges in Bilaspur. Walk in whenever chairs are free.'
                : 'See how many people are waiting at your local salon or barber. No guessing, no long waiting — just walk in when you\'re ready.'}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 mt-3.5">
              <button
                type="button"
                onClick={() => setCustomerTab('explore')}
                className={`flex-1 py-2 sm:py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                  isWomen
                    ? 'bg-[#E11D48] text-white hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-[#FF6422] text-white hover:bg-orange-600 shadow-orange-500/20'
                }`}
              >
                <span>Explore Salons</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCustomerTab('map')}
                className="py-2 sm:py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold bg-white text-stone-700 hover:text-stone-900 border border-stone-200 hover:border-stone-300 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <Compass className="w-3.5 h-3.5 text-stone-500" />
                <span>Map View</span>
              </button>
            </div>
          </div>

          {/* Featured Local Studio Spotlight */}
          {featuredShop && (
            <div className="mt-3.5 pt-3 border-t border-stone-200/70">
              <div className="flex items-center justify-between text-[11px] mb-1.5 px-0.5">
                <span className="font-bold text-stone-700 flex items-center gap-1">
                  <Star className="w-3 h-3 text-[#FF6422] fill-[#FF6422]" /> Featured Studio
                </span>
                <button
                  onClick={() => setCustomerTab('explore')}
                  className="text-stone-400 hover:text-stone-700 text-[10px] flex items-center gap-0.5"
                >
                  View all ↗
                </button>
              </div>

              <div
                onClick={() => handleSalonCardClick(featuredShop)}
                className="p-2 sm:p-2.5 rounded-2xl bg-white/90 hover:bg-white border border-stone-200 hover:border-orange-300 transition-all cursor-pointer flex items-center justify-between gap-2.5 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden relative shrink-0 ring-1 ring-black/5">
                    {featuredShop.loopVideoUrl ? (
                      <video
                        src={featuredShop.loopVideoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster={featuredShop.coverImage || featuredShop.posterImage}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={
                          featuredShop.coverImage ||
                          featuredShop.posterImage ||
                          (featuredShop.locationImages && featuredShop.locationImages[0]) ||
                          (featuredShop.workImages && featuredShop.workImages[0]) ||
                          (featuredShop.images && featuredShop.images[0])
                        }
                        alt={featuredShop.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {featuredShop.loopVideoUrl && (
                      <span className="absolute top-0.5 left-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] text-amber-300 font-bold">
                        🎥
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {featuredShop.name}
                      </span>
                      {featuredShop.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6422] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {featuredShop.locality} • Haircut from ₹{featuredShop.startingPrice}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{featuredShop.currentQueue} waiting now • ~{getEstimatedWaitMinutes(featuredShop.currentQueue, featuredShop.avgServiceTimeMinutes, featuredShop.activeBarbers)} min wait</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-[#FF6422] text-white text-xs font-bold hover:bg-orange-600 transition-colors shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
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
          <span>Finding salons near you...</span>
        </div>
      )}

      {/* 2. WAIT-TIME FILTER */}
      <LazyModeSelector />

      {/* 3. SHORTEST WAIT RIGHT NOW */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Shortest wait right now
            </h2>
            <p className="text-[11px] text-stone-500">
              Salons with the least crowd at this moment
            </p>
          </div>
          <button
            onClick={() => setCustomerTab('explore')}
            className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              isWomen ? 'text-[#E11D48] hover:text-rose-800' : 'text-[#FF6422] hover:text-orange-700'
            }`}
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {shortestQueueSalons.map((salon) => {
            const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
            const waitTime = getEstimatedWaitMinutes(
              salon.currentQueue,
              salon.avgServiceTimeMinutes,
              salon.activeBarbers
            );
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
                    title="Compare"
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
                    title="Save"
                    className="p-1.5 rounded-full bg-white/90 text-stone-500 hover:text-rose-500 border border-stone-200 backdrop-blur-md transition-colors shadow-xs"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isSaved ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-3">
                  {/* Photo / Loop Video */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden relative shrink-0">
                    {salon.loopVideoUrl ? (
                      <video
                        src={salon.loopVideoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster={salon.coverImage || salon.posterImage}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : salon.coverImage ||
                      salon.posterImage ||
                      (salon.images && salon.images[0]) ||
                      (salon.locationImages && salon.locationImages[0]) ||
                      (salon.workImages && salon.workImages[0]) ? (
                      <img
                        src={
                          salon.coverImage ||
                          salon.posterImage ||
                          (salon.images && salon.images[0]) ||
                          (salon.locationImages && salon.locationImages[0]) ||
                          (salon.workImages && salon.workImages[0])
                        }
                        alt={salon.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex flex-col items-center justify-center text-white p-2 text-center">
                        <Store className="w-6 h-6 text-[#FF6422] mb-1" />
                        <span className="text-[10px] font-black line-clamp-1">
                          {salon.name}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    {salon.loopVideoUrl && (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-[9px] font-bold text-amber-400 flex items-center gap-0.5 shadow-xs pointer-events-none">
                        🎥 Video
                      </span>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-xs ${queueInfo.pillClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${queueInfo.dotClass}`} />
                        {salon.currentQueue} waiting
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
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                            getSalonType(salon) === 'men'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : getSalonType(salon) === 'women'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {getSalonType(salon) === 'men'
                            ? 'Men'
                            : getSalonType(salon) === 'women'
                            ? 'Women'
                            : 'Unisex'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#E8E2D8] flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-stone-500">Haircut from</div>
                        <div className="font-bold text-stone-900">
                          ₹{salon.startingPrice}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-stone-500">Wait</div>
                        <div className="font-bold text-emerald-700">~{waitTime} mins</div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-stone-500">Distance</div>
                        <div className="font-medium text-stone-700">
                          {salon.distanceKm} km
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Queue Freshness */}
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
                  <span className="text-stone-500">
                    {(salon.openingHours?.formatted || '09:00 AM – 09:30 PM').split('(')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. ALL SALONS NEARBY */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#FF6422]" />
              All salons nearby ({filteredSalons.length})
            </h2>
            <p className="text-[11px] text-stone-500">
              {userLocation
                ? `Sorted by distance from ${userLocation.name.split(',')[0]}`
                : 'Verified local salons in Bilaspur'}
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
            const waitTime = getEstimatedWaitMinutes(
              salon.currentQueue,
              salon.avgServiceTimeMinutes,
              salon.activeBarbers
            );
            const freshness = getQueueFreshness(salon.lastQueueUpdate);
            const isSaved = userProfile.savedSalons.includes(salon.id);

            return (
              <div
                key={salon.id}
                onClick={() => handleSalonCardClick(salon)}
                className={`group transition-all duration-300 cursor-pointer p-4 ${
                  isWomen
                    ? 'rounded-3xl bg-white hover:bg-[#FFF8F5] border border-[#FED7CC] hover:border-rose-300 shadow-[0_2px_14px_rgba(225,29,72,0.05)] hover:shadow-xl'
                    : 'rounded-2xl bg-white hover:bg-[#FFFDF9] border border-[#E8E2D8] hover:border-orange-400 shadow-[0_2px_12px_rgba(40,20,10,0.04)] hover:shadow-xl'
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Photo with overlay */}
                  <div className="sm:w-44 h-40 rounded-2xl overflow-hidden relative shrink-0">
                    {salon.loopVideoUrl ? (
                      <video
                        src={salon.loopVideoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        poster={salon.coverImage || salon.posterImage}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : salon.coverImage ||
                      salon.posterImage ||
                      (salon.images && salon.images[0]) ||
                      (salon.locationImages && salon.locationImages[0]) ? (
                      <img
                        src={
                          salon.coverImage ||
                          salon.posterImage ||
                          (salon.images && salon.images[0]) ||
                          (salon.locationImages && salon.locationImages[0])
                        }
                        alt={salon.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 flex flex-col items-center justify-center text-white p-3 text-center">
                        <Store className="w-8 h-8 text-[#FF6422] mb-1" />
                        <span className="text-xs font-bold">{salon.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                    {salon.loopVideoUrl && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-xs text-[10px] font-bold text-amber-400 flex items-center gap-0.5 shadow-xs pointer-events-none">
                        🎥 Video
                      </span>
                    )}

                    {/* Live Queue Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-md backdrop-blur-md ${queueInfo.badgeClass}`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        {salon.currentQueue} waiting
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
                        title="Save"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isSaved ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-emerald-800 bg-white/90 px-2 py-0.5 rounded-full backdrop-blur-sm shadow-xs border border-emerald-200 text-[11px]">
                        ~{waitTime}m wait
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
                            userLocation || undefined
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
                          <span className="text-stone-400 font-normal">
                            ({salon.reviewCount})
                          </span>
                        </div>
                      </div>

                      {/* Services preview */}
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
                        <span className="text-stone-900 font-bold text-sm">
                          ₹{salon.startingPrice}{' '}
                          <span className="text-[11px] font-normal text-stone-500">
                            starting
                          </span>
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-600 flex items-center gap-1 text-[11px]">
                          <Navigation className="w-3 h-3 text-[#FF6422]" />
                          {salon.locality}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${freshness.badgeClass}`}
                        >
                          {freshness.text}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSalonCardClick(salon);
                          }}
                          className="px-3 py-1 rounded-xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
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

      {/* 5. HOW IT WORKS (SIMPLE & DIRECT) */}
      <section className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            How it works
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Three simple steps to save time on your next haircut
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="w-8 h-8 rounded-full bg-[#FF6422] text-white flex items-center justify-center font-bold text-xs mb-2.5 shadow-sm shadow-orange-500/20">
              1
            </div>
            <h3 className="text-xs font-bold text-stone-900">Check the line</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Open Kumbhkaran to see live waiting numbers and estimated wait times before heading out.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="w-8 h-8 rounded-full bg-[#FF6422] text-white flex items-center justify-center font-bold text-xs mb-2.5 shadow-sm shadow-orange-500/20">
              2
            </div>
            <h3 className="text-xs font-bold text-stone-900">Walk in or take a token</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Grab a queue number from home, or head straight over when wait times are low.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="w-8 h-8 rounded-full bg-[#FF6422] text-white flex items-center justify-center font-bold text-xs mb-2.5 shadow-sm shadow-orange-500/20">
              3
            </div>
            <h3 className="text-xs font-bold text-stone-900">Sit in the chair</h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Get styled right on time. Pay normal salon rates directly at the counter. Zero extra fees.
            </p>
          </div>
        </div>
      </section>

      {/* 6. SIMPLE, FAIR, TRANSPARENT */}
      <section className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-xs">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-bold text-stone-900">
            Simple, fair, transparent
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Designed to respect your time and money
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6422] flex items-center justify-center mb-2 font-bold text-xs">
              ₹0
            </div>
            <h4 className="text-xs font-bold text-stone-900">No Booking Fees</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              You pay standard counter prices directly to the salon. We never add markups.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">Real-Time Queues</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Counts update live as customers arrive and leave chairs throughout the day.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
              <PhoneCall className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">Call Anytime</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Have a question about a cut or style? Call the salon directly in one tap.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8]">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">No Spam</h4>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              No telemarketing calls or promotional SMS blasts. Your phone number stays safe.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FOR SALON OWNERS */}
      <section className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-lg">
            <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
              For Salon Owners
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              Own a salon in Bilaspur?
            </h3>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              List your shop on Kumbhkaran for free. Update your waiting line in one tap, reduce waiting room crowd, and bring in more walk-ins.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <a
              href="https://partner.kumbhkaransalons.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#FF6422] hover:bg-orange-600 text-white font-bold text-xs text-center shadow-md transition-all"
            >
              Partner Portal Login
            </a>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-[#FF6422]" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              Frequently asked questions
            </h3>
            <p className="text-xs text-stone-500">
              Common questions about Kumbhkaran Salons
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;

            return (
              <div
                key={faq.q}
                className="border border-[#E8E2D8] rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-3 text-left flex items-center justify-between gap-3 bg-stone-50/60 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-semibold text-stone-900">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3 pt-2 text-xs text-stone-600 bg-white border-t border-stone-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. GUIDELINES & TERMS */}
      <section className="bg-[#FAF7F2] rounded-3xl border border-[#E8E2D8] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-600" />
            <h3 className="text-xs sm:text-sm font-bold text-stone-900">
              Guidelines & Terms of Service
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFullTerms(!showFullTerms)}
            className="text-xs text-[#FF6422] hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{showFullTerms ? 'Hide details' : 'Read details'}</span>
            {showFullTerms ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Kumbhkaran connects customers with local salons for live queue tracking. All payments are handled directly at the shop.
        </p>

        {showFullTerms && (
          <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-2.5 text-xs text-stone-600">
            <div>
              <h5 className="font-bold text-stone-900">Walk-in tokens</h5>
              <p className="mt-0.5 leading-relaxed">
                Tokens help you plan your visit. Please try to arrive close to your estimated wait time. If you run late, the salon may seat the next person and attend to you right after.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-900">Direct counter payments</h5>
              <p className="mt-0.5 leading-relaxed">
                All prices listed are standard in-store rates provided by verified salons. You pay the salon directly at the counter with cash or UPI.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-900">Service quality</h5>
              <p className="mt-0.5 leading-relaxed">
                Hygiene, styling, and customer care remain the direct responsibility of each independent salon partner.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-900">Privacy</h5>
              <p className="mt-0.5 leading-relaxed">
                Your profile information and favorite salons are stored securely on your device. We will never sell your personal details to third-party telemarketers.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 10. FOOTER */}
      <footer className="pt-6 border-t border-stone-200 text-stone-500 text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF6422] text-white flex items-center justify-center font-bold shadow-xs">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-stone-900 text-sm">
                Kumbhkaran Salons
              </span>
              <p className="text-[11px] text-stone-500">
                Live salon queues in Bilaspur
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-stone-600">
            <button
              onClick={() => setCustomerTab('explore')}
              className="hover:text-[#FF6422] transition-colors cursor-pointer"
            >
              Explore
            </button>
            <button
              onClick={() => setCustomerTab('map')}
              className="hover:text-[#FF6422] transition-colors cursor-pointer"
            >
              Map
            </button>
            <button
              onClick={() => setCustomerTab('favourites')}
              className="hover:text-[#FF6422] transition-colors cursor-pointer"
            >
              Saved
            </button>
            <button
              onClick={() => setCustomerTab('profile')}
              className="hover:text-[#FF6422] transition-colors cursor-pointer"
            >
              Profile
            </button>
            <a
              href="https://partner.kumbhkaransalons.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FF6422] transition-colors"
            >
              For Salons
            </a>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
          <span>
            © {new Date().getFullYear()} Kumbhkaran Salons. All rights reserved.
          </span>
          <span>
            Built with care in Bilaspur.
          </span>
        </div>
      </footer>
    </div>
  );
};
