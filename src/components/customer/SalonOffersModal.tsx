import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Tag,
  Copy,
  Check,
  Trophy,
  Gift,
  Clock,
  RotateCw,
  Flame,
  Lock,
} from 'lucide-react';
import { Salon, SalonOffer, DEFAULT_SALON_OFFERS } from '@kumbhakaran/shared-types';

interface SalonOffersModalProps {
  salon: Salon;
  isOpen: boolean;
  onClose: () => void;
  onSelectOffer?: (offer: SalonOffer) => void;
}

const LUXURY_COLORS = [
  '#C85322', // Terracotta Brand
  '#059669', // Royal Emerald
  '#D97706', // Rich Amber
  '#7C3AED', // Deep Violet
  '#DC2626', // Crimson Ruby
  '#2563EB', // Sapphire Blue
  '#DB2777', // Magenta Pink
  '#0D9488', // Persian Teal
];

// 15 days in milliseconds
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

interface SpinRecord {
  lastSpinTimestamp: number;
  wonOffer: SalonOffer;
  wonAtDate: string;
}

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {}
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {}
};

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
  const [wonDate, setWonDate] = useState<string | null>(null);
  const [canSpin, setCanSpin] = useState<boolean>(true);
  const [remainingCooldownText, setRemainingCooldownText] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'wheel' | 'percent' | 'flat'>('all');
  const [viewTab, setViewTab] = useState<'wheel' | 'all'>('wheel');

  const storageKey = `sloon_spin_cooldown_v1_${salon.id}`;

  useEffect(() => {
    if (!isOpen) return;

    const stored = getStorageItem(storageKey);
    if (stored) {
      try {
        const record: SpinRecord = JSON.parse(stored);
        if (record && record.lastSpinTimestamp) {
          const elapsed = Date.now() - record.lastSpinTimestamp;
          if (elapsed < FIFTEEN_DAYS_MS) {
            const remainingMs = FIFTEEN_DAYS_MS - elapsed;
            const daysLeft = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
            const hoursLeft = Math.ceil((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

            const timeText = daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft} hours`;

            setCanSpin(false);
            setRemainingCooldownText(timeText);
            setWonOffer(record.wonOffer);
            setWonDate(record.wonAtDate || 'Recent spin');
            return;
          }
        }
      } catch {}
    }

    setCanSpin(true);
    setRemainingCooldownText('');
  }, [isOpen, salon.id, storageKey]);

  const allOffers: SalonOffer[] = useMemo(() => {
    if (Array.isArray(salon.offers) && salon.offers.length > 0) {
      return salon.offers.filter((o) => o.isActive !== false);
    }
    return DEFAULT_SALON_OFFERS;
  }, [salon.offers]);

  const wheelSlices: SalonOffer[] = useMemo(() => {
    const rawWheelOffers = allOffers.filter((o) => o.inSpinWheel && o.isActive !== false);
    let base = rawWheelOffers.length > 0 ? rawWheelOffers : allOffers;
    if (base.length === 0) base = DEFAULT_SALON_OFFERS;

    let slices = [...base];
    while (slices.length < 6) {
      slices = [...slices, ...base.map((o, idx) => ({ ...o, id: `${o.id}-pad-${idx}` }))];
    }
    return slices.slice(0, 8);
  }, [allOffers]);

  const numSlices = wheelSlices.length;
  const sliceAngle = 360 / numSlices;

  const filteredOffers = useMemo(() => {
    if (activeFilter === 'wheel') return allOffers.filter((o) => o.inSpinWheel);
    if (activeFilter === 'percent') return allOffers.filter((o) => o.discountType === 'percentage');
    if (activeFilter === 'flat') return allOffers.filter((o) => o.discountType === 'flat');
    return allOffers;
  }, [allOffers, activeFilter]);

  const handleSpin = () => {
    if (isSpinning || !canSpin) return;
    setIsSpinning(true);
    setWonOffer(null);
    setShowConfetti(false);

    const winningIdx = Math.floor(Math.random() * numSlices);
    const winningSlice = wheelSlices[winningIdx];

    const sliceCenter = winningIdx * sliceAngle + sliceAngle / 2;
    const targetRemainder = ((270 - sliceCenter) % 360 + 360) % 360;

    const extraRounds = 6 + Math.floor(Math.random() * 2);
    const fullSpins = extraRounds * 360;

    const currentNormalized = rotationAngle % 360;
    const diff = ((targetRemainder - currentNormalized) % 360 + 360) % 360;
    const nextAngle = rotationAngle + fullSpins + diff;

    setRotationAngle(nextAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setWonOffer(winningSlice);
      setShowConfetti(true);

      const now = Date.now();
      const formattedDate = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const record: SpinRecord = {
        lastSpinTimestamp: now,
        wonOffer: winningSlice,
        wonAtDate: formattedDate,
      };
      setStorageItem(storageKey, JSON.stringify(record));
      setCanSpin(false);
      setRemainingCooldownText('15 days');
      setWonDate(formattedDate);
    }, 4500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-60 overflow-hidden">
          {Array.from({ length: 45 }).map((_, i) => {
            const left = Math.random() * 100;
            const delay = Math.random() * 0.4;
            const duration = 2.2 + Math.random() * 1.8;
            const bg = LUXURY_COLORS[i % LUXURY_COLORS.length];
            return (
              <div
                key={i}
                className="absolute top-0 w-2.5 h-3.5 rounded-xs animate-bounce shadow-md"
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

      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#110D0B] border border-amber-500/30 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] text-white overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-amber-500/20 bg-[#191310]/80 backdrop-blur-md shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#110D0B] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {salon.name}
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  VIP Deals
                </span>
              </div>
              <p className="text-xs text-stone-400">
                1 Fortune Spin every 15 days · Exclusive in-studio vouchers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-stone-400 hover:text-white bg-stone-900/80 hover:bg-stone-800 border border-stone-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-7 pt-3 pb-1 shrink-0 bg-[#16100E] border-b border-amber-500/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-stone-950/80 rounded-2xl border border-stone-800/80">
            <button
              type="button"
              onClick={() => setViewTab('wheel')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewTab === 'wheel'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Fortune Wheel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('all')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewTab === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>All Vouchers ({allOffers.length})</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold">
            {canSpin ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Spin Ready Today!
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Next spin in {remainingCooldownText}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {viewTab === 'wheel' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-b from-[#1E1511] via-[#16100E] to-[#110D0B] border border-amber-500/25 rounded-3xl p-5 sm:p-7 text-center relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.08)_0%,_transparent_70%)] pointer-events-none" />

                <div className="space-y-1 relative z-10">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30 inline-flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      1 SPIN IN 15 DAYS
                    </span>

                    {!canSpin && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/30 inline-flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Cooldown Active
                      </span>
                    )}
                  </div>

                  <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                    {canSpin ? 'Spin for Instant In-Studio Perks!' : 'Your Exclusive 15-Day Prize'}
                  </h4>
                  <p className="text-xs text-stone-300 max-w-sm mx-auto leading-relaxed">
                    {canSpin
                      ? 'Customers are allowed 1 spin every 15 days. Win jackpot cuts, ₹100 off vouchers, or free beard treatments!'
                      : `You claimed your spin on ${wonDate || 'recently'}. Your active won deal is displayed below! Next spin unlocks in ${remainingCooldownText}.`}
                  </p>
                </div>

                <div className="relative w-68 h-68 sm:w-76 sm:h-76 mx-auto flex items-center justify-center my-4 select-none">
                  <div className="absolute inset-[-6px] rounded-full border-[6px] border-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.25)] pointer-events-none z-10" />

                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center filter drop-shadow-[0_5px_8px_rgba(0,0,0,0.9)]">
                    <div className="w-7 h-8 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 [clip-path:polygon(50%_100%,0%_0%,100%_0%)] border-t border-amber-200" />
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-600 border-2 border-amber-300 -mt-8 shadow-inner" />
                  </div>

                  <div
                    className="w-full h-full rounded-full overflow-hidden shadow-2xl relative border-4 border-amber-400/80"
                    style={{
                      transform: `rotate(${rotationAngle}deg)`,
                      transition: isSpinning
                        ? 'transform 4.5s cubic-bezier(0.12, 0.95, 0.18, 1)'
                        : 'none',
                    }}
                  >
                    <svg viewBox="0 0 300 300" className="w-full h-full">
                      <defs>
                        <radialGradient id="sliceGleamModal" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
                        </radialGradient>
                      </defs>

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

                        const color = slice.color || LUXURY_COLORS[i % LUXURY_COLORS.length];

                        const shortLabel =
                          slice.discountType === 'percentage'
                            ? `${slice.discountValue}% OFF`
                            : slice.discountType === 'flat'
                            ? `₹${slice.discountValue} OFF`
                            : 'FREE PERK';

                        return (
                          <g key={slice.id || i}>
                            <path
                              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                              fill={color}
                              stroke="#1E1511"
                              strokeWidth="2"
                            />
                            <path
                              d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                              fill="url(#sliceGleamModal)"
                              opacity="0.35"
                            />
                            <g
                              transform={`translate(${cx}, ${cy}) rotate(${midAngleDeg}) translate(${r * 0.63}, 0)`}
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
                                  textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                                  letterSpacing: '0.6px',
                                  fontFamily: 'system-ui, sans-serif',
                                }}
                              >
                                {shortLabel}
                              </text>
                            </g>
                          </g>
                        );
                      })}

                      {Array.from({ length: 24 }).map((_, idx) => {
                        const angle = (idx * (360 / 24) * Math.PI) / 180;
                        const sx = 150 + 142 * Math.cos(angle);
                        const sy = 150 + 142 * Math.sin(angle);
                        const isEven = idx % 2 === 0;
                        return (
                          <circle
                            key={idx}
                            cx={sx}
                            cy={sy}
                            r="2.5"
                            fill={isEven ? '#FEF08A' : '#F59E0B'}
                            stroke="#78350F"
                            strokeWidth="0.5"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  <button
                    type="button"
                    disabled={!canSpin || isSpinning}
                    onClick={handleSpin}
                    className={`absolute z-20 w-18 h-18 rounded-full p-0.5 shadow-2xl flex items-center justify-center transition-transform ${
                      !canSpin
                        ? 'bg-gradient-to-tr from-stone-700 to-stone-500 opacity-80 cursor-not-allowed'
                        : 'bg-gradient-to-tr from-amber-700 via-amber-400 to-yellow-100 hover:scale-105 active:scale-95 cursor-pointer'
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-b from-[#2B1B13] to-[#120B07] border-2 border-amber-400/80 flex flex-col items-center justify-center text-amber-300 font-black shadow-inner">
                      {!canSpin ? (
                        <>
                          <Clock className="w-5 h-5 text-stone-400" />
                          <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 mt-0.5">
                            1 IN 15D
                          </span>
                        </>
                      ) : (
                        <>
                          <RotateCw
                            className={`w-5 h-5 ${isSpinning ? 'animate-spin text-amber-200' : 'text-amber-400 group-hover:rotate-45'} transition-transform`}
                          />
                          <span className="text-[9px] font-black uppercase tracking-wider mt-0.5 text-amber-200">
                            {isSpinning ? 'SPINNING' : 'TAP SPIN'}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                <div className="pt-2 relative z-10 flex flex-col items-center gap-2">
                  {!canSpin ? (
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="w-full sm:w-auto min-w-[300px] py-3.5 px-6 rounded-2xl bg-stone-900/90 border border-amber-500/40 text-stone-300 font-bold text-xs shadow-md flex items-center justify-center gap-2.5">
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>
                          1 spin allowed every 15 days · Next spin in{' '}
                          <strong className="text-amber-300 font-black">{remainingCooldownText}</strong>
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400">
                        Your won prize is active below! Show coupon at billing desk.
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isSpinning}
                      onClick={handleSpin}
                      className="w-full sm:w-auto min-w-[260px] py-3.5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSpinning ? (
                        <span className="flex items-center justify-center gap-2">
                          <RotateCw className="w-4 h-4 animate-spin text-stone-950" />
                          Spinning the Wheel...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4 fill-stone-950" />
                          SPIN THE WHEEL (1x in 15 Days)
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {wonOffer && !isSpinning && (
                  <div className="mt-5 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#2A180E] via-[#381F12] to-[#2A180E] border-2 border-amber-500/60 text-left animate-in zoom-in-95 duration-300 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-stone-950 flex items-center justify-center font-black shadow-md">
                          <Trophy className="w-5 h-5 fill-stone-950" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                            {canSpin ? '🎉 WINNER PRIZE UNLOCKED!' : 'ACTIVE 15-DAY DEAL'}
                          </span>
                          <h5 className="text-base sm:text-lg font-black text-white">
                            {wonOffer.title}
                          </h5>
                        </div>
                      </div>

                      <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {canSpin ? 'Just Won' : 'Saved Deal'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 mt-2.5 leading-relaxed">
                      {wonOffer.description}
                    </p>

                    <div className="mt-3.5 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-stone-950/90 border border-amber-500/40">
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-semibold block leading-none">
                            Promo Code:
                          </span>
                          <span className="font-mono text-base font-black tracking-widest text-amber-400">
                            {wonOffer.code}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(wonOffer.code)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-all cursor-pointer active:scale-95 shadow-md shadow-amber-500/20"
                      >
                        {copiedCode === wonOffer.code ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>COPY CODE</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-2.5">
                      <span>💡 Show this code at salon checkout desk</span>
                      <span className="text-stone-400 font-semibold">
                        {!canSpin ? `Next spin in ${remainingCooldownText}` : '1 spin allowed in 15 days'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(viewTab === 'all' || viewTab === 'wheel') && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-400" />
                    All Studio Deals & Vouchers ({allOffers.length})
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Present coupon code to your stylist or front-desk receptionist
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'all' as const, label: 'All' },
                    { id: 'wheel' as const, label: '🎡 Spin Deals' },
                    { id: 'percent' as const, label: '% Discounts' },
                    { id: 'flat' as const, label: 'Flat ₹ Off' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setActiveFilter(f.id)}
                      className={`text-xs px-2.5 py-1 rounded-full transition-colors cursor-pointer border ${
                        activeFilter === f.id
                          ? 'bg-amber-500 text-stone-950 border-amber-400 font-black'
                          : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredOffers.map((offer) => {
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
                      className="flex flex-col justify-between bg-gradient-to-r from-[#1A1411] to-[#140F0D] border border-amber-500/20 hover:border-amber-500/50 rounded-2xl p-4 transition-all relative overflow-hidden group shadow-md"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5"
                        style={{ backgroundColor: offer.color || '#C85322' }}
                      />

                      <div className="space-y-2 pl-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {badgeText}
                          </span>

                          {offer.inSpinWheel && (
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                              <span>🎡 On Wheel</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <h5 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                            {offer.title}
                          </h5>
                          <p className="text-xs text-stone-300 mt-0.5 line-clamp-2 leading-relaxed">
                            {offer.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 text-[11px] text-stone-400 pt-0.5">
                          <span>
                            {offer.minSpend ? `Min spend: ₹${offer.minSpend}` : 'No minimum spend'}
                          </span>
                          <span>•</span>
                          <span>{offer.validTill || 'Valid this week'}</span>
                        </div>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2 pl-2">
                        <div className="px-3 py-1 rounded-xl bg-stone-950 border border-dashed border-stone-700 font-mono text-xs font-black text-amber-400 tracking-wider">
                          {offer.code}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyCode(offer.code)}
                          className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              <span className="text-emerald-400 font-black">Copied</span>
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
          )}
        </div>

        <div className="px-5 sm:px-7 py-3.5 border-t border-amber-500/15 bg-[#16100E] flex items-center justify-between text-xs text-stone-400 shrink-0">
          <span>Show any active coupon code upon arrival at the salon desk.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
