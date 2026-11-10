import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RotateCw, Lock, Clock, Gift, Flame, Trophy } from 'lucide-react';
import { SalonOffer } from '@kumbhakaran/shared-types';

export interface SalonToolsWheelProps {
  offers?: SalonOffer[];
  isSpinning?: boolean;
  rotationAngle?: number;
  canSpin?: boolean;
  remainingCooldownText?: string;
  onSpin?: () => void;
  size?: number;
  className?: string;
  logoSrc?: string;
  autoRotateWhenIdle?: boolean;
  showPointer?: boolean;
  showSlices?: boolean;
  badgeSubtitle?: string;
}

const VIBRANT_SLICE_COLORS = [
  '#C85322', // Brand Terracotta
  '#059669', // Emerald
  '#D97706', // Rich Amber
  '#7C3AED', // Royal Violet
  '#DC2626', // Crimson
  '#2563EB', // Sapphire
  '#DB2777', // Magenta
  '#0D9488', // Teal
];

export const SalonToolsWheel: React.FC<SalonToolsWheelProps> = ({
  offers = [],
  isSpinning = false,
  rotationAngle = 0,
  canSpin = true,
  remainingCooldownText = '',
  onSpin,
  size = 320,
  className = '',
  logoSrc = '/logo-white.png',
  autoRotateWhenIdle = true,
  showPointer,
  showSlices,
  badgeSubtitle,
}) => {
  const shouldShowPointer = showPointer !== undefined ? showPointer : offers.length > 0;
  const shouldShowSlices = showSlices !== undefined ? showSlices : offers.length > 0;
  const isInteractive = Boolean(onSpin);
  const [ambientAngle, setAmbientAngle] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Gentle ambient rotation when not spinning
  useEffect(() => {
    if (!autoRotateWhenIdle || isSpinning || !canSpin) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      // 360 degrees every 24 seconds = 15 deg/sec
      setAmbientAngle((prev) => (prev + delta * 15) % 360);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [autoRotateWhenIdle, isSpinning, canSpin]);

  const activeAngle = isSpinning || !canSpin ? rotationAngle : ambientAngle;

  // 8 slice labels around the perimeter
  const sliceCount = Math.max(offers.length, 8);
  const sliceDegree = 360 / sliceCount;

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      {/* 1. Atmospheric Luxury Mandala SVG Backdrop (Matching User Reference Image) */}
      <svg
        className="absolute inset-[-22%] w-[144%] h-[144%] text-amber-500/25 pointer-events-none stroke-current"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: `rotate(-${ambientAngle * 0.35}deg)`,
          transition: isSpinning ? 'transform 4.5s ease-out' : 'none',
        }}
      >
        <circle cx="100" cy="100" r="96" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4" />
        <circle cx="100" cy="100" r="88" strokeWidth="0.6" opacity="0.5" />
        <circle cx="100" cy="100" r="76" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.35" />
        {/* 16 Sacred Mandala Petals */}
        {Array.from({ length: 16 }).map((_, i) => (
          <path
            key={i}
            d="M 100 8 C 114 45, 114 75, 100 100 C 86 75, 86 45, 100 8 Z"
            strokeWidth="0.75"
            transform={`rotate(${i * 22.5} 100 100)`}
            opacity="0.55"
          />
        ))}
        {Array.from({ length: 16 }).map((_, i) => (
          <path
            key={`inner-${i}`}
            d="M 100 28 C 109 60, 109 78, 100 100 C 91 78, 91 60, 100 28 Z"
            strokeWidth="0.5"
            transform={`rotate(${i * 22.5 + 11.25} 100 100)`}
            opacity="0.45"
          />
        ))}
      </svg>

      {/* Atmospheric Luxury Warm Glow Backdrop */}
      <div className="absolute inset-[-18px] rounded-full bg-gradient-to-tr from-rose-950/60 via-amber-600/30 to-orange-500/40 blur-3xl pointer-events-none animate-pulse duration-1000" />

      {/* 2. Outer Studded Golden Bezel with Jewels */}
      <div className="absolute inset-0 rounded-full border-[5px] border-amber-400/70 shadow-[0_0_35px_rgba(245,158,11,0.35)] pointer-events-none z-20 overflow-hidden">
        {/* Shimmer sweep animation across bezel */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      </div>

      {/* Outer Golden Studs (16 jewel markers) */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {Array.from({ length: 16 }).map((_, idx) => {
          const deg = idx * (360 / 16);
          const rad = (deg * Math.PI) / 180;
          const r = size / 2 - 4;
          const left = size / 2 + r * Math.cos(rad);
          const top = size / 2 + r * Math.sin(rad);
          const isGold = idx % 2 === 0;

          return (
            <div
              key={idx}
              className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-sm ${
                isGold ? 'bg-amber-300 border border-amber-500 shadow-amber-400/50' : 'bg-yellow-100 border border-amber-300'
              }`}
              style={{ left: `${left}px`, top: `${top}px` }}
            />
          );
        })}
      </div>

      {/* 3. Top Casino Pointer Needle (Conditional) */}
      {shouldShowPointer && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.9)] pointer-events-none">
          <div className="w-7 h-8 bg-gradient-to-b from-amber-100 via-amber-400 to-amber-600 [clip-path:polygon(50%_100%,0%_0%,100%_0%)] border-t border-amber-200" />
          <div className="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-amber-300 -mt-8 shadow-inner animate-pulse" />
        </div>
      )}

      {/* 4. THE ROTATING SALON TOOLS WHEEL */}
      <div
        className="w-full h-full rounded-full overflow-hidden shadow-2xl relative border-2 border-amber-400/80"
        style={{
          transform: `rotate(${activeAngle}deg)`,
          transition: isSpinning
            ? 'transform 4.5s cubic-bezier(0.12, 0.95, 0.18, 1)'
            : 'none',
        }}
      >
        {/* Salon Tools Circular Art Texture */}
        <img
          src="/salon-tools-wheel.jpg"
          alt="Salon Tools Art"
          className="w-full h-full object-cover rounded-full scale-[1.06] select-none pointer-events-none"
          draggable={false}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />

        {/* Realistic 3D Radial Depth & Specular Lighting Overlay */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_transparent_35%,_rgba(0,0,0,0.3)_65%,_rgba(0,0,0,0.6)_100%)] pointer-events-none" />

        {/* Offer Ribbons around perimeter (Conditional) */}
        {shouldShowSlices && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: sliceCount }).map((_, i) => {
              const offer = offers[i % offers.length];
              const angle = i * sliceDegree + sliceDegree / 2;
              const sliceColor = VIBRANT_SLICE_COLORS[i % VIBRANT_SLICE_COLORS.length];

              const shortLabel = (offer as any)?.badgeText || (
                offer?.discountType === 'percentage'
                  ? `${offer.discountValue}% OFF`
                  : offer?.discountType === 'flat'
                    ? `₹${offer.discountValue} OFF`
                    : offer?.title?.slice(0, 10) || 'VIP REWARD'
              );

              return (
                <div
                  key={i}
                  className="absolute top-1/2 left-1/2 origin-left -translate-y-1/2 flex items-center justify-end"
                  style={{
                    width: `${size / 2}px`,
                    transform: `rotate(${angle}deg)`,
                  }}
                >
                  <div
                    className="mr-3 px-2 py-0.5 rounded-full border shadow-lg flex items-center gap-1 transform rotate-90"
                    style={{
                      backgroundColor: `${sliceColor}E6`,
                      borderColor: '#FEF08A',
                      boxShadow: `0 2px 10px ${sliceColor}80`,
                    }}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-yellow-200 fill-yellow-200" />
                    <span
                      className="text-[9px] font-black text-white whitespace-nowrap tracking-wider uppercase"
                      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}
                    >
                      {shortLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. CENTER LUXURY MEDALLION WITH SLOON LOGO */}
      <div
        onClick={isInteractive ? onSpin : undefined}
        className={`absolute z-30 rounded-full p-[3.5px] shadow-[0_12px_40px_rgba(0,0,0,0.85)] transition-all duration-300 ${
          isInteractive
            ? !canSpin
              ? 'cursor-not-allowed opacity-90'
              : 'hover:scale-105 active:scale-95 cursor-pointer group'
            : 'pointer-events-none'
        }`}
        style={{
          width: `${Math.round(size * 0.44)}px`,
          height: `${Math.round(size * 0.44)}px`,
          background: 'linear-gradient(135deg, #FEF08A 0%, #F59E0B 28%, #B45309 60%, #78350F 85%, #FDE047 100%)',
        }}
        title={isInteractive ? (canSpin ? 'Tap to Spin the Salon Wheel!' : `Next spin in ${remainingCooldownText}`) : 'SLOON'}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#241316] via-[#14080B] to-[#0A0305] border-[2.5px] border-amber-300/90 ring-1 ring-amber-600/60 flex flex-col items-center justify-center p-2 relative overflow-hidden shadow-inner">
          {/* Subtle gold specular beam across center badge */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

          {/* SLOON Official Brand Logo with Gold Drop Glow */}
          <div className="flex items-center justify-center relative z-10 px-2 py-0.5">
            <img
              src={logoSrc || '/logo-white.png'}
              alt="SLOON"
              className="h-6 sm:h-7.5 w-auto max-w-[92px] object-contain drop-shadow-[0_2px_10px_rgba(245,158,11,0.65)] select-none pointer-events-none filter brightness-110"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes('logo-white.png')) {
                  target.src = '/logo-white.png';
                } else if (!target.src.includes('logo.png')) {
                  target.src = '/logo.png';
                } else {
                  target.style.display = 'none';
                }
              }}
            />
          </div>

          {/* Interactive Status Indicator or Custom Subtitle below logo */}
          <div className="relative z-10 mt-1 flex items-center justify-center">
            {badgeSubtitle ? (
              <div className="flex items-center gap-1 text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest text-amber-200 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/50 shadow-xs">
                <span>{badgeSubtitle}</span>
              </div>
            ) : !isInteractive ? (
              <div className="flex items-center gap-1 text-[7.5px] sm:text-[8px] font-black uppercase tracking-widest text-amber-300/90">
                <Sparkles className="w-2 h-2 text-amber-400 fill-amber-400" />
                <span>OFFICIAL</span>
              </div>
            ) : !canSpin ? (
              <div className="flex items-center gap-1 text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-stone-400 bg-stone-900/80 px-2 py-0.5 rounded-full border border-stone-700/60">
                <Clock className="w-2.5 h-2.5 text-stone-400" />
                <span>1 IN 15D</span>
              </div>
            ) : isSpinning ? (
              <div className="flex items-center gap-1 text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider text-amber-200 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/50">
                <RotateCw className="w-2.5 h-2.5 animate-spin text-amber-300" />
                <span>SPINNING</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-widest text-stone-950 bg-gradient-to-r from-amber-400 to-yellow-300 px-2.5 py-0.5 rounded-full shadow-md shadow-amber-500/30 group-hover:from-amber-300 group-hover:to-yellow-200 transition-all">
                <Sparkles className="w-2.5 h-2.5 fill-stone-950" />
                <span>TAP SPIN</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
