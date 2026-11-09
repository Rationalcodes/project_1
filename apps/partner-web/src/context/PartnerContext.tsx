import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Salon,
  Service,
  Staff,
  Review,
  PartnerView,
  SalonRegistrationInput,
  QueueEntry,
} from '@kumbhakaran/shared-types';
import {
  createQueueRequestFingerprint,
  createQueueRequestId,
  defaultApiClient,
  getDefaultApiBaseUrl,
  AuthUser,
  SalonMembership,
} from '@kumbhakaran/api-client';
import { safeStorage } from '../utils/safeStorage';
import { INITIAL_SALONS } from '../data/mockSalons';

// Resilient default avatar SVG (zero external dependency, 100% offline-ready)
export const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80' width='80' height='80'%3E%3Crect width='80' height='80' rx='40' fill='%2327273A'/%3E%3Ccircle cx='40' cy='30' r='14' fill='%23F59E0B'/%3E%3Cpath d='M16 66c0-12 11-20 24-20s24 8 24 20' fill='%23F59E0B' opacity='0.8'/%3E%3C/svg%3E";

// Explicitly sync API client base URL with Vite environment or dynamic runtime discovery
const configuredApiBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  getDefaultApiBaseUrl();

defaultApiClient.setBaseUrl(configuredApiBaseUrl);

interface PartnerContextType {
  partnerUser: AuthUser | null;
  memberships: SalonMembership[];
  isAuthenticated: boolean;
  loginWithGoogle: (credential: string, clientId?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  salons: Salon[];
  activeSalonId: string;
  setActiveSalonId: (id: string) => void;
  activeSalon: Salon | null;
  partnerView: PartnerView;
  setPartnerView: (view: PartnerView) => void;
  ownerTab: PartnerView;
  setOwnerTab: (view: PartnerView) => void;
  registerSalon: (data: SalonRegistrationInput) => Promise<Salon>;
  updateQueue: (salonId: string, delta: number, manualValue?: number) => void;
  updateQueueStatus: (salonId: string, status: 'open' | 'paused' | 'closed') => Promise<void>;
  isUpdatingQueueStatus: boolean;
  updateSalonInfo: (salonId: string, updates: Partial<Salon>) => void;
  addService: (salonId: string, service: Omit<Service, 'id'>) => void;
  updateService: (salonId: string, serviceId: string, updates: Partial<Service>) => void;
  deleteService: (salonId: string, serviceId: string) => void;
  addStaff: (salonId: string, staffMember: Omit<Staff, 'id'>) => void;
  updateStaff: (salonId: string, staffId: string, updates: Partial<Staff>) => void;
  deleteStaff: (salonId: string, staffId: string) => void;
  replyToReview: (salonId: string, reviewId: string, replyComment: string) => void;
  fetchSalonReviews: (salonId?: string) => Promise<void>;
  notificationMessage: string | null;
  triggerNotification: (msg: string) => void;
  queueEntries: QueueEntry[];
  isLoadingQueue: boolean;
  refreshQueueEntries: (salonId?: string) => Promise<void>;
  addCustomerToQueue: (name: string, phone?: string, serviceName?: string) => Promise<void>;
  updateCustomerStatus: (entryId: string, status: string) => Promise<void>;
  confirmQueueDeparture: (entryId: string) => Promise<void>;
  restoreQueueEntry: (entryId: string) => Promise<void>;
  updateSmartQueueRadius: (radiusMeters: number) => Promise<void>;
  clearQueue: () => Promise<void>;
  latestCrowdReport: any | null;
  checkApprovalStatus: () => Promise<boolean>;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  completeOnboarding: () => void;
}

export function normalizeSalon(raw: any): Salon {
  if (!raw) return raw;
  const openingHours = raw.openingHours && typeof raw.openingHours === 'object'
    ? {
        open: raw.openingHours.open || '09:00 AM',
        close: raw.openingHours.close || '09:30 PM',
        formatted: raw.openingHours.formatted || raw.openingHoursFormatted || '09:00 AM – 09:30 PM (All Days)',
      }
    : {
        open: '09:00 AM',
        close: '09:30 PM',
        formatted: raw.openingHoursFormatted || '09:00 AM – 09:30 PM (All Days)',
      };

  const staff = Array.isArray(raw.staff) && raw.staff.length > 0
    ? raw.staff.map((st: any) => ({
        id: st.id,
        name: st.name,
        role: st.role || 'Senior Stylist',
        experience: st.experience || '4 Years',
        specialization: st.specialization || (Array.isArray(st.specialties) ? st.specialties.join(', ') : 'Hair styling & Grooming'),
        rating: Number(st.rating || 5.0),
        reviewsCount: Number(st.reviewsCount || 0),
        avatarUrl: st.avatarUrl || st.photo || '',
        photo: st.photo || st.avatarUrl || '',
        status: st.status || 'active',
        isAvailable: st.status === 'active' || st.isAvailable !== false,
      }))
    : [];

  const locImages = Array.isArray(raw.locationImages) ? raw.locationImages : (Array.isArray(raw.location_images) ? raw.location_images : []);
  const workImages = Array.isArray(raw.workImages) ? raw.workImages : (Array.isArray(raw.work_images) ? raw.work_images : []);
  const effectiveCover = raw.coverImage || raw.cover_image || raw.posterImage || raw.poster_image || locImages[0] || workImages[0] || '';
  const effectivePoster = raw.posterImage || raw.poster_image || effectiveCover;
  const effectiveLoop = raw.loopVideoUrl || raw.loop_video_url || '';
  const allImages = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images
    : [
        ...(effectiveCover ? [effectiveCover] : []),
        ...locImages,
        ...workImages,
      ].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

  return {
    ...raw,
    coverImage: effectiveCover,
    posterImage: effectivePoster,
    loopVideoUrl: effectiveLoop,
    openingHours,
    coordinates: raw.coordinates || {
      lat: Number(raw.latitude || 28.6139),
      lng: Number(raw.longitude || 77.2090),
    },
    staff,
    services: Array.isArray(raw.services) ? raw.services : [],
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
    images: allImages,
    locationImages: locImages,
    workImages: workImages,
    mediaGallery: Array.isArray(raw.mediaGallery) ? raw.mediaGallery : [],
    currentQueue: raw.currentQueue !== undefined
      ? Number(raw.currentQueue)
      : (raw.current_queue !== undefined ? Number(raw.current_queue) : 0),
    activeBarbers: Number(raw.activeBarbers || raw.active_barbers || 2),
    avgServiceTimeMinutes: Number(raw.avgServiceTimeMinutes || raw.avg_service_time_minutes || 20),
    lastQueueUpdate: raw.lastQueueUpdate || raw.last_queue_update || new Date().toISOString(),
    queueStatus: raw.queueStatus || raw.queue_status || (raw.isOpen === false ? 'closed' : 'open'),
  };
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salons, setSalons] = useState<Salon[]>(() => {
    try {
      const cached = safeStorage.getItem('kumbhakaran_partner_active_salon');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) return [normalizeSalon(parsed)];
      }
    } catch {}
    return [];
  });

  const [activeSalonId, setActiveSalonId] = useState<string>(() => {
    try {
      const cached = safeStorage.getItem('kumbhakaran_partner_active_salon');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) return parsed.id;
      }
    } catch {}
    return '';
  });

  const [partnerView, setPartnerViewState] = useState<PartnerView>(() => {
    try {
      const saved = safeStorage.getItem('kumbhakaran_partner_view') as PartnerView;
      if (
        saved &&
        [
          'overview',
          'home',
          'live-queue',
          'dashboard',
          'services',
          'staff',
          'profile',
          'reviews',
          'analytics',
          'notifications',
          'billing',
          'settings',
          'help',
          'gallery',
          'register-new',
          'register',
        ].includes(saved)
      ) {
        return saved;
      }
    } catch {}
    return 'overview';
  });

  const setPartnerView = (view: PartnerView) => {
    setPartnerViewState(view);
    try {
      safeStorage.setItem('kumbhakaran_partner_view', view);
    } catch {}
  };

  const [partnerUser, setPartnerUser] = useState<AuthUser | null>(() => {
    try {
      const savedToken = safeStorage.getItem('kumbhakaran_partner_token');
      if (savedToken) {
        defaultApiClient.setAuthToken(savedToken);
      }
      const cached = safeStorage.getItem('kumbhakaran_partner_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.email || parsed.id)) return parsed;
      }
    } catch {}
    return null;
  });

  const [memberships, setMemberships] = useState<SalonMembership[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // Partner Onboarding Flow state (Runs on first partner visit, replayable anytime)
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const completed = safeStorage.getItem('sloon_partner_onboarding_completed');
      return completed !== 'true';
    } catch {
      return false;
    }
  });

  const completeOnboarding = () => {
    setShowOnboarding(false);
    try {
      safeStorage.setItem('sloon_partner_onboarding_completed', 'true');
    } catch {}
  };
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(false);
  const [isUpdatingQueueStatus, setIsUpdatingQueueStatus] = useState<boolean>(false);
  const queueStatusUpdateLock = useRef(false);
  const [latestCrowdReport, setLatestCrowdReport] = useState<any | null>(null);

  const activeSalon = salons.find((s) => s.id === activeSalonId) || salons[0] || null;

  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  const refreshQueueEntries = useCallback(async (salonIdToFetch?: string) => {
    const sId = salonIdToFetch || activeSalonId;
    if (!sId) {
      setQueueEntries([]);
      setLatestCrowdReport(null);
      return;
    }
    // Skip remote polling when browser is offline to prevent console errors
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' && !navigator.onLine) {
      return;
    }
    try {
      const entries = await defaultApiClient.getPartnerQueueEntries(sId);
      if (Array.isArray(entries) && entries.length > 0) {
        setQueueEntries(entries);
        setSalons((prev) =>
          prev.map((s) => {
            if (s.id !== sId) return s;
            const waitingCount = entries.filter((e: any) => e.status === 'waiting' || e.status === 'called').length;
            const completedCount = entries.filter((e: any) => e.status === 'completed').length;
            const effectiveCompleted = Math.max(s.todayCustomersServed, completedCount);
            if (waitingCount !== s.currentQueue || effectiveCompleted !== s.todayCustomersServed) {
              const updated = {
                ...s,
                currentQueue: waitingCount,
                todayCustomersServed: effectiveCompleted,
                lastQueueUpdate: new Date().toISOString(),
              };
              safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
              return updated;
            }
            return s;
          }),
        );
      }
    } catch {
      // Quietly fall back to local queue state without spamming console
    }

    try {
      const crowdRes = await defaultApiClient.getLatestCrowdReport(sId);
      if (crowdRes && crowdRes.report) {
        setLatestCrowdReport(crowdRes.report);
      } else {
        setLatestCrowdReport(null);
      }
    } catch {}
  }, [activeSalonId]);

  const updateQueueStatus = async (salonId: string, status: 'open' | 'paused' | 'closed') => {
    if (queueStatusUpdateLock.current) return;
    queueStatusUpdateLock.current = true;
    setIsUpdatingQueueStatus(true);
    try {
      const result = await defaultApiClient.updateQueueStatus(salonId, status);
      setSalons((prev) =>
        prev.map((salon) => {
          if (salon.id !== salonId) return salon;
          const updated = normalizeSalon({
            ...salon,
            queueStatus: result.queueStatus,
            isOpen: result.isOpen,
            currentQueue: status === 'closed' ? 0 : salon.currentQueue,
            lastQueueUpdate: new Date().toISOString(),
          });
          safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
          return updated;
        }),
      );
      if (status === 'closed') setQueueEntries([]);
      else await refreshQueueEntries(salonId);
      broadcastTelemetryUpdate(salonId);
      triggerNotification(
        status === 'paused'
          ? 'New queue entries paused. Current customers remain in line.'
          : status === 'open'
            ? 'New queue entries are open.'
            : 'Queue closed.',
      );
    } catch (error) {
      triggerNotification(error instanceof Error ? error.message : 'Could not update queue status.');
    } finally {
      queueStatusUpdateLock.current = false;
      setIsUpdatingQueueStatus(false);
    }
  };

  // Realtime queue synchronization and adaptive resilient fallback (Phase 3 Optimization)
  useEffect(() => {
    if (!activeSalonId) return;

    let inFlight = false;

    const safeRefresh = async () => {
      if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' && !navigator.onLine) {
        return;
      }
      if (typeof document !== 'undefined' && document.hidden) {
        return; // Tab is in background: pause polling
      }
      if (inFlight) {
        return; // Prevent overlapping requests
      }
      inFlight = true;
      try {
        await refreshQueueEntries(activeSalonId);
      } finally {
        inFlight = false;
      }
    };

    safeRefresh();

    // Subscribe to salon-specific WebSocket room for immediate live queue updates
    const unsubscribe = defaultApiClient.subscribeToSalonQueue(activeSalonId, () => {
      safeRefresh();
    });

    // Adaptive fallback polling (25s when active, 0s when hidden)
    const interval = setInterval(safeRefresh, 25000);

    const onOnline = () => safeRefresh();
    const onFocus = () => safeRefresh();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') safeRefresh();
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('kumbhakaran_telemetry');
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'QUEUE_UPDATE' && (!ev.data.salonId || ev.data.salonId === activeSalonId)) {
          safeRefresh();
        }
        if (ev?.data?.type === 'SALON_VERIFIED' && (!ev.data.salonId || ev.data.salonId === activeSalonId)) {
          if (partnerUser) {
            loadUserSalon(partnerUser);
          }
        }
      };
    } catch {}

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [activeSalonId, refreshQueueEntries]);

  const broadcastTelemetryUpdate = (salonId: string, currentQueue?: number) => {
    try {
      const bc = new BroadcastChannel('kumbhakaran_telemetry');
      bc.postMessage({ type: 'QUEUE_UPDATE', salonId, currentQueue, timestamp: Date.now() });
      bc.close();
    } catch {}
  };

  const addCustomerToQueue = async (name: string, phone?: string, serviceName?: string) => {
    const sId = activeSalonId || activeSalon?.id;
    if (!sId) return;
    try {
      setIsLoadingQueue(true);
      const requestFingerprint = await createQueueRequestFingerprint([
        partnerUser?.id || '',
        name.trim(),
        phone?.trim() || '',
        serviceName?.trim() || '',
      ]);
      const requestIdKey = `kumbhakaran_pending_queue_request:${sId}:${requestFingerprint}`;
      const requestId = safeStorage.getItem(requestIdKey) || createQueueRequestId();
      safeStorage.setItem(requestIdKey, requestId);
      const res = await defaultApiClient.addQueueEntry(sId, {
        requestId,
        customerName: name,
        phone,
        serviceName,
      });
      if (res?.entry) {
        safeStorage.removeItem(requestIdKey);
        setQueueEntries((prev) => [...prev, res.entry]);
        setSalons((prev) =>
          prev.map((s) =>
            s.id === sId
              ? {
                  ...s,
                  currentQueue: res.currentQueue ?? s.currentQueue + 1,
                  lastQueueUpdate: new Date().toISOString(),
                }
              : s
          )
        );
        broadcastTelemetryUpdate(sId, res.currentQueue);
        triggerNotification(`Added #${res.entry.ticketNumber} ${name} to live queue!`);
      }
      await refreshQueueEntries(sId);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const updateCustomerStatus = async (entryId: string, status: string) => {
    const sId = activeSalonId || activeSalon?.id;
    if (!sId) return;
    try {
      await defaultApiClient.updateQueueEntryStatus(sId, entryId, status);
      broadcastTelemetryUpdate(sId);
      if (status === 'completed') {
        const avgPrice = activeSalon?.services[0]?.price || 150;
        setSalons((prev) =>
          prev.map((s) =>
            s.id === sId
              ? {
                  ...s,
                  currentQueue: Math.max(0, s.currentQueue - 1),
                  todayCustomersServed: s.todayCustomersServed + 1,
                  todayRevenue: s.todayRevenue + avgPrice,
                  monthlyRevenue: s.monthlyRevenue + avgPrice,
                  lastQueueUpdate: new Date().toISOString(),
                }
              : s
          )
        );
        triggerNotification('Customer marked as completed / served');
      } else if (status === 'cancelled') {
        setSalons((prev) =>
          prev.map((s) =>
            s.id === sId
              ? {
                  ...s,
                  currentQueue: Math.max(0, s.currentQueue - 1),
                  lastQueueUpdate: new Date().toISOString(),
                }
              : s
          )
        );
        triggerNotification('Customer removed from queue');
      } else if (status === 'in_service') {
        triggerNotification('Customer called to styling chair');
      }
      await refreshQueueEntries(sId);
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to update customer status');
    }
  };

  const confirmQueueDeparture = async (entryId: string) => {
    const sId = activeSalonId || activeSalon?.id;
    if (!sId) return;
    await defaultApiClient.confirmQueueDepartureByStaff(sId, entryId);
    broadcastTelemetryUpdate(sId);
    triggerNotification('Customer marked absent. Their ticket can still be restored.');
    await refreshQueueEntries(sId);
  };

  const restoreQueueEntry = async (entryId: string) => {
    const sId = activeSalonId || activeSalon?.id;
    if (!sId) return;
    await defaultApiClient.restoreQueueEntry(sId, entryId);
    broadcastTelemetryUpdate(sId);
    triggerNotification('Customer ticket restored to the queue.');
    await refreshQueueEntries(sId);
  };

  const updateSmartQueueRadius = async (radiusMeters: number) => {
    const sId = activeSalonId || activeSalon?.id;
    if (!sId) return;
    await defaultApiClient.updateSmartQueueSettings(sId, radiusMeters);
    triggerNotification(`Location assistance radius set to ${Math.round(radiusMeters)} metres.`);
  };

  const clearQueue = async () => {
    const sId = activeSalonId || activeSalon?.id;
    if (!sId) return;
    try {
      await defaultApiClient.clearQueueEntries(sId);
      setQueueEntries([]);
      setSalons((prev) =>
        prev.map((s) =>
          s.id === sId
            ? { ...s, currentQueue: 0, lastQueueUpdate: new Date().toISOString() }
            : s
        )
      );
      broadcastTelemetryUpdate(sId, 0);
      triggerNotification('All waiting customers cleared from queue');
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to clear queue');
    }
  };

  // Helper to load the single salon tied to this Gmail ID or user memberships
  const loadUserSalon = useCallback(async (user: AuthUser, initialMemberships?: SalonMembership[]) => {
    try {
      // 1. Fetch via getMySalon (backend checks ownerId, memberships, and email)
      const mySalon = await defaultApiClient.getMySalon(user.email);
      if (mySalon && mySalon.id) {
        const normalized = normalizeSalon(mySalon);
        setSalons([normalized]);
        setActiveSalonId(normalized.id);
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(normalized));
        return normalized;
      }

      // 2. Fallback: If memberships contain a salonId, fetch public salon profile
      const mems = initialMemberships || memberships || [];
      const ownerMem = mems.find((m) => m.role === 'PARTNER_OWNER') || mems[0];
      if (ownerMem && ownerMem.salonId) {
        const memSalon = await defaultApiClient.getPublicSalonById(ownerMem.salonId);
        if (memSalon && memSalon.id) {
          const normalized = normalizeSalon(memSalon);
          setSalons([normalized]);
          setActiveSalonId(normalized.id);
          safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(normalized));
          return normalized;
        }
      }
    } catch (e) {
      console.warn('Could not load user salon from database:', e);
    }

    // 3. Fallback: Check if local storage already has a cached salon record
    try {
      const cached = safeStorage.getItem('kumbhakaran_partner_active_salon');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id) {
          const normalized = normalizeSalon(parsed);
          setSalons([normalized]);
          setActiveSalonId(normalized.id);
          return normalized;
        }
      }
    } catch {}

    // No salon found yet: prompt registration for this account
    setSalons([]);
    setActiveSalonId('');
    return null;
  }, [memberships]);

  // Restore authenticated session from localStorage
  useEffect(() => {
    let isMounted = true;
    const savedToken = safeStorage.getItem('kumbhakaran_partner_token');
    if (savedToken) {
      defaultApiClient.setAuthToken(savedToken);
      defaultApiClient.getCurrentUser().then(async (res: any) => {
        if (!isMounted) return;
        const freshUser = res?.user || (res?.email ? res : null);
        if (freshUser) {
          setPartnerUser(freshUser);
          setMemberships(res.memberships || []);
          safeStorage.setItem('kumbhakaran_partner_user', JSON.stringify(freshUser));
          await loadUserSalon(freshUser, res.memberships);
        }
        // Note: Do not remove tokens on transient failures so partner stays logged in across reloads/restarts
      }).catch(() => {
        // Network timeout / transient issue: retain optimistic session from localStorage
      });
    }
    return () => {
      isMounted = false;
    };
  }, [loadUserSalon]);

  const loginWithGoogle = async (credential: string, clientId?: string): Promise<boolean> => {
    try {
      const res = await defaultApiClient.loginWithGoogle(credential, clientId);
      if (res && res.accessToken) {
        safeStorage.setItem('kumbhakaran_partner_token', res.accessToken);
        safeStorage.setItem('kumbhakaran_partner_user', JSON.stringify(res.user));
        defaultApiClient.setAuthToken(res.accessToken);
        setPartnerUser(res.user);
        setMemberships(res.memberships || []);
        triggerNotification(`Welcome back, ${res.user.name}!`);
        await loadUserSalon(res.user, res.memberships);
        return true;
      }
    } catch (err: any) {
      console.error('Partner login error:', err);
      triggerNotification(err?.message || 'Google Sign-In failed. Please try again.');
      return false;
    }
    triggerNotification('Google Sign-In failed. Please try again.');
    return false;
  };

  const logout = async () => {
    try {
      await defaultApiClient.logout();
    } catch {}
    safeStorage.removeItem('kumbhakaran_partner_token');
    safeStorage.removeItem('kumbhakaran_partner_user');
    safeStorage.removeItem('kumbhakaran_partner_active_salon');
    safeStorage.removeItem('kumbhakaran_partner_view');
    defaultApiClient.setAuthToken(null);
    setPartnerUser(null);
    setMemberships([]);
    setSalons([]);
    setActiveSalonId('');
    setPartnerView('register');
    triggerNotification('Signed out from Partner OS');
  };

  const registerSalon = async (data: SalonRegistrationInput): Promise<Salon> => {
    let backendSalonId: string | null = null;
    try {
      const res = await defaultApiClient.registerSalon(data);
      if (res?.salon?.id) {
        backendSalonId = res.salon.id;
      }
    } catch (err: any) {
      console.error('Backend registration error:', err);
      triggerNotification(`Registration error: ${err.message || 'Could not save salon to cloud'}`);
      throw err;
    }

    const newId = backendSalonId || `salon-${Date.now()}`;
    const startingPrice =
      data.services && data.services.length > 0
        ? Math.min(...data.services.map((s) => s.price))
        : 150;

    const newSalon: Salon = {
      id: newId,
      name: data.name,
      tagline: data.tagline || 'Modern grooming & live walk-in visibility',
      coverImage:
        data.coverImage ||
        'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
      images: [
        data.coverImage ||
          'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
      ],
      rating: 5.0,
      reviewCount: 0,
      currentQueue: 0,
      avgServiceTimeMinutes: 20,
      activeBarbers: data.activeBarbers || 2,
      distanceKm: 1.5,
      startingPrice: startingPrice,
      isOpen: true,
      openingHours: data.openingHours,
      address: data.address,
      locality: data.locality,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      coordinates: data.coordinates,
      phone: data.phone,
      email: data.email,
      ownerName: data.ownerName,
      lastQueueUpdate: new Date().toISOString(),
      services: data.services.map((s, idx) => ({
        id: `svc-reg-${idx}`,
        name: s.name,
        category: s.category,
        price: s.price,
        durationMinutes: s.durationMinutes,
        description: s.description,
        isAvailable: true,
      })),
      staff: [
        {
          id: `st-reg-1`,
          name: data.masterBarberName || data.ownerName,
          role: 'Master Barber / Proprietor',
          experience: '6 Years',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          specialties: ['Precision Fade', 'Beard Contour'],
          status: 'active',
          rating: 5.0,
        },
      ],
      ratingBreakdown: {
        haircutQuality: 5.0,
        staffBehaviour: 5.0,
        cleanliness: 5.0,
        pricing: 5.0,
        overallExperience: 5.0,
      },
      reviews: [],
      featured: false,
      isVerified: false,
      status: 'pending',
      todayCustomersServed: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
    };

    setSalons((prev) => [newSalon, ...prev.filter((s) => s.id !== newId)]);
    setActiveSalonId(newId);
    setPartnerView('home');
    safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(newSalon));
    triggerNotification(`🎉 Salon "${newSalon.name}" registered! Submitted for Admin authorization.`);

    try {
      const bc = new BroadcastChannel('kumbhakaran_telemetry');
      bc.postMessage({
        type: 'SALON_REGISTERED',
        salonId: newId,
        salonName: newSalon.name,
        timestamp: Date.now(),
      });
      bc.close();
    } catch {}

    return newSalon;
  };

  const updateQueue = async (salonId: string, delta: number, manualValue?: number) => {
    let finalQueue = 0;
    setSalons((prev) =>
      prev.map((salon) => {
        if (salon.id !== salonId) return salon;

        let newQueue = manualValue !== undefined ? manualValue : salon.currentQueue + delta;
        if (newQueue < 0) newQueue = 0;
        finalQueue = newQueue;

        const customersServedDelta = delta < 0 ? Math.abs(delta) : 0;
        const avgPrice = salon.services[0]?.price || 150;
        const revenueDelta = customersServedDelta * avgPrice;

        const updated = {
          ...salon,
          currentQueue: newQueue,
          lastQueueUpdate: new Date().toISOString(),
          todayCustomersServed: salon.todayCustomersServed + customersServedDelta,
          todayRevenue: salon.todayRevenue + revenueDelta,
          monthlyRevenue: salon.monthlyRevenue + revenueDelta,
        };
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );

    const salon = salons.find((s) => s.id === salonId);
    triggerNotification(
      `Queue updated for ${salon?.name || 'salon'}: ${finalQueue} waiting`,
    );
    broadcastTelemetryUpdate(salonId, finalQueue);
    refreshQueueEntries(salonId);

    // Asynchronously synchronize with NestJS backend
    try {
      const res = await defaultApiClient.updateQueue(salonId, delta, manualValue);
      if (res && res.currentQueue !== undefined) {
        setSalons((prev) =>
          prev.map((s) => {
            if (s.id !== salonId) return s;
            const synced = {
              ...s,
              currentQueue: Number(res.currentQueue),
              lastQueueUpdate: res.lastQueueUpdate || s.lastQueueUpdate,
            };
            safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(synced));
            return synced;
          }),
        );
      }
    } catch {
      // Quietly continue; local queue state is safely persisted in safeStorage
    }
  };

  const updateSalonInfo = (salonId: string, updates: Partial<Salon>) => {
    const effectiveIsOpen = updates.isOpen;

    // 1. Optimistic local update in state and safeStorage
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = normalizeSalon({
          ...s,
          ...updates,
          ...(effectiveIsOpen === false ? { currentQueue: 0, queueStatus: 'closed' } : {}),
          ...(effectiveIsOpen === true ? { queueStatus: 'open' } : {}),
        });
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );

    if (effectiveIsOpen === false) {
      setQueueEntries([]);
      broadcastTelemetryUpdate(salonId, 0);
    }

    triggerNotification(
      effectiveIsOpen !== undefined
        ? effectiveIsOpen
          ? 'Salon is open for walk-ins.'
          : 'Salon is closed.'
        : 'Salon information updated successfully'
    );

    // 2. Safe background cloud sync (resilient against offline / network errors)
    const cloudPayload: any = {
      ...updates,
      latitude: (updates as any).coordinates?.lat ?? (updates as any).latitude,
      longitude: (updates as any).coordinates?.lng ?? (updates as any).longitude,
      ...(updates.openingHours
        ? {
            openingHoursOpen: updates.openingHours.open,
            openingHoursClose: updates.openingHours.close,
            openingHoursFormatted: updates.openingHours.formatted,
          }
        : {}),
    };
    void defaultApiClient.updateSalon(salonId, cloudPayload).catch(() => {});
    if (effectiveIsOpen === false) {
      void defaultApiClient.clearQueueEntries(salonId).catch(() => {});
    }
  };

  const addService = (salonId: string, serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: `svc-${Date.now()}`,
    };
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = { ...s, services: [...(s.services || []), newService] };
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );
    triggerNotification(`Added service "${newService.name}" (₹${newService.price})`);
  };

  const updateService = (salonId: string, serviceId: string, updates: Partial<Service>) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = {
          ...s,
          services: (s.services || []).map((svc) => (svc.id === serviceId ? { ...svc, ...updates } : svc)),
        };
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );
    triggerNotification('Service updated successfully');
  };

  const deleteService = (salonId: string, serviceId: string) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = {
          ...s,
          services: (s.services || []).filter((svc) => svc.id !== serviceId),
        };
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );
    triggerNotification('Service removed');
  };

  const addStaff = async (salonId: string, staffData: Omit<Staff, 'id'>) => {
    try {
      const created = await defaultApiClient.addSalonStaff(salonId, {
        name: staffData.name,
        role: staffData.role,
        experience: staffData.experience,
        specialties: staffData.specialties,
        photo: staffData.photo,
      });
      const newMember: Staff = {
        ...staffData,
        id: created?.id || `st-${Date.now()}`,
      };
      setSalons((prev) =>
        prev.map((s) => {
          if (s.id !== salonId) return s;
          const updated = {
            ...s,
            activeBarbers: (s.staff || []).length + 1,
            staff: [...(s.staff || []), newMember],
          };
          safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
          return updated;
        }),
      );
      triggerNotification(`Stylist ${newMember.name} added to roster`);
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to add stylist');
    }
  };

  const updateStaff = async (salonId: string, staffId: string, updates: Partial<Staff>) => {
    try {
      if (updates.status) {
        await defaultApiClient.updateStaffStatus(
          salonId,
          staffId,
          updates.status === 'break' ? 'ON_BREAK' : updates.status === 'off' ? 'OFFLINE' : 'AVAILABLE',
        );
      }
      setSalons((prev) =>
        prev.map((s) => {
          if (s.id !== salonId) return s;
          const updated = {
            ...s,
            staff: (s.staff || []).map((st) => (st.id === staffId ? { ...st, ...updates } : st)),
          };
          safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
          return updated;
        }),
      );
      triggerNotification('Staff details updated');
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to update staff');
    }
  };

  const deleteStaff = async (salonId: string, staffId: string) => {
    try {
      await defaultApiClient.deleteSalonStaff(salonId, staffId);
      setSalons((prev) =>
        prev.map((s) => {
          if (s.id !== salonId) return s;
          const remainingStaff = (s.staff || []).filter((st) => st.id !== staffId);
          const updated = {
            ...s,
            activeBarbers: Math.max(1, remainingStaff.length),
            staff: remainingStaff,
          };
          safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
          return updated;
        }),
      );
      triggerNotification('Staff member removed');
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to delete staff member');
    }
  };

  const fetchSalonReviews = useCallback(async (targetSalonId?: string) => {
    const sId = targetSalonId || activeSalonId || activeSalon?.id;
    if (!sId) return;
    try {
      const res = await defaultApiClient.getSalonReviews(sId);
      if (Array.isArray(res)) {
        const formattedReviews: Review[] = res.map((r: any) => ({
          id: r.id || `rev-${Date.now()}`,
          customerName: r.customerName || r.customer_name || 'Anonymous Customer',
          customerAvatar: r.customerAvatar || r.customer_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          rating: Number(r.rating) || 5,
          comment: r.comment || '',
          date: r.createdAt || r.created_at ? new Date(r.createdAt || r.created_at).toLocaleDateString() : 'Recent',
          verifiedVisit: Boolean(r.verifiedVisit !== undefined ? r.verifiedVisit : r.verified_visit),
          criteria: r.criteria,
          ownerReply: r.ownerReply || r.owner_reply,
        }));

        setSalons((prev) =>
          prev.map((s) => {
            if (s.id !== sId) return s;
            const updated = {
              ...s,
              reviews: formattedReviews,
              reviewsCount: formattedReviews.length,
            };
            safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
            return updated;
          }),
        );
      }
    } catch (err) {
      console.warn('Failed to fetch salon reviews:', err);
    }
  }, [activeSalonId, activeSalon?.id]);

  useEffect(() => {
    if (activeSalonId && partnerView === 'reviews') {
      fetchSalonReviews(activeSalonId);
    }
  }, [activeSalonId, partnerView, fetchSalonReviews]);

  const replyToReview = async (salonId: string, reviewId: string, replyComment: string) => {
    const trimmed = (replyComment || '').trim();
    if (!trimmed) return;

    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = {
          ...s,
          reviews: (s.reviews || []).map((r) =>
            r.id === reviewId
              ? { ...r, ownerReply: { comment: trimmed, date: 'Just now' } }
              : r,
          ),
        };
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );

    try {
      await defaultApiClient.replyToSalonReview(salonId, reviewId, trimmed);
      triggerNotification('Owner response published to customer app!');
      await fetchSalonReviews(salonId);
    } catch {
      triggerNotification('Response saved locally');
    }
  };

  const checkApprovalStatus = async (): Promise<boolean> => {
    if (!partnerUser) return false;
    try {
      const refreshed = await loadUserSalon(partnerUser);
      if (refreshed && refreshed.isVerified && refreshed.status === 'active') {
        triggerNotification(`🎉 Authorization Approved! Welcome to the SLOON Partner Platform.`);
        return true;
      }
    } catch {}
    return false;
  };

  return (
    <PartnerContext.Provider
      value={{
        partnerUser,
        memberships,
        isAuthenticated: Boolean(partnerUser),
        loginWithGoogle,
        logout,
        salons,
        activeSalonId,
        setActiveSalonId,
        activeSalon,
        partnerView,
        setPartnerView,
        ownerTab: partnerView,
        setOwnerTab: setPartnerView,
        registerSalon,
        updateQueue,
        updateQueueStatus,
        isUpdatingQueueStatus,
        updateSalonInfo,
        addService,
        updateService,
        deleteService,
        addStaff,
        updateStaff,
        deleteStaff,
        replyToReview,
        fetchSalonReviews,
        notificationMessage,
        triggerNotification,
        queueEntries,
        isLoadingQueue,
        refreshQueueEntries,
        addCustomerToQueue,
        updateCustomerStatus,
        confirmQueueDeparture,
        restoreQueueEntry,
        updateSmartQueueRadius,
        clearQueue,
        latestCrowdReport,
        checkApprovalStatus,
        showOnboarding,
        setShowOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartner = () => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
};

// Aliased export for compatibility
export const useSalon = usePartner;

export const getEstimatedWaitMinutes = (currentQueue: number, avgServiceTime: number, activeBarbers: number): number => {
  if (currentQueue <= 0) return 0;
  const barbers = Math.max(1, activeBarbers || 2);
  const time = avgServiceTime || 20;
  return Math.max(5, Math.ceil((currentQueue * time) / barbers));
};

export const formatDuration = (minutes: number | string | null | undefined): string => {
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
};

export const formatWaitTime = (minutes: number | string | null | undefined): string => {
  const num = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
  if (num == null || isNaN(num) || num <= 0) {
    return '0 min';
  }
  return `~${formatDuration(num)}`;
};


export const getQueueDisplay = (currentQueue: number, isOpen: boolean, queueStatus?: Salon['queueStatus']) => {
  if (!isOpen || queueStatus === 'closed') {
    return {
      label: 'Closed',
      shortLabel: 'Closed',
      color: 'slate',
      badgeClass: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700',
      pillClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      dotClass: 'bg-zinc-500',
      textClass: 'text-zinc-400',
    };
  }
  if (queueStatus === 'paused') {
    return {
      label: 'Queue Temporarily Paused',
      shortLabel: 'Temporarily Paused',
      color: 'amber',
      badgeClass: 'bg-amber-950/70 text-amber-300 border border-amber-500/30',
      pillClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-300',
    };
  }
  if (currentQueue === 0) {
    return {
      label: 'Zero Wait • Walk Straight In',
      shortLabel: '0 waiting',
      color: 'emerald',
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30',
      pillClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-400 animate-pulse',
      textClass: 'text-emerald-400',
    };
  }
  if (currentQueue <= 2) {
    return {
      label: 'Low Queue • Quick Turnaround',
      shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
      color: 'emerald',
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30',
      pillClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dotClass: 'bg-emerald-400 animate-pulse',
      textClass: 'text-emerald-400',
    };
  }
  if (currentQueue <= 6) {
    return {
      label: 'Moderate Queue • Normal Flow',
      shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
      color: 'amber',
      badgeClass: 'bg-amber-950/70 text-amber-300 border border-amber-500/30',
      pillClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-400',
    };
  }
  return {
    label: 'High Queue • Extended Wait',
    shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
    color: 'rose',
    badgeClass: 'bg-rose-950/70 text-rose-300 border border-rose-500/30',
    pillClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-400',
  };
};

export const getQueueFreshness = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 2) return { text: 'Updated just now', isStale: false, color: 'text-emerald-400', badgeClass: 'text-emerald-400 bg-emerald-500/10' };
  if (diffMins < 20) return { text: `Updated ${formatDuration(diffMins)} ago`, isStale: false, color: 'text-zinc-300', badgeClass: 'text-zinc-300 bg-zinc-800/80' };
  return { text: `Updated ${formatDuration(diffMins)} ago • Stale`, isStale: true, color: 'text-amber-400', badgeClass: 'text-amber-400 bg-amber-500/10 border border-amber-500/30' };
};
