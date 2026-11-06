/**
 * KUMBHAKARAN PLATFORM - FRONTEND API CLIENT
 * Connects React UI to NestJS + Fastify PostGIS Backend
 */

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined' &&
  window.location?.hostname &&
  !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://kumbhakaran-salons.onrender.com/api/v1'
    : 'http://localhost:3001/api/v1');

export interface NearbySalonsApiResponse {
  totalFound: number;
  page: number;
  limit: number;
  radiusKm: number;
  salons: Array<{
    id: string;
    name: string;
    tagline?: string;
    locality: string;
    city: string;
    latitude: number;
    longitude: number;
    distanceKm: number;
    rating: number;
    reviewCount: number;
    currentQueue: number;
    estimatedWaitMinutes: number;
    startingPrice: number;
    isOpen: boolean;
    isVerified: boolean;
    coverImage?: string;
    lastQueueUpdate: string;
    freshnessBadge: string;
  }>;
}

export const api = {
  /**
   * Discovers nearby verified salons using PostGIS geographical queries
   */
  async getNearbySalons(
    latitude?: number,
    longitude?: number,
    radiusKm?: number,
    lazyFilter?: string,
  ): Promise<NearbySalonsApiResponse | null> {
    try {
      const params = new URLSearchParams();
      if (latitude !== undefined && longitude !== undefined) {
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
        if (radiusKm) params.append('radius_km', radiusKm.toString());
      }

      if (lazyFilter && lazyFilter !== 'all') {
        params.append('lazy_filter', lazyFilter);
      }

      const res = await fetch(`${API_BASE}/salons/nearby?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      // Backend is offline or starting up; graceful fallback
      return null;
    }
  },

  /**
   * Fetches public salon details by ID (Strict privacy: zero walk-in names)
   */
  async getPublicSalonById(id: string) {
    try {
      const res = await fetch(`${API_BASE}/salons/${id}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Registers a new salon with verified PostGIS coordinates
   */
  async registerSalon(payload: {
    name: string;
    tagline?: string;
    ownerName: string;
    phone: string;
    address: string;
    locality: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
    coverImage?: string;
    activeBarbers?: number;
    startingPrice?: number;
    services?: Array<{ name: string; category: string; price: number; durationMinutes?: number }>;
  }) {
    try {
      const res = await fetch(`${API_BASE}/salons/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Transactionally adjusts physical walk-in queue counter
   */
  async updateQueue(salonId: string, delta?: number, manualValue?: number, ownerId: string = 'owner-1') {
    try {
      const res = await fetch(`${API_BASE}/salons/${salonId}/queue`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-id': ownerId,
          Accept: 'application/json',
        },
        body: JSON.stringify({ delta, manualValue }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Submit Customer Review (persisted directly to PostgreSQL database)
   */
  async submitSalonReview(salonId: string, review: {
    customerName: string;
    customerAvatar?: string;
    rating: number;
    comment: string;
    verifiedVisit?: boolean;
    criteria?: {
      haircutQuality?: number;
      staffBehaviour?: number;
      cleanliness?: number;
      pricing?: number;
      overallExperience?: number;
    };
  }) {
    try {
      const res = await fetch(`${API_BASE}/salons/${salonId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(review),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  /**
   * Get all reviews for a salon
   */
  async getSalonReviews(salonId: string) {
    try {
      const res = await fetch(`${API_BASE}/salons/${salonId}/reviews`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Update salon details, poster, loop video, and gallery
   */
  async updateSalon(salonId: string, updates: any) {
    try {
      const res = await fetch(`${API_BASE}/salons/${salonId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },
};
