import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Tag,
  Copy,
  Check,
  Trophy,
  Gift,
  Clock,
  ArrowRight,
  ChevronRight,
  Info,
  RotateCw,
} from 'lucide-react';
import { Salon, SalonOffer, DEFAULT_SALON_OFFERS } from '@kumbhakaran/shared-types';

interface SalonOffersModalProps {
  salon: Salon;
  isOpen: boolean;
  onClose: () => void;
  onSelectOffer?: (offer: SalonOffer) => void;
}

const PRESET_COLORS = [
  '#FF6422', // Terracotta Orange
  '#059669', // Emerald Green
  '#D97706', // Warm Amber
  '#7C3AED', // Royal Purple
  '#DC2626', // Crimson Red
  '#2563EB', // Blue
  '#DB2777', // Magenta Pink
  '#0D9488', // Teal
];

export const SalonOffersModal: React.FC<SalonOffersModalProps> = ({
  salon,
  isOpen,
  onClose,
  onSelectOffer,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [wonOffer, setWonOffer] = useState<SalonOffer | null>(null);
  const [spinCountToday, setSpinCountToday] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Load active offers for this salon, falling back to default rich offers if none defined
  const allOffers: SalonOffer[] = useMemo(() => {
    if (Array.isArray(salon.offers) && salon.offers.length > 0) {
      return salon.offers.filter((o) => o.isActive !== false);
    }
    return DEFAULT_SALON_OFFERS;
  }, [salon.offers]);

  // Wheel slices (must have at least 4 slices for a proper wheel feel; repeat if needed)
  const wheelSlices: SalonOffer[] = useMemo(() => {
    const rawWheelOffers = allOffers.filter((o) => o.inSpinWheel && o.isActive !== false);
    let base = rawWheelOffers.length > 0 ? rawWheelOffers : allOffers;
    if (base.length === 0) base = DEFAULT_SALON_OFFERS;

    // Pad slices up to at least 6 slices if fewer
    let slices = [...base];
    while (slices.length < 6) {
      slices = [...slices, ...base.map((o, idx) => ({ ...o, id: `${o.id}-pad-${idx}` }))];
    }
    return slices.slice(0, 8); // At most 8 slices for clean typography
  }, [allOffers]);

  const numSlices = wheelSlices.length;
  const sliceAngle = 360 / numSlices;

  // Handle spin action
  const handleSpin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWonOffer(null);
    setShowConfetti(false);

    // Pick a random winning index
    const winningIdx = Math.floor(Math.random() * numSlices);
    const winningSlice = wheelSlices[winningIdx];

    // Compute target angle so winningIdx lands directly at top needle (270° / 12 o'clock)
    // Slice center angle in local coordinates:
    const sliceCenter = winningIdx * sliceAngle + sliceAngle / 2;
    // We want: (sliceCenter + finalRotation) % 360 == 270
    // => targetRemainder = (270 - sliceCenter) % 360
    const targetRemainder = ((270 - sliceCenter) % 360 + 360) % 360;

    // Add 5 to 7 full rotations (1800° - 2520°) for suspenseful deceleration
    const extraRounds = 5 + Math.floor(Math.random() * 3);
    const fullSpins = extraRounds * 360;

    // Current normalized rotation
    const currentNormalized = rotationAngle % 360;
    const diff = ((targetRemainder - currentNormalized) % 360 + 360) % 360;
    const nextAngle = rotationAngle + fullSpins + diff;

    setRotationAngle(nextAngle);

    // Stop after 4.5s animation
    setTimeout(() => {
      setIsSpinning(false);
      setWonOffer(winningSlice);
      setShowConfetti(true);
      setSpinCountToday((prev) => prev + 1);
    }, 4500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Confetti Animation when winning */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-60 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.5;
            const duration = 2 + Math.random() * 2;
            const bg = PRESET_COLORS[i % PRESET_COLORS.length];
            return (
              <div
                key={i}
                className="absolute top-0 w-2.5 h-2.5 rounded-sm animate-bounce"
                style={{
                  left: `${left}%`,
                  backgroundColor: bg,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            );
          })}
        </div>
      )}

      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#14141c] border border-zinc-800 rounded-3xl shadow-2xl text-white overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-zinc-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Sparkles className="w-5 h-5 fill-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {salon.name}
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Exclusive Deals
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Spin the fortune wheel & claim special in-studio discounts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* SECTION 1: THE LUCKY SPIN WHEEL */}
          <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border border-zinc-800 rounded-3xl p-5 sm:p-6 text-center space-y-5 relative overflow-hidden shadow-inner">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 inline-flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-amber-400" />
                Fortune Spin-To-Win
              </span>
              <h4 className="text-lg sm:text-xl font-black text-white">
                Spin for Instant Studio Discounts!
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Tap spin below to unlock exclusive salon perks, free service add-ons, or up to 50% off your visit.
              </p>
            </div>

            {/* Wheel Canvas / SVG Presentation */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center my-2 select-none">
              {/* Outer Golden Studded Rim */}
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)] pointer-events-none" />

              {/* Top Pointer Needle (12 o'clock) */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
                <div className="w-6 h-7 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 [clip-path:polygon(50%_100%,0%_0%,100%_0%)]" />
                <div className="w-3 h-3 rounded-full bg-amber-200 border-2 border-amber-600 -mt-7" />
              </div>

              {/* Rotating Wheel Container */}
              <div
                className="w-full h-full rounded-full overflow-hidden shadow-2xl relative"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                  transition: isSpinning
                    ? 'transform 4.5s cubic-bezier(0.15, 0.9, 0.2, 1)'
                    : 'none',
                }}
              >
                <svg viewBox="0 0 300 300" className="w-full h-full">
                  <defs>
                    <radialGradient id="hubGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFF" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
                    </radialGradient>
                  </defs>

                  {/* Slices */}
                  {wheelSlices.map((slice, i) => {
                    const startAngle = (i * sliceAngle * Math.PI) / 180;
                    const endAngle = (((i + 1) * sliceAngle) * Math.PI) / 180;
                    const midAngleDeg = i * sliceAngle + sliceAngle / 2;

                    const r = 148;
                    const cx = 150;
                    const cy = 150;

                    const x1 = cx + r * Math.cos(startAngle);
                    const y1 = cy + r * Math.sin(startAngle);
                    const x2 = cx + r * Math.cos(endAngle);
                    const y2 = cy + r * Math.sin(endAngle);

                    const color = slice.color || PRESET_COLORS[i % PRESET_COLORS.length];

                    // Format short label for slice
                    const shortLabel =
                      slice.discountType === 'percentage'
                        ? `${slice.discountValue}% OFF`
                        : slice.discountType === 'flat'
                        ? `₹${slice.discountValue} OFF`
                        : 'FREE PERK';

                    return (
                      <g key={slice.id || i}>
                        {/* Slice Wedge */}
                        <path
                          d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                          fill={color}
                          stroke="#14141c"
                          strokeWidth="2"
                        />

                        {/* Radial Text */}
                        <g
                          transform={`translate(${cx}, ${cy}) rotate(${midAngleDeg}) translate(${r * 0.62}, 0)`}
                        >
                          <text
                            x="0"
                            y="4"
                            fill="#FFFFFF"
                            fontSize="11"
                            fontWeight="900"
                            textAnchor="middle"
                            transform="rotate(90)"
                            style={{
                              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {shortLabel}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Outer Rim Studs */}
                  {Array.from({ length: 24 }).map((_, idx) => {
                    const angle = (idx * (360 / 24) * Math.PI) / 180;
                    const sx = 150 + 142 * Math.cos(angle);
                    const sy = 150 + 142 * Math.sin(angle);
                    return <circle key={idx} cx={sx} cy={sy} r="2" fill="#FEF08A" />;
                  })}
                </svg>
              </div>

              {/* Center Wheel Cap / Button */}
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpin}
                className="absolute z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-4 border-zinc-950 shadow-xl flex flex-col items-center justify-center text-zinc-950 font-black cursor-pointer hover:scale-105 active:scale-95 transition-transform disabled:opacity-80 disabled:cursor-not-allowed group"
              >
                <RotateCw
                  className={`w-5 h-5 text-zinc-950 ${isSpinning ? 'animate-spin' : 'group-hover:rotate-45'} transition-transform`}
                />
                <span className="text-[9px] font-extrabold uppercase tracking-tight">
                  {isSpinning ? 'SPINNING' : 'SPIN'}
                </span>
              </button>
            </div>

            {/* Spin CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpin}
                className="w-full sm:w-auto min-w-[220px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSpinning ? (
                  <span className="flex items-center justify-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    Spinning the Wheel...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 fill-zinc-950" />
                    SPIN TO WIN A DEAL
                  </span>
                )}
              </button>
            </div>

            {/* Winning Result Card */}
            {wonOffer && !isSpinning && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/40 text-left animate-in zoom-in-95 duration-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center font-black">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        🎉 Congratulations! You Won
                      </span>
                      <h5 className="text-base font-black text-white">
                        {wonOffer.title}
                      </h5>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active Coupon
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {wonOffer.description}
                </p>

                {/* Coupon Code Pill */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span className="font-mono text-sm font-black tracking-widest text-amber-400">
                      {wonOffer.code}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(wonOffer.code)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    {copiedCode === wonOffer.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-950" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span>💡 Show this code at salon counter or during queue check-in</span>
                  <button
                    type="button"
                    onClick={handleSpin}
                    className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                  >
                    Spin Again
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: LIST OTHER OFFERS IN NORMAL FORM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-400" />
                  All Available Deals & Coupons ({allOffers.length})
                </h4>
                <p className="text-xs text-zinc-500">
                  Valid at {salon.name} for walk-in and online queue customers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {allOffers.map((offer) => {
                const isCopied = copiedCode === offer.code;

                const badgeText =
                  offer.discountType === 'percentage'
                    ? `${offer.discountValue}% OFF`
                    : offer.discountType === 'flat'
                    ? `₹${offer.discountValue} OFF`
                    : 'FREE PERK';

                return (
                  <div
                    key={offer.id}
                    className="flex flex-col justify-between bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 transition-all relative overflow-hidden group shadow-sm"
                  >
                    {/* Left Decorative Accent Stripe */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: offer.color || '#FF6422' }}
                    />

                    <div className="space-y-2 pl-1.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {badgeText}
                        </span>

                        {offer.inSpinWheel && (
                          <span className="text-[10px] text-zinc-400 font-medium flex items-center gap-1">
                            <span>🎡 Spin Deal</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h5 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                          {offer.title}
                        </h5>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {offer.description}
                        </p>
                      </div>

                      {/* Spend & Validity */}
                      <div className="flex items-center gap-3 text-[11px] text-zinc-500 pt-1">
                        {offer.minSpend ? (
                          <span>Min Spend: ₹{offer.minSpend}</span>
                        ) : (
                          <span>No min spend</span>
                        )}
                        <span>•</span>
                        <span>{offer.validTill || 'Valid this week'}</span>
                      </div>
                    </div>

                    {/* Bottom Coupon Code & Copy Action */}
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 pl-1.5">
                      <div className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-dashed border-zinc-700 font-mono text-xs font-bold text-amber-400 tracking-wider">
                        {offer.code}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(offer.code)}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/70 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Apply coupons directly at the salon billing desk.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
