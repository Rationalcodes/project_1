import { InstagramGradientIcon } from '../common/InstagramIcon';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  Clock,
  ArrowRight,
  Scissors,
  CheckCircle2,
  Compass,
  ShieldCheck,
  PhoneCall,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Store,
  Info,
  Heart,
  Phone,
  X,
  Navigation,
  Sparkles,
  PhoneOff,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  getQueueDisplay,
  matchesGenderFilter,
  getSalonType,
} from '../../context/CustomerContext';
import { Salon, HomeBanner, DEFAULT_HOME_BANNERS } from '@kumbhakaran/shared-types';
import { defaultApiClient } from '@kumbhakaran/api-client';

export const HomeScreen: React.FC = () => {
  const {
    salons,
    genderFilter,
    setCustomerTab,
    setSelectedSalonForDetail,
    addToRecentlyViewed,
    toggleFavorite,
    userProfile,
    selectedServiceFilter,
    setSelectedServiceFilter,
  } = useSalon();

  const isWomen = genderFilter === 'women';

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: 'Good morning', icon: '☀️' };
    if (hour >= 12 && hour < 17) return { text: 'Good afternoon', icon: '🌤️' };
    if (hour >= 17 && hour < 21) return { text: 'Good evening', icon: '🌆' };
    return { text: 'Hey there', icon: '🌙' };
  }, []);

  const BANNER_STORAGE_KEY = 'sloon_home_banners';

  // 4 Home Poster Spaces (Admin controllable & persistent)
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>(() => {
    try {
      const saved = localStorage.getItem(BANNER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_HOME_BANNERS;
  });

  useEffect(() => {
    // 1. Fetch live banners from backend database
    defaultApiClient.getBanners().then((fetched) => {
      if (Array.isArray(fetched) && fetched.length > 0) {
        setHomeBanners(fetched);
        try {
          localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(fetched));
        } catch {}
      }
    }).catch(() => {});

    // 2. Listen to local/tab update events
    const handleUpdate = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) setHomeBanners(e.detail);
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === BANNER_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setHomeBanners(parsed);
        } catch {}
      }
    };
    window.addEventListener('sloon_banners_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('sloon_banners_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Banner carousel state & touch/swipe handlers
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const totalSlides = homeBanners.length || 4;
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

  // Categories list with ultra-crisp grooming imagery
  const categories = isWomen
    ? [
        {
          id: 'Hair',
          name: 'Hair Care',
          image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Facial',
          name: 'Face & Skin',
          image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Eye',
          name: 'Eye & Brow',
          image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Spa',
          name: 'Spa & Care',
          image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Color',
          name: 'Hair Color',
          image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Combos',
          name: 'Packages',
          image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
        },
      ]
    : [
        {
          id: 'Hair',
          name: 'Hair Care',
          image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Facial',
          name: 'Face & Skin',
          image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Beard',
          name: 'Beard & Shave',
          image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Eye',
          name: 'Eye & Brow',
          image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Spa',
          name: 'Spa & Massage',
          image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Color',
          name: 'Hair Color',
          image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 'Combos',
          name: 'Combos',
          image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=400&q=80',
        },
      ];

  // Memoized gender and service category filtering (Phase 4 Optimization)
  const genderMatchedSalons = useMemo(
    () => salons.filter((s) => matchesGenderFilter(s, genderFilter)),
    [salons, genderFilter],
  );

  // Filter salons if a category is clicked
  const displayedSalons = useMemo(() => {
    return genderMatchedSalons.filter((salon) => {
      if (selectedServiceFilter === 'All' || !selectedServiceFilter) return true;
      // Check salon services
      if (Array.isArray(salon.services) && salon.services.length > 0) {
        return salon.services.some(
          (svc) =>
            svc.category?.toLowerCase() === selectedServiceFilter.toLowerCase() ||
            svc.name?.toLowerCase().includes(selectedServiceFilter.toLowerCase()),
        );
      }
      return true;
    });
  }, [genderMatchedSalons, selectedServiceFilter]);

  const handleSalonCardClick = (salon: Salon) => {
    addToRecentlyViewed(salon.id);
    setSelectedSalonForDetail(salon);
  };

  const handleCategoryClick = (categoryId: string) => {
    if (selectedServiceFilter === categoryId) {
      setSelectedServiceFilter('All');
    } else {
      setSelectedServiceFilter(categoryId);
    }
  };

  const faqs = [
    {
      q: 'Is SLOON free to use?',
      a: 'Yes, 100% free. You only pay your salon directly at the counter for your haircut or styling. There are no platform fees or booking charges.',
    },
    {
      q: 'How are waiting times tracked?',
      a: 'Salons update their waiting list live from their phone whenever a customer arrives or finishes. Each salon card shows exactly when the counter was last updated.',
    },
    {
      q: 'Do I need to book an appointment?',
      a: 'No appointments needed. SLOON is made for walk-ins. Check the crowd from home, head over when wait times are low, and walk right in.',
    },
    {
      q: 'Can I get in line from home?',
      a: 'Yes! Tap any salon to view details, then tap "Join Walk-In Queue" to grab a digital ticket (#01, #02...). You can time your visit so a chair is ready when you arrive.',
    },
    {
      q: 'Can I share a queue update?',
      a: 'If you’re near a salon, you can share how many people are waiting and the estimated wait. Your location helps us confirm the update is from someone nearby.',
    },
  ];

  return (
    <div className="space-y-6 pb-28 text-stone-900">
      {/* 1. TOP POSTER CAROUSEL (4 Blank Poster Spaces with Admin Update Access) */}
      <section className="relative">
        <div
          className="relative overflow-hidden rounded-3xl group select-none shadow-xs border border-stone-200/80"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Sliding Track */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {homeBanners.map((banner, idx) => {
              const hasImage = Boolean(banner.imageUrl && banner.imageUrl.trim());

              if (hasImage) {
                return (
                  <div
                    key={banner.id || idx}
                    onClick={() => {
                      if (banner.targetUrl) {
                        window.open(banner.targetUrl, '_blank');
                      } else {
                        setCustomerTab('explore');
                      }
                    }}
                    className="w-full shrink-0 flex-none aspect-[3/1] min-h-[160px] sm:min-h-[220px] md:min-h-[260px] relative overflow-hidden rounded-3xl bg-stone-900 cursor-pointer"
                  >
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || `Poster #${banner.slot}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    {(banner.title || banner.subtitle) && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-5 sm:p-7 flex flex-col justify-end text-white">
                        {banner.title && (
                          <h3 className="text-base sm:text-2xl font-black tracking-tight leading-snug drop-shadow-sm">
                            {banner.title}
                          </h3>
                        )}
                        {banner.subtitle && (
                          <p className="text-xs sm:text-sm text-stone-200 font-medium mt-0.5 leading-snug drop-shadow-sm">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // HELPFUL, FRIENDLY EDITORIAL CAROUSEL CARD
              const editorialSlides = isWomen ? [
                {
                  title: 'Skip the crowded waiting room',
                  desc: 'Check live parlour chairs from home and step in when ready.',
                  tag: 'Effortless Beauty Walk-Ins',
                  bg: 'from-[#351329] via-[#54203F] to-[#783653]',
                },
                {
                  title: 'Know the wait before you head out',
                  desc: 'Real front-desk updates so you never sit around waiting.',
                  tag: 'Live Chair Updates',
                  bg: 'from-[#54203F] via-[#783653] to-[#B66D86]',
                },
                {
                  title: 'Pay regular counter prices',
                  desc: 'Zero platform fees. Pay your stylist directly by cash or UPI.',
                  tag: 'Zero Booking Fees',
                  bg: 'from-[#351329] via-[#4A1B38] to-[#6E2E4E]',
                },
                {
                  title: 'Getting ready together?',
                  desc: 'Grab a separate walk-in token for your friend or daughter.',
                  tag: 'Bring Friends Along',
                  bg: 'from-[#451834] via-[#66274B] to-[#8C3A64]',
                },
              ] : [
                {
                  title: 'Never sit in a crowded barber shop again',
                  desc: 'See how many people are in line right now before you leave home.',
                  tag: 'Walk In With Confidence',
                  bg: 'from-[#24140A] via-[#381E10] to-[#85441E]',
                },
                {
                  title: 'Hold your spot from your phone',
                  desc: 'Take a token on your way and walk in right as your chair is ready.',
                  tag: 'Zero Waiting Room Waste',
                  bg: 'from-[#381E10] via-[#4A2B18] to-[#85441E]',
                },
                {
                  title: 'Pay regular prices at the counter',
                  desc: 'No advance payments, no card commitments. Just honest local grooming.',
                  tag: '100% Free Service',
                  bg: 'from-[#24140A] via-[#3D2111] to-[#633216]',
                },
                {
                  title: 'Bringing a friend or family?',
                  desc: 'You can easily take separate tokens for them under their own name.',
                  tag: 'Tokens For Family',
                  bg: 'from-[#2B180E] via-[#4A2612] to-[#7A3E1D]',
                },
              ];
              const slideInfo = editorialSlides[idx % editorialSlides.length];

              return (
                <div
                  key={banner.id || idx}
                  onClick={() => setCustomerTab('explore')}
                  className={`w-full shrink-0 flex-none aspect-[3/1] min-h-[160px] sm:min-h-[220px] md:min-h-[260px] rounded-3xl bg-gradient-to-r ${slideInfo.bg} p-6 sm:p-8 flex flex-col justify-end text-white relative overflow-hidden transition-all shadow-sm cursor-pointer`}
                >
                  <div className="relative z-10 max-w-lg space-y-1 sm:space-y-1.5">
                    <span className="inline-block text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/25">
                      {slideInfo.tag}
                    </span>
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-sm">
                      {slideInfo.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-200 font-medium leading-snug drop-shadow-sm max-w-md">
                      {slideInfo.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prev / Next Slide Arrows (Hover/Tap) */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous poster"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer shadow-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next poster"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer shadow-md"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          {homeBanners.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx
                  ? 'w-6 bg-stone-800'
                  : 'w-1.5 bg-stone-300 hover:bg-stone-400'
              }`}
              aria-label={`Poster ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. CATEGORIES SECTION (ROUND PHOTO AVATARS) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
            Categories
          </h2>
          <button
            onClick={() => {
              setSelectedServiceFilter('All');
              setCustomerTab('explore');
            }}
            className={`text-xs font-bold hover:underline cursor-pointer ${
              isWomen ? 'text-[#F47B70] hover:text-[#d9665b]' : 'text-[#FF6422] hover:text-orange-700'
            }`}
          >
            View all
          </button>
        </div>

        {/* Horizontal Scrolling Row of Circular Grooming Avatars */}
        <div className="flex items-start gap-3.5 sm:gap-4 overflow-x-auto pb-2 no-scrollbar px-1 -mx-1">
          {categories.map((cat) => {
            const isSelected = selectedServiceFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center shrink-0 group cursor-pointer focus:outline-none"
              >
                <div
                  className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 transition-all p-0.5 ${
                    isSelected
                      ? isWomen
                        ? 'border-[#F47B70] ring-2 ring-[#F47B70]/30 scale-105 shadow-md'
                        : 'border-[#FF6422] ring-2 ring-[#FF6422]/30 scale-105 shadow-md'
                      : 'border-white ring-1 ring-stone-200/80 shadow-xs group-hover:scale-105 group-hover:border-stone-300'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span
                  className={`text-[11px] sm:text-xs mt-2 font-bold transition-colors text-center max-w-[76px] leading-tight ${
                    isSelected
                      ? isWomen
                        ? 'text-[#F47B70] font-black'
                        : 'text-[#FF6422] font-black'
                      : 'text-stone-700 group-hover:text-stone-900'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. NEARBY SALONS SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
              Nearby Salons
            </h2>
            {selectedServiceFilter !== 'All' && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isWomen
                    ? 'bg-[#FFF0F3] text-[#F47B70] border-[#F1DDE3]'
                    : 'bg-[#FFF5ED] text-[#FF6422] border-[#E7DED5]'
                }`}
              >
                {selectedServiceFilter}
              </span>
            )}
          </div>
          <button
            onClick={() => setCustomerTab('explore')}
            className={`text-xs font-bold hover:underline cursor-pointer ${
              isWomen ? 'text-[#F47B70] hover:text-[#d9665b]' : 'text-[#FF6422] hover:text-orange-700'
            }`}
          >
            View all
          </button>
        </div>

        {/* Salon Cards Grid / Vertical List matching the screenshot */}
        {displayedSalons.length === 0 ? (
          <div className={`bg-white rounded-3xl p-6 text-center space-y-2 border ${
            isWomen ? 'border-[#F1DDE3]' : 'border-[#E7DED5]'
          }`}>
            <Store className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-xs font-bold text-stone-700">No salons found for this category</p>
            <button
              onClick={() => setSelectedServiceFilter('All')}
              className={`text-xs font-bold hover:underline ${
                isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'
              }`}
            >
              Reset filter to see all salons
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedSalons.map((salon) => {
              const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen, salon.queueStatus);
              const waitTime = getEstimatedWaitMinutes(
                salon.currentQueue,
                salon.avgServiceTimeMinutes,
                salon.activeBarbers,
              );
              const isSaved = userProfile.savedSalons.includes(salon.id);
              const salonType = getSalonType(salon);
              const cover =
                salon.coverImage ||
                salon.posterImage ||
                (salon.images && salon.images[0]) ||
                (salon.locationImages && salon.locationImages[0]) ||
                '';

              return (
                                <div
                  key={salon.id}
                  onClick={() => handleSalonCardClick(salon)}
                  className={`group bg-white rounded-3xl border ${
                    isWomen ? 'border-[#F1DDE3] hover:border-[#E9A0AA]' : 'border-[#E7DED5] hover:border-[#D97706]/40'
                  } overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col`}
                >
                  {/* Clean Salon Photography */}
                  <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-stone-100">
                    {cover ? (
                      <img
                        src={cover}
                        alt={salon.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-white p-4 text-center">
                        <Store className="w-8 h-8 text-stone-400 mb-1" />
                        <span className="text-sm font-bold tracking-wider">{salon.name}</span>
                      </div>
                    )}

                    {/* Top-Left: Clean Live Status Pill */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-stone-900 shadow-sm backdrop-blur-md border border-stone-200/60">
                        <span className={`w-2 h-2 rounded-full ${
                          !salon.isOpen
                            ? 'bg-stone-400'
                            : salon.currentQueue === 0
                            ? 'bg-emerald-500'
                            : salon.currentQueue <= 3
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`} />
                        <span>
                          {!salon.isOpen
                            ? 'Closed'
                            : salon.currentQueue === 0
                            ? '0 in line • Open now'
                            : `${salon.currentQueue} in line • ~${waitTime}m`}
                        </span>
                      </span>
                    </div>

                    {/* Top-Right: Action buttons (Instagram link + Heart Save) */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      {(salon.instagramUrl || salon.instagramHandle) && (
                        <a
                          href={
                            salon.instagramUrl?.startsWith('http')
                              ? salon.instagramUrl
                              : `https://instagram.com/${(salon.instagramHandle || salon.instagramUrl || '').replace(/^@/, '')}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-9 h-9 rounded-full bg-white/95 text-stone-700 hover:text-pink-600 border border-stone-200/60 backdrop-blur-md flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
                          title={`Visit ${salon.name} on Instagram`}
                        >
                          <InstagramGradientIcon className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(salon.id);
                        }}
                        className="w-9 h-9 rounded-full bg-white/95 text-stone-700 hover:text-rose-500 border border-stone-200/60 backdrop-blur-md flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
                        title={isSaved ? 'Remove from saved' : 'Save salon'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isSaved ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Bottom-Left subtle salon type tag */}
                    <div className="absolute bottom-2.5 left-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
                        {salonType === 'men' ? "Men's Studio" : salonType === 'women' ? "Women's Parlour" : 'Unisex'}
                      </span>
                    </div>
                  </div>

                  {/* Clean Human Card Details (Like Airbnb/Fresha) */}
                  <div className="p-4 sm:p-4.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-black text-stone-900 tracking-tight leading-snug line-clamp-1 group-hover:text-stone-950">
                          {salon.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-stone-900">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>{salon.rating.toFixed(1)}</span>
                          <span className="text-stone-400 font-normal">({salon.reviewCount})</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 mt-1 text-xs text-stone-500">
                        <p className="flex items-center gap-1 truncate">
                          <Navigation className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{salon.locality}</span>
                          <span>•</span>
                          <span className="font-medium text-stone-600">{salon.distanceKm.toFixed(1)} km away</span>
                        </p>
                        {salon.phone && (
                          <a
                            href={`tel:${salon.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-[11px] font-bold text-stone-700 hover:text-emerald-700 shrink-0 bg-stone-50 hover:bg-emerald-50 px-2 py-0.5 rounded-lg border border-stone-200/60 transition-colors"
                            title="Call salon"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">
                        Haircuts from <strong className="text-stone-900 font-black">₹{salon.startingPrice}</strong>
                      </span>

                      <span className={`font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
                        isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'
                      }`}>
                        <span>View chairs</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. FREQUENTLY ASKED QUESTIONS */}
      <section className={`bg-white rounded-3xl p-5 sm:p-6 shadow-xs border ${
        isWomen ? 'border-[#F1DDE3]' : 'border-[#E7DED5]'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className={`w-4 h-4 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              Frequently asked questions
            </h3>
            <p className="text-xs text-stone-500">Everything you need to know about SLOON</p>
          </div>
        </div>

        <div className={`divide-y ${isWomen ? 'divide-[#F1DDE3]' : 'divide-[#E7DED5]'}`}>
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className="py-3 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left gap-3 text-xs font-bold text-stone-800 hover:text-stone-950 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed pl-0.5">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. FOR SALON OWNERS FOOTER CTA */}
      <section className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-3xl p-5 sm:p-6 text-white relative overflow-hidden shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="max-w-lg">
            <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wider">
              For Salon Owners
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              Own a salon in Bilaspur?
            </h3>
            <p className="text-xs text-stone-300 mt-1 leading-relaxed">
              List your studio on SLOON for free. Manage your live queue, reduce walk-in crowd, and attract new customers.
            </p>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <a
              href="https://partner.sloon.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#FF6422] hover:bg-orange-600 text-white font-bold text-xs text-center shadow-md transition-all cursor-pointer"
            >
              Partner Portal Login
            </a>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS MODAL */}
      {showHowItWorksModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  ⓘ
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">How SLOON Works</h3>
                  <p className="text-xs text-stone-500">Walk-in with zero waiting</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHowItWorksModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-4">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Check the Live Line</div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    Browse salons and check real-time chair counts and wait times before stepping out.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Take a Token or Walk In</div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    Grab your digital ticket (#01, #02...) from home, or head straight over when wait times are low.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <div className="text-xs font-bold text-stone-900">Pay at the Salon Counter</div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    No advance payments or card commitments needed. Pay normal prices directly to the barber via cash, UPI, or card.
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowItWorksModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              Got it, let's explore!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
