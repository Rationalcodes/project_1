import React, { useState } from 'react';
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
  FileText,
  Play,
  User,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  matchesGenderFilter,
} from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';

export const HomeScreen: React.FC = () => {
  const {
    salons,
    genderFilter,
    setCustomerTab,
    setSelectedSalonForDetail,
    addToRecentlyViewed,
  } = useSalon();

  const isWomen = genderFilter === 'women';

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showFullTerms, setShowFullTerms] = useState(false);

  const genderMatchedSalons = salons.filter((s) => matchesGenderFilter(s, genderFilter));

  // Featured shop spotlight / local shop advertisement
  const featuredShop = genderMatchedSalons.find((s) => s.isVerified) || genderMatchedSalons[0];

  const handleSalonCardClick = (salon: Salon) => {
    addToRecentlyViewed(salon.id);
    setSelectedSalonForDetail(salon);
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
                <User className="w-3 h-3 text-[#E11D48]" />
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

          {/* Featured Local Studio Spotlight / Shop Ad */}
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
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-white font-bold flex items-center gap-0.5 text-[9px]">
                        <Play className="w-2.5 h-2.5 fill-white" />
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
      </section>

      {/* 2. LIVE PARTNER STUDIOS GRID */}
      {genderMatchedSalons.length > 0 && (
        <section className="bg-white rounded-3xl border border-[#E8E2D8] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-2">
                <span>Live Partner Studios</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  {genderMatchedSalons.length} Live
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Real-time queues updated directly by barbers
              </p>
            </div>
            <button
              onClick={() => setCustomerTab('explore')}
              className={`text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer ${
                isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'
              }`}
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {genderMatchedSalons.map((salon) => (
              <div
                key={salon.id}
                onClick={() => handleSalonCardClick(salon)}
                className="group p-3 rounded-2xl bg-[#FAF7F2] hover:bg-white border border-[#E8E2D8] hover:border-orange-300 transition-all cursor-pointer flex flex-col justify-between shadow-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-stone-200 ring-1 ring-black/5">
                    {salon.coverImage || salon.posterImage || (salon.images && salon.images[0]) ? (
                      <img
                        src={salon.coverImage || salon.posterImage || salon.images[0]}
                        alt={salon.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-800 text-white font-bold text-xs">
                        {salon.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="text-xs font-bold text-stone-900 truncate">
                        {salon.name}
                      </h3>
                      {salon.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6422] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {salon.locality} • {salon.city}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] mt-1">
                      <span className="font-semibold text-stone-700">₹{salon.startingPrice} onwards</span>
                      <span className="text-stone-300">•</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {salon.currentQueue} waiting
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E8E2D8]/70 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400">
                    ~{getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers)} min wait
                  </span>
                  <span className={`font-bold flex items-center gap-0.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`}>
                    <span>Check Queue</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. HOW IT WORKS (SIMPLE & DIRECT) */}
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
              Open SLOON to see live waiting numbers and estimated wait times before heading out.
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

      {/* 3. SIMPLE, FAIR, TRANSPARENT */}
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

      {/* 4. FOR SALON OWNERS */}
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
              List your shop on SLOON for free. Update your waiting line in one tap, reduce waiting room crowd, and bring in more walk-ins.
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

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <section className="bg-white rounded-3xl border border-[#E8E2D8] p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-[#FF6422]" />
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              Frequently asked questions
            </h3>
            <p className="text-xs text-stone-500">
              Common questions about SLOON
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

      {/* 6. GUIDELINES & TERMS */}
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
          SLOON connects customers with local salons for live queue tracking. All payments are handled directly at the shop.
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

      {/* 7. FOOTER */}
      <footer className="pt-6 border-t border-stone-200 text-stone-500 text-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF6422] text-white flex items-center justify-center font-bold shadow-xs">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-stone-900 text-sm">
                SLOON
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
            © {new Date().getFullYear()} SLOON. All rights reserved.
          </span>
          <span>
            Built with care in Bilaspur.
          </span>
        </div>
      </footer>
    </div>
  );
};
