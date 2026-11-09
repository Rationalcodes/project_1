import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ArrowRight,
  Scissors,
  Sparkles,
  Clock,
  QrCode,
  ShieldCheck,
  Store,
  Wifi,
  Eye,
  Layers,
  X
} from 'lucide-react';

export interface PartnerOnboardingScreenProps {
  onFinish: () => void;
  initialMode?: 'interactive' | 'gallery';
}

export const PartnerOnboardingScreen: React.FC<PartnerOnboardingScreenProps> = ({
  onFinish,
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

  const accentColor = '#E05326';
  const bgLightIllustration = '#FFF9F5';

  const renderPhoneTopBar = (dark = false) => (
    <div
      className={`pt-3 px-6 pb-2 flex items-center justify-between text-xs font-bold shrink-0 select-none ${
        dark ? 'text-white/90' : 'text-stone-800'
      }`}
    >
      <span className="tracking-tight text-[12px] font-bold">12:30</span>
      <div
        className={`w-16 h-3.5 rounded-full mx-auto ${
          dark ? 'bg-black/30' : 'bg-stone-900/15'
        }`}
      />
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-[1.5px] h-2.5">
          <span className={`w-[2.5px] h-1 rounded-xs ${dark ? 'bg-white' : 'bg-stone-800'}`} />
          <span className={`w-[2.5px] h-1.5 rounded-xs ${dark ? 'bg-white' : 'bg-stone-800'}`} />
          <span className={`w-[2.5px] h-2 rounded-xs ${dark ? 'bg-white' : 'bg-stone-800'}`} />
          <span className={`w-[2.5px] h-2.5 rounded-xs ${dark ? 'bg-white' : 'bg-stone-800'}`} />
        </div>
        <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
        <div
          className={`w-5 h-2.5 rounded-[3px] border p-[1px] flex items-center ${
            dark ? 'border-white' : 'border-stone-800'
          }`}
        >
          <div className="w-3.5 h-full bg-[#10B981] rounded-[1.5px]" />
        </div>
      </div>
    </div>
  );

  const renderPhone1Splash = () => (
    <div
      className="relative w-full h-full flex flex-col justify-between overflow-hidden cursor-pointer select-none"
      style={{
        background: 'linear-gradient(180deg, #FDF7F2 0%, #FAECE1 45%, #F4DDCB 100%)',
      }}
      onClick={() => setCurrentStep(1)}
    >
      {renderPhoneTopBar(false)}

      <div className="absolute inset-0 opacity-[0.08] pointer-events-none flex flex-wrap gap-8 p-6 justify-around items-center">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="transform rotate-12 text-[#783F0F]">
            {i % 4 === 0 ? (
              <Scissors className="w-10 h-10" />
            ) : i % 4 === 1 ? (
              <Store className="w-10 h-10" />
            ) : i % 4 === 2 ? (
              <QrCode className="w-9 h-9" />
            ) : (
              <Sparkles className="w-9 h-9" />
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-white shadow-2xl shadow-stone-800/15 border-4 border-white/90 flex flex-col items-center justify-center p-5 transform transition-transform duration-500 hover:scale-105">
          <img
            src="/logo.png"
            alt="SLOON Partner"
            className="w-28 sm:w-32 h-auto object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo-transparent.png';
            }}
          />
          <div className="mt-2.5 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC]">
            <span className="text-[10px] font-black tracking-widest uppercase">
              PARTNER OS
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-1">
          <p className="text-[11px] font-black tracking-widest text-[#783F0F] uppercase">
            Smart Walk-In Queue System
          </p>
          <p className="text-[11px] text-stone-500 font-medium">Tap to continue</p>
        </div>
      </div>

      <div className="pb-6 text-center">
        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
          SLOON FOR SALONS
        </span>
      </div>
    </div>
  );

  const renderPhone2Queue = () => (
    <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">
      {renderPhoneTopBar(false)}

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
            <rect x="30" y="185" width="220" height="38" rx="8" fill="#291F18" />
            <rect x="42" y="195" width="196" height="18" rx="4" fill="#3D2D23" />

            <path
              d="M115 82C115 62 128 52 140 52C155 52 165 62 165 82C165 92 162 100 158 106H122C118 100 115 92 115 82Z"
              fill="#1C1917"
            />
            <ellipse cx="140" cy="88" rx="18" ry="20" fill="#FCD5B5" />
            <path
              d="M135 96C138 99 142 99 145 96"
              stroke="#8C4A28"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="134" cy="86" r="2" fill="#1C1917" />
            <circle cx="146" cy="86" r="2" fill="#1C1917" />
            <path
              d="M120 115C120 107 130 105 140 105C150 105 160 107 160 115L170 185H110L120 115Z"
              fill={accentColor}
            />
            <path d="M132 105L140 120L148 105" fill="#FFFFFF" />

            <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.18))">
              <rect x="65" y="145" width="85" height="58" rx="10" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="2.5" />
              <rect x="72" y="152" width="71" height="44" rx="6" fill="#FAF7F2" />
              <text x="107" y="166" textAnchor="middle" fill="#78716C" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">
                WALK-IN QUEUE
              </text>
              <text x="107" y="186" textAnchor="middle" fill={accentColor} fontSize="18" fontWeight="900" fontFamily="sans-serif">
                03
              </text>
            </g>

            <g filter="drop-shadow(0px 6px 12px rgba(224,83,38,0.35))">
              <circle cx="45" cy="148" r="20" fill={accentColor} />
              <text x="45" y="155" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontWeight="900" fontFamily="sans-serif">
                +1
              </text>
            </g>

            <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))">
              <rect x="165" y="60" width="105" height="34" rx="10" fill="#FFFFFF" stroke="#F0EBE4" strokeWidth="1.5" />
              <polygon points="172,94 180,94 170,102" fill="#FFFFFF" />
              <text x="217" y="76" textAnchor="middle" fill="#1C1917" fontSize="9" fontWeight="800" fontFamily="sans-serif">
                3 Waiting in Line
              </text>
              <text x="217" y="87" textAnchor="middle" fill="#059669" fontSize="7.5" fontWeight="700" fontFamily="sans-serif">
                • Live Transparency
              </text>
            </g>
          </svg>
        </div>

        <div className="mt-6 space-y-2 max-w-[270px]">
          <h2 className="text-lg sm:text-[19px] font-black text-stone-900 tracking-tight leading-snug">
            Take Complete Control Of Your{' '}
            <span style={{ color: accentColor }}>Walk-In Rush</span> In 1 Tap
          </h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            Eliminate crowded salon benches and let neighbourhood clients track waiting turns live.
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

  const renderPhone3Commission = () => (
    <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">
      {renderPhoneTopBar(false)}

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
            <g filter="drop-shadow(0px 10px 20px rgba(0,0,0,0.14))">
              <rect x="42" y="55" width="95" height="140" rx="12" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="2.5" />
              <rect x="52" y="68" width="75" height="75" rx="6" fill="#1C1917" />
              
              <rect x="59" y="75" width="16" height="16" fill="#FFFFFF" />
              <rect x="63" y="79" width="8" height="8" fill="#1C1917" />
              <rect x="102" y="75" width="16" height="16" fill="#FFFFFF" />
              <rect x="106" y="79" width="8" height="8" fill="#1C1917" />
              <rect x="59" y="118" width="16" height="16" fill="#FFFFFF" />
              <rect x="63" y="122" width="8" height="8" fill="#1C1917" />
              <rect x="88" y="100" width="10" height="10" fill="#FFFFFF" />

              <text x="89" y="160" textAnchor="middle" fill="#1C1917" fontSize="7" fontWeight="800" fontFamily="sans-serif">
                SCAN TO CHECK QUEUE
              </text>
              <text x="89" y="174" textAnchor="middle" fill={accentColor} fontSize="6.5" fontWeight="800" fontFamily="sans-serif">
                Free Standee PDF
              </text>

              <path d="M35 195H144L139 203H40L35 195Z" fill="#D6C7B8" />
            </g>

            <path
              d="M185 85C185 68 196 58 210 58C224 58 235 68 235 85C235 94 231 102 227 106H190C187 102 185 94 185 85Z"
              fill="#2E1C12"
            />
            <ellipse cx="210" cy="92" rx="16" ry="18" fill="#FCD5B5" />
            <path d="M198 94C198 108 206 114 210 114C214 114 222 108 222 94H198Z" fill="#2E1C12" />
            <path d="M205 101C207 103 213 103 215 101" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="204" cy="88" r="1.8" fill="#1C1917" />
            <circle cx="216" cy="88" r="1.8" fill="#1C1917" />
            <path d="M188 118C188 110 198 108 210 108C222 108 232 110 232 118L240 205H180L188 118Z" fill="#1C1917" />

            <g filter="drop-shadow(0px 8px 18px rgba(16,185,129,0.35))">
              <rect x="120" y="155" width="130" height="42" rx="12" fill="#10B981" />
              <text x="185" y="174" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="900" fontFamily="sans-serif">
                0% COMMISSION
              </text>
              <text x="185" y="187" textAnchor="middle" fill="#D1FAE5" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">
                Keep 100% Cash & Direct UPI
              </text>
            </g>
          </svg>
        </div>

        <div className="mt-6 space-y-2 max-w-[270px]">
          <h2 className="text-lg sm:text-[19px] font-black text-stone-900 tracking-tight leading-snug">
            Keep 100% Of Your Revenue With{' '}
            <span style={{ color: accentColor }}>0% Commission</span>
          </h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            No expensive POS rentals. Just print your counter standee and operate directly on your phone.
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

  const renderPhone4Chairs = () => (
    <div className="relative w-full h-full bg-white flex flex-col justify-between overflow-hidden">
      {renderPhoneTopBar(false)}

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
            <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
              <rect x="55" y="145" width="80" height="16" rx="5" fill="#1C1917" />
              <path d="M62 105C62 98 68 92 76 92H118C126 92 132 98 132 105V145H62V105Z" fill="#783F0F" />
              <rect x="80" y="78" width="28" height="18" rx="4" fill="#1C1917" />
              <rect x="91" y="161" width="9" height="26" fill="#78716C" />
              <ellipse cx="95" cy="190" rx="38" ry="7" fill="#1C1917" />
            </g>

            <path
              d="M175 80C175 62 188 50 205 50C222 50 234 62 234 80C234 90 230 98 226 102H182C178 98 175 90 175 80Z"
              fill="#1C1917"
            />
            <ellipse cx="204" cy="88" rx="16" ry="18" fill="#FCD5B5" />
            <path d="M200 96C202 99 207 99 209 96" stroke="#8C4A28" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="199" cy="86" r="1.8" fill="#1C1917" />
            <circle cx="210" cy="86" r="1.8" fill="#1C1917" />
            <path d="M180 114C180 106 190 104 204 104C218 104 228 106 228 114L238 198H170L180 114Z" fill="#1C1917" />

            <circle cx="162" cy="138" r="3.5" stroke="#F59E0B" strokeWidth="1.6" fill="none" />
            <circle cx="168" cy="138" r="3.5" stroke="#F59E0B" strokeWidth="1.6" fill="none" />
            <line x1="163" y1="135" x2="157" y2="122" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="167" y1="135" x2="161" y2="122" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />

            <g filter="drop-shadow(0px 8px 18px rgba(0,0,0,0.14))">
              <rect x="145" y="32" width="112" height="38" rx="10" fill="#FFFFFF" stroke="#F0EBE4" strokeWidth="1.5" />
              <circle cx="163" cy="51" r="8" fill="#10B981" />
              <path d="M160 51L162 53L167 48" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
              <text x="178" y="48" fill="#1C1917" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                VERIFIED
              </text>
              <text x="178" y="59" fill="#78716C" fontSize="7.5" fontWeight="700" fontFamily="sans-serif">
                ★ 4.9 Neighbourhood Salon
              </text>
            </g>
          </svg>
        </div>

        <div className="mt-6 space-y-2 max-w-[270px]">
          <h2 className="text-lg sm:text-[19px] font-black text-stone-900 tracking-tight leading-snug">
            Attract High-Value Clients To{' '}
            <span style={{ color: accentColor }}>Your Chairs</span>
          </h2>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            Get verified by our team, showcase your master barbers, and turn one-time walk-ins into regulars.
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
          <span>Continue to Partner Desk</span>
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
            <span className="text-xs uppercase font-black tracking-widest px-2.5 py-1 rounded bg-[#E05326] text-white">
              SLOON PARTNER ONBOARDING
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
            {renderPhone2Queue()}
          </div>
          <div className="w-[280px] sm:w-[295px] h-[590px] rounded-[36px] bg-white border-[6px] border-stone-900 shadow-2xl overflow-hidden shrink-0 flex flex-col">
            {renderPhone3Commission()}
          </div>
          <div className="w-[280px] sm:w-[295px] h-[590px] rounded-[36px] bg-white border-[6px] border-stone-900 shadow-2xl overflow-hidden shrink-0 flex flex-col">
            {renderPhone4Chairs()}
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
            onClick={() => setViewMode('gallery')}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 hover:bg-white border border-stone-200 text-stone-700 hover:text-orange-600 text-[10px] font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
            title="View All 4 Screens Side-by-Side (Matching Reference)"
          >
            <Layers className="w-3 h-3 text-[#E05326]" />
            <span>All 4 Screens</span>
          </button>

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
          {currentStep === 1 && renderPhone2Queue()}
          {currentStep === 2 && renderPhone3Commission()}
          {currentStep === 3 && renderPhone4Chairs()}
        </div>
      </div>
    </div>
  );
};
