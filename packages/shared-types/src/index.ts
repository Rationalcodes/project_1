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
  activeBarbers: number;
  distanceKm: number;
  startingPrice: number;
  isOpen: boolean;
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
  ownerName?: string;
  ownerId?: string;
  lastQueueUpdate: string;
  services: Service[];
  staff: Staff[];
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

export type PartnerView = 'dashboard' | 'register' | 'live-queue' | 'services' | 'staff' | 'reviews' | 'analytics' | 'settings' | 'gallery';
export type OwnerTab = PartnerView;

export type AdminTab = 'overview' | 'salons' | 'customers' | 'verification' | 'reviews' | 'subscriptions' | 'analytics' | 'settings';

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
