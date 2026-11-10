// ==============================================================================
// @kumbhakaran/shared-types - Platform-Wide Common Types & Invariants
// ==============================================================================

export interface LocationOption {
  name: string;
  lat: number;
  lng: number;
}

export interface Service {
  id: string;
  name: string;
  category: 'Hair' | 'Beard' | 'Combos' | 'Spa' | 'Facial' | 'Color';
  price: number;
  durationMinutes: number;
  isAvailable: boolean;
  description: string;
  popular?: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  experience: string;
  photo: string;
  specialties: string[];
  status: 'active' | 'break' | 'off';
  rating: number;
}

export interface ReviewCriteria {
  haircutQuality: number;
  staffBehaviour: number;
  cleanliness: number;
  pricing: number;
  overallExperience: number;
}

export interface Review {
  id: string;
  customerName: string;
  customerAvatar: string;
  rating: number;
  date: string;
  comment: string;
  verifiedVisit: boolean;
  criteria?: ReviewCriteria;
  flagged?: boolean;
  ownerReply?: {
    comment: string;
    date: string;
  };
}

export interface SalonMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  category: 'location' | 'work' | 'poster';
  title?: string;
  tag?: string;
  thumbnailUrl?: string;
  uploadedAt?: string;
}

export type SalonType = 'unisex' | 'men' | 'women';

// ==============================================================================
// Unified Beauty & Grooming Provider Archetypes & Service Modes
// ==============================================================================

/** The 4 Core Provider Archetypes in the Sloon Ecosystem */
export type ProviderType =
  | 'traditional_salon' // Established physical salon with storefront & staff
  | 'home_studio'       // Professional operating from residential studio premises
  | 'freelance_pro'     // Mobile freelancer traveling to client residences
  | 'independent_pro';  // Senior independent stylist offering studio and/or home visits

/** The 3 Omnichannel Service Modes */
export type ServiceMode =
  | 'at_salon'     // Customer visits physical salon (live walk-in queue + appointments)
  | 'home_visit'   // Stylist visits customer's residence (Sloon Home)
  | 'studio_visit'; // Customer visits private residential studio

export interface ProviderCapability {
  hasPhysicalStorefront: boolean;
  hasWalkInQueue: boolean;
  hasAppointments: boolean;
  hasHomeVisits: boolean;
  requiresAddressPrivacy: boolean;
  canConfigureTravelFee: boolean;
  canManageStaff: boolean;
}

export function getProviderCapabilities(
  providerType: ProviderType = 'traditional_salon',
  serviceModes: ServiceMode[] = ['at_salon']
): ProviderCapability {
  const isSalon = providerType === 'traditional_salon';
  const isHomeStudio = providerType === 'home_studio';
  const isFreelance = providerType === 'freelance_pro';
  const isIndependent = providerType === 'independent_pro';

  return {
    hasPhysicalStorefront: isSalon,
    hasWalkInQueue: isSalon && serviceModes.includes('at_salon'),
    hasAppointments: isHomeStudio || isIndependent || serviceModes.includes('studio_visit'),
    hasHomeVisits: serviceModes.includes('home_visit') || isFreelance,
    requiresAddressPrivacy: isHomeStudio || isIndependent,
    canConfigureTravelFee: serviceModes.includes('home_visit') || isFreelance,
    canManageStaff: isSalon,
  };
}

export interface SalonOffer {
  id: string;
  salonId?: string;
  title: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat' | 'free_service';
  discountValue: number;
  minSpend?: number;
  validTill?: string;
  inSpinWheel: boolean;
  color?: string;
  isActive: boolean;
}

export const DEFAULT_SALON_OFFERS: SalonOffer[] = [
  {
    id: 'off-1',
    title: '20% OFF on Haircut & Style',
    code: 'SLOON20',
    description: 'Valid on master haircut and beard styling combos.',
    discountType: 'percentage',
    discountValue: 20,
    minSpend: 250,
    validTill: 'Valid all week',
    inSpinWheel: true,
    color: '#FF6422',
    isActive: true,
  },
  {
    id: 'off-2',
    title: 'Flat ₹100 OFF on Total Bill',
    code: 'FLAT100',
    description: 'Get instant ₹100 off on any grooming service above ₹499.',
    discountType: 'flat',
    discountValue: 100,
    minSpend: 499,
    validTill: 'Valid all month',
    inSpinWheel: true,
    color: '#059669',
    isActive: true,
  },
  {
    id: 'off-3',
    title: 'Free Beard Sculpt & Oil',
    code: 'FREEBEARD',
    description: 'Complimentary beard trim and beard hot oil with any premium hair service.',
    discountType: 'free_service',
    discountValue: 0,
    minSpend: 350,
    validTill: 'Valid Mon-Thu',
    inSpinWheel: true,
    color: '#D97706',
    isActive: true,
  },
  {
    id: 'off-4',
    title: '15% OFF Deep Facial / Spa',
    code: 'GLOW15',
    description: 'Refresh and relax with 15% discount on detan, face cleanup or head massage.',
    discountType: 'percentage',
    discountValue: 15,
    minSpend: 400,
    validTill: 'Valid all days',
    inSpinWheel: true,
    color: '#7C3AED',
    isActive: true,
  },
  {
    id: 'off-5',
    title: 'JACKPOT: 50% OFF Haircut',
    code: 'JACKPOT50',
    description: 'Lucky winner special: Half-price on any signature haircut today!',
    discountType: 'percentage',
    discountValue: 50,
    minSpend: 200,
    validTill: 'Same day only',
    inSpinWheel: true,
    color: '#DC2626',
    isActive: true,
  },
  {
    id: 'off-6',
    title: 'Flat ₹50 Instant Voucher',
    code: 'SAVE50',
    description: 'Direct ₹50 discount for your walk-in chair visit today.',
    discountType: 'flat',
    discountValue: 50,
    minSpend: 200,
    validTill: 'Valid today',
    inSpinWheel: true,
    color: '#2563EB',
    isActive: true,
  },
];

// ==============================================================================
// Salon Growth & Revenue Marketing Engine (Partner Portal Configuration)
// ==============================================================================

/** 1. Weekday Happy Hours / Quiet Hours Promotions */
export interface QuietHoursPromotion {
  enabled: boolean;
  days: string[]; // ['Mon', 'Tue', 'Wed', 'Thu']
  startTime: string; // '11:00'
  endTime: string;   // '16:00'
  discountType: 'percentage' | 'flat';
  discountValue: number; // 20 (%) or 100 (₹)
  badgeText: string;
  autoApplyInQueue: boolean;
}

/** 2. Digital Loyalty Rewards (Stamp Card) */
export interface LoyaltyProgramConfig {
  enabled: boolean;
  visitsRequired: number; // e.g. 5
  rewardType: 'percentage' | 'flat' | 'free_service';
  rewardValue: string | number; // e.g. '50% OFF' or 'Free Beard Sculpting'
  minSpendPerVisit: number; // e.g. 150
  programName: string;
  terms: string;
}

/** 3. Repeat Visit & Customer Retention Win-Back Engine */
export interface RepeatVisitConfig {
  enabled: boolean;
  targetDays: number; // Return within e.g. 21 days
  incentiveDiscount: number; // ₹50 or 15%
  winbackLapsedDays: number; // Missed return after e.g. 35 days
  winbackDiscount: number; // ₹100 or 25% off
  reminderWhatsAppTemplate: string;
}

/** 4. Premium Service Upsell & VIP Upgrade Prompts */
export interface PremiumUpsellConfig {
  enabled: boolean;
  triggerServiceName: string; // e.g. 'Haircut & Styling'
  upsellServiceName: string;  // e.g. 'Activated Charcoal De-Tan'
  originalPrice: number;      // e.g. 600
  upsellPrice: number;        // e.g. 299
  headline: string;           // e.g. 'Add Charcoal De-Tan for ₹299 (Save 50%)'
  description: string;
}

/** 5. Bundled Grooming Packages & Combos */
export interface GroomingPackage {
  id: string;
  title: string;
  subtitle: string;
  includedServices: string[];
  originalTotal: number;
  bundlePrice: number;
  savingsAmount: number;
  badge?: string; // 'Best Value' | 'Most Popular' | 'Weekend Special'
  isActive: boolean;
}

export interface SalonMarketingConfig {
  quietHours: QuietHoursPromotion;
  loyaltyProgram: LoyaltyProgramConfig;
  repeatVisit: RepeatVisitConfig;
  premiumUpsell: PremiumUpsellConfig;
  groomingPackages: GroomingPackage[];
}

export const DEFAULT_SALON_MARKETING_CONFIG: SalonMarketingConfig = {
  quietHours: {
    enabled: true,
    days: ['Mon', 'Tue', 'Wed', 'Thu'],
    startTime: '11:00',
    endTime: '16:00',
    discountType: 'percentage',
    discountValue: 20,
    badgeText: '⚡ Quiet Hours Flash Deal: 20% OFF Mon-Thu 11am-4pm',
    autoApplyInQueue: true,
  },
  loyaltyProgram: {
    enabled: true,
    visitsRequired: 5,
    rewardType: 'percentage',
    rewardValue: 50,
    minSpendPerVisit: 150,
    programName: 'SLOON VIP Club: Every 5th Visit 50% OFF',
    terms: 'Valid on haircut and styling services. Digital stamp awarded automatically upon bill completion.',
  },
  repeatVisit: {
    enabled: true,
    targetDays: 21,
    incentiveDiscount: 50,
    winbackLapsedDays: 35,
    winbackDiscount: 100,
    reminderWhatsAppTemplate: 'Hi {name}! Your fresh look from {salon} is due for a touch-up. Visit within {days} days to enjoy ₹{discount} OFF your haircut!',
  },
  premiumUpsell: {
    enabled: true,
    triggerServiceName: 'Haircut & Styling',
    upsellServiceName: 'Charcoal De-Tan Facial Cleanse',
    originalPrice: 600,
    upsellPrice: 299,
    headline: 'Upgrade to Charcoal De-Tan for ₹299 (Save ₹301!)',
    description: 'Deep pore detox, blackhead removal & instant sun-tan clearance paired with your haircut.',
  },
  groomingPackages: [
    {
      id: 'pkg-1',
      title: 'The Executive Gentleman Suite',
      subtitle: 'Complete hair, beard, hot steamed towel & relaxing scalp revive',
      includedServices: ['Master Haircut & Style', 'Precision Beard Fade & Lineup', 'Hot Steamed Peppermint Towel', 'Ayurvedic Scalp Massage'],
      originalTotal: 750,
      bundlePrice: 499,
      savingsAmount: 251,
      badge: 'Best Value',
      isActive: true,
    },
    {
      id: 'pkg-2',
      title: 'Wedding & Celebration Ready Combo',
      subtitle: 'Head-to-toe festive grooming for parties, receptions & groom entourage',
      includedServices: ['Skin Fade Haircut', 'Charcoal De-Tan Facial Cleanse', 'Beard Styling & Razor Finish', 'Deep Nourish Hair Spa'],
      originalTotal: 1400,
      bundlePrice: 899,
      savingsAmount: 501,
      badge: 'Most Popular',
      isActive: true,
    },
    {
      id: 'pkg-3',
      title: 'Father & Son Weekend Cut Duo',
      subtitle: 'Two signature haircuts with beard grooming and fun junior styling',
      includedServices: ['2x Master Haircuts', '1x Beard Shaping & Trim', '2x Relaxing Head Wash & Blowdry'],
      originalTotal: 900,
      bundlePrice: 599,
      savingsAmount: 301,
      badge: 'Family Saver',
      isActive: true,
    },
  ],
};

export interface Salon {
  id: string;
  name: string;
  tagline: string;
  salonType?: SalonType;
  coverImage: string;
  posterImage?: string;
  loopVideoUrl?: string;
  images: string[];
  locationImages?: string[];
  workImages?: string[];
  mediaGallery?: SalonMediaItem[];
  rating: number;
  reviewCount: number;
  currentQueue: number;
  avgServiceTimeMinutes: number;
  estimatedWaitMinutes?: number;
  activeBarbers: number;
  distanceKm: number;
  startingPrice: number;
  isOpen: boolean;
  queueStatus?: 'open' | 'paused' | 'closed';
  openingHours: {
    open: string;
    close: string;
    formatted: string;
  };
  address: string;
  locality: string;
  city: string;
  state?: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone: string;
  email?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  ownerName?: string;
  ownerId?: string;
  lastQueueUpdate: string;
  services: Service[];
  staff: Staff[];
  offers?: SalonOffer[];
  ratingBreakdown: ReviewCriteria;
  reviews: Review[];
  featured?: boolean;
  isSponsored?: boolean;
  isVerified: boolean;
  status: 'active' | 'suspended' | 'pending';
  todayCustomersServed: number;
  todayRevenue: number;
  monthlyRevenue: number;
  queueStatusNote?: string;
  googlePlaceId?: string;
  googleReviewUrl?: string;
  hasHomeService?: boolean;
  homeServiceRadiusKm?: number;
  homeServiceMinOrder?: number;
  homeServiceCategories?: HomeVisitCategory[];
  marketingConfig?: SalonMarketingConfig;
  providerType?: ProviderType;
  serviceModes?: ServiceMode[];
  serviceRadiusKm?: number;
  baseTravelFee?: number;
  travelFeePerKm?: number;
  experienceYears?: number;
  qualifications?: string[];
  specializations?: string[];
  portfolioImages?: string[];
  approximateLocality?: string;
  cancellationPolicy?: string;
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
}

export interface SalonRegistrationInput {
  name: string;
  tagline?: string;
  salonType?: SalonType;
  providerType?: ProviderType;
  serviceModes?: ServiceMode[];
  serviceRadiusKm?: number;
  baseTravelFee?: number;
  experienceYears?: number;
  qualifications?: string[];
  specializations?: string[];
  approximateLocality?: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  googlePlaceId?: string;
  googleReviewUrl?: string;
  coverImage?: string;
  posterImage?: string;
  loopVideoUrl?: string;
  locationImages?: string[];
  workImages?: string[];
  openingHours: {
    open: string;
    close: string;
    formatted: string;
  };
  services: {
    name: string;
    category: 'Hair' | 'Beard' | 'Combos' | 'Spa' | 'Facial' | 'Color';
    price: number;
    durationMinutes: number;
    description: string;
  }[];
  activeBarbers: number;
  masterBarberName?: string;
}

export type LazyFilter = 'all' | '0-5' | '5-15' | '15-30' | '30+';

export type CustomerTab = 'home' | 'explore' | 'map' | 'favourites' | 'offers' | 'profile';

export type PartnerView =
  | 'overview'
  | 'home'
  | 'dashboard'
  | 'register'
  | 'live-queue'
  | 'services'
  | 'offers'
  | 'staff'
  | 'profile'
  | 'reviews'
  | 'analytics'
  | 'notifications'
  | 'billing'
  | 'settings'
  | 'help'
  | 'gallery'
  | 'doorstep';
export type OwnerTab = PartnerView;

export type AdminTab = 'overview' | 'salons' | 'customers' | 'verification' | 'reviews' | 'subscriptions' | 'analytics' | 'banners' | 'settings';

export interface HomeBanner {
  id: string;
  slot: number;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  targetUrl?: string;
  isActive: boolean;
}

export const DEFAULT_HOME_BANNERS: HomeBanner[] = [
  { id: 'slot-1', slot: 1, imageUrl: '', title: '', subtitle: '', targetUrl: '', isActive: true },
  { id: 'slot-2', slot: 2, imageUrl: '', title: '', subtitle: '', targetUrl: '', isActive: true },
  { id: 'slot-3', slot: 3, imageUrl: '', title: '', subtitle: '', targetUrl: '', isActive: true },
  { id: 'slot-4', slot: 4, imageUrl: '', title: '', subtitle: '', targetUrl: '', isActive: true },
];

export interface QueueEntry {
  id: string;
  salonId?: string;
  position: number;
  ticketNumber: string;
  customerName: string;
  phone?: string | null;
  serviceName?: string | null;
  status: 'waiting' | 'called' | 'in_service' | 'skipped' | 'no_show' | 'completed' | 'cancelled';
  joinedAt: string;
  servedAt?: string | null;
  deviceId?: string | null;
  userId?: string | null;
  partySize?: number;
  checkInMethod?: 'online' | 'qr' | string;
  arrivalConfirmedAt?: string | null;
  locationConsent?: boolean;
  departureDetectedAt?: string | null;
  departureReviewRequired?: boolean;
  queueAccessToken?: string;
}

export interface CustomerProfile {
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  savedSalons: string[];
  recentlyViewed: string[];
  patiencePreference: LazyFilter;
  preferredLocality: string;
  notifyOnShortQueue: boolean;
  queueAlertThreshold: number;
}

/**
 * Universal time formatting for durations and waiting times across all platforms (Customer, Partner, Admin).
 * Examples:
 *   190 -> "3 hr 10 min"
 *   60  -> "1 hr"
 *   120 -> "2 hr"
 *   45  -> "45 min"
 *   0   -> "0 min"
 */
export function formatDuration(minutes: number | string | null | undefined): string {
  const num = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  if (num == null || isNaN(num) || num <= 0) {
    return '0 min';
  }
  const total = Math.round(num);
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

export function formatWaitTime(minutes: number | string | null | undefined): string {
  const num = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  if (num == null || isNaN(num) || num <= 0) {
    return '0 min';
  }
  return `~${formatDuration(num)}`;
}

// ==============================================================================
// Doorstep Salon & Home Visit Service Types (Salon Industry Standard Taxonomy)
// ==============================================================================

export type HomeVisitCategory =
  | 'bridal'         // Bridal & Trousseau Styling
  | 'senior_care'    // Senior Citizen & Assisted Care (Geriatric Grooming)
  | 'kids'           // Kids & Toddlers Gentle Care (Pediatric Grooming)
  | 'mens_grooming'  // Men's Executive & Classic Grooming
  | 'womens_spa'     // Women's Salon, Spa & Esthetics
  | 'festive_group'; // Festive, Party & Group Makeovers

export interface HomeVisitCategoryMeta {
  id: HomeVisitCategory;
  title: string;
  subtitle: string;
  industryTag: string;
  badge: string;
  iconName: string;
  accentColor: string;
  gradient: string;
  description: string;
  hygieneGuarantees: string[];
}

export interface HomeVisitServiceItem {
  id: string;
  categoryId: HomeVisitCategory;
  name: string;
  tagline: string;
  price: number;
  durationMinutes: number;
  features: string[];
  hygieneKit: string;
  recommendedFor?: string;
  popular?: boolean;
}

export interface HomeVisitBookingRequest {
  id: string;
  salonId: string;
  salonName: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  category: HomeVisitCategory;
  categoryTitle: string;
  selectedServices: HomeVisitServiceItem[];
  scheduledDate: string; // YYYY-MM-DD
  timeSlot: string;      // e.g. "10:00 AM - 12:00 PM"
  specialInstructions?: string;
  specialCareRequirements?: string[]; // e.g. "Bed-Bound / Low-Mobility", "Low-Noise Clipper", "Diabetic Foot Care"
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'technician_assigned' | 'completed' | 'cancelled';
  technicianName?: string;
  technicianPhone?: string;
  createdAt: string;
}

export const HOME_VISIT_CATEGORIES: HomeVisitCategoryMeta[] = [
  {
    id: 'bridal',
    title: 'Bridal & Trousseau Styling',
    subtitle: 'High-Definition Bridal, Draping & Pre-Bridal Rituals',
    industryTag: 'Bridal & Trousseau Artistry',
    badge: 'Luxury Suite',
    iconName: 'Crown',
    accentColor: '#E11D48',
    gradient: 'from-rose-500 via-pink-600 to-rose-700',
    description: 'Bespoke bridal styling delivered to your residence or bridal suite. Includes premium HD cosmetics, luxury hair updos, and expert saree/dupatta draping.',
    hygieneGuarantees: ['100% Sealed Single-Use Brushes & Sponges', 'Sterilized Artistry Tools', 'Airbrushed Precision Hygiene'],
  },
  {
    id: 'senior_care',
    title: 'Senior Citizen & Assisted Care',
    subtitle: 'Gentle Grooming for Elders, Low-Mobility & Bed-Bound Loved Ones',
    industryTag: 'Geriatric & Assisted Grooming',
    badge: 'Compassionate Care',
    iconName: 'HeartHandshake',
    accentColor: '#059669',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    description: 'Patient, compassionate grooming performed by trained specialists for elders, bed-bound parents, or recovery patients in the comfort of their favorite chair or bed.',
    hygieneGuarantees: ['Ultra-Gentle Whisper Clippers', 'Diabetic-Safe Antiseptic Foot Care', 'Hospital-Grade Sanitized Gear'],
  },
  {
    id: 'kids',
    title: 'Kids & Toddlers Gentle Care',
    subtitle: 'Tear-Free First Haircuts, Mundan Ceremonies & Playful Styles',
    industryTag: 'Pediatric Hair Care',
    badge: 'Tear-Free Certified',
    iconName: 'Smile',
    accentColor: '#D97706',
    gradient: 'from-amber-500 via-orange-500 to-amber-700',
    description: 'Zero stress, zero tears. Our kid-whisperer barbers bring cartoon bibs, rounded safety blades, and patient soothing techniques right into your living room.',
    hygieneGuarantees: ['Rounded Safety Blade Shears', 'Hypoallergenic Baby Shampoo', 'Single-Use Colorful Cape'],
  },
  {
    id: 'mens_grooming',
    title: "Men's Executive Grooming",
    subtitle: 'Precision Fade, Hot Towel Beard Sculpting & Charcoal De-Tan',
    industryTag: "Gentleman's Doorstep Barber",
    badge: 'Executive Express',
    iconName: 'Scissors',
    accentColor: '#C85322',
    gradient: 'from-[#C85322] via-amber-700 to-stone-900',
    description: 'Transform your space into a high-end barbershop. Complete with cordless precision fades, beard geometry, hot steamed towels, and skin detox.',
    hygieneGuarantees: ['Fresh Disinfected Blades & Razors', 'Barbershop Floor Shield Mat', 'Vacuum Cleanup Guarantee'],
  },
  {
    id: 'womens_spa',
    title: "Women's Salon, Spa & Skincare",
    subtitle: 'Hygienic Waxing, Herbal Facials, Hair Spa & Manicure-Pedicure',
    industryTag: 'Esthetics & Holistic Spa',
    badge: 'Organic & Gentle',
    iconName: 'Sparkles',
    accentColor: '#7C3AED',
    gradient: 'from-purple-600 via-indigo-600 to-violet-800',
    description: 'Full-service doorstep beauty parlour. Single-use waxing cartridges, organic facials, and luxury spa pedicures performed with disposable sheets and mats.',
    hygieneGuarantees: ['100% Disposable Bed & Floor Sheets', 'Single-Use Waxing Spatulas & Strips', 'Autoclaved Manicure Tools'],
  },
  {
    id: 'festive_group',
    title: 'Festive & Family Group Styling',
    subtitle: 'Celebrations, Sangeet, Mehendi & Family Gatherings (2+ Guests)',
    industryTag: 'Group Occasion Makeover',
    badge: 'Family Savings',
    iconName: 'Users',
    accentColor: '#2563EB',
    gradient: 'from-blue-600 via-cyan-600 to-indigo-800',
    description: 'Coordinated hair styling, makeup, and draping for entire families and bridal entourages before weddings, festivals, or family photoshoots.',
    hygieneGuarantees: ['Multi-Artist Team Deployment', 'Individual Fresh Toolkits per Guest', 'On-Time Guaranteed Readiness'],
  },
];

export const HOME_VISIT_SERVICE_CATALOG: HomeVisitServiceItem[] = [
  // Bridal
  {
    id: 'hvs-bridal-hd',
    categoryId: 'bridal',
    name: 'HD Signature Bridal Makeover',
    tagline: 'Flawless high-definition bridal glam with contour, lashes & setting',
    price: 6999,
    durationMinutes: 150,
    features: ['High-Definition Waterproof Makeup', 'Custom Mink Lashes', 'Contour & Highlight', 'Touch-Up Kit Included'],
    hygieneKit: '100% Brand-new disposable sponges & sanitized brush set',
    recommendedFor: 'Bride on Main Wedding Ceremony',
    popular: true,
  },
  {
    id: 'hvs-bridal-pre',
    categoryId: 'bridal',
    name: 'Pre-Bridal Radiance Glow Ritual',
    tagline: 'Full body de-tan, herbal polish, brightening facial & gold peel',
    price: 3499,
    durationMinutes: 120,
    features: ['Diamond Radiance Facial', 'Full Arms & Legs Fruit Wax', 'De-Tan Body Polish', 'Hydrating Scalp Spa'],
    hygieneKit: 'Single-use sterilized kit with disposable gowns',
    recommendedFor: '2-3 days before wedding rituals',
  },
  {
    id: 'hvs-bridal-drape',
    categoryId: 'bridal',
    name: 'Luxury Saree & Dupatta Draping with Hair Updo',
    tagline: 'Traditional or contemporary draping plus ornate floral hairstyle',
    price: 1999,
    durationMinutes: 60,
    features: ['Pleat Perfect Saree Draping', 'Double Dupatta Setting', 'Floral Bun or Braid', 'Setting Spray Hold'],
    hygieneKit: 'Clean styling kit with pearl pins and hair cushion',
    recommendedFor: 'Reception, Sangeet & Bridal Entourage',
    popular: true,
  },

  // Senior Citizen & Assisted Care
  {
    id: 'hvs-senior-haircut',
    categoryId: 'senior_care',
    name: 'Gentle Senior Gentleman Haircut & Warm Shave',
    tagline: 'Patient, quiet trim and warm foam shave in comfort of favorite chair',
    price: 449,
    durationMinutes: 45,
    features: ['Low-Vibration Quiet Trimmer', 'Warm Lather Shave / Trim', 'Ear & Eyebrow Neatening', 'Gentle Witch Hazel Wipe'],
    hygieneKit: 'Freshly sterilized stainless tools + disposable neck cape',
    recommendedFor: 'Elders & Senior Gentlemen',
    popular: true,
  },
  {
    id: 'hvs-senior-bedbound',
    categoryId: 'senior_care',
    name: 'Assisted Low-Mobility / Bed-Bound Grooming',
    tagline: 'Specialized compassionate grooming for bed-bound or wheelchair elders',
    price: 699,
    durationMinutes: 60,
    features: ['No-Rinse Scalp Cleansing', 'Gentle Bedside Haircut', 'Nail Trim & Buffing', 'Moisturizing Skin Shield'],
    hygieneKit: 'Waterproof bed protector mat + hospital-grade antiseptics',
    recommendedFor: 'Bed-bound elders, post-surgery recovery, Parkinson/Alzheimer care',
    popular: true,
  },
  {
    id: 'hvs-senior-footcare',
    categoryId: 'senior_care',
    name: 'Diabetic-Safe Senior Pedicure & Calming Head Massage',
    tagline: 'Safe non-invasive nail shaping and 20-min Ayurvedic oil champi',
    price: 649,
    durationMinutes: 50,
    features: ['Blunt Safety Nail Trimming', 'Epsom Salt Warm Soak', 'Antiseptic Foot Balm', '20-Min Herbal Champi'],
    hygieneKit: 'Disposable foot bath liner + single-use nail file',
    recommendedFor: 'Senior citizens needing diabetic foot hygiene & stress relief',
  },

  // Kids & Toddlers
  {
    id: 'hvs-kids-first',
    categoryId: 'kids',
    name: 'Tear-Free Toddler & Kids Haircut',
    tagline: 'Fun, gentle hair cut with animated cape, rounded clippers & treat',
    price: 349,
    durationMinutes: 30,
    features: ['Ultra-Quiet Ceramic Blade Clipper', 'Tear-Free Finishing Mist', 'Superhero / Princess Cape', 'Post-Haircut Surprise Sticker'],
    hygieneKit: 'Single-use sanitized toddler cape & sterilized comb',
    recommendedFor: 'Babies (1 yr+) & Kids up to 12 years',
    popular: true,
  },
  {
    id: 'hvs-kids-mundan',
    categoryId: 'kids',
    name: 'Traditional First Baby Head Shave (Mundan Ceremony)',
    tagline: 'Sacred ceremonial head shave by experienced baby specialist',
    price: 799,
    durationMinutes: 45,
    features: ['Traditional Fresh Razor Ceremony', 'Turmeric & Sandalwood Soothing Balm', 'Parent Lap Support Protocol', 'Clean Hair Collection Pouch'],
    hygieneKit: 'Brand new razor blade opened in front of parents + antiseptic kit',
    recommendedFor: 'Newborns and infants for religious Mundan / Tonsure',
    popular: true,
  },

  // Men's Executive
  {
    id: 'hvs-men-executive',
    categoryId: 'mens_grooming',
    name: "Executive Haircut & Hot Towel Beard Sculpting",
    tagline: 'Sharp precision fade, scissor work, steamed towel and beard oil',
    price: 599,
    durationMinutes: 50,
    features: ['Custom Skin Fade / Taper', 'Straight Razor Beard Outline', 'Steamed Peppermint Towel', 'Matte Styling Clay Finish'],
    hygieneKit: 'Disinfected professional clippers + single-use neck roll',
    recommendedFor: 'Busy executives and grooming connoisseurs',
    popular: true,
  },
  {
    id: 'hvs-men-detan',
    categoryId: 'mens_grooming',
    name: 'Charcoal De-Tan Facial & Scalp Oil Revival',
    tagline: 'Deep pore detox, blackhead extraction, tan removal & head massage',
    price: 799,
    durationMinutes: 55,
    features: ['Activated Bamboo Charcoal Scrub', 'Steam Pore Cleanse', 'Detox Peel-Off Mask', '15-Min Stress-Relief Head Massage'],
    hygieneKit: 'Single-use applicator sponges & steam mask',
    recommendedFor: 'Sun-tanned skin and weekend relaxation',
  },

  // Women's Spa & Esthetics
  {
    id: 'hvs-women-glow',
    categoryId: 'womens_spa',
    name: 'Organic Radiance Facial & Threading Combo',
    tagline: 'Deep herbal cleanse, enzyme peel, glow massage & eyebrow shaping',
    price: 999,
    durationMinutes: 65,
    features: ['Organic Rose & Saffron Cleanser', 'Ultrasonic Blackhead Cleanse', 'Brightening Algae Rubber Mask', 'Eyebrow & Upper Lip Threading'],
    hygieneKit: '100% disposable bed cover & sealed organic product sachets',
    recommendedFor: 'Instant skin luminosity before parties or events',
    popular: true,
  },
  {
    id: 'hvs-women-wax',
    categoryId: 'womens_spa',
    name: 'Full Body Rica Liposoluble Waxing Suite',
    tagline: 'Painless Italian Rica wax for arms, full legs & underarms',
    price: 1199,
    durationMinutes: 70,
    features: ['Colophony-Free Italian Rica Wax', 'Pre-Wax Soothing Gel', 'Post-Wax Calming Coconut Oil', 'Zero In-Grown Hair Technique'],
    hygieneKit: 'Disposable wooden spatulas & disposable waxing bed runner',
    recommendedFor: 'Smooth, irritation-free hair removal',
    popular: true,
  },
  {
    id: 'hvs-women-pedi',
    categoryId: 'womens_spa',
    name: 'Aromatherapy Candle Pedicure & Manicure',
    tagline: 'Warm soy candle oil massage, cuticle care, scrub & gel polish',
    price: 899,
    durationMinutes: 60,
    features: ['Dead Sea Salt Soak', 'Callus Smoothing', 'Warm Melted Candle Massage', 'Long-Lasting High Shine Top Coat'],
    hygieneKit: 'Sterilized stainless cuticle nippers + fresh nail buffer',
    recommendedFor: 'Tired feet, soft hands and salon-grade polish',
  },

  // Festive & Group
  {
    id: 'hvs-festive-duo',
    categoryId: 'festive_group',
    name: 'Celebration Duo Styling Package (2 Persons)',
    tagline: 'Hair styling, light makeup / beard groom & touch-up for two guests',
    price: 1899,
    durationMinutes: 80,
    features: ['Two Complete Event Hairdos', 'Quick Glow Makeup / Beard Groom', 'Hair Floral Placement', 'Setting Spray Long Hold'],
    hygieneKit: 'Two independent sanitized toolkits',
    recommendedFor: 'Couples, Mother & Daughter, Sisters going to an event',
    popular: true,
  },
  {
    id: 'hvs-festive-family',
    categoryId: 'festive_group',
    name: 'Family Event Grooming Platoon (Up to 4 Persons)',
    tagline: 'Complete home salon takeover for 4 family members before celebration',
    price: 3499,
    durationMinutes: 140,
    features: ['4x Custom Haircuts / Hairstyles', '2x Beard Styling or Saree Drapes', 'Express Glow Touch-ups', 'Floor Cleanup Guaranteed'],
    hygieneKit: 'Complete salon mobile station with floor drop sheets',
    recommendedFor: 'Festivals (Diwali, Eid, Puja), Weddings & Housewarmings',
    popular: true,
  },
];

// ==============================================================================
// 8 Master Beauty & Grooming Domains (Unified Ecosystem Standard)
// ==============================================================================

export type MasterBeautyDomain =
  | 'bridal'           // A. Bridal & Wedding
  | 'womens_beauty'    // B. Women's Beauty
  | 'mens_grooming'    // C. Men's Grooming
  | 'kids_grooming'    // D. Kids Grooming
  | 'senior_grooming'  // E. Senior Grooming
  | 'makeup_occasions' // F. Makeup & Special Occasions
  | 'nail_care'        // G. Nail Care
  | 'spa_relaxation';  // H. Spa & Relaxation

export interface MasterDomainMeta {
  id: MasterBeautyDomain;
  title: string;
  subtitle: string;
  badge: string;
  iconName: string;
  gradient: string;
  accentColor: string;
  description: string;
  applicableModes: ServiceMode[];
  servicesCount: number;
}

export const MASTER_BEAUTY_DOMAINS: MasterDomainMeta[] = [
  {
    id: 'bridal',
    title: 'Bridal & Wedding Artistry',
    subtitle: 'HD Makeup, Airbrush, Trousseau & Saree Draping',
    badge: 'Luxury Suite',
    iconName: 'Crown',
    gradient: 'from-rose-500 via-pink-600 to-rose-700',
    accentColor: '#E11D48',
    description: 'Bespoke bridal styling delivered to wedding suites, venues, or private studios.',
    applicableModes: ['home_visit', 'studio_visit', 'at_salon'],
    servicesCount: 10,
  },
  {
    id: 'womens_beauty',
    title: "Women's Beauty & Esthetics",
    subtitle: 'Organic Facials, Rica Waxing, Threading, Hair Spa & Blowouts',
    badge: 'Certified Organic',
    iconName: 'Sparkles',
    gradient: 'from-purple-600 via-indigo-600 to-violet-800',
    accentColor: '#7C3AED',
    description: 'Complete beauty parlour and skincare services with disposable single-use sheets.',
    applicableModes: ['at_salon', 'studio_visit', 'home_visit'],
    servicesCount: 10,
  },
  {
    id: 'mens_grooming',
    title: "Men's Grooming & Barbershop",
    subtitle: 'Precision Fades, Hot Towel Beard Sculpting & Charcoal De-Tan',
    badge: 'Executive',
    iconName: 'Scissors',
    gradient: 'from-[#C85322] via-amber-700 to-stone-900',
    accentColor: '#C85322',
    description: 'Classic barbershop fades, beard geometry, steamed towels, and skin detox.',
    applicableModes: ['at_salon', 'home_visit', 'studio_visit'],
    servicesCount: 8,
  },
  {
    id: 'kids_grooming',
    title: 'Kids & Toddlers Gentle Care',
    subtitle: 'Tear-Free Haircuts, Sacred Mundan & Playful Styles',
    badge: 'Tear-Free',
    iconName: 'Smile',
    gradient: 'from-amber-500 via-orange-500 to-amber-700',
    accentColor: '#D97706',
    description: 'Patience-first haircuts with rounded safety blades, cartoon bibs, and soothing care.',
    applicableModes: ['at_salon', 'home_visit', 'studio_visit'],
    servicesCount: 4,
  },
  {
    id: 'senior_grooming',
    title: 'Senior Citizen & Assisted Care',
    subtitle: 'Gentle Haircuts, Low-Mobility & Bedside Grooming',
    badge: 'Compassionate',
    iconName: 'HeartHandshake',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    accentColor: '#059669',
    description: 'Patient, gentle grooming for elders and bed-bound parents in comfortable settings.',
    applicableModes: ['home_visit', 'at_salon', 'studio_visit'],
    servicesCount: 6,
  },
  {
    id: 'makeup_occasions',
    title: 'Makeup & Special Occasions',
    subtitle: 'Party Glam, Cocktail Events, Photoshoots & Festive Looks',
    badge: 'Glamour Pro',
    iconName: 'Eye',
    gradient: 'from-fuchsia-600 via-pink-600 to-rose-600',
    accentColor: '#C026D3',
    description: 'Long-lasting professional makeup and hair updos for events and photo sessions.',
    applicableModes: ['studio_visit', 'home_visit', 'at_salon'],
    servicesCount: 5,
  },
  {
    id: 'nail_care',
    title: 'Nail Art & Extensions',
    subtitle: 'Gel Polish, Acrylic Extensions, Nail Art & Luxury Spa Pedicures',
    badge: 'High Precision',
    iconName: 'Palette',
    gradient: 'from-cyan-600 via-teal-600 to-emerald-700',
    accentColor: '#0891B2',
    description: 'Autoclaved precision tools, imported gel formulations, and custom nail designs.',
    applicableModes: ['studio_visit', 'at_salon', 'home_visit'],
    servicesCount: 5,
  },
  {
    id: 'spa_relaxation',
    title: 'Spa & Holistic Relaxation',
    subtitle: 'Ayurvedic Champi, Foot Reflexology, Body Polishing & Stress Relief',
    badge: 'Therapeutic',
    iconName: 'Flame',
    gradient: 'from-amber-600 via-rose-600 to-orange-800',
    accentColor: '#EA580C',
    description: 'Restorative wellness treatments with warm aromatherapy essential oils.',
    applicableModes: ['at_salon', 'home_visit', 'studio_visit'],
    servicesCount: 5,
  },
];

// ==============================================================================
// Unified Omnichannel Booking Lifecycle Engine
// ==============================================================================

export type BookingStatus =
  | 'pending'               // Customer submitted request
  | 'accepted'              // Provider accepted booking
  | 'rejected'              // Provider rejected booking
  | 'confirmed'             // Slot / Deposit locked
  | 'on_the_way'            // Freelance/Salon stylist traveling
  | 'arrived'               // Stylist arrived at destination / studio
  | 'in_progress'           // Service actively underway
  | 'completed'             // Service finished, bill settled
  | 'cancelled'             // Cancelled by customer or provider
  | 'no_show';              // Customer did not show up

export interface UnifiedBookingItem {
  id: string;
  serviceId?: string;
  serviceName: string;
  category: string;
  price: number;
  durationMinutes: number;
}

export interface UnifiedBooking {
  id: string;
  bookingNumber: string;
  providerId: string;
  providerName: string;
  providerType: ProviderType;
  serviceMode: ServiceMode;
  category: string;
  status: BookingStatus;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  scheduledDate: string; // YYYY-MM-DD
  timeSlot: string;      // e.g. "10:00 AM - 12:00 PM"
  serviceAddress?: string; // Protected: shown only to assigned professional for confirmed booking!
  serviceLocality?: string; // Visible for general scheduling
  serviceCoordinates?: {
    lat: number;
    lng: number;
  };
  items: UnifiedBookingItem[];
  servicesSubtotal: number;
  travelCharge: number;
  platformFee: number;
  totalAmount: number;
  advanceDeposit: number;
  specialInstructions?: string;
  specialCareRequirements?: string[];
  technicianName?: string;
  technicianPhone?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ==============================================================================
// Fair Discovery Engine & Multi-Factor Ranking
// ==============================================================================

export type DiscoveryCategory =
  | 'all'
  | 'budget'
  | 'professional'
  | 'premium'
  | 'independent'
  | 'home_services'
  | 'bridal'
  | 'top_rated'
  | 'available_now';

export interface DiscoveryCategoryMeta {
  id: DiscoveryCategory;
  label: string;
  iconName: string;
  badge?: string;
  subtitle: string;
}

export const DISCOVERY_CATEGORIES: DiscoveryCategoryMeta[] = [
  {
    id: 'all',
    label: 'All Partners',
    iconName: 'Compass',
    subtitle: 'All trusted salons & beauty pros',
  },
  {
    id: 'available_now',
    label: 'Available Now',
    iconName: 'Zap',
    badge: 'Zero Wait',
    subtitle: 'Under 15 mins queue or immediate slot',
  },
  {
    id: 'budget',
    label: 'Budget Friendly',
    iconName: 'Percent',
    badge: 'Under ₹249',
    subtitle: 'High quality essential grooming at friendly prices',
  },
  {
    id: 'top_rated',
    label: 'Top Rated',
    iconName: 'Star',
    badge: '4.8+ ★',
    subtitle: 'Loved by hundreds of local customers',
  },
  {
    id: 'professional',
    label: 'Salons & Parlours',
    iconName: 'Store',
    subtitle: 'Established brick-and-mortar salons',
  },
  {
    id: 'home_services',
    label: 'Home Service',
    iconName: 'Home',
    badge: 'Doorstep',
    subtitle: 'Certified salon stylists & pros visiting your doorstep',
  },
  {
    id: 'bridal',
    label: 'Bridal & Occasions',
    iconName: 'Crown',
    badge: 'Specialist',
    subtitle: 'Weddings, sangeet, and festive styling packages',
  },
  {
    id: 'independent',
    label: 'Freelance Artists',
    iconName: 'UserCheck',
    subtitle: 'Mobile makeup artists & freelance stylists',
  },
];

export interface RankingWeights {
  ratingWeight: number;       // default 0.30
  distanceWeight: number;     // default 0.25
  availabilityWeight: number; // default 0.20
  verifiedWeight: number;     // default 0.15
  pricingFitWeight: number;   // default 0.10
  sponsoredBoost: number;     // capped bonus for sponsored listings
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  ratingWeight: 0.30,
  distanceWeight: 0.25,
  availabilityWeight: 0.20,
  verifiedWeight: 0.15,
  pricingFitWeight: 0.10,
  sponsoredBoost: 0.08,
};

// ==============================================================================
// Sloon Business Intelligence & Operational Analytics
// ==============================================================================

export interface HourlyFootfallStat {
  hour: number;          // 0 - 23
  label: string;         // e.g. "11 AM"
  customerCount: number;
  isPeak: boolean;
  isQuiet: boolean;
  avgRevenue: number;
}

export interface ServiceDemandStat {
  serviceName: string;
  category: string;
  orderCount: number;
  totalRevenue: number;
  marginTier: 'high' | 'medium' | 'standard';
  growthPercent: number;
}

export interface BusinessMetricSummary {
  totalCustomersToday: number;
  totalCustomersMonth: number;
  grossRevenueToday: number;
  grossRevenueMonth: number;
  averageTransactionValue: number; // ATV in INR
  repeatCustomerRate: number;      // e.g. 68%
  avgWaitTimeMinutes: number;
  completedServicesCount: number;
  queueNoShowRate: number;
  walkInVsBookingRatio: {
    walkIn: number;
    appointment: number;
    homeVisit: number;
  };
}

export interface BusinessRecommendation {
  id: string;
  title: string;
  category: 'quiet_hours' | 'loyalty' | 'upsell' | 'package' | 'retention';
  description: string;
  impactEstimate: string;
  actionLabel: string;
  actionTargetTab: 'offers' | 'services' | 'settings' | 'queue';
  priority: 'high' | 'medium' | 'low';
}


