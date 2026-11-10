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
  isVerified: boolean;
  status: 'active' | 'suspended' | 'pending';
  todayCustomersServed: number;
  todayRevenue: number;
  monthlyRevenue: number;
  queueStatusNote?: string;
  googlePlaceId?: string;
  googleReviewUrl?: string;
}

export interface SalonRegistrationInput {
  name: string;
  tagline?: string;
  salonType?: SalonType;
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
  | 'gallery';
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

