import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Scissors,
  Wifi,
  Eye,
  X,
  Clock,
  ShieldCheck,
  Star,
  MapPin
} from 'lucide-react';

export interface OnboardingScreenProps {
  onFinish: () => void;
  isWomen?: boolean;
  initialMode?: 'interactive' | 'gallery';
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onFinish,
  isWomen = false,
  initialMode = 'interactive'
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'gallery'>(initialMode);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);

  useEffect(() => {
    if (viewMode === 'interactive' && currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [currentStep, viewMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onFinish();
        return;
      }
      if (viewMode === 'gallery') return;

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
  }, [currentStep, viewMode]);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentStep === 0 || viewMode === 'gallery') return;
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

  const renderPhoneTopBar = () => (
    <div className="pt-3 px-6 pb-2 flex items-center justify-between text-xs font-bold shrink-0 select-none text-stone-800">
      <span className="tracking-tight text-[12px] font-bold">12:30</span>
      <div className="w-16 h-3.5 bg-stone-900/15 rounded-full mx-auto" />
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-[1.5px] h-2.5">
          <span className="w-[2.5px] h-1 bg-stone-800 rounded-xs" />
          <span className="w-[2.5px] h-1.5 bg-stone-800 rounded-xs" />
          <span className="w-[2.5px] h-2 bg-stone-800 rounded-xs" />
          <span className="w-[2.5px] h-2.5 bg-stone-800 rounded-xs" />
        </div>
        <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
        <div className="w-5 h-2.5 rounded-[3px] border border-stone-800 p-[1px] flex items-center">
          <div className="w-3.5 h-full bg-[#10B981] rounded-[1.5px]" />
        </div>
      </div>
    </div>
  );

  const renderPhone1Splash = () => (
    <div
      className="relative w-full h-full flex flex-col justify-between overflow-hidden cursor-pointer select-none"
      style={{
        background: isWomen
          ? 'linear-gradient(180deg, #FFE8EC 0%, #FFF5ED 50%, #FAF0E6 100%)'
          : 'linear-gradient(180deg, #FDF7F2 0%, #FAECE1 45%, #F4DDCB 100%)',
      }}
      onClick={() => setCurrentStep(1)}
    >
      {renderPhoneTopBar()}

      <div className="absolute inset-0 opacity-[0.07] pointer-events-none flex flex-wrap gap-8 p-6 justify-around items-center">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="transform rotate-12 text-stone-800">
            {i % 3 === 0 ? (
              <Scissors className="w-10 h-10" />
            ) : i % 3 === 1 ? (
              <Sparkles className="w-10 h-10" />
            ) : (
              <Clock className="w-9 h-9" />
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-white shadow-2xl shadow-stone-800/15 border-4 border-white/90 flex flex-col items-center justify-center p-5 transform transition-transform duration-500 hover:scale-105">
          <img
            src={isWomen ? '/logo.png' : '/logo-men.png'}
            alt="SLOON"
            className="w-28 sm:w-32 h-auto object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo-transparent.png';
            }}
          />
          <span className="text-[10px] font-black tracking-widest uppercase mt-2.5 text-stone-400">
            Salon & Grooming
          </span>
        </div>

        <div className="mt-6 space-y-1">
          <p className="text-[11px] font-black tracking-widest text-stone-700 uppercase">
            Live Walk-In Queues
          </p>
          <p className="text-[11px] text-stone-400 font-medium">Tap to continue</p>
        </div>
      </div>

      <div className="pb-6 text-center">
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
          SLOON DISCOVERY
        </span>
      </div>
    </div>
  );

  const renderPhone2Waiting = () => (
    <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">
      {renderPhoneTopBar()}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 text-center">
        <div className="w-full max-w-[260px] aspect-square rounded-full flex items-center justify-center relative">
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

            <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))">
              <rect x="25" y="140" width="90" height="36" rx="10" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="1.5" />
              <text x="70" y="162" textAnchor="middle" fill="#1C1917" fontSize="11" fontWeight="800" fontFamily="sans-serif">
                1 In Line
              </text>
            </g>
          </svg>
        </div>

        <div className="mt-6 space-y-2 max-w-[270px]">
          <h2 className="text-lg sm:text-[19px] font-black text-stone-900 tracking-tight leading-snug">
            Check Live Waiting Counts{' '}
            <span style={{ color: accentColor }}>Before You Walk In</span>
          </h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            See real-time physical waiting lines and active chairs at neighbourhood salons from your home.
          </p>
        </div>
      </div>

      <div className="p-6 pt-2 space-y-4 shrink-0">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-7 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <div className="w-2 h-2 rounded-full bg-stone-300" />
          <div className="w-2 h-2 rounded-full bg-stone-300" />
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 px-6 rounded-full text-white font-black text-sm tracking-wide shadow-md transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          style={{ backgroundColor: accentColor }}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );

  const renderPhone3Verified = () => (
    <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">
      {renderPhoneTopBar()}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 text-center">
        <div className="w-full max-w-[260px] aspect-square rounded-full flex items-center justify-center relative">
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
            <rect x="70" y="45" width="135" height="155" rx="67.5" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="3.5" />
            <path d="M85 70C85 70 120 58 160 82" stroke={accentColor} strokeWidth="3" strokeLinecap="round" />

            <circle cx="137" cy="115" r="26" fill="#1E130D" />
            <path d="M105 178C105 148 120 142 137 142C154 142 169 148 169 178H105Z" fill="#78716C" />

            <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
              <rect x="150" y="140" width="94" height="42" rx="12" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="1.5" />
              <circle cx="168" cy="161" r="8" fill="#10B981" />
              <path d="M165 161L167 163L172 158" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              <text x="183" y="160" fill="#1C1917" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                VERIFIED
              </text>
              <text x="183" y="172" fill="#78716C" fontSize="8.5" fontWeight="700" fontFamily="sans-serif">
                SLOON Partner
              </text>
            </g>

            <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))">
              <rect x="30" y="75" width="80" height="34" rx="10" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="1.5" />
              <text x="42" y="96" fill="#D97706" fontSize="12" fontWeight="900" fontFamily="sans-serif">
                ★ 4.9
              </text>
              <text x="73" y="96" fill="#78716C" fontSize="9.5" fontWeight="700" fontFamily="sans-serif">
                (240+)
              </text>
            </g>
          </svg>
        </div>

        <div className="mt-6 space-y-2 max-w-[270px]">
          <h2 className="text-lg sm:text-[19px] font-black text-stone-900 tracking-tight leading-snug">
            Compare Transparent Rates &{' '}
            <span style={{ color: accentColor }}>Master Stylists</span>
          </h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            Browse genuine price menus, parlour portfolios, and authentic neighbourhood walk-in reviews.
          </p>
        </div>
      </div>

      <div className="p-6 pt-2 space-y-4 shrink-0">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-stone-300" />
          <div className="w-7 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
          <div className="w-2 h-2 rounded-full bg-stone-300" />
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 px-6 rounded-full text-white font-black text-sm tracking-wide shadow-md transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          style={{ backgroundColor: accentColor }}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );

  const renderPhone4Timing = () => (
    <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">
      {renderPhoneTopBar()}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-2 text-center">
        <div className="w-full max-w-[260px] aspect-square rounded-full flex items-center justify-center relative">
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
            <path
              d="M115 85C115 65 128 52 142 52C156 52 169 65 169 85C169 95 165 102 161 106H123C119 102 115 95 115 85Z"
              fill="#1C1917"
            />
            <ellipse cx="142" cy="92" rx="17" ry="19" fill="#FCD5B5" />
            <circle cx="136" cy="90" r="1.8" fill="#1C1917" />
            <circle cx="148" cy="90" r="1.8" fill="#1C1917" />
            <path d="M138 98C140 101 144 101 146 98" stroke="#8C4A28" strokeWidth="2" strokeLinecap="round" />
            
            <path d="M118 118C118 110 130 108 142 108C154 108 166 110 166 118L174 205H110L118 118Z" fill="#1C1917" />

            <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
              <rect x="155" y="45" width="100" height="38" rx="10" fill={accentColor} />
              <polygon points="160,83 170,83 162,91" fill={accentColor} />
              <text x="205" y="68" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">
                LOOK SHARP
              </text>
            </g>

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

        <div className="mt-6 space-y-2 max-w-[270px]">
          <h2 className="text-lg sm:text-[19px] font-black text-stone-900 tracking-tight leading-snug">
            Save Hours Of Waiting &{' '}
            <span style={{ color: accentColor }}>Look Your Best</span>
          </h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            Time your salon visit when chairs are open, avoid crowded rush hours, and enjoy instant service.
          </p>
        </div>
      </div>

      <div className="p-6 pt-2 space-y-4 shrink-0">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-stone-300" />
          <div className="w-2 h-2 rounded-full bg-stone-300" />
          <div className="w-7 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        </div>

        <button
          type="button"
          onClick={onFinish}
          className="w-full py-3.5 px-6 rounded-full text-white font-black text-sm tracking-wide shadow-md transition-all transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          style={{ backgroundColor: accentColor }}
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );

  if (viewMode === 'gallery') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-stone-950/90 backdrop-blur-md select-none overflow-y-auto p-4 sm:p-6 animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-4 border-b border-stone-800 text-white shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="text-xs uppercase font-black tracking-widest px-2.5 py-1 rounded text-white"
              style={{ backgroundColor: accentColor }}
            >
              SLOON CUSTOMER ONBOARDING
            </span>
            <span className="text-xs text-stone-400 font-medium hidden sm:inline">
              4-Screen Walkthrough Specification
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setViewMode('interactive');
                setCurrentStep(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>Interactive Mode</span>
            </button>

            <button
              type="button"
              onClick={onFinish}
              className="p-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Close and Enter App"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto w-full py-8 flex items-center justify-start xl:justify-center overflow-x-auto gap-5 sm:gap-6 px-2 no-scrollbar">
          <div className="w-[280px] sm:w-[295px] h-[590px] rounded-[36px] bg-white border-[6px] border-stone-900 shadow-2xl overflow-hidden shrink-0 flex flex-col">
            {renderPhone1Splash()}
          </div>

          <div className="w-[280px] sm:w-[295px] h-[590px] rounded-[36px] bg-white border-[6px] border-stone-900 shadow-2xl overflow-hidden shrink-0 flex flex-col">
            {renderPhone2Waiting()}
          </div>

          <div className="w-[280px] sm:w-[295px] h-[590px] rounded-[36px] bg-white border-[6px] border-stone-900 shadow-2xl overflow-hidden shrink-0 flex flex-col">
            {renderPhone3Verified()}
          </div>

          <div className="w-[280px] sm:w-[295px] h-[590px] rounded-[36px] bg-white border-[6px] border-stone-900 shadow-2xl overflow-hidden shrink-0 flex flex-col">
            {renderPhone4Timing()}
          </div>
        </div>

        <div className="text-center pt-2 pb-2 text-stone-400 text-xs font-medium">
          Scroll horizontally to view all 4 screens • Click "Interactive Mode" to experience the animated flow
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-sm select-none overflow-hidden animate-in fade-in duration-300"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full max-w-[340px] sm:max-w-[370px] h-[92vh] max-h-[740px] bg-white rounded-[40px] shadow-2xl border-[7px] border-stone-900 flex flex-col justify-between overflow-hidden">
        <div className="absolute top-8 left-0 right-0 px-4 flex items-center justify-between z-30 pointer-events-auto">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-1 rounded-full bg-white/80 hover:bg-white text-stone-700 shadow-xs transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-6" />
          )}

          <button
            type="button"
            onClick={onFinish}
            className="text-[11px] font-bold text-stone-500 hover:text-stone-900 px-2 py-0.5 rounded hover:bg-white/70 transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        <div className="w-full h-full flex flex-col">
          {currentStep === 0 && renderPhone1Splash()}
          {currentStep === 1 && renderPhone2Waiting()}
          {currentStep === 2 && renderPhone3Verified()}
          {currentStep === 3 && renderPhone4Timing()}
        </div>
      </div>
    </div>
  );
};
