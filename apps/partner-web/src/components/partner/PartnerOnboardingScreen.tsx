import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { SalonToolsWheel } from '@kumbhakaran/ui';
import logoFallback from '../../assets/logo.png';
import logoTransparent from '../../assets/logo-transparent.png';
import logoWhite from '../../assets/logo-white.png';

export interface PartnerOnboardingScreenProps {
  onFinish: () => void;
}

export const PartnerOnboardingScreen: React.FC<PartnerOnboardingScreenProps> = ({
  onFinish,
}) => {
  // Step 0 = Luxury Splash with 3D Wheel, Steps 1..3 = Partner Pillars
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

  const accentColor = '#E05326';
  const bgLightIllustration = '#FFF9F5';
  const isDarkSplash = currentStep === 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto select-none transition-colors duration-500 ${
        isDarkSplash
          ? 'bg-[#120508] text-stone-100'
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
      {/* Universal Top Bar */}
      <header className="w-full max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between z-10 shrink-0">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-9" />
        )}

        {/* Brand Center Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-2xs transition-colors ${
            isDarkSplash
              ? 'bg-black/40 border-amber-500/30 text-amber-300'
              : 'bg-white border-[#E8E2D8] text-[#E05326]'
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
          <span className="text-[9px] font-black tracking-widest uppercase">
            PARTNER DESK
          </span>
        </div>

        {/* Skip to Main App */}
        <button
          type="button"
          onClick={onFinish}
          className={`text-xs sm:text-sm font-bold transition-colors px-2 py-1 cursor-pointer ${
            isDarkSplash
              ? 'text-stone-400 hover:text-white'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Skip
        </button>
      </header>

      {/* Main Dynamic Step Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-2 sm:py-6 flex flex-col items-center justify-center text-center">
        {/* =========================================================
            STEP 0: FLAGSHIP LUXURY SPLASH WITH ROTATING SALON TOOLS WHEEL
            ========================================================= */}
        {currentStep === 0 && (
          <div
            className="flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-6 cursor-pointer animate-in zoom-in-95 duration-500"
            onClick={() => setCurrentStep(1)}
          >
            {/* Top Quality Badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300" />
              <span className="text-[10px] sm:text-[11px] font-black tracking-widest uppercase">
                INTELLIGENT SALON PLATFORM
              </span>
            </div>

            {/* The Animated Rotating Salon Tools Wheel with SLOON Logo */}
            <div className="transform transition-transform hover:scale-105 active:scale-95 duration-300 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <SalonToolsWheel
                size={320}
                autoRotateWhenIdle={true}
                showPointer={false}
                showSlices={false}
                badgeSubtitle="PARTNER OS"
                logoSrc={logoWhite}
              />
            </div>

            <div className="mt-8 space-y-2.5 max-w-md mx-auto">
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
                The Smart Way To{' '}
                <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                  Run Your Salon
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 font-medium leading-relaxed max-w-sm mx-auto">
                Real-time walk-in queue control, 0% commission, and seamless customer turnover for modern grooming salons.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold text-amber-200/90">
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                ✓ 0% Platform Commission
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                ✓ Live Waiting Queue
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                ✓ Direct Payouts
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
            STEP 1: LIVE WALK-IN QUEUE CONTROL
            ========================================================= */}
        {currentStep === 1 && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-full flex items-center justify-center relative p-4">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: bgLightIllustration }}
              />

              {/* Clean Vector Queue Desk Scene */}
              <svg viewBox="0 0 280 280" className="w-full h-full relative z-10" fill="none">
                <circle cx="140" cy="140" r="120" fill="#FFF2E8" />
                <path d="M 40 210 Q 140 240 240 210" stroke="#FED7CC" strokeWidth="3" fill="none" />

                {/* Counter / Reception Stand */}
                <rect x="75" y="165" width="130" height="42" rx="10" fill="#E8E2D8" stroke="#D6CEC2" strokeWidth="2" />
                <rect x="90" y="145" width="100" height="22" rx="6" fill="#1C1917" />
                <text x="140" y="160" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                  LIVE QUEUE DESK
                </text>

                {/* Queue Display Monitor */}
                <rect x="95" y="70" width="90" height="60" rx="8" fill="#FFFFFF" stroke="#E05326" strokeWidth="2.5" />
                <rect x="105" y="80" width="70" height="24" rx="4" fill="#FFF3EC" />
                <text x="140" y="96" textAnchor="middle" fill="#E05326" fontSize="12" fontWeight="900" fontFamily="sans-serif">
                  4 WAITING
                </text>
                <text x="140" y="118" textAnchor="middle" fill="#783F0F" fontSize="9" fontWeight="800" fontFamily="sans-serif">
                  ~15 MIN WAIT
                </text>

                {/* Live Floating Pulse Beacon */}
                <circle cx="140" cy="46" r="16" fill="#10B981" fillOpacity="0.15" />
                <circle cx="140" cy="46" r="10" fill="#10B981" fillOpacity="0.3" />
                <circle cx="140" cy="46" r="5" fill="#10B981" />
              </svg>
            </div>

            <div className="mt-8 space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Real-Time Walk-In{' '}
                <span style={{ color: accentColor }}>Queue Control</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                Eliminate waiting room chaos. Call the next customer, track live chair occupancy, and notify clients before their turn.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 2: 0% COMMISSION & DIRECT PAYMENTS
            ========================================================= */}
        {currentStep === 2 && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-full flex items-center justify-center relative p-4">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: bgLightIllustration }}
              />

              {/* Clean Vector 0% Commission Scene */}
              <svg viewBox="0 0 280 280" className="w-full h-full relative z-10" fill="none">
                <circle cx="140" cy="140" r="120" fill="#FFF2E8" />

                {/* Big 0% Badge */}
                <circle cx="140" cy="130" r="64" fill="#FFFFFF" stroke="#10B981" strokeWidth="4" />
                <text x="140" y="125" textAnchor="middle" fill="#10B981" fontSize="36" fontWeight="900" fontFamily="sans-serif">
                  0%
                </text>
                <text x="140" y="148" textAnchor="middle" fill="#047857" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                  COMMISSION
                </text>

                {/* Floating Shield */}
                <g transform="translate(60, 50)">
                  <rect width="40" height="40" rx="20" fill="#E05326" />
                  <path d="M 20 12 L 28 16 V 23 C 28 27 20 31 20 31 C 20 31 12 27 12 23 V 16 Z" fill="#FFFFFF" />
                </g>

                {/* Floating Settlement Tag */}
                <g transform="translate(180, 170)">
                  <rect width="65" height="28" rx="8" fill="#1C1917" />
                  <text x="32" y="18" textAnchor="middle" fill="#FEF08A" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                    100% YOURS
                  </text>
                </g>
              </svg>
            </div>

            <div className="mt-8 space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Keep 100% Of Earnings —{' '}
                <span style={{ color: '#10B981' }}>0% Platform Cut</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                Zero commission on walk-ins and direct customer payments. Keep all revenue where it belongs: in your salon.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================
            STEP 3: MASTER STYLISTS & CHAIR MANAGEMENT
            ========================================================= */}
        {currentStep === 3 && (
          <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-full flex items-center justify-center relative p-4">
              <div
                className="absolute inset-0 rounded-full"
                style={{ background: bgLightIllustration }}
              />

              {/* Clean Vector Staff & Chair Scene */}
              <svg viewBox="0 0 280 280" className="w-full h-full relative z-10" fill="none">
                <circle cx="140" cy="140" r="120" fill="#FFF2E8" />

                {/* Three Salon Chairs */}
                {[-50, 0, 50].map((offset, i) => (
                  <g key={i} transform={`translate(${140 + offset}, 145)`}>
                    <rect x="-16" y="-20" width="32" height="28" rx="6" fill="#FFFFFF" stroke="#783F0F" strokeWidth="2" />
                    <rect x="-10" y="8" width="20" height="18" rx="3" fill="#A8A29E" />
                    <circle cx="0" cy="-32" r="10" fill={i === 1 ? '#E05326' : '#10B981'} />
                    <text x="0" y="-3" textAnchor="middle" fill="#783F0F" fontSize="8" fontWeight="800" fontFamily="sans-serif">
                      C{i + 1}
                    </text>
                  </g>
                ))}

                {/* Floating QR Standee */}
                <g transform="translate(180, 55)">
                  <rect width="44" height="44" rx="8" fill="#FFFFFF" stroke="#E05326" strokeWidth="2" />
                  <rect x="8" y="8" width="10" height="10" fill="#1C1917" />
                  <rect x="26" y="8" width="10" height="10" fill="#1C1917" />
                  <rect x="8" y="26" width="10" height="10" fill="#1C1917" />
                  <rect x="22" y="22" width="14" height="14" fill="#E05326" />
                </g>
              </svg>
            </div>

            <div className="mt-8 space-y-2 max-w-md">
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                Master Stylists &amp;{' '}
                <span style={{ color: accentColor }}>Dynamic Chairs</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium leading-relaxed">
                Assign clients to available chairs, manage staff attendance, and optimize turnover so no chair stays idle.
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
            <span>Explore Partner Desk</span>
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
            <span>Enter Partner Desk</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </footer>
    </div>
  );
};
