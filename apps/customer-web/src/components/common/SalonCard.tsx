import React from 'react';
import { Star, MapPin, Heart, CheckCircle2, Store } from 'lucide-react';
import { Salon } from '@kumbhakaran/shared-types';
import { getTheme, getQueuePresentation, getQueueFreshnessText, GenderExperience } from '../../theme';
import { getSalonType } from '../../context/CustomerContext';

interface SalonCardProps {
  salon: Salon;
  onSelect: (salon: Salon) => void;
  isSaved?: boolean;
  onToggleFavorite?: (salonId: string) => void;
  experience?: GenderExperience;
  className?: string;
}

export const SalonCard: React.FC<SalonCardProps> = ({
  salon,
  onSelect,
  isSaved = false,
  onToggleFavorite,
  experience = 'men',
  className = '',
}) => {
  const isWomen = experience === 'women';
  const theme = getTheme(experience);

  const cover =
    salon.coverImage ||
    salon.posterImage ||
    (salon.images && salon.images[0]) ||
    (salon.locationImages && salon.locationImages[0]) ||
    '';

  const queueMeta = getQueuePresentation(salon.currentQueue, salon.isOpen !== false, salon.queueStatus);
  const freshness = getQueueFreshnessText(salon.lastQueueUpdate);

  const salonType = getSalonType(salon);
  const salonTypeLabel =
    salonType === 'men'
      ? 'Men Only'
      : salonType === 'women'
      ? 'Women Only'
      : 'Unisex';

  return (
    <article
      onClick={() => onSelect(salon)}
      className={`group bg-white rounded-3xl border overflow-hidden transition-all duration-300 cursor-pointer flex flex-col ${
        isWomen
          ? 'border-rose-100 hover:border-rose-300 shadow-[0_4px_20px_rgba(225,29,72,0.04)] hover:shadow-[0_12px_28px_rgba(225,29,72,0.12)]'
          : 'border-stone-200/90 hover:border-orange-300 shadow-[0_4px_20px_rgba(31,31,31,0.04)] hover:shadow-[0_12px_28px_rgba(255,100,34,0.12)]'
      } ${className}`}
    >
      {/* 1. Cover Photo & Visual Badges */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100">
        {cover ? (
          <img
            src={cover}
            alt={salon.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-white p-4 text-center">
            <Store className="w-8 h-8 text-white/70 mb-1" />
            <span className="text-sm font-black tracking-wider uppercase">{salon.name}</span>
            <span className="text-xs text-stone-400">{salon.locality}</span>
          </div>
        )}

        {/* Ambient Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/25 pointer-events-none" />

        {/* Top-Left: Physical Queue Status Pill */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black shadow-md backdrop-blur-md ${queueMeta.badgeBg} ${queueMeta.badgeText} border ${queueMeta.badgeBorder}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${queueMeta.dotColor} ${
                queueMeta.statusType === 'zero' || queueMeta.statusType === 'low' ? 'animate-pulse' : ''
              }`}
            />
            <span>
              {queueMeta.statusType === 'closed'
                ? 'Closed'
                : queueMeta.statusType === 'paused'
                ? 'Queue Paused'
                : `${salon.currentQueue} waiting • ${queueMeta.label}`}
            </span>
          </span>
        </div>

        {/* Top-Right: Favorite Button */}
        {onToggleFavorite && (
          <div className="absolute top-3 right-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(salon.id);
              }}
              className="p-2 rounded-full bg-white/90 text-stone-700 hover:text-rose-500 border border-white/40 backdrop-blur-md transition-transform hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
              title={isSaved ? 'Remove from saved' : 'Save studio'}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isSaved ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
                }`}
              />
            </button>
          </div>
        )}

        {/* Bottom Tag Overlay on Image */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/60 border border-white/20">
            {salonTypeLabel}
          </span>

          <span className="text-[11px] font-bold text-white/90 drop-shadow-sm">
            {freshness.text}
          </span>
        </div>
      </div>

      {/* 2. Content Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-base sm:text-lg font-black text-stone-900 truncate group-hover:text-stone-700 transition-colors">
                {salon.name}
              </h3>
              {salon.isVerified && (
                <span title="Verified Studio">
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 ${
                      isWomen ? 'text-rose-500' : 'text-[#FF6422]'
                    }`}
                  />
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 bg-stone-50 border border-stone-200 px-2 py-0.5 rounded-lg text-xs font-black text-stone-900">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{salon.rating > 0 ? salon.rating.toFixed(1) : '4.8'}</span>
              <span className="text-[10px] text-stone-500 font-normal">
                ({salon.reviewCount || 120})
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-500 font-medium mt-1 truncate flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>
              {salon.locality}
              {salon.city ? `, ${salon.city}` : ''}
              {salon.distanceKm ? ` • ${salon.distanceKm.toFixed(1)} km away` : ''}
            </span>
          </p>
        </div>

        {/* 3. Pricing Anchor & Observer Action */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] uppercase font-bold text-stone-400 leading-none">
              Services from
            </span>
            <span className="block text-base font-black text-stone-900 leading-tight mt-0.5">
              ₹{salon.startingPrice || 149}
            </span>
          </div>

          <span
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isWomen
                ? 'bg-rose-50 text-[#E11D48] group-hover:bg-[#E11D48] group-hover:text-white'
                : 'bg-orange-50 text-[#FF6422] group-hover:bg-[#FF6422] group-hover:text-white'
            }`}
          >
            View Studio
          </span>
        </div>
      </div>
    </article>
  );
};
