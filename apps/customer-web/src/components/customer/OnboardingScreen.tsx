import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SalonToolsWheel } from '@kumbhakaran/ui';
import logoFallback from '../../assets/logo.png';
import logoTransparent from '../../assets/logo-transparent.png';
import logoWhite from '../../assets/logo-white.png';

export interface OnboardingScreenProps {
  onFinish: () => void;
  isWomen?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onFinish,
  isWomen = false,
}) => {
  // Step 0 = Flagship Luxury Splash with 3D Wheel, Steps 1..3 = Walk-in Value Pillars
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);

  // Auto-advance from splash screen after 3.2s if untouched
  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 3200);
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
  const isDarkSplash = currentStep === 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto select-none transition-colors duration-500 ${
        isDarkSplash
          ? 'bg-[#120508] text-stone-100'
          : isWomen
            ? 'bg-[#FFF8F5] text-stone-900'
            : 'bg-[#FAF7F2] text-stone-900'
      }`}
      style={
        isDarkSplash
          ? {
              background:
                'radial-gradient(ellipse at 50% 38%, #360D17 0%, #1A060B 52%, #0A0204 100%)',
            }
          : undefined
      }
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

          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full border shadow-2xs transition-colors ${
              isDarkSplash
                ? 'bg-black/40 border-amber-500/30 text-amber-300'
                : 'bg-white border-stone-200/80 text-stone-800'
            }`}
          >
            <img
              src={isDarkSplash ? logoWhite : logoFallback}
              alt="SLOON"
              className="h-4 sm:h-4.5 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = logoTransparent;
              }}
            />
            <span className="text-[10px] font-black tracking-wider uppercase">
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
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full border shadow-xs transition-colors cursor-pointer ${
              isDarkSplash
                ? 'bg-white/10 border-white/20 text-stone-300 hover:text-white hover:bg-white/15'
                : 'bg-white border-stone-200/80 text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Skip
          </button>
        </div>
      </header>

      {/* Main Interactive Screen Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center justify-center text-center">
        {/* =========================================================
            STEP 0: FLAGSHIP LUXURY SPLASH WITH ROTATING SALON TOOLS WHEEL
            ========================================================= */}
        {currentStep === 0 && (
          <div
            onClick={() => setCurrentStep(1)}
            className="w-full flex-1 flex flex-col items-center justify-center p-2 sm:p-6 cursor-pointer animate-in zoom-in-95 duration-500"
          >
            {/* Top Quality Badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase">
                REAL-TIME SALON DISCOVERY
              </span>
            </div>

            {/* The Animated Rotating Salon Tools Wheel with SLOON Logo */}
            <div className="transform transition-transform hover:scale-105 active:scale-95 duration-300 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <SalonToolsWheel
                size={320}
                autoRotateWhenIdle={true}
                showPointer={false}
                showSlices={false}
                badgeSubtitle="LIVE QUEUES"
                logoSrc={logoWhite}
              />
            </div>

            <div className="mt-8 space-y-2.5 max-w-md mx-auto">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
                Skip The Wait •{' '}
                <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                  Look Your Best
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 font-medium leading-relaxed max-w-sm mx-auto">
                Know physical waiting lines in your neighbourhood before you walk out the door. Instant chair seats with zero wasted time.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold text-amber-200/90">
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                ✓ Live Waiting Counts
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                ✓ 0-Min Walk-In Timing
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                ✓ Verified Neighborhood Salons
              </span>
            </div>

            <div className="mt-6">
              <span className="text-[10.5px] font-bold text-stone-400 tracking-wider uppercase animate-pulse">
                Tap anywhere or press Enter to continue
              </span>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 1: LIVE WAITING TRANSPARENCY
            ========================================================= */}
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
                Know The Real Waiting Time{' '}
                <span style={{ color: accentColor }}>Before You Leave</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                Check verified live crowd levels and active barbers in real-time. Never walk into a crowded salon blindly again.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: EXPRESS WALK-IN JOINING
            ========================================================= */}
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
                {/* Smartphone Device Mockup */}
                <rect x="75" y="45" width="130" height="195" rx="20" fill="#1C1917" />
                <rect x="83" y="55" width="114" height="175" rx="14" fill="#FFFFFF" />

                {/* Speaker Notch */}
                <rect x="120" y="50" width="40" height="4" rx="2" fill="#44403C" />

                {/* Queue Ticket Card */}
                <rect x="95" y="80" width="90" height="50" rx="8" fill={accentColor} />
                <text x="140" y="102" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="sans-serif">
                  TICKET #04
                </text>
                <text x="140" y="118" textAnchor="middle" fill="#FED7AA" fontSize="9" fontWeight="700" fontFamily="sans-serif">
                  Estimated 12 mins
                </text>

                {/* Action Button */}
                <rect x="95" y="145" width="90" height="28" rx="6" fill="#10B981" />
                <text x="140" y="162" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                  JOIN QUEUE
                </text>

                {/* Floating GPS Icon */}
                <circle cx="195" cy="85" r="16" fill="#FFFFFF" filter="drop-shadow(0px 4px 10px rgba(0,0,0,0.15))" />
                <circle cx="195" cy="85" r="8" fill={accentColor} />
              </svg>
            </div>

            <div className="mt-8 space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Join The Live Queue{' '}
                <span style={{ color: accentColor }}>From Anywhere</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                Take your digital token while you are on your way or enjoying coffee nearby. Arrive right when your barber is ready.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3: LOOK SHARP WITH ZERO WAITING
            ========================================================= */}
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
                {/* Mirror Frame */}
                <rect x="80" y="40" width="120" height="155" rx="60" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="3" />
                <rect x="90" y="50" width="100" height="135" rx="50" fill="#FEF3C7" fillOpacity="0.4" />

                {/* Mirror Reflection Accent */}
                <path d="M 105 70 L 125 70 L 105 130 Z" fill="#FFFFFF" fillOpacity="0.4" />

                {/* Comb / Scissors Accent */}
                <g transform="translate(140, 165)">
                  <circle cx="0" cy="0" r="28" fill="#1C1917" />
                  <path d="M -10 -10 L 10 10 M 10 -10 L -10 10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                </g>

                {/* Floating Rating Pill */}
                <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
                  <rect x="155" y="50" width="100" height="34" rx="10" fill={accentColor} />
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
                  : isDarkSplash
                    ? 'w-2 bg-stone-700 hover:bg-stone-500'
                    : 'w-2 bg-stone-300 hover:bg-stone-400'
              }`}
              style={{
                backgroundColor: currentStep === step ? (isDarkSplash ? '#F59E0B' : accentColor) : undefined,
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
            className="w-full py-3.5 px-6 rounded-full text-stone-950 font-black text-sm tracking-wide bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 shadow-lg shadow-amber-500/25 transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
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
