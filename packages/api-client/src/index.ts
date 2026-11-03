import { Salon, SalonRegistrationInput } from '@kumbhakaran/shared-types';

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

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  phone?: string | null;
  role: 'CUSTOMER' | 'ADMIN';
}

export interface SalonMembership {
  salonId: string;
  role: 'PARTNER_OWNER' | 'PARTNER_STAFF';
  isActive: boolean;
  status?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  memberships: SalonMembership[];
}

export class KumbhakaranApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) {
      this.baseUrl = (window as any).__API_BASE_URL__;
    } else if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.VITE_API_BASE_URL) {
      this.baseUrl = (globalThis as any).process.env.VITE_API_BASE_URL;
    } else {
      this.baseUrl = 'http://localhost:3001/api/v1';
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...extraHeaders,
    };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  // ==========================================================================
  // AUTHENTICATION APIs
  // ==========================================================================

  /**
   * Authenticate with Google OAuth Credential (ID Token)
   */
  async loginWithGoogle(credential: string, clientId?: string): Promise<AuthResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ credential, clientId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.accessToken) {
        this.setAuthToken(data.accessToken);
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Get current authenticated user profile and memberships
   */
  async getCurrentUser(): Promise<AuthResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/me`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Logout user and invalidate token
   */
  async logout(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      this.setAuthToken(null);
      return res.ok;
    } catch {
      this.setAuthToken(null);
      return false;
    }
  }

  // ==========================================================================
  // PUBLIC SALON & DISCOVERY APIs
  // ==========================================================================

  /**
   * Public Customer Discovery: PostGIS ST_DWithin search
   */
  async getNearbySalons(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    lazyFilter?: string,
  ): Promise<NearbySalonsApiResponse | null> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius_km: radiusKm.toString(),
      });

      if (lazyFilter && lazyFilter !== 'all') {
        params.append('lazy_filter', lazyFilter);
      }

      const res = await fetch(`${this.baseUrl}/salons/nearby?${params.toString()}`, {
        headers: this.getHeaders(),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Public Salon Profile (strictly excludes walk-in customer names and revenue)
   */
  async getPublicSalonById(id: string): Promise<Salon | null> {
    try {
      const res = await fetch(`${this.baseUrl}/salons/${id}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // PARTNER MANAGEMENT APIs
  // ==========================================================================

  /**
   * Partner Salon Registration (requires Bearer token)
   */
  async registerSalon(payload: SalonRegistrationInput) {
    try {
      const res = await fetch(`${this.baseUrl}/salons/register`, {
        method: 'POST',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          name: payload.name,
          tagline: payload.tagline,
          ownerName: payload.ownerName,
          phone: payload.phone,
          email: payload.email,
          address: payload.address,
          locality: payload.locality,
          city: payload.city,
          state: payload.state,
          pincode: payload.pincode,
          latitude: payload.coordinates.lat,
          longitude: payload.coordinates.lng,
          coverImage: payload.coverImage,
          activeBarbers: payload.activeBarbers,
          services: payload.services.map((s) => ({
            name: s.name,
            category: s.category,
            price: s.price,
            durationMinutes: s.durationMinutes,
          })),
        }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Partner Live Queue Adjustment (authorized via Bearer token and salon_members)
   */
  async updateQueue(salonId: string, delta?: number, manualValue?: number) {
    try {
      const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue`, {
        method: 'PATCH',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ delta, manualValue }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}

export const defaultApiClient = new KumbhakaranApiClient();
