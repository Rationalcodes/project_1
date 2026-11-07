import React, { useState, useEffect } from 'react';
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
  X,
  Navigation,
  Sparkles,
  PhoneOff,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  getQueueDisplay,
  matchesGenderFilter,
  getSalonType,
} from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';

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

  // Banner carousel state & touch/swipe handlers
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

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

  const genderMatchedSalons = salons.filter((s) => matchesGenderFilter(s, genderFilter));

  // Filter salons if a category is clicked
  const displayedSalons = genderMatchedSalons.filter((salon) => {
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
                  See live queues near you, grab your token from home, and walk straight into your chair.
                </p>
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      const targetSalon = displayedSalons.find((s) => s.isOpen) || displayedSalons[0];
                      if (targetSalon) {
                        handleSalonCardClick(targetSalon);
                      } else {
                        setCustomerTab('explore');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#18181b] hover:bg-black text-white text-[11px] sm:text-xs font-bold shadow-xs hover:shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Get your token</span>
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
                <button
                  type="button"
                  onClick={() => setShowHowItWorksModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase text-white hover:bg-white/30 transition-colors cursor-pointer"
                >
                  <span>HOW IT WORKS</span>
                  <Info className="w-2.5 h-2.5" />
                </button>
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
                  Book now, pay at the salon
                </h3>
                <p className="text-[11px] sm:text-xs text-white/90 font-medium leading-snug">
                  No card needed — cash or card at the counter.
                </p>
                <button
                  type="button"
                  onClick={() => setShowHowItWorksModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white underline hover:text-white/80 transition-colors pt-0.5 cursor-pointer"
                >
                  <span>Learn how it works</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* SLIDE 2: Live Queue Engine */}
            <div
              className={`w-full shrink-0 flex-none min-h-[135px] sm:min-h-[150px] p-4 sm:p-5 text-white relative overflow-hidden flex items-center justify-between ${
                isWomen
                  ? 'bg-gradient-to-br from-[#BE123C] via-[#9F1239] to-[#881337]'
                  : 'bg-gradient-to-br from-[#1D4ED8] via-[#1E40AF] to-[#1E3A8A]'
              }`}
            >
              <div className="relative z-10 max-w-sm sm:max-w-md space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase text-white">
                  <span>LIVE QUEUE ENGINE</span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
                  Know the wait before you step out
                </h3>
                <p className="text-[11px] sm:text-xs text-white/90 font-medium leading-snug">
                  Real-time chair counts updated directly by your barber.
                </p>
                <button
                  type="button"
                  onClick={() => setCustomerTab('explore')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white underline hover:text-white/80 transition-colors pt-0.5 cursor-pointer"
                >
                  <span>Browse salons nearby</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* SLIDE 3: Digital Walk-In Token */}
            <div className="w-full shrink-0 flex-none min-h-[135px] sm:min-h-[150px] p-4 sm:p-5 text-white relative overflow-hidden flex items-center justify-between bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900">
              <div className="relative z-10 max-w-sm sm:max-w-md space-y-1.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold tracking-wider uppercase text-white">
                  <span>DIGITAL WALK-IN TOKEN</span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
                  Grab your token from home
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-300 font-medium leading-snug">
                  Take token #01, #02... and walk right into your chair.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const targetSalon = displayedSalons.find((s) => s.isOpen) || displayedSalons[0];
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
              isWomen ? 'text-rose-600 hover:text-rose-700' : 'text-blue-600 hover:text-blue-700'
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
                        ? 'border-rose-600 ring-2 ring-rose-500/30 scale-105 shadow-md'
                        : 'border-blue-600 ring-2 ring-blue-500/30 scale-105 shadow-md'
                      : 'border-white ring-1 ring-stone-200/80 shadow-xs group-hover:scale-105 group-hover:border-stone-300'
                  }`}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <span
                  className={`text-[11px] sm:text-xs mt-2 font-bold transition-colors text-center max-w-[76px] leading-tight ${
                    isSelected
                      ? isWomen
                        ? 'text-rose-600 font-black'
                        : 'text-blue-600 font-black'
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
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-orange-50 text-orange-700 border-orange-200'
                }`}
              >
                {selectedServiceFilter}
              </span>
            )}
          </div>
          <button
            onClick={() => setCustomerTab('explore')}
            className={`text-xs font-bold hover:underline cursor-pointer ${
              isWomen ? 'text-rose-600 hover:text-rose-700' : 'text-blue-600 hover:text-blue-700'
            }`}
          >
            View all
          </button>
        </div>

        {/* Salon Cards Grid / Vertical List matching the screenshot */}
        {displayedSalons.length === 0 ? (
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 text-center space-y-2">
            <Store className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-xs font-bold text-stone-700">No salons found for this category</p>
            <button
              onClick={() => setSelectedServiceFilter('All')}
              className={`text-xs font-bold hover:underline ${
                isWomen ? 'text-rose-600' : 'text-orange-600'
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
                  className={`group bg-white border overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer ${
                    isWomen
                      ? 'rounded-2xl border-[#FED7CC] hover:border-rose-400'
                      : 'rounded-2xl border-[#E8E2D8] hover:border-blue-400'
                  }`}
                >
                  {/* Salon Cover Card with Floating Pill & Heart */}
                  <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-stone-100">
                    {cover ? (
                      <img
                        src={cover}
                        alt={salon.name}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-900 to-black flex flex-col items-center justify-center text-white p-4 text-center">
                        <Store className="w-8 h-8 text-white/80 mb-1" />
                        <span className="text-base font-black tracking-wider uppercase">{salon.name}</span>
                        <span className="text-xs text-stone-400">{salon.locality}</span>
                      </div>
                    )}

                    {/* Gradient shadow for text & badge legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                    {/* Top-Left: Live Queue Status Pill */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md ${queueInfo.badgeClass}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
                        {salon.currentQueue === 0
                          ? '0 Waiting • Immediate Chair'
                          : `${salon.currentQueue} in line • ~${waitTime}m wait`}
                      </span>
                    </div>

                    {/* Top-Right: Favorite Button (Matches Screenshot) */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(salon.id);
                        }}
                        className="p-2 rounded-full bg-white/95 text-stone-700 hover:text-rose-500 border border-stone-200 backdrop-blur-md transition-colors shadow-sm cursor-pointer"
                        title={isSaved ? 'Remove from saved' : 'Save salon'}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isSaved ? 'fill-rose-500 text-rose-500' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Bottom overlay text on image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase backdrop-blur-md border ${
                              salonType === 'men'
                                ? 'bg-blue-900/80 text-blue-100 border-blue-400/40'
                                : salonType === 'women'
                                ? 'bg-rose-900/80 text-rose-100 border-rose-400/40'
                                : 'bg-stone-900/80 text-stone-100 border-stone-400/40'
                            }`}
                          >
                            {salonType === 'men'
                              ? 'Men Only'
                              : salonType === 'women'
                              ? 'Women Only'
                              : 'Unisex'}
                          </span>
                          {!salon.isOpen && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-900/80 text-stone-300">
                              Closed
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md tracking-tight mt-1 line-clamp-1">
                          {salon.name}
                        </h3>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-xs font-bold text-white/90 drop-shadow-sm">
                          From ₹{salon.startingPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Meta Bar */}
                  <div className="px-4 py-3 bg-white flex items-center justify-between text-xs text-stone-600 border-t border-stone-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <Navigation className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{salon.locality}</span>
                      <span className="text-stone-300">•</span>
                      <span className="font-semibold text-stone-500 shrink-0">
                        {salon.distanceKm.toFixed(2)} km
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 font-bold text-stone-900">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{salon.rating.toFixed(1)}</span>
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
      <section className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-[#FF6422]" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              Frequently asked questions
            </h3>
            <p className="text-xs text-stone-500">Everything you need to know about SLOON</p>
          </div>
        </div>

        <div className="divide-y divide-[#E8E2D8]">
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
