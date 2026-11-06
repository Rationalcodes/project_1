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
import { defaultApiClient, AuthUser, SalonMembership } from '@kumbhakaran/api-client';
import { safeStorage } from '../utils/safeStorage';
import { INITIAL_SALONS } from '../data/mockSalons';

// Explicitly sync API client base URL with Vite environment or production fallback
const configuredApiBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' && window.location?.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://kumbhakaran-salons.onrender.com/api/v1'
    : 'http://localhost:3001/api/v1');

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
      if (saved && ['live-queue', 'services', 'staff', 'analytics', 'reviews', 'settings', 'register-new', 'register'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'live-queue';
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
    try {
      const entries = await defaultApiClient.getPartnerQueueEntries(sId);
      if (Array.isArray(entries)) {
        setQueueEntries(entries);
        // Only increase currentQueue if digital tickets exceed manual queue count
        // Never forcibly reset or wipe out manual walk-in queue counter to 0
        setSalons((prev) =>
          prev.map((s) => {
            if (s.id !== sId) return s;
            const waitingCount = entries.filter((e: any) => e.status === 'waiting' || e.status === 'called').length;
            if (waitingCount !== s.currentQueue) {
              const updated = { ...s, currentQueue: waitingCount, lastQueueUpdate: new Date().toISOString() };
              safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
              return updated;
            }
            return s;
          }),
        );
      }
    } catch (err) {
      console.warn('Failed to fetch live queue entries:', err);
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

  // Socket updates are immediate; poll periodically as a resilient fallback.
  useEffect(() => {
    if (!activeSalonId) return;
    refreshQueueEntries(activeSalonId);
    const interval = setInterval(() => {
      refreshQueueEntries(activeSalonId);
    }, 5000);

    const onFocus = () => refreshQueueEntries(activeSalonId);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshQueueEntries(activeSalonId);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('kumbhakaran_telemetry');
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'QUEUE_UPDATE' && (!ev.data.salonId || ev.data.salonId === activeSalonId)) {
          refreshQueueEntries(activeSalonId);
        }
      };
    } catch {}

    return () => {
      clearInterval(interval);
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
      const res = await defaultApiClient.addQueueEntry(sId, {
        customerName: name,
        phone,
        serviceName,
      });
      if (res?.entry) {
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
        setPartnerView('live-queue');
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
          setPartnerView('live-queue');
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
          setPartnerView('live-queue');
          return normalized;
        }
      }
    } catch {}

    // No salon found yet: prompt registration for this account
    setSalons([]);
    setActiveSalonId('');
    setPartnerView('register');
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
        } else {
          // Invalidate session if token rejected
          setPartnerUser(null);
          safeStorage.removeItem('kumbhakaran_partner_token');
          safeStorage.removeItem('kumbhakaran_partner_user');
        }
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
      featured: true,
      isVerified: true,
      status: 'active',
      todayCustomersServed: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
    };

    setSalons((prev) => [newSalon, ...prev.filter((s) => s.id !== newId)]);
    setActiveSalonId(newId);
    setPartnerView('live-queue');
    safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(newSalon));
    triggerNotification(`🎉 Salon "${newSalon.name}" registered successfully! Your live walk-in queue is ready.`);

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
    } catch (err) {
      console.warn('Failed to sync queue update with backend:', err);
    }
  };

  const updateSalonInfo = (salonId: string, updates: Partial<Salon>) => {
    if (updates.isOpen !== undefined) {
      void defaultApiClient.updateSalon(salonId, updates).then((result) => {
        if (!result?.success) {
          throw new Error('Could not update the salon queue status. Please retry.');
        }
        const effectiveIsOpen =
          typeof result.isOpen === 'boolean' ? result.isOpen : updates.isOpen;
        const effectiveQueueStatus =
          result.queueStatus || (effectiveIsOpen ? 'open' : 'closed');
        setSalons((prev) =>
          prev.map((s) => {
            if (s.id !== salonId) return s;
            const updated = normalizeSalon({
              ...s,
              ...updates,
              isOpen: effectiveIsOpen,
              queueStatus: effectiveQueueStatus,
              ...(effectiveIsOpen === false ? { currentQueue: 0 } : {}),
            });
            safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
            return updated;
          }),
        );
        if (effectiveIsOpen === false) {
          setQueueEntries([]);
          broadcastTelemetryUpdate(salonId, 0);
        } else {
          void refreshQueueEntries(salonId);
        }
        triggerNotification(effectiveIsOpen ? 'Salon is open for walk-ins.' : 'Salon is closed.');
      }).catch((error: unknown) => {
        triggerNotification(error instanceof Error ? error.message : 'Could not update the salon queue status.');
      });
      return;
    }

    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = normalizeSalon({
          ...s,
          ...updates,
          ...(updates.isOpen === false ? { currentQueue: 0 } : {}),
        });
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );
    defaultApiClient.updateSalon(salonId, updates);

    // If salon is being closed, clear active queue in local state & broadcast 0 queue count
    if (updates.isOpen === false) {
      setQueueEntries([]);
      defaultApiClient.clearQueueEntries(salonId).catch((err) => {
        triggerNotification(err instanceof Error ? err.message : 'Failed to clear the queue');
      });
      broadcastTelemetryUpdate(salonId, 0);
    }

    triggerNotification('Salon information and media updated successfully');
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

  const addStaff = (salonId: string, staffData: Omit<Staff, 'id'>) => {
    const newMember: Staff = {
      ...staffData,
      id: `st-${Date.now()}`,
    };
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = { ...s, staff: [...(s.staff || []), newMember] };
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );
    triggerNotification(`Stylist ${newMember.name} added to roster`);
  };

  const updateStaff = (salonId: string, staffId: string, updates: Partial<Staff>) => {
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
  };

  const deleteStaff = (salonId: string, staffId: string) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = { ...s, staff: (s.staff || []).filter((st) => st.id !== staffId) };
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );
    triggerNotification('Staff member removed');
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

export const getQueueDisplay = (currentQueue: number, isOpen: boolean, queueStatus?: Salon['queueStatus']) => {
  if (!isOpen) {
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
  if (diffMins < 6) return { text: `Updated ${diffMins} mins ago`, isStale: false, color: 'text-zinc-300', badgeClass: 'text-zinc-300 bg-zinc-800/80' };
  if (diffMins < 20) return { text: `Updated ${diffMins} mins ago`, isStale: false, color: 'text-zinc-400', badgeClass: 'text-zinc-400 bg-zinc-800/60' };
  return { text: `Updated ${diffMins}m ago • Stale`, isStale: true, color: 'text-amber-400', badgeClass: 'text-amber-400 bg-amber-500/10 border border-amber-500/30' };
};
