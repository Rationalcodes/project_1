import { Salon, SalonRegistrationInput, HomeBanner } from '@kumbhakaran/shared-types';
import { io, Socket } from 'socket.io-client';

export interface QueueRealtimeEvent {
  salonId: string;
  eventName: string;
  sequence: number;
  timestamp: string;
  entry?: any;
  overview?: any;
  entries?: any[];
  [key: string]: any;
}

export type QueueEventListener = (event: QueueRealtimeEvent) => void;

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
    queueStatus?: 'open' | 'paused' | 'closed';
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

export function createQueueRequestId(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // RFC4122 version 4 UUID fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createQueueRequestFingerprint(fields: Array<string | number | null | undefined>): Promise<string> {
  const serialized = JSON.stringify(fields);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    try {
      const input = new TextEncoder().encode(serialized);
      const digest = await globalThis.crypto.subtle.digest('SHA-256', input);
      return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
    } catch {}
  }
  // Simple fallback hash
  let hash = 0;
  for (let i = 0; i < serialized.length; i++) {
    const char = serialized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function getDefaultApiBaseUrl(): string {
  let url = '';
  let viteEnvUrl: string | undefined;
  try {
    viteEnvUrl = (new Function('return typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_BASE_URL : undefined'))();
  } catch {}

  // 1. Explicit window-level override
  if (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) {
    url = (window as any).__API_BASE_URL__;
  } else if (viteEnvUrl) {
    url = viteEnvUrl;
  } else if (typeof globalThis !== 'undefined' && (globalThis as any).process?.env?.VITE_API_BASE_URL) {
    url = (globalThis as any).process.env.VITE_API_BASE_URL;
  } else if (typeof window !== 'undefined' && window.location?.hostname) {
    const h = window.location.hostname;
    const isLocal =
      ['localhost', '127.0.0.1', '::1'].includes(h) ||
      h.startsWith('192.168.') ||
      h.startsWith('10.') ||
      h.startsWith('172.') ||
      h.endsWith('.local');

    if (isLocal) {
      url = `http://${h === 'localhost' || h === '127.0.0.1' ? 'localhost' : h}:3001/api/v1`;
    } else {
      url = 'https://project-1-tt3c.onrender.com/api/v1';
    }
  } else {
    url = 'http://localhost:3001/api/v1';
  }

  let trimmed = url.replace(/\/+$/, '');
  if (!trimmed.endsWith('/api/v1')) {
    trimmed = `${trimmed}/api/v1`;
  }
  return trimmed;
}

export class KumbhakaranApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private isBackendHealthy = true;
  private nextHealthRetry = 0;

  // Realtime WebSocket state (Phase 3 Optimization)
  private socket: Socket | null = null;
  private socketConnected = false;
  private activeSalonSubscriptions = new Map<string, Set<QueueEventListener>>();
  private salonLatestSequence = new Map<string, number>();
  private globalEventListeners = new Set<(eventName: string, payload: any) => void>();

  // Short-lived API response cache and in-flight request deduplication (Phase 4 Optimization)
  private responseCache = new Map<string, { data: any; expiresAt: number }>();
  private inFlightRequests = new Map<string, Promise<any>>();

  /**
   * Coalesces concurrent identical GET requests and caches responses for specified TTL (in ms).
   * Prevents duplicate network requests across concurrent React components and effects.
   */
  public async cachedFetch<T>(
    cacheKey: string,
    ttlMs: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const cached = this.responseCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.data as T;
    }

    // In-flight coalescing: If an identical request is already active, reuse its Promise
    const existing = this.inFlightRequests.get(cacheKey);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fetcher()
      .then((data) => {
        if (data !== null && data !== undefined) {
          this.responseCache.set(cacheKey, { data, expiresAt: Date.now() + ttlMs });
        }
        return data;
      })
      .finally(() => {
        this.inFlightRequests.delete(cacheKey);
      });

    this.inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  /**
   * Invalidate cached data by exact key or prefix.
   * Invoked after mutations or on incoming WebSocket queue events.
   */
  public invalidateCache(prefix?: string) {
    if (!prefix) {
      this.responseCache.clear();
      return;
    }
    for (const key of this.responseCache.keys()) {
      if (key.startsWith(prefix)) {
        this.responseCache.delete(key);
      }
    }
  }

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getDefaultApiBaseUrl();

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isBackendHealthy = true;
        this.nextHealthRetry = 0;
      });
    }
  }

  /**
   * Computes the base server origin for WebSocket connections (strips /api/v1)
   */
  public getSocketOrigin(): string {
    try {
      const parsed = new URL(this.baseUrl);
      return parsed.origin;
    } catch {
      return this.baseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    }
  }

  /**
   * Initializes or returns the shared Socket.io client instance connected to /queue namespace
   */
  public getSocket(): Socket | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.socket) {
      const origin = this.getSocketOrigin();
      this.socket = io(`${origin}/queue`, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on('connect', () => {
        this.socketConnected = true;
        // Automatically re-join all currently active salon rooms on reconnect
        for (const salonId of this.activeSalonSubscriptions.keys()) {
          this.socket?.emit('joinSalon', { salonId });
        }
      });

      this.socket.on('disconnect', () => {
        this.socketConnected = false;
      });

      // Register listener for all known queue event types
      const queueEvents = [
        'queue.entry.created',
        'queue.entry.updated',
        'queue.service.started',
        'queue.service.completed',
        'queue.entry.called',
        'queue.status.updated',
        'salon.status.updated',
        'queue.cleared',
        'queue.eta.updated',
        'staff.availability.updated',
        'queue.crowd_report',
        'queue.entry.arrival_confirmed',
        'queue.entry.departure_candidate',
      ];

      for (const eventName of queueEvents) {
        this.socket.on(eventName, (payload: any) => {
          this.handleIncomingQueueEvent(eventName, payload);
        });
      }
    }

    return this.socket;
  }

  /**
   * Internal dispatcher for incoming WebSocket queue events.
   * Enforces monotonic sequence checking to prevent stale updates from overwriting fresh state.
   */
  private handleIncomingQueueEvent(eventName: string, payload: any) {
    const salonId = payload?.salonId;
    if (!salonId) return;

    // Check monotonic sequence number
    if (typeof payload.sequence === 'number') {
      const lastSeq = this.salonLatestSequence.get(salonId) || 0;
      if (payload.sequence < lastSeq) {
        // Out-of-order or stale event dropped
        return;
      }
      this.salonLatestSequence.set(salonId, payload.sequence);
    }

    const listeners = this.activeSalonSubscriptions.get(salonId);
    // Invalidate affected salon cache so next query gets fresh DB state
    this.invalidateCache(`salon:${salonId}`);
    this.invalidateCache('discovery:');

    if (listeners && listeners.size > 0) {
      for (const listener of listeners) {
        try {
          listener(payload);
        } catch (err) {
          console.warn(`[KumbhakaranApiClient] Error in queue event listener for ${salonId}:`, err);
        }
      }
    }

    // Notify global event listeners (for discovery and home screens)
    if (this.globalEventListeners.size > 0) {
      for (const listener of this.globalEventListeners) {
        try {
          listener(eventName, payload);
        } catch (err) {
          console.warn('[KumbhakaranApiClient] Error in global event listener:', err);
        }
      }
    }
  }

  /**
   * Subscribes a listener to global platform events (such as salon open/pause/close status changes).
   * Returns an unsubscribe callback for React useEffect cleanup.
   */
  public subscribeToGlobalEvents(listener: (eventName: string, payload: any) => void): () => void {
    this.globalEventListeners.add(listener);
    this.getSocket(); // Ensure socket connection is initialized
    return () => {
      this.globalEventListeners.delete(listener);
    };
  }

  /**
   * Subscribes a listener to live queue events for a specific salon.
   * Reference-counted: joins the WebSocket room on first subscriber, leaves on last subscriber unmount.
   * Returns an unsubscribe function for React useEffect cleanup.
   */
  public subscribeToSalonQueue(salonId: string, listener: QueueEventListener): () => void {
    if (!salonId) return () => {};

    let listeners = this.activeSalonSubscriptions.get(salonId);
    const isFirstSubscriber = !listeners || listeners.size === 0;

    if (!listeners) {
      listeners = new Set();
      this.activeSalonSubscriptions.set(salonId, listeners);
    }
    listeners.add(listener);

    const s = this.getSocket();
    if (isFirstSubscriber && s) {
      if (s.connected) {
        s.emit('joinSalon', { salonId });
      } else {
        s.once('connect', () => {
          s.emit('joinSalon', { salonId });
        });
      }
    }

    return () => {
      const currentListeners = this.activeSalonSubscriptions.get(salonId);
      if (currentListeners) {
        currentListeners.delete(listener);
        if (currentListeners.size === 0) {
          this.activeSalonSubscriptions.delete(salonId);
          if (this.socket && this.socket.connected) {
            this.socket.emit('leaveSalon', { salonId });
          }
        }
      }
    };
  }

  public isSocketConnected(): boolean {
    return this.socketConnected;
  }

  private isNetworkOnline(): boolean {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  }

  /**
   * Resilient, non-throwing fetch wrapper that prevents console spam during network outages
   */
  private async safeFetch(url: string, options?: RequestInit): Promise<Response | null> {
    if (!this.isNetworkOnline()) {
      return null;
    }

    if (!this.isBackendHealthy && Date.now() < this.nextHealthRetry) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      this.isBackendHealthy = true;
      return res;
    } catch {
      this.isBackendHealthy = false;
      this.nextHealthRetry = Date.now() + 15000;
      return null;
    }
  }

  setBaseUrl(url: string) {
    if (url && typeof url === 'string') {
      let trimmed = url.replace(/\/+$/, '');
      if (!trimmed.endsWith('/api/v1')) {
        trimmed = `${trimmed}/api/v1`;
      }
      this.baseUrl = trimmed;
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
    const cacheKey = `discovery:${queryString}`;

    return this.cachedFetch<NearbySalonsApiResponse | null>(cacheKey, 12000, async () => {
      try {
        const url = queryString ? `${this.baseUrl}/salons/nearby?${queryString}` : `${this.baseUrl}/salons/nearby`;
        const res = await fetch(url, {
          headers: this.getHeaders(),
        });

        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    });
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
    const cacheKey = `salon:${id}`;
    return this.cachedFetch<Salon | null>(cacheKey, 10000, async () => {
      try {
        const res = await fetch(`${this.baseUrl}/salons/${id}`, {
          headers: this.getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    });
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
   * Partner Salon Registration (Persists salon to Supabase PostgreSQL)
   */
  async registerSalon(payload: SalonRegistrationInput) {
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

    if (!res.ok) {
      let errorMsg = `Salon registration failed (HTTP ${res.status})`;
      try {
        const body = await res.json();
        if (body?.message) {
          errorMsg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
        }
      } catch {}
      throw new Error(errorMsg);
    }
    return await res.json();
  }

  /**
   * Partner Live Queue Adjustment (authorized via Bearer token and salon_members)
   */
  async updateQueue(salonId: string, delta?: number, manualValue?: number) {
    try {
      const res = await this.safeFetch(`${this.baseUrl}/salons/${salonId}/queue`, {
        method: 'PATCH',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ delta, manualValue }),
      });
      if (!res || !res.ok) return null;
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
      const res = await this.safeFetch(`${this.baseUrl}/salons/${salonId}`, {
        method: 'PATCH',
        headers: this.getHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(updates),
      });
      if (!res || !res.ok) return { success: true, ...updates, offline: true };
      return await res.json();
    } catch {
      return { success: true, ...updates, offline: true };
    }
  }

  async updateQueueStatus(
    salonId: string,
    status: 'open' | 'paused' | 'closed',
    reason?: string,
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-status`, {
      method: 'PATCH',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status, reason }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Could not update queue status');
    }
    return res.json();
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
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not load the salon queue');
    }
    return await res.json();
  }

  async getPartnerQueueEntries(salonId: string): Promise<any[]> {
    try {
      const res = await this.safeFetch(`${this.baseUrl}/salons/${salonId}/partner-queue-entries`, {
        headers: this.getHeaders(),
      });
      if (!res || !res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  /**
   * Get the current customer's queue ticket using its private access token.
   */
  async getQueueEntry(salonId: string, entryId: string, accessToken?: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}/customer-status`, {
        headers: this.getHeaders(accessToken ? { 'X-Queue-Access-Token': accessToken } : {}),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Add a customer to queue with their name, phone, and ticket ID
   */
  async addQueueEntry(salonId: string, entry: {
    requestId?: string;
    customerName?: string;
    phone?: string;
    serviceName?: string;
    deviceId?: string;
    userId?: string;
    partySize?: number;
    checkInToken?: string;
    bookingForSomeoneElse?: boolean;
  }): Promise<any> {
    const payload = {
      ...entry,
      requestId: entry.requestId || createQueueRequestId(),
    };
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries`, {
      method: 'POST',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add customer to queue');
    }
    this.invalidateCache(`salon:${salonId}`);
    this.invalidateCache('discovery:');
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
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update queue entry status');
    }
    this.invalidateCache(`salon:${salonId}`);
    this.invalidateCache('discovery:');
    return await res.json();
  }

  async cancelCustomerQueueEntry(salonId: string, entryId: string, accessToken: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}/customer-cancel`, {
      method: 'POST',
      headers: this.getHeaders({ 'X-Queue-Access-Token': accessToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to leave the queue');
    }
    this.invalidateCache(`salon:${salonId}`);
    this.invalidateCache('discovery:');
    return res.json();
  }

  async confirmCustomerQueueArrival(
    salonId: string,
    entryId: string,
    accessToken: string,
    qrToken: string,
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}/check-in`, {
      method: 'POST',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
        'X-Queue-Access-Token': accessToken,
      }),
      body: JSON.stringify({ qrToken }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not confirm salon check-in');
    }
    return res.json();
  }

  async setCustomerQueueLocationConsent(
    salonId: string,
    entryId: string,
    accessToken: string,
    enabled: boolean,
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}/location-consent`, {
      method: 'PATCH',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
        'X-Queue-Access-Token': accessToken,
      }),
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not update location consent');
    }
    return res.json();
  }

  async submitCustomerQueueLocation(
    salonId: string,
    entryId: string,
    accessToken: string,
    observation: { latitude: number; longitude: number; accuracyMeters: number; observedAt: string },
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}/location-observation`, {
      method: 'POST',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
        'X-Queue-Access-Token': accessToken,
      }),
      body: JSON.stringify(observation),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not verify the current location');
    }
    return res.json();
  }

  async respondToCustomerQueueDeparture(
    salonId: string,
    entryId: string,
    accessToken: string,
    response: 'left' | 'still_here' | 'returning',
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}/departure-response`, {
      method: 'POST',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
        'X-Queue-Access-Token': accessToken,
      }),
      body: JSON.stringify({ response }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not update your queue status');
    }
    return res.json();
  }

  async getSalonCheckInQr(salonId: string): Promise<{ salonId: string; checkInToken: string; geofenceRadiusMeters: number }> {
    try {
      const res = await this.safeFetch(`${this.baseUrl}/salons/${salonId}/check-in-qr`, {
        headers: this.getHeaders(),
      });
      if (res && res.ok) {
        return await res.json();
      }
    } catch {}

    // Resilient fallback token so QR standee never fails even 100% offline
    return {
      salonId,
      checkInToken: `qr_desk_${salonId}_${Date.now().toString(36)}`,
      geofenceRadiusMeters: 100,
    };
  }

  async updateSmartQueueSettings(salonId: string, geofenceRadiusMeters: number): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/smart-queue-settings`, {
      method: 'PATCH',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ geofenceRadiusMeters }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not save SmartQueue settings');
    }
    return res.json();
  }

  async confirmQueueDepartureByStaff(salonId: string, entryId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}/confirm-departure`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not confirm customer departure');
    }
    return res.json();
  }

  async restoreQueueEntry(salonId: string, entryId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue-entries/${entryId}/recall`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not restore the queue ticket');
    }
    return res.json();
  }

  /**
   * Reset / clear all waiting queue entries
   */
  async clearQueueEntries(salonId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/queue/clear`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ clearOption: 'cancelled', reason: 'Cleared by salon staff' }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Could not clear the salon queue');
    }
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

  /**
   * Home Banners and Promotional Posters
   */
  async getBanners(): Promise<HomeBanner[]> {
    return this.cachedFetch<HomeBanner[]>('banners', 60000, async () => {
      try {
        const res = await fetch(`${this.baseUrl}/banners`, {
          headers: this.getHeaders({ Accept: 'application/json' }),
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Failed to fetch banners from backend API:', err);
      }
      return [];
    });
  }

  async saveBanners(banners: HomeBanner[]): Promise<boolean> {
    const res = await fetch(`${this.baseUrl}/admin/salons/banners`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ banners }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to save banners on backend');
    }
    this.invalidateCache('banners');
    return true;
  }

  /**
   * Staff and Barber Management
   */
  async addSalonStaff(salonId: string, staffData: {
    name: string;
    role?: string;
    experience?: string;
    specialties?: string[];
    photo?: string;
  }): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/staff`, {
      method: 'POST',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(staffData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to add staff member');
    }
    return res.json();
  }

  async updateSalonStaff(salonId: string, staffId: string, updates: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/staff/${staffId}`, {
      method: 'PATCH',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update staff member');
    }
    return res.json();
  }

  async deleteSalonStaff(salonId: string, staffId: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/staff/${staffId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete staff member');
    }
    return res.json();
  }

  async updateStaffStatus(salonId: string, staffId: string, availability: 'AVAILABLE' | 'ON_BREAK' | 'OFFLINE', note?: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/staff/${staffId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ availability, note }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update staff status');
    }
    return res.json();
  }

  /**
   * Submit live crowdsourced salon status with GPS location verification (Where-Is-My-Train style)
   */
  async submitCrowdReport(salonId: string, payload: {
    latitude: number;
    longitude: number;
    peopleCount: number;
    estimatedWaitMinutes: number;
    activeBarbers?: number;
    notes?: string;
    customerName?: string;
  }): Promise<{ success: boolean; message: string; report?: any }> {
    const res = await fetch(`${this.baseUrl}/salons/${salonId}/crowd-report`, {
      method: 'POST',
      headers: this.getHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || `Failed to submit crowd report (HTTP ${res.status})`);
    }
    return data;
  }

  /**
   * Get latest verified on-site crowd report for a salon
   */
  async getLatestCrowdReport(salonId: string): Promise<{ report: any | null; history: any[] }> {
    try {
      const res = await this.safeFetch(`${this.baseUrl}/salons/${salonId}/crowd-report`, {
        headers: this.getHeaders(),
      });
      if (!res || !res.ok) return { report: null, history: [] };
      return await res.json();
    } catch {
      return { report: null, history: [] };
    }
  }
}

export const defaultApiClient = new KumbhakaranApiClient();
