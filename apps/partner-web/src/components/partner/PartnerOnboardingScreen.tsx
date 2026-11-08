import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRight, Scissors, Sparkles, Clock, QrCode, ShieldCheck, DollarSign, Users, Store, CheckCircle2 } from 'lucide-react';
import logoFallback from '../../assets/logo.png';
import logoTransparent from '../../assets/logo-transparent.png';

export interface PartnerOnboardingScreenProps {
  onFinish: () => void;
}

export const PartnerOnboardingScreen: React.FC<PartnerOnboardingScreenProps> = ({ onFinish }) => {
  // Step 0 = Splash screen, Steps 1..3 = Carousel slides
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);

  // Auto-advance from splash screen after 1.8 seconds
  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentStep === 0) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
          setCurrentStep(1);
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      } else if (e.key === 'Escape') {
        onFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Touch Swipe Handlers for mobile gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentStep === 0) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    setTouchDeltaX(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    if (touchDeltaX < -45) {
      handleNext();
    } else if (touchDeltaX > 45) {
      handleBack();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  const accentColor = '#E05326';
  const accentHoverColor = '#D0481E';
  const badgeBg = '#FFF5ED';

  /* -------------------------------------------------------------
     STEP 0: PARTNER SPLASH SCREEN (Matches Phone 1 in Reference)
  ------------------------------------------------------------- */
  if (currentStep === 0) {
    return (
      <div
        onClick={() => setCurrentStep(1)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer select-none overflow-hidden transition-all duration-700 animate-in fade-in"
        style={{
          background: 'radial-gradient(circle at 50% 30%, #2A170D 0%, #190E08 70%, #0F0804 100%)',
        }}
      >
        {/* Subtle Decorative Background Line Art (Salon Craftsmanship) */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex flex-wrap gap-12 p-8 justify-around items-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="transform rotate-12">
              {i % 3 === 0 ? (
                <Scissors className="w-14 h-14 text-amber-200" />
              ) : i % 3 === 1 ? (
                <Store className="w-12 h-12 text-amber-200" />
              ) : (
                <QrCode className="w-12 h-12 text-amber-200" />
              )}
            </div>
          ))}
        </div>

        {/* Center Circular Logo Emblem */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-white shadow-2xl shadow-black/40 border-4 border-[#3E2417] flex flex-col items-center justify-center p-6 transform transition-transform duration-700 hover:scale-105">
            <img
              src={logoFallback}
              alt="SLOON Partner"
              className="w-28 sm:w-32 h-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = logoTransparent;
              }}
            />
            <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC]">
              <span className="text-[9px] font-black tracking-widest uppercase">
                PARTNER OS
              </span>
            </div>
          </div>

          <div className="space-y-1 pt-2 animate-pulse">
            <p className="text-xs font-bold tracking-wider text-amber-200/90 uppercase">
              Smart Walk-In Queue System
            </p>
            <p className="text-[10px] text-stone-400">Tap anywhere to enter</p>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     STEPS 1..3: CAROUSEL ONBOARDING SCREENS (Phones 2, 3, 4)
  ------------------------------------------------------------- */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/60 backdrop-blur-sm select-none overflow-hidden animate-in fade-in duration-300"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Smartphone Viewport Card (Matches clean mobile mockup presentation) */}
      <div className="relative w-full max-w-sm sm:max-w-md h-[94vh] max-h-[820px] bg-white rounded-3xl sm:rounded-[36px] shadow-2xl border border-stone-200/80 flex flex-col justify-between overflow-hidden">
        {/* Top Header Bar: Back & Skip Controls */}
        <div className="pt-4 px-5 pb-2 flex items-center justify-between z-20 shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9" />
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC]">
              SLOON Partner
            </span>
          </div>

          <button
            type="button"
            onClick={onFinish}
            className="text-xs font-bold text-stone-500 hover:text-stone-900 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Middle Area: Slide Illustration & Editorial Copy */}
        <div className="flex-1 px-6 flex flex-col items-center justify-center text-center overflow-y-auto no-scrollbar py-2">
          {/* SLIDE 1: Master Your Walk-In Rush */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col items-center">
              {/* Clean Vector Artwork Container */}
              <div
                className="w-full max-w-[280px] sm:max-w-[300px] aspect-square rounded-3xl p-5 flex items-center justify-center relative overflow-hidden"
                style={{ background: badgeBg }}
              >
                {/* Visual Artwork: Salon Counter & Live Queue Stepper */}
                <svg
                  viewBox="0 0 280 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[220px]"
                >
                  <circle cx="140" cy="140" r="110" fill="#FCE8DC" opacity="0.6" />

                  {/* Salon Counter Surface */}
                  <rect x="50" y="155" width="180" height="40" rx="8" fill="#1E130D" />
                  <rect x="65" y="165" width="150" height="20" rx="4" fill="#2E1C12" />

                  {/* Operational Live Counter Device / Tablet */}
                  <rect x="85" y="70" width="110" height="85" rx="14" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="3" />
                  <rect x="95" y="80" width="90" height="65" rx="10" fill="#FAF7F2" />
                  
                  {/* Stepper Display */}
                  <text x="140" y="102" textAnchor="middle" fill="#78716C" fontSize="9" fontWeight="700" fontFamily="sans-serif">
                    WAITING NOW
                  </text>
                  <text x="140" y="128" textAnchor="middle" fill={accentColor} fontSize="24" fontWeight="900" fontFamily="sans-serif">
                    03
                  </text>

                  {/* +1 / -1 Action Pills */}
                  <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.1))">
                    <rect x="35" y="90" width="46" height="46" rx="14" fill={accentColor} />
                    <text x="58" y="118" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900" fontFamily="sans-serif">
                      +1
                    </text>
                  </g>

                  <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.1))">
                    <rect x="199" y="90" width="46" height="46" rx="14" fill="#1E130D" />
                    <text x="222" y="118" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900" fontFamily="sans-serif">
                      -1
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  Take Complete Control Of Your{' '}
                  <span style={{ color: accentColor }}>Walk-In Rush</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                  Update waiting lines in 1 tap, eliminate crowded benches, and let clients track their turn on their phones.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: 0% Commission & Zero Hardware Costs */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col items-center">
              {/* Clean Vector Artwork Container */}
              <div
                className="w-full max-w-[280px] sm:max-w-[300px] aspect-square rounded-3xl p-5 flex items-center justify-center relative overflow-hidden"
                style={{ background: badgeBg }}
              >
                <svg
                  viewBox="0 0 280 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[220px]"
                >
                  <circle cx="140" cy="140" r="110" fill="#FCE8DC" opacity="0.6" />

                  {/* Printable Desk Standee Mockup */}
                  <rect x="90" y="55" width="100" height="135" rx="16" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="4" />
                  <rect x="105" y="70" width="70" height="70" rx="8" fill="#1E130D" />
                  
                  {/* Stylized QR Matrix Pattern */}
                  <rect x="112" y="77" width="16" height="16" fill="#FFFFFF" />
                  <rect x="116" y="81" width="8" height="8" fill="#1E130D" />
                  <rect x="147" y="77" width="16" height="16" fill="#FFFFFF" />
                  <rect x="151" y="81" width="8" height="8" fill="#1E130D" />
                  <rect x="112" y="112" width="16" height="16" fill="#FFFFFF" />
                  <rect x="116" y="116" width="8" height="8" fill="#1E130D" />
                  <rect x="135" y="98" width="10" height="10" fill="#FFFFFF" />

                  <text x="140" y="160" textAnchor="middle" fill="#1C1917" fontSize="9" fontWeight="800" fontFamily="sans-serif">
                    SCAN TO JOIN
                  </text>
                  <text x="140" y="174" textAnchor="middle" fill={accentColor} fontSize="8" fontWeight="700" fontFamily="sans-serif">
                    Counter Standee
                  </text>

                  {/* 0% Commission Badge */}
                  <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
                    <rect x="35" y="150" width="115" height="42" rx="12" fill="#10B981" />
                    <text x="92" y="168" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="sans-serif">
                      0% COMMISSION
                    </text>
                    <text x="92" y="181" textAnchor="middle" fill="#D1FAE5" fontSize="8" fontWeight="700" fontFamily="sans-serif">
                      Cash & Direct UPI
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  Keep 100% Of Your Revenue With{' '}
                  <span style={{ color: accentColor }}>0% Commission</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                  No expensive POS hardware or tablet rentals required. Just print your counter standee and run on your phone.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 3: Verified Studio Presence & Growth */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col items-center">
              {/* Clean Vector Artwork Container */}
              <div
                className="w-full max-w-[280px] sm:max-w-[300px] aspect-square rounded-3xl p-5 flex items-center justify-center relative overflow-hidden"
                style={{ background: badgeBg }}
              >
                <svg
                  viewBox="0 0 280 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[220px]"
                >
                  <circle cx="140" cy="140" r="110" fill="#FCE8DC" opacity="0.6" />

                  {/* Studio Storefront Motif */}
                  <rect x="70" y="70" width="140" height="110" rx="16" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="4" />
                  
                  {/* Barber Pole Striping Accent */}
                  <rect x="85" y="90" width="12" height="70" rx="6" fill="#1E130D" />
                  <line x1="85" y1="105" x2="97" y2="95" stroke={accentColor} strokeWidth="3" />
                  <line x1="85" y1="125" x2="97" y2="115" stroke="#FFFFFF" strokeWidth="3" />
                  <line x1="85" y1="145" x2="97" y2="135" stroke={accentColor} strokeWidth="3" />

                  {/* Stylist Profile & Chair Assignment */}
                  <circle cx="140" cy="115" r="22" fill="#1E130D" />
                  <path d="M115" y="160" />
                  <text x="140" y="152" textAnchor="middle" fill="#1C1917" fontSize="10" fontWeight="800" fontFamily="sans-serif">
                    Master Stylist
                  </text>
                  <text x="140" y="165" textAnchor="middle" fill="#78716C" fontSize="9" fontWeight="600" fontFamily="sans-serif">
                    Chair 01 • Active
                  </text>

                  {/* Verified Studio Shield Badge */}
                  <g filter="drop-shadow(0px 8px 18px rgba(0,0,0,0.12))">
                    <rect x="150" y="45" width="105" height="40" rx="12" fill="#FFFFFF" />
                    <circle cx="168" cy="65" r="9" fill="#10B981" />
                    <path d="M164 65L167 68L173 62" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <text x="183" y="63" fill="#1C1917" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                      VERIFIED
                    </text>
                    <text x="183" y="75" fill="#78716C" fontSize="8" fontWeight="700" fontFamily="sans-serif">
                      SLOON Studio
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  Attract High-Value Clients To{' '}
                  <span style={{ color: accentColor }}>Your Chairs</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                  Get verified by our team, showcase your master barbers, and turn one-time walk-ins into loyal regulars.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation: Carousel Dots & Pill Continue Button */}
        <div className="p-6 pt-2 space-y-4 shrink-0">
          {/* Carousel Indicator Dots (Active is a wide smooth pill) */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((stepIndex) => (
              <button
                key={stepIndex}
                type="button"
                onClick={() => setCurrentStep(stepIndex)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentStep === stepIndex
                    ? 'w-7 h-2'
                    : 'w-2 h-2 bg-stone-300 hover:bg-stone-400'
                }`}
                style={{
                  backgroundColor: currentStep === stepIndex ? accentColor : undefined,
                }}
                aria-label={`Go to slide ${stepIndex}`}
              />
            ))}
          </div>

          {/* Full-width Pill CTA Button (Matches "Continue" in reference) */}
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 sm:py-4 px-6 rounded-full text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/20 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            style={{
              backgroundColor: accentColor,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = accentHoverColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = accentColor;
            }}
          >
            <span>{currentStep === 3 ? 'Open Partner Dashboard' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
