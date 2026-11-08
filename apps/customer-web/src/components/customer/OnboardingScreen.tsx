import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ArrowRight, Sparkles, CheckCircle2, Clock, Users, ShieldCheck, Scissors } from 'lucide-react';
import logoFallback from '../../assets/logo.png';
import logoTransparent from '../../assets/logo-transparent.png';
import logoMen from '../../assets/logo-men.png';

export interface OnboardingScreenProps {
  onFinish: () => void;
  isWomen?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish, isWomen = false }) => {
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
      // Swiped left -> next
      handleNext();
    } else if (touchDeltaX > 45) {
      // Swiped right -> back
      handleBack();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  // Color tokens based on theme
  const accentColor = isWomen ? '#F47B70' : '#FF6422';
  const accentHoverColor = isWomen ? '#e0665c' : '#e65315';
  const bgLight = isWomen ? '#FFF8F5' : '#FAF7F2';
  const badgeBg = isWomen ? '#FFF0F3' : '#FFF5ED';
  const badgeBorder = isWomen ? '#F1DDE3' : '#E7DED5';

  /* -------------------------------------------------------------
     STEP 0: SPLASH SCREEN (Matches Phone 1 in Reference)
  ------------------------------------------------------------- */
  if (currentStep === 0) {
    return (
      <div
        onClick={() => setCurrentStep(1)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer select-none overflow-hidden transition-all duration-700 animate-in fade-in"
        style={{
          background: isWomen
            ? 'linear-gradient(180deg, #FFE8EC 0%, #FFF5ED 50%, #FAF0E6 100%)'
            : 'linear-gradient(180deg, #F5ECE0 0%, #FAF4ED 45%, #EBE0D3 100%)',
        }}
      >
        {/* Subtle Decorative Background Line Art Motifs (Grooming / Salon Icons) */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex flex-wrap gap-12 p-8 justify-around items-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="transform rotate-12">
              {i % 3 === 0 ? (
                <Scissors className="w-14 h-14 text-stone-900" />
              ) : i % 3 === 1 ? (
                <Sparkles className="w-12 h-12 text-stone-900" />
              ) : (
                <Clock className="w-12 h-12 text-stone-900" />
              )}
            </div>
          ))}
        </div>

        {/* Center Circular Logo Emblem (Matching reference) */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-white shadow-2xl shadow-stone-900/10 border-4 border-white/80 flex flex-col items-center justify-center p-6 transform transition-transform duration-700 hover:scale-105">
            <img
              src={isWomen ? logoFallback : logoMen}
              alt="SLOON Logo"
              className="w-28 sm:w-32 h-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = logoTransparent;
              }}
            />
            <span className="text-[10px] font-black tracking-widest uppercase mt-2 text-stone-400">
              Salon & Grooming
            </span>
          </div>

          <div className="space-y-1 pt-2 animate-pulse">
            <p className="text-xs font-bold tracking-wider text-stone-600 uppercase">
              Live Walk-In Queues
            </p>
            <p className="text-[10px] text-stone-400">Tap anywhere to continue</p>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/40 backdrop-blur-sm select-none overflow-hidden animate-in fade-in duration-300"
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              SLOON
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
          {/* SLIDE 1: Live Queues & Zero Waiting */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col items-center">
              {/* Clean Vector Artwork Container */}
              <div
                className="w-full max-w-[280px] sm:max-w-[300px] aspect-square rounded-3xl p-5 flex items-center justify-center relative overflow-hidden"
                style={{ background: badgeBg }}
              >
                {/* Visual Artwork: Live Barber Chair & Queue Counter */}
                <svg
                  viewBox="0 0 280 280"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[220px]"
                >
                  <circle cx="140" cy="140" r="110" fill={isWomen ? '#FFE6EA' : '#FCE8DC'} opacity="0.6" />
                  
                  {/* Barber Chair Icon / Silhouette */}
                  <path
                    d="M100 180H180V192C180 196.4 176.4 200 172 200H108C103.6 200 100 196.4 100 192V180Z"
                    fill="#1E130D"
                  />
                  <path
                    d="M110 120H170C175.5 120 180 124.5 180 130V172H100V130C100 124.5 104.5 120 110 120Z"
                    fill={accentColor}
                  />
                  <rect x="125" y="80" width="30" height="34" rx="8" fill="#1E130D" />
                  <rect x="135" y="200" width="10" height="25" fill="#78716C" />
                  <ellipse cx="140" cy="228" rx="45" ry="8" fill="#1E130D" />

                  {/* Floating Digital Queue Counter Badge */}
                  <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
                    <rect x="155" y="65" width="95" height="52" rx="14" fill="#FFFFFF" />
                    <circle cx="175" cy="91" r="5" fill="#10B981" />
                    <text x="186" y="88" fill="#1C1917" fontSize="11" fontWeight="800" fontFamily="sans-serif">
                      CHAIR 01
                    </text>
                    <text x="186" y="103" fill="#059669" fontSize="10" fontWeight="700" fontFamily="sans-serif">
                      Ready now
                    </text>
                  </g>

                  {/* Live Wait Time Pill */}
                  <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))">
                    <rect x="30" y="145" width="85" height="36" rx="12" fill="#FFFFFF" />
                    <text x="44" y="167" fill="#1C1917" fontSize="11" fontWeight="800" fontFamily="sans-serif">
                      0 min wait
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  Skip The Waiting Room With{' '}
                  <span style={{ color: accentColor }}>Live Salon Queues</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                  Know exact wait times, queue status, and active chairs before stepping out of your home.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: Verified Salons & Stylists */}
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
                  <circle cx="140" cy="140" r="110" fill={isWomen ? '#FFE6EA' : '#FCE8DC'} opacity="0.6" />

                  {/* Salon Mirror / Frame */}
                  <rect x="75" y="50" width="130" height="150" rx="65" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="4" />
                  <path d="M90 70C90 70 120 60 160 85" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />

                  {/* Stylist & Shears Motif */}
                  <circle cx="140" cy="120" r="28" fill="#1E130D" />
                  <path d="M105 185C105 155 120 148 140 148C160 148 175 155 175 185H105Z" fill="#78716C" />
                  
                  {/* Verified Check Badge */}
                  <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
                    <rect x="160" y="145" width="88" height="42" rx="12" fill="#FFFFFF" />
                    <circle cx="178" cy="166" r="8" fill="#10B981" />
                    <path d="M175 166L177 168L182 163" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                    <text x="192" y="165" fill="#1C1917" fontSize="10" fontWeight="800" fontFamily="sans-serif">
                      VERIFIED
                    </text>
                    <text x="192" y="177" fill="#78716C" fontSize="9" fontWeight="600" fontFamily="sans-serif">
                      Partner
                    </text>
                  </g>

                  {/* Rating Badge */}
                  <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))">
                    <rect x="35" y="80" width="75" height="34" rx="10" fill="#FFFFFF" />
                    <text x="47" y="101" fill="#D97706" fontSize="12" fontWeight="900" fontFamily="sans-serif">
                      ★ 4.9
                    </text>
                    <text x="76" y="101" fill="#78716C" fontSize="10" fontWeight="600" fontFamily="sans-serif">
                      (240+)
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  Discover Top Verified{' '}
                  <span style={{ color: accentColor }}>Salons & Stylists</span> Near You
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                  Browse authentic studio portfolios, transparent price menus, and genuine walk-in customer reviews.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 3: Express Walk-ins & On-Time Arrival */}
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
                  <circle cx="140" cy="140" r="110" fill={isWomen ? '#FFE6EA' : '#FCE8DC'} opacity="0.6" />

                  {/* Smartphone Live Token Mockup */}
                  <rect x="95" y="45" width="90" height="160" rx="18" fill="#1E130D" />
                  <rect x="100" y="52" width="80" height="146" rx="14" fill="#FFFFFF" />
                  
                  {/* Token Ticket on Screen */}
                  <rect x="106" y="68" width="68" height="75" rx="10" fill={isWomen ? '#FFF0F3' : '#FFF5ED'} />
                  <text x="140" y="85" textAnchor="middle" fill="#78716C" fontSize="8" fontWeight="700" fontFamily="sans-serif">
                    LIVE TICKET
                  </text>
                  <text x="140" y="112" textAnchor="middle" fill={accentColor} fontSize="20" fontWeight="900" fontFamily="sans-serif">
                    #03
                  </text>
                  <text x="140" y="130" textAnchor="middle" fill="#059669" fontSize="8" fontWeight="800" fontFamily="sans-serif">
                    NEXT IN LINE
                  </text>

                  {/* Arrive Notification Pill */}
                  <g filter="drop-shadow(0px 8px 18px rgba(0,0,0,0.12))">
                    <rect x="40" y="165" width="130" height="42" rx="12" fill="#FFFFFF" />
                    <circle cx="58" cy="186" r="8" fill={accentColor} />
                    <text x="58" y="189" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                      ✓
                    </text>
                    <text x="74" y="182" fill="#1C1917" fontSize="10" fontWeight="800" fontFamily="sans-serif">
                      Your Chair is Ready
                    </text>
                    <text x="74" y="195" fill="#78716C" fontSize="9" fontWeight="600" fontFamily="sans-serif">
                      Arrive at counter
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                  Arrive Right On Time For{' '}
                  <span style={{ color: accentColor }}>Your Chair</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                  Join the queue remotely, get live countdown alerts, and never waste another minute waiting in line.
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
            className="w-full py-3.5 sm:py-4 px-6 rounded-full text-white font-black text-sm tracking-wide shadow-lg transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
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
            <span>{currentStep === 3 ? 'Get Started' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
