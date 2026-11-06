import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Salon,
  Service,
  Review,
  LazyFilter,
  CustomerProfile,
  LocationOption,
  QueueEntry,
} from '@kumbhakaran/shared-types';
import {
  createQueueRequestFingerprint,
  createQueueRequestId,
  defaultApiClient,
  AuthUser,
} from '@kumbhakaran/api-client';
import { safeStorage } from '../utils/safeStorage';
import { calculateHaversineDistance } from '@kumbhakaran/ui';
import { INITIAL_SALONS, INITIAL_USER } from '../data/mockSalons';

// Explicitly sync API client base URL with Vite environment or production fallback
const configuredApiBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' && window.location?.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://kumbhakaran-salons.onrender.com/api/v1'
    : 'http://localhost:3001/api/v1');

defaultApiClient.setBaseUrl(configuredApiBaseUrl);

export type CustomerTab = 'home' | 'explore' | 'map' | 'favourites' | 'offers' | 'profile';
export type SalonType = 'unisex' | 'men' | 'women';
export type GenderFilter = 'men' | 'women';

export const getSalonType = (salon: Salon): SalonType => {
  if (salon.salonType) return salon.salonType;
  const combined = (
    salon.name + ' ' +
    (salon.tagline || '') + ' ' +
    (salon.services || []).map((s) => s.name + ' ' + s.category).join(' ')
  ).toLowerCase();

  if (
    combined.includes('ladies only') ||
    combined.includes('women only') ||
    combined.includes('beauty parlour') ||
    combined.includes('ladies beauty') ||
    combined.includes('women beauty')
  ) {
    return 'women';
  }

  if (
    (combined.includes('barber') ||
      combined.includes('gents') ||
      combined.includes('mens salon') ||
      combined.includes('men only')) &&
    !combined.includes('unisex')
  ) {
    return 'men';
  }

  return 'unisex';
};

export const matchesGenderFilter = (salon: Salon, filter: GenderFilter): boolean => {
  const type = getSalonType(salon);
  if (filter === 'men') {
    // Men filter includes Men-specific studios AND Unisex studios
    return type === 'men' || type === 'unisex';
  }
  if (filter === 'women') {
    // Women filter includes Women-specific studios AND Unisex studios
    return type === 'women' || type === 'unisex';
  }
  return true;
};

export const POPULAR_LOCATIONS: LocationOption[] = [
  { name: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245 },
  { name: 'Indiranagar, Bengaluru', lat: 12.9719, lng: 77.6412 },
  { name: 'HSR Layout, Bengaluru', lat: 12.9121, lng: 77.6446 },
  { name: 'BTM Layout, Bengaluru', lat: 12.9165, lng: 77.6101 },
  { name: 'Bellandur, Bengaluru', lat: 12.9260, lng: 77.6762 },
  { name: 'Whitefield, Bengaluru', lat: 12.9698, lng: 77.7500 },
  { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 },
];

interface CustomerContextType {
  salons: Salon[];
  activeSalonId: string;
  setActiveSalonId: (id: string) => void;
  activeSalon: Salon | null;
  isLoadingSalons: boolean;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;
  selectedSalonForDetail: Salon | null;
  setSelectedSalonForDetail: (salon: Salon | null) => void;
  userProfile: CustomerProfile;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  loginWithGoogle: (credential: string, clientId?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCustomerName: (name: string) => void;
  toggleFavorite: (salonId: string) => void;
  addToRecentlyViewed: (salonId: string) => void;
  addReview: (salonId: string, review: Omit<Review, 'id' | 'date'>) => void;
  userLocation: LocationOption | null;
  setUserLocation: (loc: LocationOption) => void;
  clearUserLocation: () => void;
  requestDeviceLocation: () => Promise<boolean>;
  lazyFilter: LazyFilter;
  setLazyFilter: (filter: LazyFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedServiceFilter: string;
  setSelectedServiceFilter: (service: string) => void;
  liveSimulatorActive: boolean;
  toggleLiveSimulator: () => void;
  comparisonList: string[];
  toggleCompareSalon: (salonId: string) => void;
  clearComparison: () => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
  notificationMessage: string | null;
  triggerNotification: (msg: string) => void;
  genderFilter: GenderFilter;
  setGenderFilter: (filter: GenderFilter) => void;
  queueEntries: QueueEntry[];
  activeTicket: QueueEntry | null;
  fetchSalonQueue: (salonId: string) => Promise<QueueEntry[]>;
  joinLiveQueue: (
    salonId: string,
    name: string,
    phone?: string,
    serviceName?: string,
    options?: { partySize?: number; checkInToken?: string | null },
  ) => Promise<QueueEntry>;
  confirmQueueArrival: (salonId: string, entryId: string, qrToken: string) => Promise<void>;
  setQueueLocationConsent: (salonId: string, entryId: string, enabled: boolean) => Promise<void>;
  observeQueueLocation: (salonId: string, entryId: string) => Promise<any>;
  respondToQueueDeparture: (salonId: string, entryId: string, response: 'left' | 'still_here' | 'returning') => Promise<void>;
  leaveLiveQueue: (salonId: string, entryId: string) => Promise<void>;
  reportSalonCrowd: (salonId: string, crowdLevel: 'empty' | 'medium' | 'busy') => Promise<void>;
  latestCrowdReport: any | null;
  fetchLatestCrowdReport: (salonId: string) => Promise<any | null>;
  submitLocationCrowdReport: (
    salonId: string,
    payload: {
      peopleCount: number;
      estimatedWaitMinutes: number;
      activeBarbers?: number;
      notes?: string;
    },
  ) => Promise<{ success: boolean; message: string; report?: any }>;
  isExpressWalkin: boolean;
  setIsExpressWalkin: (active: boolean) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const getOrCreateDeviceId = (): string => {
  try {
    let deviceId = safeStorage.getItem('kumbhakaran_device_id');
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      safeStorage.setItem('kumbhakaran_device_id', deviceId);
    }
    return deviceId;
  } catch {
    return `dev_${Date.now()}`;
  }
};

const loadStoredUserProfile = (): CustomerProfile => {
  try {
    const saved = safeStorage.getItem('kumbhakaran_customer_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const cleanName = parsed.name && parsed.name !== 'Guest User' ? parsed.name : '';
        return {
          ...INITIAL_USER,
          name: cleanName,
          avatar: parsed.avatar || INITIAL_USER.avatar,
          savedSalons: Array.isArray(parsed.savedSalons) ? parsed.savedSalons : [],
          recentlyViewed: Array.isArray(parsed.recentlyViewed) ? parsed.recentlyViewed : [],
          preferredLocality: parsed.preferredLocality || '',
          notifyOnShortQueue: parsed.notifyOnShortQueue ?? true,
          queueAlertThreshold: parsed.queueAlertThreshold ?? 2,
        };
      }
    }
  } catch {}
  return {
    ...INITIAL_USER,
    name: '',
  };
};


export interface UrlTargetInfo {
  salonId: string | null;
  autoJoin: boolean;
  serviceName: string | null;
  isExpressWalkin: boolean;
  checkInToken: string | null;
}

export function getTargetSalonFromUrl(): UrlTargetInfo {
  if (typeof window === 'undefined') {
    return { salonId: null, autoJoin: false, serviceName: null, isExpressWalkin: false, checkInToken: null };
  }
  try {
    const params = new URLSearchParams(window.location.search);
    let salonId = params.get('salon') || params.get('s') || params.get('id') || params.get('queue') || null;
    const autoJoin = params.get('join') === 'true' || params.get('action') === 'queue' || params.has('queue');
    const isExpressWalkin =
      params.get('walkin') === 'true' ||
      params.get('express') === 'true' ||
      params.get('checkin') === 'true' ||
      Boolean(params.get('checkin') && params.get('checkin') !== 'true') ||
      params.get('counter') === 'true';
    const checkInToken = params.get('checkin') && params.get('checkin') !== 'true' ? params.get('checkin') : null;
    const serviceName = params.get('service') || null;

    if (!salonId && window.location.pathname) {
      const match = window.location.pathname.match(/\/salon\/([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        salonId = match[1];
      }
    }

    if (!salonId && window.location.hash) {
      const match = window.location.hash.match(/#\/?salon[-/]([a-zA-Z0-9_-]+)/i);
      if (match && match[1]) {
        salonId = match[1];
      }
    }

    return { salonId, autoJoin, serviceName, isExpressWalkin, checkInToken };
  } catch {
    return { salonId: null, autoJoin: false, serviceName: null, isExpressWalkin: false, checkInToken: null };
  }
}

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salons, setSalons] = useState<Salon[]>(() => {
    try {
      const cached = safeStorage.getItem('kumbhakaran_cached_salons');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SALONS;
  });
  const [activeSalonId, setActiveSalonId] = useState<string>('salon-1');
  const [customerTab, setCustomerTabState] = useState<CustomerTab>(() => {
    try {
      const saved = safeStorage.getItem('kumbhakaran_customer_tab') as CustomerTab;
      if (saved && ['home', 'explore', 'saved', 'profile', 'compare'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'home';
  });

  const setCustomerTab = (tab: CustomerTab) => {
    setCustomerTabState(tab);
    try {
      safeStorage.setItem('kumbhakaran_customer_tab', tab);
    } catch {}
  };

  const [selectedSalonForDetail, setSelectedSalonForDetail] = useState<Salon | null>(null);
  const [isExpressWalkin, setIsExpressWalkin] = useState<boolean>(() => getTargetSalonFromUrl().isExpressWalkin);


  const [userProfile, setUserProfile] = useState<CustomerProfile>(loadStoredUserProfile);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const savedToken = safeStorage.getItem('kumbhakaran_customer_token');
      if (savedToken) {
        defaultApiClient.setAuthToken(savedToken);
      }
      const savedUser = safeStorage.getItem('kumbhakaran_customer_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.email || parsed.id)) return parsed;
      }
    } catch {}
    return null;
  });
  // Strictly take location from user only — never assume or force a default locality
  const [userLocation, setUserLocationState] = useState<LocationOption | null>(() => {
    try {
      const saved = safeStorage.getItem('kumbhakaran_user_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lng && parsed?.name) {
          // Automatically clear stale Bellandur / Bengaluru default from older versions
          if (
            parsed.name.toLowerCase().includes('bellandur') ||
            parsed.name.toLowerCase().includes('koramangala')
          ) {
            safeStorage.removeItem('kumbhakaran_user_location');
            return null;
          }
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const [lazyFilter, setLazyFilter] = useState<LazyFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('All');
  const [liveSimulatorActive, setLiveSimulatorActive] = useState<boolean>(false);
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isLoadingSalons, setIsLoadingSalons] = useState<boolean>(true);
  const [genderFilter, setGenderFilterState] = useState<GenderFilter>(() => {
    try {
      const saved = safeStorage.getItem('kumbhakaran_gender_filter');
      if (saved === 'men' || saved === 'women') return saved;
    } catch {}
    return 'men';
  });

  const setGenderFilter = (filter: GenderFilter) => {
    setGenderFilterState(filter);
    safeStorage.setItem('kumbhakaran_gender_filter', filter);
  };

  // Synchronize browser URL bar and back button navigation with selected salon
  const handleSetSelectedSalonForDetail = useCallback(
    (update: Salon | null | ((prev: Salon | null) => Salon | null)) => {
      setSelectedSalonForDetail((prev) => {
        const next = typeof update === 'function' ? update(prev) : update;
        if (typeof window !== 'undefined') {
          try {
            const url = new URL(window.location.href);
            if (next && next.id) {
              url.searchParams.set('salon', next.id);
              window.history.pushState({ salonId: next.id }, '', url.toString());
            } else {
              url.searchParams.delete('salon');
              url.searchParams.delete('s');
              url.searchParams.delete('id');
              url.searchParams.delete('queue');
              url.searchParams.delete('action');
              url.searchParams.delete('join');
              url.searchParams.delete('service');
              url.searchParams.delete('walkin');
              url.searchParams.delete('express');
              url.searchParams.delete('checkin');
              const cleanPath = url.pathname.startsWith('/salon/') ? '/' : url.pathname;
              window.history.pushState({}, '', cleanPath + (url.search ? url.search : ''));
            }
          } catch {}
        }
        return next;
      });
    },
    [],
  );

  // Check URL on startup for direct link or QR scan
  useEffect(() => {
    const { salonId } = getTargetSalonFromUrl();
    if (!salonId) return;

    let isMounted = true;

    // 1. Check if already in initial list
    const existing = salons.find((s) => s.id === salonId);
    if (existing) {
      setSelectedSalonForDetail(existing);
      return;
    }

    // 2. Fetch directly from database by ID so QR/link opens immediately anywhere
    defaultApiClient
      .getPublicSalonById(salonId)
      .then((res) => {
        if (!isMounted || !res || !res.id) return;
        const mapped = mapApiSalons([res], userLocation)[0];
        setSalons((prev) => {
          if (prev.some((s) => s.id === mapped.id)) return prev;
          return [mapped, ...prev];
        });
        setSelectedSalonForDetail(mapped);
      })
      .catch((err) => {
        console.warn('Could not load salon from direct link/QR:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to browser forward/back buttons for seamless navigation
  useEffect(() => {
    const onPopState = () => {
      const { salonId, isExpressWalkin: popExpress } = getTargetSalonFromUrl();
      setIsExpressWalkin(popExpress);
      if (salonId) {
        const found = salons.find((s) => s.id === salonId);
        if (found) {
          setSelectedSalonForDetail(found);
        } else {
          defaultApiClient.getPublicSalonById(salonId).then((res) => {
            if (res && res.id) {
              const mapped = mapApiSalons([res], userLocation)[0];
              setSelectedSalonForDetail(mapped);
            }
          }).catch(() => {});
        }
      } else {
        setSelectedSalonForDetail(null);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [salons, userLocation]);

  const setUserLocation = (loc: LocationOption) => {
    setUserLocationState(loc);
    safeStorage.setItem('kumbhakaran_user_location', JSON.stringify(loc));
  };

  const clearUserLocation = () => {
    setUserLocationState(null);
    safeStorage.removeItem('kumbhakaran_user_location');
  };

  const requestDeviceLocation = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      triggerNotification('Geolocation is not supported by your browser');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(5));
          const lng = Number(pos.coords.longitude.toFixed(5));
          let detectedName = `${lat}, ${lng}`;

          try {
            const nomRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
              { headers: { 'User-Agent': 'KumbhkaranSalons/1.0' } }
            );
            if (nomRes.ok) {
              const data = await nomRes.json();
              const addr = data.address || {};
              const loc = addr.suburb || addr.neighbourhood || addr.village || addr.county || '';
              const city = addr.city || addr.town || addr.district || '';
              if (loc && city && loc !== city) {
                detectedName = `${loc}, ${city}`;
              } else if (city) {
                detectedName = city;
              } else if (loc) {
                detectedName = loc;
              }
            }
          } catch {}

          const newLoc: LocationOption = {
            name: detectedName,
            lat,
            lng,
          };
          setUserLocation(newLoc);
          triggerNotification(`📍 Location detected: ${detectedName}`);
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err.message);
          triggerNotification('Location permission was denied. Please select or search your locality.');
          resolve(false);
        },
        { timeout: 10000, enableHighAccuracy: true },
      );
    });
  };

  const activeSalon = salons.find((s) => s.id === activeSalonId) || salons[0] || null;

  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [activeTicket, setActiveTicket] = useState<QueueEntry | null>(() => {
    try {
      const saved = safeStorage.getItem('kumbhakaran_customer_ticket');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const activeTicketRef = useRef<QueueEntry | null>(activeTicket);
  useEffect(() => {
    activeTicketRef.current = activeTicket;
  }, [activeTicket]);

  const selectedSalonRef = useRef<Salon | null>(selectedSalonForDetail);
  useEffect(() => {
    selectedSalonRef.current = selectedSalonForDetail;
  }, [selectedSalonForDetail]);

  const fetchSalonQueue = async (salonId: string): Promise<QueueEntry[]> => {
    try {
      const entries = await defaultApiClient.getQueueEntries(salonId);
      if (Array.isArray(entries)) {
        setQueueEntries(entries);
        // Verify user's active ticket
        const curTicket = activeTicketRef.current;
        if (curTicket && (curTicket.salonId === salonId || !curTicket.salonId)) {
          const match = entries.find((e: QueueEntry) => e.id === curTicket.id);
          if (match) {
            const privateStatus = curTicket.queueAccessToken
              ? await defaultApiClient.getQueueEntry(salonId, curTicket.id, curTicket.queueAccessToken)
              : null;
            const updatedTicket = { ...curTicket, ...match, ...(privateStatus || {}), salonId };
            setActiveTicket(updatedTicket);
            safeStorage.setItem('kumbhakaran_customer_ticket', JSON.stringify(updatedTicket));
          } else if (curTicket.salonId === salonId) {
            // Verify specific ticket status before clearing out
            try {
              const ticketStatus = await defaultApiClient.getQueueEntry(
                salonId,
                curTicket.id,
                curTicket.queueAccessToken,
              );
              if (ticketStatus && ticketStatus.status === 'completed') {
                triggerNotification('🎉 Service completed! Thank you for visiting.');
                setActiveTicket(null);
                safeStorage.removeItem('kumbhakaran_customer_ticket');
              } else if (ticketStatus && ticketStatus.status === 'cancelled') {
                triggerNotification('Your queue ticket was cancelled.');
                setActiveTicket(null);
                safeStorage.removeItem('kumbhakaran_customer_ticket');
              } else if (ticketStatus && ticketStatus.status) {
                const updatedTicket = { ...ticketStatus, salonId };
                setActiveTicket(updatedTicket);
                safeStorage.setItem('kumbhakaran_customer_ticket', JSON.stringify(updatedTicket));
              }
            } catch {
              // Network blip: keep current ticket!
            }
          }
        }
        return entries;
      }
    } catch (err) {
      console.warn('Failed to fetch salon queue:', err);
    }
    return [];
  };

  const broadcastTelemetryUpdate = (salonId: string, currentQueue?: number) => {
    try {
      const bc = new BroadcastChannel('kumbhakaran_telemetry');
      bc.postMessage({ type: 'QUEUE_UPDATE', salonId, currentQueue, timestamp: Date.now() });
      bc.close();
    } catch {}
  };

  const joinLiveQueue = async (
    salonId: string,
    name: string,
    phone?: string,
    serviceName?: string,
    options?: { partySize?: number; checkInToken?: string | null },
  ): Promise<QueueEntry> => {
    const deviceId = getOrCreateDeviceId();
    const requestFingerprint = await createQueueRequestFingerprint([
      authUser?.id || deviceId,
      deviceId,
      name.trim(),
      phone?.trim() || '',
      serviceName?.trim() || '',
      options?.partySize || 1,
    ]);
    const requestIdKey = `kumbhakaran_pending_queue_request:${salonId}:${requestFingerprint}`;
    const requestId = safeStorage.getItem(requestIdKey) || createQueueRequestId();
    safeStorage.setItem(requestIdKey, requestId);
    const res = await defaultApiClient.addQueueEntry(salonId, {
      requestId,
      customerName: name,
      phone,
      serviceName,
      deviceId,
      partySize: options?.partySize,
      checkInToken: options?.checkInToken || undefined,
    });
    if (res?.entry) {
      safeStorage.removeItem(requestIdKey);
      const entryWithSalon: QueueEntry = {
        ...res.entry,
        salonId,
        queueAccessToken: res.queueAccessToken,
        ...res.smartQueue,
      };
      setActiveTicket(entryWithSalon);
      safeStorage.setItem('kumbhakaran_customer_ticket', JSON.stringify(entryWithSalon));
      setQueueEntries((prev) => [...prev, entryWithSalon]);
      const newCount = res.currentQueue ?? 1;
      // Update local salon currentQueue & selectedSalonForDetail instantly
      setSalons((prev) =>
        prev.map((s) => (s.id === salonId ? { ...s, currentQueue: newCount, lastQueueUpdate: new Date().toISOString() } : s))
      );
      setSelectedSalonForDetail((prev) =>
        prev && prev.id === salonId
          ? { ...prev, currentQueue: newCount, lastQueueUpdate: new Date().toISOString() }
          : prev
      );
      broadcastTelemetryUpdate(salonId, newCount);
      fetchSalonQueue(salonId);
      triggerNotification(`🎉 You joined the queue! Ticket #${entryWithSalon.ticketNumber || entryWithSalon.position}`);
      return entryWithSalon;
    }
    throw new Error('Failed to join queue');
  };

  const leaveLiveQueue = async (salonId: string, entryId: string) => {
    try {
      const ticket = activeTicketRef.current;
      if (!ticket?.queueAccessToken || ticket.id !== entryId) {
        throw new Error('This ticket is missing its private access link. Rejoin using the salon QR code or contact salon staff.');
      }
      await defaultApiClient.cancelCustomerQueueEntry(salonId, entryId, ticket.queueAccessToken);
      setActiveTicket(null);
      safeStorage.removeItem('kumbhakaran_customer_ticket');
      setSalons((prev) =>
        prev.map((s) => (s.id === salonId ? { ...s, currentQueue: Math.max(0, s.currentQueue - 1), lastQueueUpdate: new Date().toISOString() } : s))
      );
      setSelectedSalonForDetail((prev) =>
        prev && prev.id === salonId
          ? { ...prev, currentQueue: Math.max(0, prev.currentQueue - 1), lastQueueUpdate: new Date().toISOString() }
          : prev
      );
      broadcastTelemetryUpdate(salonId);
      triggerNotification('You have left the queue.');
      await fetchSalonQueue(salonId);
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to leave queue');
    }
  };

  const confirmQueueArrival = async (salonId: string, entryId: string, qrToken: string) => {
    const ticket = activeTicketRef.current;
    if (!ticket?.queueAccessToken || ticket.id !== entryId) {
      throw new Error('This ticket is missing its private access link.');
    }
    const updated = await defaultApiClient.confirmCustomerQueueArrival(
      salonId,
      entryId,
      ticket.queueAccessToken,
      qrToken,
    );
    const nextTicket = { ...ticket, ...updated };
    setActiveTicket(nextTicket);
    safeStorage.setItem('kumbhakaran_customer_ticket', JSON.stringify(nextTicket));
    triggerNotification('You’re checked in at the salon. Your place in line is safe.');
  };

  const setQueueLocationConsent = async (salonId: string, entryId: string, enabled: boolean) => {
    const ticket = activeTicketRef.current;
    if (!ticket?.queueAccessToken || ticket.id !== entryId) {
      throw new Error('This ticket is missing its private access link.');
    }
    const result = await defaultApiClient.setCustomerQueueLocationConsent(
      salonId,
      entryId,
      ticket.queueAccessToken,
      enabled,
    );
    const nextTicket = { ...ticket, locationConsent: result.locationConsent };
    setActiveTicket(nextTicket);
    safeStorage.setItem('kumbhakaran_customer_ticket', JSON.stringify(nextTicket));
  };

  const observeQueueLocation = async (salonId: string, entryId: string) => {
    const ticket = activeTicketRef.current;
    if (!ticket?.queueAccessToken || ticket.id !== entryId) {
      throw new Error('This ticket is missing its private access link.');
    }
    if (!navigator.geolocation) throw new Error('Location is not available in this browser.');
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 12000,
      });
    });
    return defaultApiClient.submitCustomerQueueLocation(salonId, entryId, ticket.queueAccessToken, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracyMeters: position.coords.accuracy,
      observedAt: new Date(position.timestamp).toISOString(),
    });
  };

  const respondToQueueDeparture = async (
    salonId: string,
    entryId: string,
    response: 'left' | 'still_here' | 'returning',
  ) => {
    const ticket = activeTicketRef.current;
    if (!ticket?.queueAccessToken || ticket.id !== entryId) {
      throw new Error('This ticket is missing its private access link.');
    }
    const result = await defaultApiClient.respondToCustomerQueueDeparture(
      salonId,
      entryId,
      ticket.queueAccessToken,
      response,
    );
    if (response === 'left' || result.status === 'cancelled') {
      setActiveTicket(null);
      safeStorage.removeItem('kumbhakaran_customer_ticket');
      triggerNotification('You left the queue. Thanks for letting the salon know.');
      await fetchSalonQueue(salonId);
      return;
    }
    const updated = {
      ...ticket,
      departureDetectedAt: null,
      departureReviewRequired: false,
    };
    setActiveTicket(updated);
    safeStorage.setItem('kumbhakaran_customer_ticket', JSON.stringify(updated));
  };

  const [latestCrowdReport, setLatestCrowdReport] = useState<any | null>(null);

  const getCurrentGpsCoordinates = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation is not supported by your browser.'));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {
          reject(new Error('Please enable device location/GPS to verify you are at this salon.'));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const fetchLatestCrowdReport = async (salonId: string) => {
    try {
      const data = await defaultApiClient.getLatestCrowdReport(salonId);
      if (data && data.report) {
        setLatestCrowdReport(data.report);
        return data.report;
      }
      return null;
    } catch {
      return null;
    }
  };

  const submitLocationCrowdReport = async (
    salonId: string,
    payload: {
      peopleCount: number;
      estimatedWaitMinutes: number;
      activeBarbers?: number;
      notes?: string;
    },
  ) => {
    try {
      const coords = await getCurrentGpsCoordinates();
      const res = await defaultApiClient.submitCrowdReport(salonId, {
        latitude: coords.lat,
        longitude: coords.lng,
        peopleCount: payload.peopleCount,
        estimatedWaitMinutes: payload.estimatedWaitMinutes,
        activeBarbers: payload.activeBarbers,
        notes: payload.notes,
        customerName: userProfile.name || undefined,
      });

      if (res.report) {
        setLatestCrowdReport(res.report);
      }

      setSalons((prev) =>
        prev.map((s) =>
          s.id === salonId
            ? {
                ...s,
                currentQueue: payload.peopleCount,
                lastQueueUpdate: new Date().toISOString(),
              }
            : s,
        ),
      );

      setSelectedSalonForDetail((prev) =>
        prev && prev.id === salonId
          ? {
              ...prev,
              currentQueue: payload.peopleCount,
              lastQueueUpdate: new Date().toISOString(),
            }
          : prev,
      );

      broadcastTelemetryUpdate(salonId, payload.peopleCount);
      triggerNotification(
        res.message || '📍 Live status successfully verified & contributed!',
      );
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Failed to submit crowd status';
      triggerNotification(msg);
      throw err;
    }
  };

  const reportSalonCrowd = async (salonId: string, crowdLevel: 'empty' | 'medium' | 'busy') => {
    const peopleCount = crowdLevel === 'empty' ? 0 : crowdLevel === 'medium' ? 2 : 4;
    const estWait = crowdLevel === 'empty' ? 0 : crowdLevel === 'medium' ? 15 : 30;
    try {
      await submitLocationCrowdReport(salonId, {
        peopleCount,
        estimatedWaitMinutes: estWait,
      });
    } catch {}
  };

  const persistProfile = (updater: (prev: CustomerProfile) => CustomerProfile) => {
    setUserProfile((prev) => {
      const next = updater(prev);
      try {
        safeStorage.setItem('kumbhakaran_customer_profile', JSON.stringify(next));
        const deviceId = getOrCreateDeviceId();
        defaultApiClient
          .saveDeviceProfile({
            deviceId,
            name: next.name || undefined,
            savedSalons: next.savedSalons,
            recentlyViewed: next.recentlyViewed,
            genderFilter,
            preferredLocality: next.preferredLocality,
          })
          .catch(() => {});
      } catch (e) {
        console.error('Failed to persist user profile:', e);
      }
      return next;
    });
  };

  // Synchronize device profile mapping with server for cross-session continuity
  useEffect(() => {
    let isMounted = true;
    const deviceId = getOrCreateDeviceId();

    defaultApiClient
      .getDeviceProfile(deviceId)
      .then((deviceProfile) => {
        if (isMounted && deviceProfile) {
          setUserProfile((prev) => {
            const finalName =
              prev.name ||
              (deviceProfile.name && deviceProfile.name !== 'Guest User' ? deviceProfile.name : '');
            const mergedSaved = Array.from(
              new Set([...prev.savedSalons, ...(deviceProfile.savedSalons || [])]),
            );
            const mergedRecent = Array.from(
              new Set([...prev.recentlyViewed, ...(deviceProfile.recentlyViewed || [])]),
            );

            const updated: CustomerProfile = {
              ...prev,
              name: finalName,
              savedSalons: mergedSaved,
              recentlyViewed: mergedRecent,
              preferredLocality: prev.preferredLocality || deviceProfile.preferredLocality || '',
            };

            try {
              safeStorage.setItem('kumbhakaran_customer_profile', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [genderFilter]);

  // Restore authenticated session from localStorage
  useEffect(() => {
    let isMounted = true;
    const savedToken = safeStorage.getItem('kumbhakaran_customer_token');
    if (savedToken) {
      defaultApiClient.setAuthToken(savedToken);
      defaultApiClient.getCurrentUser().then((res: any) => {
        if (isMounted) {
          const freshUser = res?.user || (res?.email ? res : null);
          if (freshUser) {
            setAuthUser(freshUser);
            try {
              safeStorage.setItem('kumbhakaran_customer_user', JSON.stringify(freshUser));
            } catch {}
            persistProfile((prev) => ({
              ...prev,
              name: freshUser.name,
              avatar: freshUser.avatarUrl || prev.avatar,
            }));
          } else {
            setAuthUser(null);
            safeStorage.removeItem('kumbhakaran_customer_token');
            safeStorage.removeItem('kumbhakaran_customer_user');
          }
        }
      }).catch(() => {
        // Network timeout: retain optimistic session from localStorage
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithGoogle = async (credential: string, clientId?: string): Promise<boolean> => {
    try {
      const res = await defaultApiClient.loginWithGoogle(credential, clientId);
      if (res && res.accessToken) {
        safeStorage.setItem('kumbhakaran_customer_token', res.accessToken);
        safeStorage.setItem('kumbhakaran_customer_user', JSON.stringify(res.user));
        defaultApiClient.setAuthToken(res.accessToken);
        setAuthUser(res.user);
        persistProfile((prev) => ({
          ...prev,
          name: res.user.name,
          avatar: res.user.avatarUrl || prev.avatar,
        }));
        triggerNotification(`Welcome, ${res.user.name}!`);
        return true;
      }
    } catch (err: any) {
      console.error('Customer login error:', err);
      triggerNotification(err?.message || 'Google Sign-In failed. Please try again.');
      return false;
    }
    triggerNotification('Google Sign-In failed. Please try again.');
    return false;
  };

  const logout = async () => {
    try {
      await defaultApiClient.logout();
    } catch {
      // Ignore network errors on logout
    }
    safeStorage.removeItem('kumbhakaran_customer_token');
    safeStorage.removeItem('kumbhakaran_customer_user');
    safeStorage.removeItem('kumbhakaran_customer_tab');
    defaultApiClient.setAuthToken(null);
    setAuthUser(null);
    triggerNotification('Signed out successfully');
  };

  // Helper to map API salon records with dynamic Haversine distance
  const mapApiSalons = (apiList: any[], loc: LocationOption | null): Salon[] => {
    return apiList.map((item) => {
      const calculatedDist = loc
        ? calculateHaversineDistance(loc.lat, loc.lng, item.latitude, item.longitude)
        : null;
      const dist = calculatedDist ?? item.distanceKm;

      const locImgs = Array.isArray(item.locationImages) ? item.locationImages : [];
      const workImgs = Array.isArray(item.workImages) ? item.workImages : [];
      const effectiveCover = item.coverImage || item.posterImage || locImgs[0] || workImgs[0] || '';
      const allImgs = Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : [
            ...(effectiveCover ? [effectiveCover] : []),
            ...locImgs,
            ...workImgs,
          ].filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);

      return {
        id: item.id,
        name: item.name,
        tagline: item.tagline || 'Verified Kumbhakaran Salon Partner',
        coverImage: effectiveCover,
        posterImage: item.posterImage || effectiveCover,
        loopVideoUrl: item.loopVideoUrl || '',
        images: allImgs,
        locationImages: locImgs,
        workImages: workImgs,
        rating: Number(item.rating) || 5.0,
        reviewCount: Number(item.reviewCount) || 0,
        currentQueue: item.currentQueue,
        avgServiceTimeMinutes: 20,
        activeBarbers: 2,
        distanceKm: dist,
        startingPrice: Number(item.startingPrice) || 150,
        isOpen: item.isOpen,
        queueStatus: item.queueStatus || (item.isOpen ? 'open' : 'closed'),
        openingHours: {
          open: '09:00 AM',
          close: '09:30 PM',
          formatted: '09:00 AM – 09:30 PM (All Days)',
        },
        address: `${item.locality}, ${item.city}`,
        locality: item.locality,
        city: item.city,
        pincode: '560001',
        coordinates: {
          lat: item.latitude,
          lng: item.longitude,
        },
        phone: '+91 98000 00000',
        lastQueueUpdate: item.lastQueueUpdate,
        services: item.services && item.services.length > 0
          ? item.services
          : [
              { id: `svc-${item.id}-1`, name: 'Signature Haircut', category: 'Hair', price: Number(item.startingPrice) || 150, durationMinutes: 25, isAvailable: true, description: 'Master stylist haircut' },
            ],
        staff: (item as any).staff || [],
        ratingBreakdown: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 5, pricing: 5, overallExperience: 5 },
        reviews: (() => {
          let cached: Review[] = [];
          if (typeof window !== 'undefined') {
            try {
              const raw: Review[] = JSON.parse(safeStorage.getItem(`kumbhakaran_reviews_${item.id}`) || '[]');
              const seen = new Set<string>();
              cached = raw.filter((r) => {
                const sig = `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}`;
                if (seen.has(sig)) return false;
                seen.add(sig);
                return true;
              });
              if (cached.length !== raw.length) {
                safeStorage.setItem(`kumbhakaran_reviews_${item.id}`, JSON.stringify(cached));
              }
            } catch {}
          }
          return cached;
        })(),
        isVerified: item.isVerified,
        status: 'active',
        todayCustomersServed: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
      };
    });
  };

  // Synchronize discovery with NestJS PostGIS Backend & dynamic Haversine distance engine
  useEffect(() => {
    let isMounted = true;

    const queryLat = userLocation?.lat;
    const queryLng = userLocation?.lng;
    const queryRadius = userLocation ? 25 : undefined;

    const fetchSalons = async (isInitial = false) => {
      if (isInitial && isMounted) setIsLoadingSalons(true);
      try {
        let res = await defaultApiClient.getNearbySalons(queryLat, queryLng, queryRadius, lazyFilter);
        let discoveredSalons = res?.salons || [];

        // If local radius returns fewer than 3 studios or none, fetch all studios across India so customers & owners can always discover newly onboarded studios
        if (discoveredSalons.length < 3) {
          const nationalRes = await defaultApiClient.getNearbySalons(undefined, undefined, undefined, lazyFilter);
          if (nationalRes?.salons && nationalRes.salons.length > 0) {
            const existingIds = new Set(discoveredSalons.map((s) => s.id));
            const additional = nationalRes.salons.filter((s) => !existingIds.has(s.id));
            discoveredSalons = [...discoveredSalons, ...additional];
          }
        }

        if (isMounted) {
          if (discoveredSalons.length > 0) {
            const mapped = mapApiSalons(discoveredSalons, userLocation);
            setSalons(mapped);
            try {
              safeStorage.setItem('kumbhakaran_cached_salons', JSON.stringify(mapped));
            } catch {}

            // Also keep selectedSalonForDetail live if customer is viewing a modal or direct link
            const targetId = getTargetSalonFromUrl().salonId;
            setSelectedSalonForDetail((prev) => {
              if (!prev) {
                if (targetId) {
                  const match = mapped.find((m) => m.id === targetId);
                  if (match) return match;
                }
                return prev;
              }
              const match = mapped.find((m) => m.id === prev.id);
              if (!match) return prev;
              return {
                ...prev,
                currentQueue: match.currentQueue,
                lastQueueUpdate: match.lastQueueUpdate,
                isOpen: match.isOpen,
                queueStatus: match.queueStatus,
              };
            });
          }
        }
      } catch (err) {
        console.warn('Discovery API call failed (retaining cached salons):', err);
      } finally {
        if (isInitial && isMounted) {
          setIsLoadingSalons(false);
        }
      }
    };

    // Initial fetch
    fetchSalons(true);

    // Socket updates are immediate; five-second polling is a resilient fallback.
    const intervalId = setInterval(() => {
      fetchSalons(false);
      // Auto-poll active queue ticket in real-time
      if (activeTicketRef.current?.salonId) {
        fetchSalonQueue(activeTicketRef.current.salonId);
      } else if (selectedSalonRef.current?.id) {
        fetchSalonQueue(selectedSalonRef.current.id);
      }
    }, 5000);

    // Immediate sync on tab focus or screen unlock
    const onFocus = () => fetchSalons(false);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchSalons(false);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    // 0ms instant cross-tab telemetry sync
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('kumbhakaran_telemetry');
      bc.onmessage = (ev) => {
        if (ev?.data?.type === 'QUEUE_UPDATE') {
          fetchSalons(false);
          if (ev.data.salonId) {
            fetchSalonQueue(ev.data.salonId);
          }
        }
      };
    } catch {}

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, [userLocation, lazyFilter]);

  // Synchronize salon profile and public reviews from PostgreSQL database
  useEffect(() => {
    if (!selectedSalonForDetail?.id) return;
    let isMounted = true;
    const salonId = selectedSalonForDetail.id;

    defaultApiClient.getPublicSalonById(salonId).then((publicData) => {
      if (!isMounted || !publicData) return;

      // Read any locally cached customer reviews
      let localReviews: Review[] = [];
      try {
        localReviews = JSON.parse(safeStorage.getItem(`kumbhakaran_reviews_${salonId}`) || '[]');
      } catch {}

      // Format database reviews
      const dbReviews: Review[] = (publicData.reviews || []).map((r: any) => ({
        id: r.id,
        customerName: r.customerName || r.customer_name,
        customerAvatar: r.customerAvatar || r.customer_avatar,
        rating: Number(r.rating),
        comment: r.comment,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
        verifiedVisit: Boolean(r.verifiedVisit !== undefined ? r.verifiedVisit : r.verified_visit),
        criteria: r.criteria || {
          haircutQuality: Number(r.rating) || 5,
          staffBehaviour: Number(r.rating) || 5,
          cleanliness: Number(r.rating) || 5,
          pricing: Number(r.rating) || 5,
          overallExperience: Number(r.rating) || 5,
        },
        ownerReply: r.ownerReply || r.owner_reply,
      }));

      // Merge and deduplicate reviews: Database reviews are authoritative
      const getContentKey = (r: { customerName?: string; comment?: string }) =>
        `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}`;

      const dbContentKeys = new Set(dbReviews.map(getContentKey));
      const unsyncedLocalReviews = localReviews.filter(
        (lr) => !dbContentKeys.has(getContentKey(lr))
      );
      const combinedReviews = [...unsyncedLocalReviews, ...dbReviews];

      // Synchronize safeStorage so stale or duplicate local copies are immediately purged
      safeStorage.setItem(`kumbhakaran_reviews_${salonId}`, JSON.stringify(combinedReviews));

      setSelectedSalonForDetail((prev) => {
        if (!prev || prev.id !== salonId) return prev;
        return {
          ...prev,
          rating: Number(publicData.rating) || prev.rating,
          reviewCount: Math.max(combinedReviews.length, Number(publicData.reviewCount) || prev.reviewCount),
          reviews: combinedReviews,
          currentQueue: publicData.currentQueue !== undefined ? publicData.currentQueue : prev.currentQueue,
          isOpen: publicData.isOpen !== undefined ? publicData.isOpen : prev.isOpen,
          queueStatus: publicData.queueStatus || prev.queueStatus,
          coverImage: (publicData as any).coverImage || prev.coverImage,
          posterImage: (publicData as any).posterImage || (publicData as any).coverImage || prev.posterImage,
          loopVideoUrl: (publicData as any).loopVideoUrl || prev.loopVideoUrl,
          images: ((publicData as any).images && (publicData as any).images.length > 0) ? (publicData as any).images : prev.images,
          locationImages: (publicData as any).locationImages || prev.locationImages,
          workImages: (publicData as any).workImages || prev.workImages,
          mediaGallery: (publicData as any).mediaGallery || prev.mediaGallery,
        };
      });

      setSalons((prev) =>
        prev.map((s) => {
          if (s.id !== salonId) return s;
          return {
            ...s,
            rating: Number(publicData.rating) || s.rating,
            reviewCount: Math.max(combinedReviews.length, Number(publicData.reviewCount) || s.reviewCount),
            reviews: combinedReviews,
            currentQueue: publicData.currentQueue !== undefined ? publicData.currentQueue : s.currentQueue,
            isOpen: publicData.isOpen !== undefined ? publicData.isOpen : s.isOpen,
            queueStatus: publicData.queueStatus || s.queueStatus,
            coverImage: (publicData as any).coverImage || s.coverImage,
            posterImage: (publicData as any).posterImage || (publicData as any).coverImage || s.posterImage,
            loopVideoUrl: (publicData as any).loopVideoUrl || s.loopVideoUrl,
            images: ((publicData as any).images && (publicData as any).images.length > 0) ? (publicData as any).images : s.images,
            locationImages: (publicData as any).locationImages || s.locationImages,
            workImages: (publicData as any).workImages || s.workImages,
            mediaGallery: (publicData as any).mediaGallery || s.mediaGallery,
          };
        }),
      );
    });

    return () => {
      isMounted = false;
    };
  }, [selectedSalonForDetail?.id]);

  const updateCustomerName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    persistProfile((prev) => ({
      ...prev,
      name: trimmed,
    }));
    triggerNotification(`Name saved as "${trimmed}"`);
  };

  const toggleFavorite = (salonId: string) => {
    persistProfile((prev) => {
      const exists = prev.savedSalons.includes(salonId);
      const nextSaved = exists
        ? prev.savedSalons.filter((id) => id !== salonId)
        : [...prev.savedSalons, salonId];
      const salon = salons.find((s) => s.id === salonId);
      triggerNotification(
        exists ? `Removed ${salon?.name || 'salon'} from Favourites` : `Added ${salon?.name || 'salon'} to Favourites ❤️`,
      );
      return { ...prev, savedSalons: nextSaved };
    });
  };

  const addToRecentlyViewed = (salonId: string) => {
    persistProfile((prev) => {
      const filtered = prev.recentlyViewed.filter((id) => id !== salonId);
      return { ...prev, recentlyViewed: [salonId, ...filtered].slice(0, 8) };
    });
  };

  const addReview = async (salonId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    const cleanComment = (reviewData.comment || '').trim();
    const cleanName = (reviewData.customerName || '').trim() || 'Anonymous Customer';

    // 1. Persist to PostgreSQL backend database
    let createdReviewId = `rev-${Date.now()}`;
    let createdDate = 'Just now';

    try {
      const persisted = await defaultApiClient.submitSalonReview(salonId, {
        customerName: cleanName,
        customerAvatar: reviewData.customerAvatar,
        rating: reviewData.rating,
        comment: cleanComment,
        verifiedVisit: reviewData.verifiedVisit,
        criteria: reviewData.criteria,
      });

      if (persisted && persisted.id) {
        createdReviewId = persisted.id;
        if (persisted.createdAt) {
          createdDate = new Date(persisted.createdAt).toLocaleDateString();
        }
      }
    } catch (err) {
      console.warn('Backend review submission warning:', err);
    }

    const newReview: Review = {
      ...reviewData,
      customerName: cleanName,
      comment: cleanComment,
      id: createdReviewId,
      date: createdDate,
    };

    const contentKey = `${cleanName.toLowerCase()}|${cleanComment.toLowerCase()}`;

    // 2. Cache cleanly in localStorage with deduplication
    if (typeof window !== 'undefined') {
      try {
        const key = `kumbhakaran_reviews_${salonId}`;
        const existing: Review[] = JSON.parse(safeStorage.getItem(key) || '[]');
        const filtered = existing.filter(
          (r) => `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}` !== contentKey && r.id !== newReview.id
        );
        safeStorage.setItem(key, JSON.stringify([newReview, ...filtered]));
      } catch (e) {
        console.warn('Failed to cache review in storage:', e);
      }
    }

    // 3. Immediately update selectedSalonForDetail if currently viewing this exact salon
    setSelectedSalonForDetail((prev) => {
      if (!prev || prev.id !== salonId) return prev;
      const existingReviews = (prev.reviews || []).filter(
        (r) => `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}` !== contentKey && r.id !== createdReviewId
      );
      const nextReviews = [newReview, ...existingReviews];
      const newCount = nextReviews.length;
      const newRating = Number(
        (nextReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / newCount).toFixed(1)
      );
      return {
        ...prev,
        reviews: nextReviews,
        reviewCount: newCount,
        rating: newRating,
      };
    });

    // 4. Update local React state for this specific salon only
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const existingReviews = (s.reviews || []).filter(
          (r) => `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}` !== contentKey && r.id !== createdReviewId
        );
        const nextReviews = [newReview, ...existingReviews];
        const newCount = nextReviews.length;
        const newRating = Number(
          (nextReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / newCount).toFixed(1)
        );
        return {
          ...s,
          reviews: nextReviews,
          reviewCount: newCount,
          rating: newRating,
        };
      })
    );

    // 5. In background, re-fetch public salon data to sync server-side computed aggregates
    defaultApiClient.getPublicSalonById(salonId).then((freshPublic) => {
      if (freshPublic && Array.isArray(freshPublic.reviews)) {
        const dbReviews: Review[] = freshPublic.reviews.map((r: any) => ({
          id: r.id,
          customerName: r.customerName || r.customer_name,
          customerAvatar: r.customerAvatar || r.customer_avatar,
          rating: Number(r.rating),
          comment: r.comment,
          date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent',
          verifiedVisit: Boolean(r.verifiedVisit !== undefined ? r.verifiedVisit : r.verified_visit),
          criteria: r.criteria,
          ownerReply: r.ownerReply || r.owner_reply,
        }));
        safeStorage.setItem(`kumbhakaran_reviews_${salonId}`, JSON.stringify(dbReviews));
        setSelectedSalonForDetail((prev) => (prev && prev.id === salonId ? { ...prev, reviews: dbReviews, rating: Number(freshPublic.rating) || prev.rating, reviewCount: Number(freshPublic.reviewCount) || dbReviews.length } : prev));
        setSalons((prev) => prev.map((s) => (s.id === salonId ? { ...s, reviews: dbReviews, rating: Number(freshPublic.rating) || s.rating, reviewCount: Number(freshPublic.reviewCount) || dbReviews.length } : s)));
      }
    }).catch(() => {});

    triggerNotification('Thank you! Your verified review has been published.');
  };

  const toggleLiveSimulator = () => {
    setLiveSimulatorActive((prev) => !prev);
    triggerNotification(liveSimulatorActive ? 'Live queue updates paused' : 'Live queue updates active');
  };

  const toggleCompareSalon = (salonId: string) => {
    setComparisonList((prev) => {
      if (prev.includes(salonId)) {
        return prev.filter((id) => id !== salonId);
      }
      if (prev.length >= 3) {
        triggerNotification('You can compare a maximum of 3 salons at once');
        return prev;
      }
      return [...prev, salonId];
    });
  };

  const clearComparison = () => {
    setComparisonList([]);
  };

  return (
    <CustomerContext.Provider
      value={{
        salons,
        activeSalonId,
        setActiveSalonId,
        activeSalon,
        isLoadingSalons,
        customerTab,
        setCustomerTab,
        selectedSalonForDetail,
        setSelectedSalonForDetail: handleSetSelectedSalonForDetail,
        userProfile,
        authUser,
        isAuthenticated: Boolean(authUser),
        loginWithGoogle,
        logout,
        updateCustomerName,
        toggleFavorite,
        addToRecentlyViewed,
        addReview,
        userLocation,
        setUserLocation,
        clearUserLocation,
        requestDeviceLocation,
        lazyFilter,
        setLazyFilter,
        searchQuery,
        setSearchQuery,
        selectedServiceFilter,
        setSelectedServiceFilter,
        liveSimulatorActive,
        toggleLiveSimulator,
        comparisonList,
        toggleCompareSalon,
        clearComparison,
        isCompareOpen,
        setIsCompareOpen,
        notificationMessage,
        triggerNotification,
        genderFilter,
        setGenderFilter,
        queueEntries,
        activeTicket,
        fetchSalonQueue,
        joinLiveQueue,
        confirmQueueArrival,
        setQueueLocationConsent,
        observeQueueLocation,
        respondToQueueDeparture,
        leaveLiveQueue,
        reportSalonCrowd,
        latestCrowdReport,
        fetchLatestCrowdReport,
        submitLocationCrowdReport,
        isExpressWalkin,
        setIsExpressWalkin,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

// Aliased helper export for compatibility
export const useSalon = useCustomer;

export const getEstimatedWaitMinutes = (currentQueue: number, avgServiceTime: number, activeBarbers: number): number => {
  if (currentQueue <= 0) return 0;
  const barbers = Math.max(1, activeBarbers || 2);
  const time = avgServiceTime || 20;
  return Math.max(5, Math.ceil((currentQueue * time) / barbers));
};

export const getQueueDisplay = (
  currentQueue: number,
  isOpen: boolean,
  queueStatus?: 'open' | 'paused' | 'closed',
) => {
  if (!isOpen) {
    return {
      label: 'Closed',
      shortLabel: 'Closed',
      color: 'slate',
      badgeClass: 'bg-stone-100 text-stone-600 border border-stone-200',
      pillClass: 'bg-stone-100 text-stone-600 border-stone-200',
      dotClass: 'bg-stone-400',
      textClass: 'text-stone-500',
    };
  }
  if (queueStatus === 'paused') {
    return {
      label: 'Queue Temporarily Paused',
      shortLabel: 'Temporarily Paused',
      color: 'amber',
      badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
      pillClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
      textClass: 'text-amber-700',
    };
  }
  if (currentQueue === 0) {
    return {
      label: 'Zero Wait • Walk Straight In',
      shortLabel: '0 waiting',
      color: 'emerald',
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500 animate-pulse',
      textClass: 'text-emerald-700',
    };
  }
  if (currentQueue <= 2) {
    return {
      label: 'Low Queue • Quick Turnaround',
      shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
      color: 'emerald',
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dotClass: 'bg-emerald-500 animate-pulse',
      textClass: 'text-emerald-700',
    };
  }
  if (currentQueue <= 6) {
    return {
      label: 'Moderate Queue • Normal Flow',
      shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
      color: 'amber',
      badgeClass: 'bg-orange-50 text-orange-800 border border-orange-200',
      pillClass: 'bg-orange-50 text-orange-700 border-orange-200',
      dotClass: 'bg-orange-500',
      textClass: 'text-orange-700',
    };
  }
  return {
    label: 'High Queue • Extended Wait',
    shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-700',
  };
};

export const getQueueFreshness = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 2) return { text: 'Updated just now', isStale: false, color: 'text-emerald-700', badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200' };
  if (diffMins < 6) return { text: `Updated ${diffMins} mins ago`, isStale: false, color: 'text-stone-700', badgeClass: 'text-stone-700 bg-stone-100 border border-stone-200' };
  if (diffMins < 20) return { text: `Updated ${diffMins} mins ago`, isStale: false, color: 'text-stone-600', badgeClass: 'text-stone-600 bg-stone-100 border border-stone-200' };
  return { text: `Updated ${diffMins}m ago • Stale`, isStale: true, color: 'text-orange-700', badgeClass: 'text-orange-700 bg-orange-50 border border-orange-200' };
};
