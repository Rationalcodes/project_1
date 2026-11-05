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
  CalendarX,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgePercent,
  Check,
  X,
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

  // Interactive accordion states for FAQs and T&C
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showFullTerms, setShowFullTerms] = useState(false);

  // Filtering logic
  const filteredSalons = salons.filter((salon) => {
    // Gender Filter match
    if (!matchesGenderFilter(salon, genderFilter)) return false;

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = salon.name.toLowerCase().includes(q);
      const matchLocality = salon.locality.toLowerCase().includes(q);
      const matchServices = salon.services.some((s) => s.name.toLowerCase().includes(q));
      const matchStaff = salon.staff.some((st) => st.name.toLowerCase().includes(q));
      if (!matchName && !matchLocality && !matchServices && !matchStaff) return false;
    }

    // Lazy Mode Filter
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
      q: 'Is Kumbhkaran really 100% free for customers?',
      a: 'Yes, absolutely! Kumbhkaran is completely free to use. You never pay any booking surcharge, platform fee, or hidden markup. You pay the salon directly for your service at their standard counter price.',
    },
    {
      q: 'How are the live waiting queue counts updated?',
      a: 'Queue counts are updated live directly by salon owners and stylists via the Kumbhkaran Partner software whenever a customer walks in or sits in a styling chair. Each studio card features a real-time freshness timestamp (e.g., "Updated 4m ago").',
    },
    {
      q: 'Can I join the walk-in queue online before leaving home?',
      a: 'Yes! When viewing a salon detail page, tap "Join Walk-In Queue". You will receive a digital ticket token (#01, #02...) with your estimated wait time, allowing you to walk in right when a chair opens up.',
    },
    {
      q: 'What if a salon queue status is marked "Outdated / Stale"?',
      a: 'If a salon has not updated its physical waiting counter in over 30 minutes, we transparently mark it with an orange "Outdated" warning tag and provide a 1-tap "Call Studio" button so you can confirm directly before heading over.',
    },
    {
      q: 'How can a salon or barber register their business?',
      a: 'Salon owners and independent barbers can onboard within 2 minutes for free through our Partner Portal. Simply claim or add your salon, set your active chair count, and start broadcasting live queues to nearby customers.',
    },
  ];

  return (
    <div className="space-y-8 pb-24 text-stone-900">
      {/* 1. HERO BRANDING & MISSION GLIMPSE */}
      <section
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 transition-all duration-300 ${
          isWomen
            ? 'bg-gradient-to-br from-[#FFF0EA] via-[#FFF8F5] to-[#FFEBE5] border border-[#FED7CC] shadow-[0_4px_24px_rgba(225,29,72,0.06)]'
            : 'bg-white border border-[#E8E2D8] shadow-[0_4px_24px_rgba(40,20,10,0.04)]'
        }`}
      >
        <div
          className={`absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full blur-3xl pointer-events-none ${
            isWomen ? 'bg-rose-400/15' : 'bg-orange-400/15'
          }`}
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                isWomen
                  ? 'bg-rose-100/90 border border-rose-200 text-[#E11D48]'
                  : 'bg-orange-50 border border-orange-200 text-[#FF6422]'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
              <span>{isWomen ? 'Glow & Glamour. Without the wait.' : 'Too lazy to call. Too smart to wait.'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight leading-tight">
              {isWomen ? (
                <>Skip beauty parlour crowds. <br /><span className="text-[#E11D48]">Walk in when chairs are free.</span></>
              ) : (
                <>Skip the salon crowd today. <br /><span className="text-[#FF6422]">Live walk-in queues in real-time.</span></>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 mt-2.5 leading-relaxed">
              Kumbhkaran connects you to verified neighborhood salons with 100% walk-in transparency.
              See exact waiting counts, estimated chair wait times, and real studio videos before leaving home.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setCustomerTab('explore')}
                className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  isWomen
                    ? 'bg-[#E11D48] text-white hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-[#FF6422] text-white hover:bg-orange-600 shadow-orange-500/20'
                }`}
              >
                <span>Browse All Studios & Services</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCustomerTab('map')}
                className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white text-stone-700 hover:text-stone-900 border border-stone-200 hover:border-stone-300 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Compass className="w-4 h-4 text-stone-500" />
                <span>Open City Map</span>
              </button>
            </div>
          </div>

          {/* Key Transparency Highlights Pill Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full md:w-auto shrink-0">
            <div className="p-3 rounded-2xl bg-white/80 border border-stone-200/80 shadow-xs flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold text-xs sm:text-sm">
                <Zap className="w-4 h-4" />
                <span>100% Real-Time</span>
              </div>
              <span className="text-[11px] text-stone-500 mt-0.5">Live queue chair counts</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 border border-stone-200/80 shadow-xs flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-[#FF6422] font-extrabold text-xs sm:text-sm">
                <Coffee className="w-4 h-4" />
                <span>Zero Blind Wait</span>
              </div>
              <span className="text-[11px] text-stone-500 mt-0.5">No plastic chair waiting</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 border border-stone-200/80 shadow-xs flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-xs sm:text-sm">
                <BadgePercent className="w-4 h-4" />
                <span>₹0 Extra Fee</span>
              </div>
              <span className="text-[11px] text-stone-500 mt-0.5">Exact counter prices</span>
            </div>

            <div className="p-3 rounded-2xl bg-white/80 border border-stone-200/80 shadow-xs flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-purple-600 font-extrabold text-xs sm:text-sm">
                <PhoneCall className="w-4 h-4" />
                <span>1-Tap Call</span>
              </div>
              <span className="text-[11px] text-stone-500 mt-0.5">Direct phone to studio</span>
            </div>
          </div>
        </div>

        {/* Comparison Bar Trigger (if items selected) */}
        {comparisonList.length > 0 && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
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

      {/* 2. LAZY MODE WAIT-TIME SELECTOR */}
      <LazyModeSelector />

      {/* 3. LIVE STUDIOS SHOWCASE ("Keep this image thing of homepage same") */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Shortest Queues Right Now
            </h2>
            <p className="text-[11px] text-stone-500">
              Live studio loop videos, real photos & physical queue tracking
            </p>
          </div>
          <button
            onClick={() => setCustomerTab('explore')}
            className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
              isWomen ? 'text-[#E11D48] hover:text-rose-800' : 'text-[#FF6422] hover:text-orange-700'
            }`}
          >
            <span>Explore all studios</span>
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
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isSaved ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="flex gap-3">
                  {/* Photo / Loop Video with Live Queue Badge Overlay */}
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
                        {salon.currentQueue < 10
                          ? `0${salon.currentQueue}`
                          : salon.currentQueue}{' '}
                        in queue
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
                        <div className="font-extrabold text-stone-900">
                          ₹{salon.startingPrice}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-stone-500">Est. Wait</div>
                        <div className="font-bold text-emerald-700">~{waitTime} mins</div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-stone-500">Distance</div>
                        <div className="font-semibold text-stone-700">
                          {salon.distanceKm} km
                        </div>
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
                  <span className="text-stone-500">
                    {(salon.openingHours?.formatted || '09:00 AM – 09:30 PM').split('(')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. THE PROBLEM WE ARE SOLVING (OLD BLIND WALK-IN VS KUMBHKARAN) */}
      <section className="bg-stone-900 text-white rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-[#FF6422]/10 blur-3xl pointer-events-none" />

        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>The Walk-In Reality</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Why Blind Walk-Ins Are Broken.
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1.5">
            Every week, millions of people waste hours on uncomfortable salon benches or make awkward phone calls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* The Old Painful Way */}
          <div className="rounded-2xl bg-white/5 border border-red-500/20 p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm mb-3">
                <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <X className="w-4 h-4 text-rose-400" />
                </div>
                <span>The Frustrating Old Way</span>
              </div>
              <ul className="space-y-2.5 text-xs text-stone-300">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span><strong>Blind Arrival:</strong> You reach the salon on Sunday morning only to find 7 people waiting ahead of you.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span><strong>Vague Phone Calls:</strong> Barber says <em>"Bhai bas 5 minute mein aao"</em>, and you still wait 45 minutes on a plastic chair.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span><strong>Wasted Weekend Hours:</strong> Half your weekend afternoon is killed doing nothing in crowded waiting areas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold shrink-0">✕</span>
                  <span><strong>Price Uncertainty:</strong> No idea about haircuts, beard trims, or combo prices until the bill arrives.</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-rose-300/80 font-medium">
              Average time wasted per haircut: <strong>45 to 70 minutes</strong>
            </div>
          </div>

          {/* The Kumbhkaran Solution */}
          <div className="rounded-2xl bg-gradient-to-br from-[#FF6422]/15 via-orange-950/20 to-black/40 border border-orange-500/30 p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-emerald-400" />
                </div>
                <span>The Kumbhkaran Transparency Way</span>
              </div>
              <ul className="space-y-2.5 text-xs text-stone-200">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span><strong>Live Waiting Counts:</strong> Check active customer counts directly from active barber chairs in real time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span><strong>Calculated Wait Times:</strong> Know whether your wait is 0 mins or 15 mins before tying your shoelaces.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span><strong>Digital Walk-In Token:</strong> Grab a live queue ticket (#01, #02) and walk in right when your turn arrives.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span><strong>100% In-Store Price Clarity:</strong> Verified service menus with ₹0 booking markups or hidden fees.</span>
                </li>
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-emerald-300 font-bold">
              Time wasted with Kumbhkaran: <strong>0 minutes blind waiting</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-7 shadow-xs">
        <div className="text-center max-w-lg mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF6422] text-xs font-bold mb-2">
            <Scissors className="w-3.5 h-3.5 text-[#FF6422]" />
            <span>Effortless Grooming</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            How Kumbhkaran Works in 3 Steps
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            No booking deposits. No inflexible schedules. Pure walk-in freedom.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#FF6422] text-white flex items-center justify-center font-black text-sm mb-3 shadow-md shadow-orange-500/20">
              1
            </div>
            <h3 className="text-sm font-bold text-stone-900">Check Live Queue</h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Open Kumbhkaran, see verified local studios, real chair videos, and exact waiting numbers before leaving home.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#FF6422] text-white flex items-center justify-center font-black text-sm mb-3 shadow-md shadow-orange-500/20">
              2
            </div>
            <h3 className="text-sm font-bold text-stone-900">Join Queue or Walk In</h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Grab a digital ticket token (#01, #02...) or head out right when a studio chair opens up. Call the salon directly if needed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-[#FF6422] text-white flex items-center justify-center font-black text-sm mb-3 shadow-md shadow-orange-500/20">
              3
            </div>
            <h3 className="text-sm font-bold text-stone-900">Get Styled & Pay In-Store</h3>
            <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
              Sit in the styling chair right on time. Pay normal salon counter prices with cash or UPI. Exactly ₹0 extra fee.
            </p>
          </div>
        </div>
      </section>

      {/* 6. OUR WORK & TRANSPARENCY CHARTER */}
      <section
        className={`rounded-3xl p-5 sm:p-7 border ${
          isWomen
            ? 'bg-gradient-to-r from-rose-50 via-pink-50/50 to-white border-rose-200'
            : 'bg-gradient-to-r from-orange-50 via-amber-50/40 to-white border-orange-200'
        } shadow-xs`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-bold text-stone-800 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>The Kumbhkaran Promise</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight">
              Our Work & Transparency Charter
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Built specifically for Indian local neighborhood grooming culture.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center gap-1 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% In-Store Pricing
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6422] flex items-center justify-center mb-2 font-bold">
              ₹0
            </div>
            <h4 className="text-xs font-bold text-stone-900">Zero Commission Markup</h4>
            <p className="text-[11px] text-stone-500 mt-1">
              We never inflate salon service menus. You pay the exact same price as a walk-in off the street.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">Timestamped Freshness</h4>
            <p className="text-[11px] text-stone-500 mt-1">
              Every salon queue is labeled with an exact update time. Stale queues are marked visibly.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
              <Building2 className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">Empowering Local Barbers</h4>
            <p className="text-[11px] text-stone-500 mt-1">
              Independent barbers get world-class queue SaaS completely free to grow their business.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-stone-900">Privacy & Spam Free</h4>
            <p className="text-[11px] text-stone-500 mt-1">
              Zero unwanted telemarketing calls or promotional SMS blasts. Your device data is respected.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FOR SALON OWNERS & BARBERS (PARTNER BANNER) */}
      <section className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-5 sm:p-7 text-white relative overflow-hidden shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold mb-2.5 border border-orange-500/30">
              <Store className="w-3.5 h-3.5 text-[#FF723A]" />
              <span>For Salon Owners & Independent Barbers</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Grow Walk-In Flow with Kumbhkaran Partner OS
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-1.5 leading-relaxed">
              Put your salon on Bilaspur&apos;s digital walk-in map. Eliminate chaotic crowd clusters,
              broadcast your live queue in 1 tap, and let nearby customers walk in during quiet hours.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <a
              href="https://partner.kumbhkaransalons.in"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-full bg-[#FF6422] hover:bg-orange-600 text-white font-bold text-xs sm:text-sm text-center shadow-lg transition-all"
            >
              Partner Portal Login
            </a>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) */}
      <section className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-[#FF6422]" />
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-stone-500">
              Everything you need to know about Kumbhkaran Salons
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;

            return (
              <div
                key={faq.q}
                className="border border-[#E8E2D8] rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-3 bg-stone-50/70 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-stone-900">
                    {faq.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-stone-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3.5 pt-2 text-xs text-stone-600 bg-white border-t border-stone-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. TERMS & CONDITIONS & WALK-IN GUIDELINES (T&C) */}
      <section className="bg-[#FAF7F2] rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Terms & Conditions & Walk-In Charter
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowFullTerms(!showFullTerms)}
            className="text-xs text-[#FF6422] hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{showFullTerms ? 'Collapse T&C' : 'Read Full T&C'}</span>
            {showFullTerms ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Kumbhkaran Salons operates as a discovery and live queue transparency technology platform.
          By using this service, customers and partner studios agree to fair walk-in practices and courteous conduct.
        </p>

        {showFullTerms && (
          <div className="mt-4 pt-4 border-t border-stone-200/80 space-y-3.5 text-xs text-stone-600">
            <div>
              <h5 className="font-bold text-stone-900">1. Real-Time Walk-In Queue Fair Use</h5>
              <p className="mt-0.5 leading-relaxed">
                Tokens issued on Kumbhkaran represent active physical walk-in queues. Customers holding a token are encouraged to arrive within the estimated wait window. Studios reserve the right to call subsequent customers if a ticket holder does not arrive within a reasonable courtesy buffer.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-900">2. Pricing & Direct Counter Settlement</h5>
              <p className="mt-0.5 leading-relaxed">
                All prices displayed are standard salon counter rates provided by verified studios. Kumbhkaran does not levy any platform surcharges or handling fees. Customers settle all service fees directly with the salon owner or barber at the store counter.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-900">3. Independent Salon Verification</h5>
              <p className="mt-0.5 leading-relaxed">
                All styling services, treatments, hygiene standards, and customer care are the direct responsibility of the respective independent salon partner. Kumbhkaran verifies physical salon locations and provides real-time digital communication tools.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-stone-900">4. Privacy & Device Data Policy</h5>
              <p className="mt-0.5 leading-relaxed">
                We store customer profile names, favorite studios, and queue tickets locally on your device for fast access. Authenticated sessions via Google OAuth are securely encrypted. We never sell your personal data or mobile number to third-party telemarketers.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 10. RICH BRAND FOOTER */}
      <footer className="pt-6 border-t border-stone-200 text-stone-500 text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF6422] text-white flex items-center justify-center font-black shadow-xs">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-stone-900 text-sm">
                Kumbhkaran Salons
              </span>
              <p className="text-[11px] text-stone-500">
                Bilaspur&apos;s Live Walk-In & Queue Transparency Network
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-stone-600">
            <button
              onClick={() => setCustomerTab('explore')}
              className="hover:text-[#FF6422] transition-colors cursor-pointer"
            >
              Explore Studios
            </button>
            <button
              onClick={() => setCustomerTab('map')}
              className="hover:text-[#FF6422] transition-colors cursor-pointer"
            >
              Salon Map
            </button>
            <button
              onClick={() => setCustomerTab('favourites')}
              className="hover:text-[#FF6422] transition-colors cursor-pointer"
            >
              Saved Studios
            </button>
            <button
              onClick={() => setCustomerTab('profile')}
              className="hover:text-[#FF6422] transition-colors cursor-pointer"
            >
              My Profile
            </button>
            <a
              href="https://partner.kumbhkaransalons.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FF6422] transition-colors"
            >
              Partner Portal
            </a>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
          <span>
            © {new Date().getFullYear()} Kumbhkaran Salons. All rights reserved.
          </span>
          <span>
            Built for modern Indian salons & smart walk-in customers.
          </span>
        </div>
      </footer>
    </div>
  );
};
