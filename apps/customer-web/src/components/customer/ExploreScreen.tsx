import { InstagramGradientIcon } from '../common/InstagramIcon';
import React, { useState, useMemo } from 'react';
import {
  Search,
  Star,
  Users,
  Navigation,
  MapPin,
  Phone,
  CheckCircle2,
  Heart,
  X,
  Store,
  Clock,
  Sparkles,
  Map as MapIcon,
  ArrowRight,
  Percent,
  Home,
  UserCheck,
  Crown,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Compass,
  Info,
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  formatDuration,
  formatWaitTime,
  getQueueDisplay,
  matchesGenderFilter,
  getSalonType,
} from '../../context/CustomerContext';
import {
  DiscoveryCategory,
  DISCOVERY_CATEGORIES,
  DEFAULT_RANKING_WEIGHTS,
  Salon,
} from '@kumbhakaran/shared-types';
import { MapScreen } from './MapScreen';

type ExploreViewMode = 'studios' | 'map';
type SortOption = 'smart_rank' | 'queue' | 'distance' | 'rating' | 'price_asc';

export const ExploreScreen: React.FC = () => {
  const {
    salons,
    searchQuery,
    setSearchQuery,
    setSelectedSalonForDetail,
    toggleFavorite,
    userProfile,
    genderFilter,
  } = useSalon();

  const [viewMode, setViewMode] = useState<ExploreViewMode>('studios');
  const [selectedCategory, setSelectedCategory] = useState<DiscoveryCategory>('all');
  const [activeSort, setActiveSort] = useState<SortOption>('smart_rank');
  const [showFairRankingInfo, setShowFairRankingInfo] = useState(false);

  const isWomen = genderFilter === 'women';

  // Transparent multi-factor ranking scoring function (Sustainable marketplace - not price-only race)
  const computeFairScore = (salon: Salon): number => {
    // 1. Rating Quality & Credibility (30%)
    const ratingScore = (Math.min(5, Math.max(0, salon.rating)) / 5.0) * DEFAULT_RANKING_WEIGHTS.ratingWeight;

    // 2. Proximity to user (25%)
    const distanceScore = Math.max(0, 1 - (salon.distanceKm / 15)) * DEFAULT_RANKING_WEIGHTS.distanceWeight;

    // 3. Real-time availability & queue wait time (20%)
    const isAvailable = salon.isOpen && salon.queueStatus !== 'closed' && salon.queueStatus !== 'paused';
    const queueFactor = salon.currentQueue === 0 ? 1 : Math.max(0.2, 1 - (salon.currentQueue / 6));
    const availScore = (isAvailable ? queueFactor : 0.05) * DEFAULT_RANKING_WEIGHTS.availabilityWeight;

    // 4. Verification & KYC trust (15%)
    const verifiedScore = (salon.isVerified ? 1.0 : 0.6) * DEFAULT_RANKING_WEIGHTS.verifiedWeight;

    // 5. Pricing transparency & fairness (10%)
    const priceScore = Math.max(0.4, 1 - (Math.max(0, salon.startingPrice - 100) / 1000)) * DEFAULT_RANKING_WEIGHTS.pricingFitWeight;

    // 6. Transparent Sponsored / Featured Partner Boost (capped)
    const sponsoredBonus = (salon.isSponsored || salon.featured) ? DEFAULT_RANKING_WEIGHTS.sponsoredBoost : 0;

    return ratingScore + distanceScore + availScore + verifiedScore + priceScore + sponsoredBonus;
  };

  // Filtered & Sorted Salon Records
  const processedSalons = useMemo(() => {
    return salons
      .filter((salon) => {
        // Gender match
        if (!matchesGenderFilter(salon, genderFilter)) return false;

        // Search text matching
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            salon.name.toLowerCase().includes(q) ||
            salon.locality.toLowerCase().includes(q) ||
            salon.city.toLowerCase().includes(q) ||
            (salon.tagline && salon.tagline.toLowerCase().includes(q));
          if (!matches) return false;
        }

        // Category filter matching
        if (selectedCategory === 'available_now') {
          return salon.isOpen && salon.queueStatus !== 'closed' && salon.queueStatus !== 'paused' && salon.currentQueue <= 1;
        }
        if (selectedCategory === 'budget') {
          return salon.startingPrice <= 249;
        }
        if (selectedCategory === 'top_rated') {
          return salon.rating >= 4.8;
        }
        if (selectedCategory === 'professional') {
          return !salon.providerType || salon.providerType === 'traditional_salon';
        }
        if (selectedCategory === 'home_services') {
          return salon.hasHomeService || salon.providerType === 'freelance_pro' || (salon.serviceModes && salon.serviceModes.includes('home_visit'));
        }
        if (selectedCategory === 'independent') {
          return salon.providerType === 'independent_pro' || salon.providerType === 'freelance_pro';
        }
        if (selectedCategory === 'bridal') {
          return (
            salon.homeServiceCategories?.includes('bridal') ||
            salon.services?.some((s) => s.category === 'Combos' || s.name.toLowerCase().includes('bridal'))
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (activeSort === 'smart_rank') {
          return computeFairScore(b) - computeFairScore(a);
        }
        if (activeSort === 'queue') {
          return a.currentQueue - b.currentQueue;
        }
        if (activeSort === 'distance') {
          return a.distanceKm - b.distanceKm;
        }
        if (activeSort === 'rating') {
          return b.rating - a.rating;
        }
        if (activeSort === 'price_asc') {
          return a.startingPrice - b.startingPrice;
        }
        return 0;
      });
  }, [salons, genderFilter, selectedCategory, activeSort, searchQuery]);

  // Icon mapping helper for categories
  const renderCategoryIcon = (iconName: string, active: boolean) => {
    const iconClass = `w-3.5 h-3.5 ${active ? 'text-white' : 'text-stone-600'}`;
    switch (iconName) {
      case 'Zap':
        return <Zap className={iconClass} />;
      case 'Percent':
        return <Percent className={iconClass} />;
      case 'Star':
        return <Star className={`w-3.5 h-3.5 ${active ? 'fill-white text-white' : 'fill-amber-400 text-amber-500'}`} />;
      case 'Store':
        return <Store className={iconClass} />;
      case 'Home':
        return <Home className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      case 'UserCheck':
        return <UserCheck className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      default:
        return <Compass className={iconClass} />;
    }
  };

  return (
    <div className="space-y-4 pb-28 text-stone-900 max-w-5xl mx-auto">
      {/* 1. TOP HEADER & TWO-WAY TOGGLE: [ 🏢 Explore Studios | 🗺️ Map ] */}
      <header className="sticky top-0 z-30 pt-1 pb-2 bg-[var(--bg-main,#FAF7F2)]/95 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-lg font-black tracking-tight text-stone-950 flex items-center gap-2">
              <span>Fair Marketplace Discovery</span>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                {genderFilter === 'women' ? 'Women' : 'Men'}
              </span>
            </h1>
            <p className="text-[11px] text-stone-500 font-medium">
              Transparent local discovery for physical salons, studios, and home beauty pros.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFairRankingInfo(!showFairRankingInfo)}
            className="flex items-center gap-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200/80 px-2.5 py-1 rounded-full shadow-xs cursor-pointer transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-[#FF6422]" />
            <span className="hidden sm:inline">How Ranking Works</span>
          </button>
        </div>

        {/* Ranking Transparency Info Box */}
        {showFairRankingInfo && (
          <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-stone-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Sloon Fair Marketplace Guarantee
              </span>
              <button
                type="button"
                onClick={() => setShowFairRankingInfo(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              We never promote salons solely based on price-gouging or who paid the most. Our fair ranking balances verified ratings (30%), real distance (25%), zero-wait availability (20%), verified identity checks (15%), and fair prices (10%).
            </p>
          </div>
        )}

        {/* Clean 2-Way Segmented Control: [ Explore Studios | 🗺️ Map ] */}
        <div className="bg-stone-200/70 p-1 rounded-2xl flex items-center gap-1 max-w-md">
          <button
            type="button"
            onClick={() => setViewMode('studios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'studios'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <Store className="w-4 h-4 text-[#FF6422]" />
            <span>List View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
            }`}
          >
            <MapIcon className="w-4 h-4 text-emerald-600" />
            <span>Map</span>
          </button>
        </div>
      </header>

      {/* VIEW MODE 1: DEDICATED MAP VIEW ONLY */}
      {viewMode === 'map' && (
        <MapScreen onClose={() => setViewMode('studios')} isFullScreen={true} />
      )}

      {/* VIEW MODE 2: STUDIOS DIRECTORY LIST */}
      {viewMode === 'studios' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Search className={`w-4 h-4 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isWomen
                  ? 'Search parlours, home studios, or bridal artists...'
                  : 'Search salons, barbers, or home grooming pros...'
              }
              className={`w-full pl-10 pr-9 py-2.5 bg-white border ${
                isWomen
                  ? 'border-[#F1DDE3] focus:border-[#F47B70]'
                  : 'border-[#E7DED5] focus:border-[#FF6422]'
              } rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none shadow-xs transition-colors`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 9 Fair Marketplace Discovery Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {DISCOVERY_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap flex items-center gap-1.5 transition-all border cursor-pointer ${
                    isActive
                      ? isWomen
                        ? 'bg-[#F47B70] text-white border-[#F47B70] shadow-xs'
                        : 'bg-[#FF6422] text-white border-[#FF6422] shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                  title={cat.subtitle}
                >
                  {renderCategoryIcon(cat.iconName, isActive)}
                  <span>{cat.label}</span>
                  {cat.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {cat.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary Sorting Controls & Count */}
          <div className="flex items-center justify-between text-xs text-stone-500 px-1 pt-0.5">
            <span className="font-medium">
              Showing <strong className="text-stone-900 font-black">{processedSalons.length}</strong> partners
            </span>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400 hidden sm:inline">Sort by:</span>
              <select
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value as SortOption)}
                aria-label="Sort salons by"
                className="bg-white border border-stone-200 text-stone-800 text-[11px] font-bold rounded-xl px-2.5 py-1 focus:outline-none focus:border-[#FF6422] cursor-pointer shadow-xs"
              >
                <option value="smart_rank">✨ Smart Fair Rank</option>
                <option value="queue">⏳ Shortest Wait Line</option>
                <option value="distance">📍 Closest Distance</option>
                <option value="rating">⭐ Highest Rated</option>
                <option value="price_asc">💰 Pocket Friendly (Price)</option>
              </select>
            </div>
          </div>

          {/* Salon Card Directory */}
          {processedSalons.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-stone-200 shadow-xs">
              <Store className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-stone-800 font-bold text-sm">No salons or studios found</p>
              <p className="text-stone-500 text-xs mt-1">
                Try switching categories or clearing search keywords.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setActiveSort('smart_rank');
                }}
                className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {processedSalons.map((salon) => {
                const waitTime = getEstimatedWaitMinutes(
                  salon.currentQueue,
                  salon.avgServiceTimeMinutes || 20,
                  salon.activeBarbers || 2
                );
                const isFav = userProfile.savedSalons.includes(salon.id);
                const salonType = getSalonType(salon);
                const cover =
                  salon.coverImage ||
                  salon.posterImage ||
                  (salon.images && salon.images[0]) ||
                  (salon.locationImages && salon.locationImages[0]) ||
                  '';

                const isSponsored = salon.isSponsored || salon.featured;
                const isQuietHoursActive =
                  salon.marketingConfig?.quietHours?.enabled &&
                  salon.marketingConfig.quietHours.discountValue > 0;

                const providerTypeLabel =
                  salon.providerType === 'freelance_pro'
                    ? 'Freelance Stylist'
                    : salon.hasHomeService || salon.serviceModes?.includes('home_visit')
                    ? 'Salon & Doorstep'
                    : 'Physical Salon';

                return (
                  <div
                    key={salon.id}
                    onClick={() => setSelectedSalonForDetail(salon)}
                    className={`group bg-white rounded-3xl border ${
                      isWomen ? 'border-[#F1DDE3] hover:border-[#E9A0AA]' : 'border-[#E7DED5] hover:border-[#D97706]/40'
                    } overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col`}
                  >
                    {/* Clean Salon Photography */}
                    <div className="h-48 sm:h-56 w-full relative overflow-hidden bg-stone-100">
                      {cover ? (
                        <img
                          src={cover}
                          alt={salon.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-stone-900 flex flex-col items-center justify-center text-white p-4 text-center">
                          <Store className="w-8 h-8 text-stone-400 mb-1" />
                          <span className="text-sm font-bold tracking-wider">{salon.name}</span>
                        </div>
                      )}

                      {/* Top-Left: Live Status Pill & Sponsored Badge */}
                      <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[75%]">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-stone-900 shadow-sm backdrop-blur-md border border-stone-200/60">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              !salon.isOpen || salon.queueStatus === 'closed'
                                ? 'bg-stone-400'
                                : salon.queueStatus === 'paused'
                                ? 'bg-amber-400'
                                : salon.currentQueue === 0
                                ? 'bg-emerald-500'
                                : salon.currentQueue <= 3
                                ? 'bg-emerald-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span>
                            {!salon.isOpen || salon.queueStatus === 'closed'
                              ? 'Closed'
                              : salon.queueStatus === 'paused'
                              ? 'Queue Paused'
                              : salon.currentQueue === 0
                              ? '0 in line • Open now'
                              : `${salon.currentQueue} in line • ~${formatDuration(waitTime)}`}
                          </span>
                        </span>

                        {isSponsored && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm backdrop-blur-md">
                            <Sparkles className="w-3 h-3" />
                            <span>Featured</span>
                          </span>
                        )}

                        {isQuietHoursActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-sm backdrop-blur-md">
                            <Percent className="w-3 h-3" />
                            <span>Happy Hour</span>
                          </span>
                        )}
                      </div>

                      {/* Top-Right: Action buttons (Instagram link + Heart Save) */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        {(salon.instagramUrl || salon.instagramHandle) && (
                          <a
                            href={
                              salon.instagramUrl?.startsWith('http')
                                ? salon.instagramUrl
                                : `https://instagram.com/${(salon.instagramHandle || salon.instagramUrl || '').replace(/^@/, '')}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="w-9 h-9 rounded-full bg-white/95 text-stone-700 hover:text-pink-600 border border-stone-200/60 backdrop-blur-md flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
                            title={`Visit ${salon.name} on Instagram`}
                          >
                            <InstagramGradientIcon className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(salon.id);
                          }}
                          className="w-9 h-9 rounded-full bg-white/95 text-stone-700 hover:text-rose-500 border border-stone-200/60 backdrop-blur-md flex items-center justify-center transition-all shadow-sm active:scale-90 cursor-pointer"
                          title={isFav ? 'Remove from saved' : 'Save salon'}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isFav ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Bottom-Left: Provider Archetype and Gender Model */}
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-md border border-white/20">
                          {providerTypeLabel}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-stone-800 backdrop-blur-md shadow-xs">
                          {salonType === 'men' ? "Men's Studio" : salonType === 'women' ? "Women's Parlour" : 'Unisex'}
                        </span>
                      </div>
                    </div>

                    {/* Human Details */}
                    <div className="p-4 sm:p-4.5 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="text-base font-black text-stone-900 tracking-tight leading-snug truncate group-hover:text-stone-950">
                              {salon.name}
                            </h3>
                            {salon.isVerified && (
                              <span title="Verified Partner with verified trade license">
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 ${
                                    isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'
                                  }`}
                                />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-stone-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>{salon.rating.toFixed(1)}</span>
                            <span className="text-stone-400 font-normal">({salon.reviewCount})</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 mt-1 text-xs text-stone-500">
                          <p className="flex items-center gap-1 truncate">
                            <Navigation className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{salon.locality}</span>
                            <span>•</span>
                            <span className="font-medium text-stone-600">{salon.distanceKm.toFixed(1)} km away</span>
                          </p>
                          {salon.phone && (
                            <a
                              href={`tel:${salon.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-[11px] font-bold text-stone-700 hover:text-emerald-700 shrink-0 bg-stone-50 hover:bg-emerald-50 px-2 py-0.5 rounded-lg border border-stone-200/60 transition-colors"
                              title="Call partner"
                            >
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>Call</span>
                            </a>
                          )}
                        </div>

                        {/* Supported Service Modes Pill */}
                        <div className="flex flex-wrap items-center gap-1 mt-2.5">
                          <span className="text-[10px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Store className="w-3 h-3 text-[#FF6422]" />
                            <span>In-Salon Queue</span>
                          </span>
                          {(salon.hasHomeService || salon.serviceModes?.includes('home_visit')) && (
                            <span className="text-[10px] font-semibold text-stone-600 bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Home className="w-3 h-3 text-emerald-600" />
                              <span>Doorstep Available</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transparent Price Breakdown Banner */}
                      <div className="pt-2.5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-stone-600 font-medium">
                            Starts at <strong className="text-stone-900 font-black">₹{salon.startingPrice}</strong>
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ₹0 Platform Fee
                          </span>
                        </div>

                        <span
                          className={`font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform ${
                            isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'
                          }`}
                        >
                          <span>View chairs & book</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
