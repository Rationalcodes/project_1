import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Salon,
  Service,
  Staff,
  Review,
  PartnerView,
  SalonRegistrationInput,
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
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  salons: Salon[];
  activeSalonId: string;
  setActiveSalonId: (id: string) => void;
  activeSalon: Salon | null;
  partnerView: PartnerView;
  setPartnerView: (view: PartnerView) => void;
  ownerTab: PartnerView;
  setOwnerTab: (view: PartnerView) => void;
  registerSalon: (data: SalonRegistrationInput) => Salon;
  updateQueue: (salonId: string, delta: number, manualValue?: number) => void;
  updateSalonInfo: (salonId: string, updates: Partial<Salon>) => void;
  addService: (salonId: string, service: Omit<Service, 'id'>) => void;
  updateService: (salonId: string, serviceId: string, updates: Partial<Service>) => void;
  deleteService: (salonId: string, serviceId: string) => void;
  addStaff: (salonId: string, staffMember: Omit<Staff, 'id'>) => void;
  updateStaff: (salonId: string, staffId: string, updates: Partial<Staff>) => void;
  deleteStaff: (salonId: string, staffId: string) => void;
  replyToReview: (salonId: string, reviewId: string, replyComment: string) => void;
  notificationMessage: string | null;
  triggerNotification: (msg: string) => void;
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
        reviewsCount: Number(st.reviewsCount || 15),
        avatarUrl: st.avatarUrl || st.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        photo: st.photo || st.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        status: st.status || 'active',
        isAvailable: st.status === 'active' || st.isAvailable !== false,
      }))
    : [
        {
          id: `staff-${raw.id}-1`,
          name: raw.ownerName || 'Lead Stylist',
          role: 'Master Barber',
          experience: '5+ Years',
          specialization: 'Classic Fades, Beard Grooming',
          rating: 5.0,
          reviewsCount: 18,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          status: 'active',
          isAvailable: true,
        },
        {
          id: `staff-${raw.id}-2`,
          name: 'Senior Stylist',
          role: 'Hair & Beard Specialist',
          experience: '3 Years',
          specialization: 'Modern Cuts & Hair Spa',
          rating: 4.9,
          reviewsCount: 14,
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
          status: 'active',
          isAvailable: true,
        },
      ];

  return {
    ...raw,
    openingHours,
    coordinates: raw.coordinates || {
      lat: Number(raw.latitude || 28.6139),
      lng: Number(raw.longitude || 77.2090),
    },
    staff,
    services: Array.isArray(raw.services) ? raw.services : [],
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
    images: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : [
      raw.coverImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80'
    ],
    locationImages: Array.isArray(raw.locationImages) ? raw.locationImages : [],
    workImages: Array.isArray(raw.workImages) ? raw.workImages : [],
    mediaGallery: Array.isArray(raw.mediaGallery) ? raw.mediaGallery : [],
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

  const [partnerView, setPartnerView] = useState<PartnerView>(() => {
    try {
      const cached = safeStorage.getItem('kumbhakaran_partner_active_salon');
      if (cached) return 'live-queue';
    } catch {}
    return 'live-queue';
  });

  const [partnerUser, setPartnerUser] = useState<AuthUser | null>(() => {
    try {
      const cached = safeStorage.getItem('kumbhakaran_partner_user');
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });

  const [memberships, setMemberships] = useState<SalonMembership[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const activeSalon = salons.find((s) => s.id === activeSalonId) || salons[0] || null;

  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
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
      defaultApiClient.getCurrentUser().then(async (res) => {
        if (!isMounted) return;
        if (res?.user) {
          setPartnerUser(res.user);
          setMemberships(res.memberships || []);
          safeStorage.setItem('kumbhakaran_partner_user', JSON.stringify(res.user));
          await loadUserSalon(res.user, res.memberships);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [loadUserSalon]);

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const res = await defaultApiClient.loginWithGoogle(credential);
      if (res && res.accessToken) {
        safeStorage.setItem('kumbhakaran_partner_token', res.accessToken);
        safeStorage.setItem('kumbhakaran_partner_user', JSON.stringify(res.user));
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
    defaultApiClient.setAuthToken(null);
    setPartnerUser(null);
    setMemberships([]);
    setSalons([]);
    setActiveSalonId('');
    setPartnerView('register');
    triggerNotification('Signed out from Partner OS');
  };

  const registerSalon = (data: SalonRegistrationInput): Salon => {
    const newId = `salon-partner-${Date.now()}`;
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

    setSalons((prev) => [newSalon, ...prev]);
    setActiveSalonId(newId);
    setPartnerView('live-queue');
    safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(newSalon));
    triggerNotification(`🎉 Salon "${newSalon.name}" registered successfully! Your live walk-in queue is ready.`);

    // Asynchronously synchronize with NestJS backend
    defaultApiClient.registerSalon(data);

    return newSalon;
  };

  const updateQueue = (salonId: string, delta: number, manualValue?: number) => {
    setSalons((prev) =>
      prev.map((salon) => {
        if (salon.id !== salonId) return salon;

        let newQueue = manualValue !== undefined ? manualValue : salon.currentQueue + delta;
        if (newQueue < 0) newQueue = 0;

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
      `Queue updated for ${salon?.name || 'salon'}: ${manualValue !== undefined ? manualValue : Math.max(0, (salon?.currentQueue || 0) + delta)} waiting`,
    );

    // Asynchronously synchronize with NestJS backend
    defaultApiClient.updateQueue(salonId, delta, manualValue);
  };

  const updateSalonInfo = (salonId: string, updates: Partial<Salon>) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = normalizeSalon({ ...s, ...updates });
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );
    defaultApiClient.updateSalon(salonId, updates);
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

  const replyToReview = (salonId: string, reviewId: string, replyComment: string) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const updated = {
          ...s,
          reviews: (s.reviews || []).map((r) =>
            r.id === reviewId
              ? { ...r, ownerReply: { comment: replyComment, date: 'Just now' } }
              : r,
          ),
        };
        safeStorage.setItem('kumbhakaran_partner_active_salon', JSON.stringify(updated));
        return updated;
      }),
    );
    triggerNotification('Reply sent to customer review');
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
        updateSalonInfo,
        addService,
        updateService,
        deleteService,
        addStaff,
        updateStaff,
        deleteStaff,
        replyToReview,
        notificationMessage,
        triggerNotification,
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

export const getQueueDisplay = (currentQueue: number, isOpen: boolean) => {
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
