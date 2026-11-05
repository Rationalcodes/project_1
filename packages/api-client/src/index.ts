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

export function getDefaultApiBaseUrl(): string {
  // 1. Explicit window-level override
  if (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) {
    return (window as any).__API_BASE_URL__;
  }

  // 2. Vite build-time environment variable
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) {
      return (import.meta as any).env.VITE_API_BASE_URL;
    }
  } catch {}

  // 3. Node / SSR environment variable
  try {
    const proc = (globalThis as any).process;
    if (proc && proc.env?.VITE_API_BASE_URL) {
      return proc.env.VITE_API_BASE_URL;
    }
  } catch {}

  // 4. In browser runtime on production / remote domains (e.g. *.vercel.app), default to live Render backend
  if (
    typeof window !== 'undefined' &&
    window.location?.hostname &&
    !['localhost', '127.0.0.1'].includes(window.location.hostname)
  ) {
    return 'https://kumbhakaran-salons.onrender.com/api/v1';
  }

  // 5. Default local development backend
  return 'http://localhost:3001/api/v1';
}

export class KumbhakaranApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getDefaultApiBaseUrl();
  }

  setBaseUrl(url: string) {
    if (url && typeof url === 'string') {
      this.baseUrl = url.replace(/\/+$/, '');
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
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
  async loginWithGoogle(credential: string, clientId?: string): Promise<AuthResponse> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ credential, clientId }),
      });
    } catch (networkErr: any) {
      const msg = `Unable to reach backend API at ${this.baseUrl}: ${networkErr?.message || 'Network error'}`;
      console.error(msg, networkErr);
      throw new Error(msg);
    }

    if (!res.ok) {
      let serverMsg = `Authentication rejected (HTTP ${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) {
          serverMsg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        }
      } catch {}
      throw new Error(serverMsg);
    }

    const data: AuthResponse = await res.json();
    if (data?.accessToken) {
      this.setAuthToken(data.accessToken);
    }
    return data;
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
   * Public Customer Discovery: PostGIS ST_DWithin search or all-salons national discovery
   */
  async getNearbySalons(
    latitude?: number | null,
    longitude?: number | null,
    radiusKm: number = 25,
    lazyFilter?: string,
  ): Promise<NearbySalonsApiResponse | null> {
    try {
      const params = new URLSearchParams();

      if (latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null) {
        params.append('latitude', latitude.toString());
        params.append('longitude', longitude.toString());
        params.append('radius_km', radiusKm.toString());
      }

      if (lazyFilter && lazyFilter !== 'all') {
        params.append('lazy_filter', lazyFilter);
      }

      const queryString = params.toString();
      const url = queryString ? `${this.baseUrl}/salons/nearby?${queryString}` : `${this.baseUrl}/salons/nearby`;

      const res = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Get the single salon belonging to the authenticated partner (or by email)
   */
  async getMySalon(email?: string): Promise<Salon | null> {
    try {
      const url = email
        ? `${this.baseUrl}/salons/my-salon?email=${encodeURIComponent(email)}`
        : `${this.baseUrl}/salons/my-salon`;
      const res = await fetch(url, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.hasSalon === false || !data.id) return null;
      return data;
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
  }): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/salons/${salonId}/reviews`, {
        method: 'POST',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(review),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Get all reviews for a salon
   */
  async getSalonReviews(salonId: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/salons/${salonId}/reviews`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Reply to a salon review (Owner only)
   */
  async replyToSalonReview(salonId: string, reviewId: string, comment: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/salons/${salonId}/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ comment }),
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

  /**
   * Update salon profile, poster, loop video, or location & work gallery (requires Partner/Owner auth)
   */
  async updateSalon(salonId: string, updates: any): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/salons/${salonId}`, {
        method: 'PATCH',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(updates),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // ADMINISTRATOR SALON MANAGEMENT & DELETION APIs
  // ==========================================================================

  /**
   * List all registered salons for administration (requires ADMIN role)
   */
  async getAdminSalons(): Promise<any[] | null> {
    try {
      const res = await fetch(`${this.baseUrl}/admin/salons`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Verify or unverify a salon registration (requires ADMIN role)
   */
  async verifyAdminSalon(salonId: string, isVerified: boolean): Promise<any> {
    const res = await fetch(`${this.baseUrl}/admin/salons/${salonId}/verify`, {
      method: 'PATCH',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ isVerified }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Verification failed with status ${res.status}`);
    }
    return await res.json();
  }

  /**
   * Update salon operational status (active / suspended) (requires ADMIN role)
   */
  async updateAdminSalonStatus(salonId: string, status: 'active' | 'suspended' | 'pending'): Promise<any> {
    const res = await fetch(`${this.baseUrl}/admin/salons/${salonId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Status update failed with status ${res.status}`);
    }
    return await res.json();
  }

  // ==========================================================================
  // DEVICE PROFILE PERSISTENCE (Zero-Sign In Device Mapping)
  // ==========================================================================

  /**
   * Fetch customer device profile mapped to anonymous device ID
   */
  async getDeviceProfile(deviceId: string): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/device-profile/${encodeURIComponent(deviceId)}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Save or update customer device profile mapped to device ID
   */
  async saveDeviceProfile(profile: {
    deviceId: string;
    name?: string;
    avatar?: string;
    savedSalons?: string[];
    recentlyViewed?: string[];
    genderFilter?: string;
    preferredLocality?: string;
  }): Promise<any | null> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/device-profile`, {
        method: 'POST',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(profile),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // LIVE QUEUE ENTRIES & CALLING API
  // ==========================================================================

  /**
   * Get waiting customer entries in the live walk-in queue
   */
  async getQueueEntries(salonId: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Add a customer to queue with their name, phone, and ticket ID
   */
  async addQueueEntry(salonId: string, entry: {
    customerName?: string;
    phone?: string;
    serviceName?: string;
    deviceId?: string;
    userId?: string;
  }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries`, {
      method: 'POST',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add customer to queue');
    }
    return await res.json();
  }

  /**
   * Update queue entry status (in_service / completed / cancelled)
   */
  async updateQueueEntryStatus(salonId: string, entryId: string, status: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}`, {
      method: 'PATCH',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    return await res.json();
  }

  /**
   * Reset / clear all waiting queue entries
   */
  async clearQueueEntries(salonId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  }

  /**
   * Permanently delete a salon and all associated records (requires ADMIN role and exact confirmation)
   */
  async deleteAdminSalon(salonId: string, confirmSalonName: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/admin/salons/${salonId}`, {
      method: 'DELETE',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ confirmSalonName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Salon deletion failed with status ${res.status}`);
    }
    return await res.json();
  }
}

export const defaultApiClient = new KumbhakaranApiClient();
