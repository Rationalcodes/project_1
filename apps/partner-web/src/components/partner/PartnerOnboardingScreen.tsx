import React, { useState, useEffect } from 'react';
import { ChevronLeft, ArrowRight, Scissors, Sparkles, Clock, QrCode, ShieldCheck, DollarSign, Users, Store, CheckCircle2, Wifi } from 'lucide-react';
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

  // Auto-advance from splash screen after 2 seconds
  useEffect(() => {
    if (currentStep === 0) {
      const timer = setTimeout(() => {
        setCurrentStep(1);
      }, 2000);
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
  const accentHoverColor = '#C8441B';
  const illustrationBg = '#FFF6EE';

  /* -------------------------------------------------------------
     STEP 0: PARTNER SPLASH SCREEN (Matches Phone 1 in Reference)
  ------------------------------------------------------------- */
  if (currentStep === 0) {
    return (
      <div
        onClick={() => setCurrentStep(1)}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer select-none overflow-hidden transition-all duration-700 animate-in fade-in"
        style={{
          background: 'linear-gradient(180deg, #FDF7F2 0%, #FAECE1 45%, #F4DDCB 100%)',
        }}
      >
        {/* Subtle Decorative Background Line Art Motifs (Grooming / Salon Icons) */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none flex flex-wrap gap-14 p-10 justify-around items-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="transform rotate-12 text-[#783F0F]">
              {i % 4 === 0 ? (
                <Scissors className="w-14 h-14" />
              ) : i % 4 === 1 ? (
                <Store className="w-13 h-13" />
              ) : i % 4 === 2 ? (
                <QrCode className="w-12 h-12" />
              ) : (
                <Sparkles className="w-11 h-11" />
              )}
            </div>
          ))}
        </div>

        {/* Center Circular Logo Emblem (Exact match to Phone 1 in reference) */}
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-white shadow-2xl shadow-stone-800/15 border-4 border-white/90 flex flex-col items-center justify-center p-6 transform transition-transform duration-700 hover:scale-105">
            <img
              src={logoFallback}
              alt="SLOON Partner"
              className="w-32 sm:w-36 h-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = logoTransparent;
              }}
            />
            <div className="mt-2.5 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC]">
              <span className="text-[10px] font-black tracking-widest uppercase">
                PARTNER OS
              </span>
            </div>
          </div>

          <div className="space-y-1 pt-2 animate-pulse">
            <p className="text-xs font-bold tracking-widest text-[#783F0F] uppercase">
              Smart Walk-In Queue System
            </p>
            <p className="text-[11px] text-stone-500 font-medium">Tap anywhere to enter</p>
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
      {/* Smartphone Viewport Card (Matches clean mobile mockup presentation in reference) */}
      <div className="relative w-full max-w-sm sm:max-w-md h-[95vh] max-h-[820px] bg-white rounded-3xl sm:rounded-[40px] shadow-2xl border border-stone-200/90 flex flex-col justify-between overflow-hidden">
        {/* iOS-Style Status Bar (Matches 12:30 in reference) */}
        <div className="pt-3 px-6 pb-1 flex items-center justify-between text-stone-900 text-xs font-bold shrink-0 select-none">
          <span className="tracking-tight text-[13px] font-semibold text-stone-800">12:30</span>
          
          {/* Subtle Phone Speaker Pill */}
          <div className="w-16 h-4 bg-stone-900/10 rounded-full mx-auto" />

          <div className="flex items-center gap-1.5 text-stone-800">
            {/* Cellular Bars */}
            <div className="flex items-end gap-[1.5px] h-3">
              <span className="w-[2.5px] h-1.5 bg-stone-800 rounded-xs" />
              <span className="w-[2.5px] h-2 bg-stone-800 rounded-xs" />
              <span className="w-[2.5px] h-2.5 bg-stone-800 rounded-xs" />
              <span className="w-[2.5px] h-3 bg-stone-800 rounded-xs" />
            </div>
            {/* Wifi Icon */}
            <Wifi className="w-3.5 h-3.5 stroke-[2.5]" />
            {/* Battery Indicator */}
            <div className="w-5 h-2.5 rounded-[3px] border border-stone-800 p-[1px] flex items-center">
              <div className="w-3.5 h-full bg-[#10B981] rounded-[1.5px]" />
            </div>
          </div>
        </div>

        {/* Top Header Bar: Back & Skip Controls */}
        <div className="pt-1 px-5 pb-1 flex items-center justify-between z-20 shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 -ml-1 rounded-full hover:bg-stone-100 text-stone-600 transition-colors cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC]">
              SLOON PARTNER
            </span>
          </div>

          <button
            type="button"
            onClick={onFinish}
            className="text-xs font-bold text-stone-500 hover:text-stone-900 px-2.5 py-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Skip
          </button>
        </div>

        {/* Middle Area: Slide Illustration & Editorial Copy */}
        <div className="flex-1 px-6 flex flex-col items-center justify-center text-center overflow-y-auto no-scrollbar py-2">
          {/* SLIDE 1: Master Your Walk-In Rush (Friendly Human Receptionist / Counter) */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col items-center">
              {/* Human-Crafted Vector Scene Container */}
              <div
                className="w-full max-w-[280px] sm:max-w-[310px] aspect-square rounded-3xl p-4 flex items-center justify-center relative overflow-hidden"
                style={{ background: illustrationBg }}
              >
                <svg
                  viewBox="0 0 300 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[240px]"
                >
                  {/* Warm Circular Backdrop */}
                  <circle cx="150" cy="150" r="120" fill="#FCE9DE" opacity="0.75" />

                  {/* Salon Counter Table */}
                  <rect x="40" y="195" width="220" height="42" rx="10" fill="#291F18" />
                  <rect x="52" y="205" width="196" height="22" rx="5" fill="#3D2D23" />
                  
                  {/* Human Receptionist Character */}
                  {/* Hair */}
                  <path d="M125 78C125 58 140 48 155 48C172 48 185 58 185 78C185 88 182 98 178 104H132C128 98 125 88 125 78Z" fill="#1C1917" />
                  {/* Face */}
                  <ellipse cx="155" cy="85" rx="20" ry="22" fill="#FCD5B5" />
                  {/* Friendly Smile */}
                  <path d="M150 94C153 97 157 97 160 94" stroke="#8C4A28" strokeWidth="2" strokeLinecap="round" />
                  {/* Eyes */}
                  <circle cx="148" cy="83" r="2" fill="#1C1917" />
                  <circle cx="162" cy="83" r="2" fill="#1C1917" />
                  {/* Glasses */}
                  <rect x="143" y="80" width="10" height="7" rx="2" stroke="#783F0F" strokeWidth="1.5" fill="none" />
                  <rect x="157" y="80" width="10" height="7" rx="2" stroke="#783F0F" strokeWidth="1.5" fill="none" />
                  <line x1="153" y1="83" x2="157" y2="83" stroke="#783F0F" strokeWidth="1.5" />
                  {/* Apron / Uniform Collar */}
                  <path d="M130 115C130 107 142 105 155 105C168 105 180 107 180 115L192 195H118L130 115Z" fill="#E05326" />
                  <path d="M145 105L155 125L165 105" fill="#FFFFFF" />
                  {/* Embroidered Scissors on Apron */}
                  <circle cx="152" cy="148" r="3" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
                  <circle cx="158" cy="148" r="3" stroke="#FFFFFF" strokeWidth="1.2" fill="none" />
                  <line x1="153" y1="145" x2="157" y2="136" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="157" y1="145" x2="153" y2="136" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Tablet on Counter (Live Walk-in Stepper) */}
                  <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.18))">
                    <rect x="75" y="148" width="80" height="60" rx="10" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="2.5" />
                    <rect x="82" y="155" width="66" height="46" rx="6" fill="#FAF7F2" />
                    <text x="115" y="170" textAnchor="middle" fill="#78716C" fontSize="7" fontWeight="800" fontFamily="sans-serif">
                      WALK-IN QUEUE
                    </text>
                    <text x="115" y="190" textAnchor="middle" fill={accentColor} fontSize="18" fontWeight="900" fontFamily="sans-serif">
                      03
                    </text>
                  </g>

                  {/* Floating Action Button (+1 Walk In) */}
                  <g filter="drop-shadow(0px 6px 12px rgba(224,83,38,0.35))">
                    <circle cx="50" cy="150" r="22" fill={accentColor} />
                    <text x="50" y="157" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="900" fontFamily="sans-serif">
                      +1
                    </text>
                  </g>

                  {/* Floating Live Pill (-1 Finish) */}
                  <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.12))">
                    <circle cx="240" cy="150" r="22" fill="#1C1917" />
                    <text x="240" y="157" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="900" fontFamily="sans-serif">
                      -1
                    </text>
                  </g>

                  {/* Speech Bubble: "3 Clients in Line" */}
                  <g filter="drop-shadow(0px 6px 12px rgba(0,0,0,0.08))">
                    <rect x="180" y="55" width="105" height="34" rx="10" fill="#FFFFFF" />
                    <polygon points="186,89 194,89 184,97" fill="#FFFFFF" />
                    <text x="232" y="72" textAnchor="middle" fill="#1C1917" fontSize="9" fontWeight="800" fontFamily="sans-serif">
                      3 Clients in Line
                    </text>
                    <text x="232" y="82" textAnchor="middle" fill="#059669" fontSize="7.5" fontWeight="700" fontFamily="sans-serif">
                      • Updated 1s ago
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description (Matching style of reference) */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                  Take Complete Control Of Your{' '}
                  <span style={{ color: accentColor }}>Walk-In Rush</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                  Update waiting lines in 1 tap, eliminate crowded benches, and let clients track their turn live.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 2: 0% Commission & Standee QR (Happy Salon Owner) */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col items-center">
              {/* Human-Crafted Vector Scene Container */}
              <div
                className="w-full max-w-[280px] sm:max-w-[310px] aspect-square rounded-3xl p-4 flex items-center justify-center relative overflow-hidden"
                style={{ background: illustrationBg }}
              >
                <svg
                  viewBox="0 0 300 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[240px]"
                >
                  <circle cx="150" cy="150" r="120" fill="#FCE9DE" opacity="0.75" />

                  {/* Printable Acrylic Desk Standee Mockup */}
                  <g filter="drop-shadow(0px 10px 20px rgba(0,0,0,0.14))">
                    <rect x="50" y="60" width="105" height="150" rx="14" fill="#FFFFFF" stroke="#E7DED5" strokeWidth="3" />
                    <rect x="62" y="75" width="81" height="81" rx="8" fill="#1C1917" />
                    
                    {/* Stylized QR Matrix Pattern */}
                    <rect x="70" y="83" width="18" height="18" fill="#FFFFFF" />
                    <rect x="74" y="87" width="10" height="10" fill="#1C1917" />
                    <rect x="113" y="83" width="18" height="18" fill="#FFFFFF" />
                    <rect x="117" y="87" width="10" height="10" fill="#1C1917" />
                    <rect x="70" y="126" width="18" height="18" fill="#FFFFFF" />
                    <rect x="74" y="130" width="10" height="10" fill="#1C1917" />
                    <rect x="98" y="108" width="12" height="12" fill="#FFFFFF" />

                    <text x="102" y="174" textAnchor="middle" fill="#1C1917" fontSize="8" fontWeight="800" fontFamily="sans-serif">
                      SCAN TO CHECK QUEUE
                    </text>
                    <text x="102" y="188" textAnchor="middle" fill={accentColor} fontSize="7" fontWeight="700" fontFamily="sans-serif">
                      Free Standee PDF
                    </text>

                    {/* Acrylic Standee Foot */}
                    <path d="M42 210H163L157 218H48L42 210Z" fill="#D6C7B8" />
                  </g>

                  {/* Happy Salon Owner Character */}
                  {/* Hair / Head */}
                  <path d="M195 90C195 72 208 60 225 60C240 60 252 72 252 90C252 100 248 108 244 112H200C197 108 195 100 195 90Z" fill="#2E1C12" />
                  <ellipse cx="224" cy="98" rx="18" ry="20" fill="#FCD5B5" />
                  {/* Neat Beard & Warm Smile */}
                  <path d="M210 98C210 114 220 122 224 122C228 122 238 114 238 98H210Z" fill="#2E1C12" />
                  <path d="M218 106C221 109 227 109 230 106" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
                  {/* Eyes */}
                  <circle cx="217" cy="94" r="2" fill="#1C1917" />
                  <circle cx="231" cy="94" r="2" fill="#1C1917" />
                  {/* Smart Linen Shirt */}
                  <path d="M198 126C198 118 210 116 224 116C238 116 250 118 250 126L260 220H188L198 126Z" fill="#1C1917" />
                  <line x1="224" y1="116" x2="224" y2="200" stroke="#783F0F" strokeWidth="2" />

                  {/* 0% Commission Hero Badge */}
                  <g filter="drop-shadow(0px 8px 18px rgba(16,185,129,0.35))">
                    <rect x="130" y="165" width="135" height="46" rx="14" fill="#10B981" />
                    <text x="197" y="186" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                      0% COMMISSION
                    </text>
                    <text x="197" y="200" textAnchor="middle" fill="#D1FAE5" fontSize="8" fontWeight="800" fontFamily="sans-serif">
                      Keep 100% Cash & Direct UPI
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                  Keep 100% Of Your Revenue With{' '}
                  <span style={{ color: accentColor }}>0% Commission</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 font-medium leading-relaxed">
                  No expensive POS hardware or tablet rentals. Just print your counter standee and run on your phone.
                </p>
              </div>
            </div>
          )}

          {/* SLIDE 3: Verified Chairs & Master Stylists (Master Barber / Stylist) */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 w-full flex flex-col items-center">
              {/* Human-Crafted Vector Scene Container */}
              <div
                className="w-full max-w-[280px] sm:max-w-[310px] aspect-square rounded-3xl p-4 flex items-center justify-center relative overflow-hidden"
                style={{ background: illustrationBg }}
              >
                <svg
                  viewBox="0 0 300 300"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full max-h-[240px]"
                >
                  <circle cx="150" cy="150" r="120" fill="#FCE9DE" opacity="0.75" />

                  {/* Barber Chair Motif */}
                  <g filter="drop-shadow(0px 8px 16px rgba(0,0,0,0.12))">
                    <rect x="65" y="150" width="85" height="18" rx="6" fill="#1C1917" />
                    <path d="M72 105C72 98 78 92 86 92H128C136 92 142 98 142 105V150H72V105Z" fill="#783F0F" />
                    <rect x="92" y="75" width="30" height="20" rx="5" fill="#1C1917" />
                    <rect x="103" y="168" width="10" height="30" fill="#78716C" />
                    <ellipse cx="108" cy="202" rx="42" ry="8" fill="#1C1917" />
                  </g>

                  {/* Master Stylist Character */}
                  {/* Hair */}
                  <path d="M185 85C185 65 200 52 218 52C236 52 248 65 248 85C248 95 244 104 240 108H192C188 104 185 95 185 85Z" fill="#1C1917" />
                  <ellipse cx="216" cy="94" rx="18" ry="20" fill="#FCD5B5" />
                  {/* Smile */}
                  <path d="M211 103C214 106 219 106 222 103" stroke="#8C4A28" strokeWidth="2" strokeLinecap="round" />
                  {/* Eyes */}
                  <circle cx="210" cy="91" r="2" fill="#1C1917" />
                  <circle cx="223" cy="91" r="2" fill="#1C1917" />
                  {/* Black Barber Polo */}
                  <path d="M190 122C190 114 202 112 216 112C230 112 242 114 242 122L252 210H180L190 122Z" fill="#1C1917" />
                  
                  {/* Golden Shears in Hand */}
                  <circle cx="172" cy="148" r="4" stroke="#F59E0B" strokeWidth="1.8" fill="none" />
                  <circle cx="178" cy="148" r="4" stroke="#F59E0B" strokeWidth="1.8" fill="none" />
                  <line x1="173" y1="145" x2="166" y2="132" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                  <line x1="177" y1="145" x2="171" y2="132" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

                  {/* Verified Studio Shield Badge */}
                  <g filter="drop-shadow(0px 8px 18px rgba(0,0,0,0.14))">
                    <rect x="150" y="38" width="115" height="42" rx="12" fill="#FFFFFF" />
                    <circle cx="170" cy="59" r="10" fill="#10B981" />
                    <path d="M166 59L169 62L175 56" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
                    <text x="187" y="56" fill="#1C1917" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                      VERIFIED
                    </text>
                    <text x="187" y="68" fill="#78716C" fontSize="8" fontWeight="700" fontFamily="sans-serif">
                      ★ 4.9 Neighbourhood Salon
                    </text>
                  </g>
                </svg>
              </div>

              {/* Title & Description */}
              <div className="space-y-2 max-w-xs">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
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

        {/* Bottom Navigation: Carousel Dots & Pill Continue Button (Matches reference) */}
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
            <span>{currentStep === 3 ? 'Continue to Partner Desk' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
