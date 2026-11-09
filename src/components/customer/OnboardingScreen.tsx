import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Scissors,
  Clock,
  X,
  MapPin,
} from 'lucide-react';

export interface OnboardingScreenProps {
  onFinish: () => void;
  isWomen?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onFinish,
  isWomen = false,
}) => {
  // Step 0 = Welcome Splash, Steps 1..3 = Walk-in Value Pillars
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);

  // Auto-advance from splash screen after 2.2s if untouched
  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onFinish();
        return;
      }
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
    } else if (currentStep === 1) {
      setCurrentStep(0);
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

  const accentColor = isWomen ? '#E11D48' : '#FF6422';
  const bgLightIllustration = isWomen ? '#FFF1F3' : '#FFF6EE';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto select-none transition-colors duration-300 ${
        isWomen ? 'bg-[#FFF8F5] text-stone-900' : 'bg-[#FAF7F2] text-stone-900'
      }`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Universal Responsive Top Navigation */}
      <header className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-full bg-white border border-stone-200/80 hover:bg-stone-100 text-stone-700 shadow-xs transition-colors cursor-pointer"
              aria-label="Previous step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="SLOON"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo-transparent.png';
              }}
            />
            <span className="text-[11px] font-bold text-stone-500 tracking-wider uppercase hidden sm:inline">
              Walk-In Network
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <span className="text-xs font-semibold text-stone-500 font-mono">
              Step {currentStep} of 3
            </span>
          )}

          <button
            type="button"
            onClick={onFinish}
            className="text-xs font-bold text-stone-600 hover:text-stone-900 px-3.5 py-1.5 rounded-full bg-white border border-stone-200/80 hover:bg-stone-100 shadow-xs transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>
      </header>

      {/* Main Interactive Screen Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center justify-center text-center">
        {/* STEP 0: WELCOME & SPLASH SCREEN */}
        {currentStep === 0 && (
          <div
            onClick={() => setCurrentStep(1)}
            className="w-full flex-1 flex flex-col items-center justify-center cursor-pointer animate-in fade-in duration-300"
          >
            {/* Center Circular Emblem */}
            <div className="relative flex flex-col items-center justify-center p-6 text-center">
              <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-full bg-white shadow-xl shadow-stone-800/5 border-4 border-white flex flex-col items-center justify-center p-6 transform transition-transform duration-500 hover:scale-105">
                <img
                  src="/logo.png"
                  alt="SLOON"
                  className="w-32 sm:w-36 h-auto object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/logo-transparent.png';
                  }}
                />
                <span className="text-[11px] font-black tracking-widest uppercase mt-3 text-stone-400">
                  Salon &amp; Grooming
                </span>
              </div>

              <div className="mt-8 space-y-2 max-w-sm">
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  Live Walk-In Queues
                </h1>
                <p className="text-xs sm:text-sm text-stone-600 font-medium">
                  Know physical waiting lines in your neighbourhood before you walk out the door.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 bg-white px-3.5 py-1.5 rounded-full border border-stone-200/80 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Tap anywhere to begin
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: LIVE WAITING TRANSPARENCY */}
        {currentStep === 1 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-98 duration-300">
            <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 aspect-square rounded-full flex items-center justify-center relative shadow-xs">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: bgLightIllustration }}
              />

              <svg
                viewBox="0 0 280 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10"
              >
                {/* Salon Chair Motif */}
                <path
                  d="M90 178H170V190C170 194.4 166.4 198 162 198H98C93.6 198 90 194.4 90 190V178Z"
                  fill="#1E130D"
                />
                <path
                  d="M100 118H160C165.5 118 170 122.5 170 128V170H90V128C90 122.5 94.5 118 100 118Z"
                  fill={accentColor}
                />
                <rect x="115" y="80" width="30" height="32" rx="6" fill="#1E130D" />
                <rect x="125" y="198" width="10" height="25" fill="#78716C" />
                <ellipse cx="130" cy="225" rx="42" ry="7" fill="#1E130D" />

                {/* Live Queue Badge */}
                <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.14))">
                  <rect x="145" y="60" width="102" height="52" rx="12" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="2" />
                  <circle cx="165" cy="86" r="5" fill="#10B981" />
                  <text x="178" y="82" fill="#1C1917" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">
                    CHAIR 01
                  </text>
                  <text x="178" y="97" fill="#059669" fontSize="9.5" fontWeight="800" fontFamily="sans-serif">
                    0 Min Wait
                  </text>
                </g>

                {/* Waiting Count Pill */}
                <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))">
                  <rect x="25" y="140" width="90" height="36" rx="10" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="1.5" />
                  <text x="70" y="162" textAnchor="middle" fill="#1C1917" fontSize="11" fontWeight="800" fontFamily="sans-serif">
                    1 In Line
                  </text>
                </g>
              </svg>
            </div>

            <div className="mt-8 space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Check Live Waiting Counts{' '}
                <span style={{ color: accentColor }}>Before You Walk In</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                See real-time physical waiting lines and active chairs at neighbourhood salons directly from your phone.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: VERIFIED STYLISTS & DISCOVERY */}
        {currentStep === 2 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-98 duration-300">
            <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 aspect-square rounded-full flex items-center justify-center relative shadow-xs">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: bgLightIllustration }}
              />

              <svg
                viewBox="0 0 280 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10"
              >
                {/* Salon Mirror / Frame */}
                <rect x="70" y="45" width="135" height="155" rx="67.5" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="3.5" />
                <path d="M85 70C85 70 120 58 160 82" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />

                {/* Stylist Silhouette */}
                <circle cx="137" cy="115" r="26" fill="#1E130D" />
                <path d="M105 178C105 148 120 142 137 142C154 142 169 148 169 178H105Z" fill="#78716C" />

                {/* Verified Badge */}
                <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
                  <rect x="150" y="140" width="94" height="42" rx="12" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="1.5" />
                  <circle cx="168" cy="161" r="8" fill="#10B981" />
                  <path d="M165 161L167 163L172 158" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <text x="183" y="160" fill="#1C1917" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                    VERIFIED
                  </text>
                  <text x="183" y="173" fill="#78716C" fontSize="8.5" fontWeight="800" fontFamily="sans-serif">
                    Salon &amp; Rates
                  </text>
                </g>

                {/* Transparent Pricing Pill */}
                <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))">
                  <rect x="35" y="65" width="90" height="38" rx="10" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="1.5" />
                  <text x="80" y="88" textAnchor="middle" fill={accentColor} fontSize="12" fontWeight="900" fontFamily="sans-serif">
                    ₹150 Cut
                  </text>
                </g>
              </svg>
            </div>

            <div className="mt-8 space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Transparent Prices &amp;{' '}
                <span style={{ color: accentColor }}>Verified Stylists</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                Browse genuine service menus, clear walk-in pricing, and authentic customer feedback with zero hidden costs.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: LOOK SHARP & SAVE HOURS */}
        {currentStep === 3 && (
          <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-98 duration-300">
            <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-68 md:h-68 aspect-square rounded-full flex items-center justify-center relative shadow-xs">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: bgLightIllustration }}
              />

              <svg
                viewBox="0 0 280 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full relative z-10"
              >
                {/* Modern Haircut Profile Silhouette */}
                <ellipse cx="140" cy="115" rx="34" ry="40" fill="#FBBF24" />
                <path d="M106 100C106 65 130 52 165 60C175 62 180 72 178 85C175 90 170 94 165 92C155 88 140 92 135 104C132 110 120 115 110 112L106 100Z" fill="#1C1917" />
                <path d="M118 118C118 110 130 108 142 108C154 108 166 110 166 118L174 205H110L118 118Z" fill="#1C1917" />

                {/* Speech Bubble: "LOOK SHARP" */}
                <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
                  <rect x="155" y="45" width="100" height="38" rx="10" fill={accentColor} />
                  <polygon points="160,83 170,83 162,91" fill={accentColor} />
                  <text x="205" y="68" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">
                    LOOK SHARP
                  </text>
                </g>

                {/* Zero Wait Time Pill */}
                <g filter="drop-shadow(0px 8px 16px rgba(16,185,129,0.3))">
                  <rect x="35" y="150" width="125" height="42" rx="12" fill="#10B981" />
                  <text x="97" y="169" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="sans-serif">
                    0 MIN WAITING
                  </text>
                  <text x="97" y="181" textAnchor="middle" fill="#D1FAE5" fontSize="8" fontWeight="800" fontFamily="sans-serif">
                    Walk In At Perfect Time
                  </text>
                </g>
              </svg>
            </div>

            <div className="mt-8 space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Save Hours Of Waiting &amp;{' '}
                <span style={{ color: accentColor }}>Look Your Best</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                Time your salon visit when chairs are open, avoid crowded rush hours, and enjoy instant service.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Universal Responsive Bottom Actions & Indicators */}
      <footer className="w-full max-w-md mx-auto px-6 pb-6 sm:pb-10 pt-2 shrink-0 space-y-4">
        {/* Progress Indicators */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(step)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                currentStep === step
                  ? 'w-8'
                  : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
              style={{
                backgroundColor: currentStep === step ? accentColor : undefined,
              }}
              aria-label={`Go to step ${step}`}
            />
          ))}
        </div>

        {/* Primary Action Button */}
        {currentStep === 0 ? (
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="w-full py-3.5 px-6 rounded-full text-white font-black text-sm tracking-wide shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            style={{ backgroundColor: accentColor }}
          >
            <span>Explore Walk-In Queues</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        ) : currentStep < 3 ? (
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 px-6 rounded-full text-white font-black text-sm tracking-wide shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            style={{ backgroundColor: accentColor }}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinish}
            className="w-full py-3.5 px-6 rounded-full text-white font-black text-sm tracking-wide shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            style={{ backgroundColor: accentColor }}
          >
            <span>Start Exploring Salons</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </footer>
    </div>
  );
};
