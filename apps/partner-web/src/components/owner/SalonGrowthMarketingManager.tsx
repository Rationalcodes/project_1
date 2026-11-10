import React, { useState } from 'react';
import {
  Zap,
  Gift,
  Clock,
  Sparkles,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  Share2,
  Plus,
  Trash2,
  Edit2,
  Save,
  Check,
  ShieldCheck,
  Crown,
  Layers,
  ArrowRight,
  Info,
  DollarSign,
  AlertCircle,
  Tag,
  RotateCw,
} from 'lucide-react';
import {
  Salon,
  SalonMarketingConfig,
  DEFAULT_SALON_MARKETING_CONFIG,
  QuietHoursPromotion,
  LoyaltyProgramConfig,
  RepeatVisitConfig,
  PremiumUpsellConfig,
  GroomingPackage,
  SalonOffer,
} from '@kumbhakaran/shared-types';

export interface SalonGrowthMarketingManagerProps {
  activeSalon: Salon;
  onUpdateMarketingConfig: (config: SalonMarketingConfig) => void;
  salonOffers: SalonOffer[];
  onUpdateOffers: (offers: SalonOffer[]) => void;
  triggerNotification: (msg: string) => void;
}

type MarketingSubTab = 'quiet-hours' | 'loyalty' | 'repeat-visits' | 'upsell' | 'packages' | 'spin-vouchers';

const WEEKDAYS = [
  { id: 'Mon', label: 'Monday' },
  { id: 'Tue', label: 'Tuesday' },
  { id: 'Wed', label: 'Wednesday' },
  { id: 'Thu', label: 'Thursday' },
  { id: 'Fri', label: 'Friday' },
  { id: 'Sat', label: 'Saturday' },
  { id: 'Sun', label: 'Sunday' },
];

export const SalonGrowthMarketingManager: React.FC<SalonGrowthMarketingManagerProps> = ({
  activeSalon,
  onUpdateMarketingConfig,
  salonOffers,
  onUpdateOffers,
  triggerNotification,
}) => {
  const [activeTab, setActiveTab] = useState<MarketingSubTab>('quiet-hours');

  // Form states initialized with active salon config or defaults
  const config = activeSalon.marketingConfig || DEFAULT_SALON_MARKETING_CONFIG;

  const [quietHours, setQuietHours] = useState<QuietHoursPromotion>({
    ...DEFAULT_SALON_MARKETING_CONFIG.quietHours,
    ...(config.quietHours || {}),
  });

  const [loyalty, setLoyalty] = useState<LoyaltyProgramConfig>({
    ...DEFAULT_SALON_MARKETING_CONFIG.loyaltyProgram,
    ...(config.loyaltyProgram || {}),
  });

  const [repeatVisit, setRepeatVisit] = useState<RepeatVisitConfig>({
    ...DEFAULT_SALON_MARKETING_CONFIG.repeatVisit,
    ...(config.repeatVisit || {}),
  });

  const [upsell, setUpsell] = useState<PremiumUpsellConfig>({
    ...DEFAULT_SALON_MARKETING_CONFIG.premiumUpsell,
    ...(config.premiumUpsell || {}),
  });

  const [packages, setPackages] = useState<GroomingPackage[]>(
    config.groomingPackages && config.groomingPackages.length > 0
      ? config.groomingPackages
      : DEFAULT_SALON_MARKETING_CONFIG.groomingPackages
  );

  // Package modal states
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [pkgTitle, setPkgTitle] = useState('');
  const [pkgSubtitle, setPkgSubtitle] = useState('');
  const [pkgIncludedServices, setPkgIncludedServices] = useState<string[]>([]);
  const [pkgOriginalTotal, setPkgOriginalTotal] = useState<number>(600);
  const [pkgBundlePrice, setPkgBundlePrice] = useState<number>(399);
  const [pkgBadge, setPkgBadge] = useState('Best Value');

  // WhatsApp demo message customer state
  const [demoCustomerName, setDemoCustomerName] = useState('Rohan');
  const [demoCustomerPhone, setDemoCustomerPhone] = useState('9876543210');

  // Commit changes to parent & persist
  const saveAllConfig = (
    updatedPartial: Partial<SalonMarketingConfig>,
    successMessage?: string
  ) => {
    const nextConfig: SalonMarketingConfig = {
      quietHours,
      loyaltyProgram: loyalty,
      repeatVisit,
      premiumUpsell: upsell,
      groomingPackages: packages,
      ...updatedPartial,
    };
    onUpdateMarketingConfig(nextConfig);
    triggerNotification(successMessage || 'Marketing settings saved & published!');
  };

  const toggleQuietDay = (day: string) => {
    setQuietHours((prev) => {
      const exists = prev.days.includes(day);
      const nextDays = exists ? prev.days.filter((d) => d !== day) : [...prev.days, day];
      const updated = { ...prev, days: nextDays };
      saveAllConfig({ quietHours: updated }, `Quiet Hours days updated`);
      return updated;
    });
  };

  // Handle Grooming Package Add / Edit
  const handleSavePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle || pkgBundlePrice <= 0) return;

    const savings = Math.max(0, pkgOriginalTotal - pkgBundlePrice);

    if (editingPackageId) {
      setPackages((prev) => {
        const next = prev.map((p) =>
          p.id === editingPackageId
            ? {
                ...p,
                title: pkgTitle,
                subtitle: pkgSubtitle,
                includedServices: pkgIncludedServices,
                originalTotal: pkgOriginalTotal,
                bundlePrice: pkgBundlePrice,
                savingsAmount: savings,
                badge: pkgBadge,
              }
            : p
        );
        saveAllConfig({ groomingPackages: next }, `Package "${pkgTitle}" updated!`);
        return next;
      });
    } else {
      const newPkg: GroomingPackage = {
        id: `pkg-${Date.now()}`,
        title: pkgTitle,
        subtitle: pkgSubtitle,
        includedServices: pkgIncludedServices,
        originalTotal: pkgOriginalTotal,
        bundlePrice: pkgBundlePrice,
        savingsAmount: savings,
        badge: pkgBadge,
        isActive: true,
      };
      setPackages((prev) => {
        const next = [newPkg, ...prev];
        saveAllConfig({ groomingPackages: next }, `New package "${pkgTitle}" added!`);
        return next;
      });
    }

    setShowPackageModal(false);
  };

  const handleDeletePackage = (pkgId: string) => {
    setPackages((prev) => {
      const next = prev.filter((p) => p.id !== pkgId);
      saveAllConfig({ groomingPackages: next }, 'Package removed');
      return next;
    });
  };

  const handleTogglePackageStatus = (pkgId: string) => {
    setPackages((prev) => {
      const next = prev.map((p) => (p.id === pkgId ? { ...p, isActive: !p.isActive } : p));
      saveAllConfig({ groomingPackages: next }, 'Package status toggled');
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner: Salon Growth & Revenue Command Center */}
      <div className="bg-gradient-to-br from-[#1C110A] via-[#2A160D] to-[#120804] text-white p-5 sm:p-6 rounded-3xl border border-amber-900/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-amber-500/15 via-orange-600/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-bold flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 fill-stone-950" />
                Revenue Accelerator
              </span>
              <span className="text-xs text-amber-300/90 font-semibold">
                Salon Owner Growth Tools
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Offers, Rewards & Revenue Engine
            </h3>
            <p className="text-xs text-stone-300 max-w-xl mt-1 leading-relaxed">
              Fill empty weekday chairs, drive repeat bookings with digital stamps, automate WhatsApp retention nudges, and sell high-margin grooming combos.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setQuietHours(DEFAULT_SALON_MARKETING_CONFIG.quietHours);
                setLoyalty(DEFAULT_SALON_MARKETING_CONFIG.loyaltyProgram);
                setRepeatVisit(DEFAULT_SALON_MARKETING_CONFIG.repeatVisit);
                setUpsell(DEFAULT_SALON_MARKETING_CONFIG.premiumUpsell);
                setPackages(DEFAULT_SALON_MARKETING_CONFIG.groomingPackages);
                saveAllConfig(DEFAULT_SALON_MARKETING_CONFIG, 'Turnkey defaults restored!');
              }}
              className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5 text-stone-400" />
              <span>Load Best-Practice Presets</span>
            </button>
          </div>
        </div>

        {/* 5 Growth Levers KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-5 pt-5 border-t border-stone-800/80 text-xs">
          <div className="p-2.5 rounded-2xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Quiet Hours
            </span>
            <div className="text-sm font-black text-white mt-0.5">
              {quietHours.enabled ? `${quietHours.discountValue}% OFF Mon-Thu` : 'Disabled'}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" /> VIP Loyalty
            </span>
            <div className="text-sm font-black text-white mt-0.5">
              {loyalty.enabled ? `Visit ${loyalty.visitsRequired}: ${loyalty.rewardValue}% OFF` : 'Disabled'}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Re-Visit Cadence
            </span>
            <div className="text-sm font-black text-white mt-0.5">
              {repeatVisit.enabled ? `${repeatVisit.targetDays} Days / ₹${repeatVisit.incentiveDiscount} Off` : 'Disabled'}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-400" /> VIP Upsell
            </span>
            <div className="text-sm font-black text-white mt-0.5">
              {upsell.enabled ? `De-Tan @ ₹${upsell.upsellPrice}` : 'Disabled'}
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-stone-900/80 border border-stone-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-stone-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-400" /> Combos Live
            </span>
            <div className="text-sm font-black text-white mt-0.5">
              {packages.filter((p) => p.isActive).length} Active Suites
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-stone-200">
        {[
          { id: 'quiet-hours' as const, label: '⚡ Quiet Hours Promo', desc: 'Off-peak weekdays' },
          { id: 'loyalty' as const, label: '⭐ Loyalty Stamp Card', desc: '5th visit reward' },
          { id: 'repeat-visits' as const, label: '🔁 Repeat Visit Win-Back', desc: '21-day retention' },
          { id: 'upsell' as const, label: '💎 Premium Upsell Prompts', desc: 'De-Tan & Keratin' },
          { id: 'packages' as const, label: '📦 Bundled Grooming Combos', desc: 'High-ticket suites' },
          { id: 'spin-vouchers' as const, label: '🎰 Spin Wheel & Vouchers', desc: 'Promo codes' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all text-left cursor-pointer flex flex-col ${
                isActive
                  ? 'bg-[#C85322] text-white shadow-md shadow-orange-950/20 font-black'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] font-normal ${isActive ? 'text-amber-200' : 'text-stone-400'}`}>
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. SUB-TAB 1: QUIET HOURS & WEEKDAY PROMOTIONS */}
      {activeTab === 'quiet-hours' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h4 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Weekday Quiet Hours Promotion (Happy Hours)
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Automatically discount walk-ins during slow hours to fill idle barbers and maximize chair utilization.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...quietHours, enabled: !quietHours.enabled };
                  setQuietHours(updated);
                  saveAllConfig({ quietHours: updated }, `Quiet Hours promotion ${updated.enabled ? 'Enabled' : 'Paused'}`);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                  quietHours.enabled
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-stone-100 text-stone-500 border border-stone-300'
                }`}
              >
                {quietHours.enabled ? '✓ Promotion Active' : 'Promotion Paused'}
              </button>
            </div>

            {/* Target Days Selector */}
            <div>
              <label className="text-xs font-bold text-stone-800 mb-2 block">
                Target Days (Low footfall weekdays)
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {WEEKDAYS.map((d) => {
                  const isSelected = quietHours.days.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleQuietDay(d.id)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-xs'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {d.id}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Window */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Quiet Hours Start Time
                </label>
                <input
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) => {
                    const updated = { ...quietHours, startTime: e.target.value };
                    setQuietHours(updated);
                    saveAllConfig({ quietHours: updated });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Quiet Hours End Time
                </label>
                <input
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) => {
                    const updated = { ...quietHours, endTime: e.target.value };
                    setQuietHours(updated);
                    saveAllConfig({ quietHours: updated });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Discount Value */}
            <div>
              <label className="text-xs font-bold text-stone-800 mb-2 block">
                Off-Peak Discount Value:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[10, 15, 20, 25, 30].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...quietHours,
                        discountValue: val,
                        badgeText: `⚡ Quiet Hours Flash Deal: ${val}% OFF ${quietHours.days.join('-')} ${quietHours.startTime}-${quietHours.endTime}`,
                      };
                      setQuietHours(updated);
                      saveAllConfig({ quietHours: updated });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition ${
                      quietHours.discountValue === val
                        ? 'bg-[#C85322] text-white border-[#C85322]'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {val}% OFF
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Customer Badge Text */}
            <div>
              <label className="text-xs font-bold text-stone-800 mb-1 block">
                Customer Live Queue Banner Text
              </label>
              <input
                type="text"
                value={quietHours.badgeText}
                onChange={(e) => {
                  const updated = { ...quietHours, badgeText: e.target.value };
                  setQuietHours(updated);
                }}
                onBlur={() => saveAllConfig({ quietHours }, 'Banner updated!')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Customer Live Preview */}
          <div className="space-y-4">
            <div className="bg-stone-900 text-white rounded-3xl p-5 border border-stone-800 shadow-xl space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Live Customer Screen Preview
              </span>
              <p className="text-xs text-stone-400 leading-snug">
                This is how nearby customers see your studio on their phone during quiet hours:
              </p>

              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 border border-amber-500/40 text-amber-200 flex items-start gap-2.5">
                <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black text-amber-300">
                    {quietHours.enabled ? quietHours.badgeText : '⚡ Quiet Hours (Currently Off)'}
                  </div>
                  <p className="text-[11px] text-stone-300 mt-0.5">
                    Walk in right now without waiting and enjoy {quietHours.discountValue}% off your total service!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-stone-400 text-xs">
                <span className="text-white font-bold">Why it works:</span> Turns zero-revenue idle chair hours into paying walk-in traffic without cutting weekend rates.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUB-TAB 2: DIGITAL LOYALTY REWARDS (STAMP CARD) */}
      {activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h4 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  Digital Loyalty Rewards Program (Stamp Card)
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Customers collect a digital stamp every time they visit. On their target visit, they unlock a generous discount or free grooming perk.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...loyalty, enabled: !loyalty.enabled };
                  setLoyalty(updated);
                  saveAllConfig({ loyaltyProgram: updated }, `Loyalty program ${updated.enabled ? 'Enabled' : 'Paused'}`);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                  loyalty.enabled
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-stone-100 text-stone-500 border border-stone-300'
                }`}
              >
                {loyalty.enabled ? '✓ Loyalty Active' : 'Loyalty Paused'}
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-800 mb-1 block">
                Loyalty Program Name
              </label>
              <input
                type="text"
                value={loyalty.programName}
                onChange={(e) => setLoyalty({ ...loyalty, programName: e.target.value })}
                onBlur={() => saveAllConfig({ loyaltyProgram: loyalty })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-800 mb-2 block">
                  Visits Required to Unlock Reward:
                </label>
                <div className="flex items-center gap-2">
                  {[4, 5, 6, 8, 10].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        const updated = { ...loyalty, visitsRequired: v };
                        setLoyalty(updated);
                        saveAllConfig({ loyaltyProgram: updated });
                      }}
                      className={`w-10 h-10 rounded-xl text-xs font-black border transition ${
                        loyalty.visitsRequired === v
                          ? 'bg-[#C85322] text-white border-[#C85322]'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Minimum Bill Per Visit to Earn Stamp (₹)
                </label>
                <input
                  type="number"
                  value={loyalty.minSpendPerVisit}
                  onChange={(e) => {
                    const updated = { ...loyalty, minSpendPerVisit: Number(e.target.value) || 0 };
                    setLoyalty(updated);
                  }}
                  onBlur={() => saveAllConfig({ loyaltyProgram: loyalty })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-800 mb-2 block">
                Reward on Target Visit:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: '50% OFF Haircut', val: 50, type: 'percentage' as const },
                  { label: '100% Free Haircut', val: 100, type: 'percentage' as const },
                  { label: 'Free Beard Styling', val: 'Free Beard', type: 'free_service' as const },
                  { label: 'Flat ₹150 Credit', val: 150, type: 'flat' as const },
                ].map((rew, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...loyalty,
                        rewardType: rew.type,
                        rewardValue: rew.val,
                      };
                      setLoyalty(updated);
                      saveAllConfig({ loyaltyProgram: updated });
                    }}
                    className={`p-2.5 text-center rounded-xl text-xs font-bold border transition ${
                      loyalty.rewardValue === rew.val
                        ? 'bg-amber-500 text-stone-950 border-amber-500 font-black'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {rew.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Digital Stamp Card Visualizer */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-stone-950 via-[#1C120B] to-stone-950 text-white rounded-3xl p-5 border border-amber-600/40 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Customer Digital Stamp Card
                </span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  SLOON VIP
                </span>
              </div>

              <div>
                <h5 className="text-base font-black text-white">{loyalty.programName}</h5>
                <p className="text-xs text-stone-300 mt-0.5">
                  Collect {loyalty.visitsRequired} stamps to unlock {loyalty.rewardValue}% OFF!
                </p>
              </div>

              {/* The Stamp Slots */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {Array.from({ length: loyalty.visitsRequired }).map((_, idx) => {
                  const isEarned = idx < 3; // Demo: 3 of 5 stamped
                  const isFinal = idx === loyalty.visitsRequired - 1;
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-1 border transition-all ${
                        isEarned
                          ? 'bg-amber-500 border-amber-400 text-stone-950 shadow-md shadow-amber-500/30 font-black'
                          : isFinal
                          ? 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
                          : 'bg-stone-900 border-stone-800 text-stone-600'
                      }`}
                    >
                      {isEarned ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 fill-stone-950 text-amber-500" />
                          <span className="text-[9px] font-extrabold mt-0.5">#{idx + 1}</span>
                        </>
                      ) : isFinal ? (
                        <>
                          <Gift className="w-4 h-4 text-rose-400" />
                          <span className="text-[9px] font-bold mt-0.5">REWARD</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-stone-600">#{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-stone-800/80 text-[11px] text-stone-400 flex items-center justify-between">
                <span>Earned on bills above ₹{loyalty.minSpendPerVisit}</span>
                <span className="text-amber-400 font-bold">2 stamps left!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB 3: REPEAT VISITS & CUSTOMER RETENTION (WIN-BACK ENGINE) */}
      {activeTab === 'repeat-visits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h4 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Repeat Visits & Win-Back Automation
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Men haircut cycles average 21-25 days. Encourage punctual return visits with timed perks and re-engage lapsed customers before they switch salons.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...repeatVisit, enabled: !repeatVisit.enabled };
                  setRepeatVisit(updated);
                  saveAllConfig({ repeatVisit: updated }, `Repeat visit automation ${updated.enabled ? 'Enabled' : 'Paused'}`);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                  repeatVisit.enabled
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-stone-100 text-stone-500 border border-stone-300'
                }`}
              >
                {repeatVisit.enabled ? '✓ Retention Active' : 'Retention Paused'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Phase 1: Punctual Re-Visit Perk
                </span>
                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    Ideal Haircut Cadence (Days)
                  </label>
                  <input
                    type="number"
                    value={repeatVisit.targetDays}
                    onChange={(e) => {
                      const updated = { ...repeatVisit, targetDays: Number(e.target.value) || 21 };
                      setRepeatVisit(updated);
                    }}
                    onBlur={() => saveAllConfig({ repeatVisit })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    Discount for Returning Within {repeatVisit.targetDays} Days (₹)
                  </label>
                  <input
                    type="number"
                    value={repeatVisit.incentiveDiscount}
                    onChange={(e) => {
                      const updated = { ...repeatVisit, incentiveDiscount: Number(e.target.value) || 50 };
                      setRepeatVisit(updated);
                    }}
                    onBlur={() => saveAllConfig({ repeatVisit })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                  Phase 2: Lapsed Customer Win-Back
                </span>
                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    Lapsed Threshold (Days without visit)
                  </label>
                  <input
                    type="number"
                    value={repeatVisit.winbackLapsedDays}
                    onChange={(e) => {
                      const updated = { ...repeatVisit, winbackLapsedDays: Number(e.target.value) || 35 };
                      setRepeatVisit(updated);
                    }}
                    onBlur={() => saveAllConfig({ repeatVisit })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    Win-Back Voucher Value (₹)
                  </label>
                  <input
                    type="number"
                    value={repeatVisit.winbackDiscount}
                    onChange={(e) => {
                      const updated = { ...repeatVisit, winbackDiscount: Number(e.target.value) || 100 };
                      setRepeatVisit(updated);
                    }}
                    onBlur={() => saveAllConfig({ repeatVisit })}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-800 mb-1 block">
                WhatsApp Retention Message Template
              </label>
              <textarea
                rows={3}
                value={repeatVisit.reminderWhatsAppTemplate}
                onChange={(e) => setRepeatVisit({ ...repeatVisit, reminderWhatsAppTemplate: e.target.value })}
                onBlur={() => saveAllConfig({ repeatVisit })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Variables: &#123;name&#125;, &#123;salon&#125;, &#123;days&#125;, &#123;discount&#125; are replaced automatically.
              </span>
            </div>
          </div>

          {/* 1-Tap WhatsApp Broadcast Re-engagement Box */}
          <div className="space-y-4">
            <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 shadow-2xs space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-emerald-600" />
                1-Tap WhatsApp Retention Broadcast
              </span>
              <p className="text-xs text-stone-500">
                Test the message format or send an instant reminder to a client:
              </p>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={demoCustomerName}
                  onChange={(e) => setDemoCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                />
                <input
                  type="tel"
                  placeholder="Customer Phone"
                  value={demoCustomerPhone}
                  onChange={(e) => setDemoCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const msg = repeatVisit.reminderWhatsAppTemplate
                    .replace('{name}', demoCustomerName)
                    .replace('{salon}', activeSalon.name)
                    .replace('{days}', String(repeatVisit.targetDays))
                    .replace('{discount}', String(repeatVisit.incentiveDiscount));
                  const phone = demoCustomerPhone.replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
              >
                <Share2 className="w-3.5 h-3.5" />
                Send Test via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-TAB 4: PREMIUM SERVICE UPSELL & UPGRADES */}
      {activeTab === 'upsell' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <h4 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  Premium Service Upsell & VIP Upgrade Prompts
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  When a customer books a standard haircut, proactively prompt them with high-margin luxury add-ons (Charcoal De-Tan, Keratin Spa, Beard Revival) at an irresistible upgrade price.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = { ...upsell, enabled: !upsell.enabled };
                  setUpsell(updated);
                  saveAllConfig({ premiumUpsell: updated }, `Upsell prompts ${updated.enabled ? 'Enabled' : 'Paused'}`);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition ${
                  upsell.enabled
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-stone-100 text-stone-500 border border-stone-300'
                }`}
              >
                {upsell.enabled ? '✓ Upsell Active' : 'Upsell Paused'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Base Trigger Service
                </label>
                <input
                  type="text"
                  value={upsell.triggerServiceName}
                  onChange={(e) => setUpsell({ ...upsell, triggerServiceName: e.target.value })}
                  onBlur={() => saveAllConfig({ premiumUpsell: upsell })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Featured Premium Upgrade Add-On
                </label>
                <input
                  type="text"
                  value={upsell.upsellServiceName}
                  onChange={(e) => setUpsell({ ...upsell, upsellServiceName: e.target.value })}
                  onBlur={() => saveAllConfig({ premiumUpsell: upsell })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Regular Standalone Price (₹)
                </label>
                <input
                  type="number"
                  value={upsell.originalPrice}
                  onChange={(e) => setUpsell({ ...upsell, originalPrice: Number(e.target.value) || 0 })}
                  onBlur={() => saveAllConfig({ premiumUpsell: upsell })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Special Add-On Upgrade Price (₹)
                </label>
                <input
                  type="number"
                  value={upsell.upsellPrice}
                  onChange={(e) => {
                    const price = Number(e.target.value) || 0;
                    const updated = {
                      ...upsell,
                      upsellPrice: price,
                      headline: `Upgrade to ${upsell.upsellServiceName} for ₹${price} (Save ₹${Math.max(0, upsell.originalPrice - price)}!)`,
                    };
                    setUpsell(updated);
                  }}
                  onBlur={() => saveAllConfig({ premiumUpsell: upsell })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-black text-rose-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-800 mb-1 block">
                Upsell Call-To-Action Headline
              </label>
              <input
                type="text"
                value={upsell.headline}
                onChange={(e) => setUpsell({ ...upsell, headline: e.target.value })}
                onBlur={() => saveAllConfig({ premiumUpsell: upsell })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-900"
              />
            </div>
          </div>

          {/* Upsell Dialog Preview */}
          <div className="space-y-4">
            <div className="bg-stone-950 text-white rounded-3xl p-5 border border-rose-900/40 shadow-xl space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">
                Customer Queue Upsell Prompt
              </span>
              <p className="text-xs text-stone-400 leading-snug">
                Shown to customer when they tap "Join Walk-In Queue":
              </p>

              <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                      VIP Add-On Deal
                    </span>
                    <h5 className="text-sm font-black text-white mt-1">{upsell.headline}</h5>
                    <p className="text-[11px] text-stone-400 mt-0.5">{upsell.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800">
                  <div>
                    <span className="text-xs text-stone-500 line-through">₹{upsell.originalPrice}</span>
                    <span className="text-sm font-black text-rose-400 ml-1.5">₹{upsell.upsellPrice}</span>
                  </div>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[11px] font-black"
                  >
                    + Add to Haircut
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB 5: BUNDLED GROOMING PACKAGES (COMBOS) */}
      {activeTab === 'packages' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E8E2D8] rounded-3xl p-5 shadow-2xs">
            <div>
              <h4 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Bundled Grooming Packages & Combos
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Bundle 3 or more services into high-ticket suites. Customers love the bundled savings, and your average ticket value increases by 40-70%.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingPackageId(null);
                setPkgTitle('');
                setPkgSubtitle('');
                setPkgIncludedServices(['Master Haircut & Style', 'Precision Beard Fade', 'Hot Steamed Towel']);
                setPkgOriginalTotal(650);
                setPkgBundlePrice(449);
                setPkgBadge('Best Value');
                setShowPackageModal(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-[#C85322] hover:bg-[#b04518] text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-orange-950/20 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Grooming Combo</span>
            </button>
          </div>

          {/* Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-[#E8E2D8] rounded-3xl p-5 shadow-2xs flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {pkg.badge || 'Combo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTogglePackageStatus(pkg.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        pkg.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-stone-100 text-stone-500 border-stone-300'
                      }`}
                    >
                      {pkg.isActive ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <h5 className="text-base font-black text-stone-900 mt-2">{pkg.title}</h5>
                  <p className="text-xs text-stone-500 mt-0.5">{pkg.subtitle}</p>

                  <div className="mt-3 pt-3 border-t border-stone-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-stone-600 block">
                      Included Services:
                    </span>
                    {pkg.includedServices.map((svc, i) => (
                      <div key={i} className="text-xs text-stone-700 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{svc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-stone-400 line-through">₹{pkg.originalTotal}</span>
                    <div className="text-lg font-black text-[#C85322]">₹{pkg.bundlePrice}</div>
                    <span className="text-[10px] font-bold text-emerald-700">
                      Save ₹{pkg.savingsAmount}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPackageId(pkg.id);
                        setPkgTitle(pkg.title);
                        setPkgSubtitle(pkg.subtitle);
                        setPkgIncludedServices(pkg.includedServices);
                        setPkgOriginalTotal(pkg.originalTotal);
                        setPkgBundlePrice(pkg.bundlePrice);
                        setPkgBadge(pkg.badge || 'Best Value');
                        setShowPackageModal(true);
                      }}
                      className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                      title="Edit Package"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Package"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. SUB-TAB 6: SPIN-THE-WHEEL & PROMO VOUCHERS */}
      {activeTab === 'spin-vouchers' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  Spin-the-Wheel VIP Offers & Promo Codes
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Vouchers enabled with "Spin Wheel" appear on the customer fortune prize wheel and can be won every 15 days.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {salonOffers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono font-black text-xs text-[#C85322] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                        {offer.code}
                      </span>
                      <h5 className="text-sm font-black text-stone-900 mt-1">{offer.title}</h5>
                      <p className="text-xs text-stone-500 mt-0.5">{offer.description}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">
                      {offer.discountType === 'percentage'
                        ? `${offer.discountValue}% OFF`
                        : `Flat ₹${offer.discountValue} OFF`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = salonOffers.map((o) =>
                          o.id === offer.id ? { ...o, inSpinWheel: !o.inSpinWheel } : o
                        );
                        onUpdateOffers(updated);
                        triggerNotification(`Offer ${offer.code} wheel status updated.`);
                      }}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                        offer.inSpinWheel
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-stone-100 text-stone-500 border-stone-300'
                      }`}
                    >
                      {offer.inSpinWheel ? '🎰 On Spin Wheel' : 'Standard Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Package Creator / Editor Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h4 className="text-base font-black text-stone-900">
                {editingPackageId ? 'Edit Grooming Package' : 'Create New Grooming Combo'}
              </h4>
              <button
                type="button"
                onClick={() => setShowPackageModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Combo Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Gentleman Suite"
                  value={pkgTitle}
                  onChange={(e) => setPkgTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Subtitle / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Complete hair, beard, hot towel & massage"
                  value={pkgSubtitle}
                  onChange={(e) => setPkgSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-800 mb-1 block">
                  Included Services (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Haircut, Beard Styling, Steamed Towel, Head Wash"
                  value={pkgIncludedServices.join(', ')}
                  onChange={(e) =>
                    setPkgIncludedServices(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    Total Normal Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={pkgOriginalTotal}
                    onChange={(e) => setPkgOriginalTotal(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-800 mb-1 block">
                    Bundle Offer Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={pkgBundlePrice}
                    onChange={(e) => setPkgBundlePrice(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs font-black text-[#C85322]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs flex items-center justify-between text-orange-900 font-bold">
                <span>Customer Savings:</span>
                <span className="text-sm font-black text-[#C85322]">
                  Save ₹{Math.max(0, pkgOriginalTotal - pkgBundlePrice)} (
                  {pkgOriginalTotal > 0
                    ? Math.round(((pkgOriginalTotal - pkgBundlePrice) / pkgOriginalTotal) * 100)
                    : 0}
                  % OFF)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#C85322] hover:bg-[#b04518] text-white font-black text-xs shadow-md"
                >
                  Save Combo Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
