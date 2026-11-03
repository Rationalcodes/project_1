import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Salon,
  Service,
  Staff,
  Review,
  PartnerView,
  SalonRegistrationInput,
} from '@kumbhakaran/shared-types';
import { defaultApiClient, AuthUser, SalonMembership } from '@kumbhakaran/api-client';
import { INITIAL_SALONS } from '../data/mockSalons';

interface PartnerContextType {
  partnerUser: AuthUser | null;
  memberships: SalonMembership[];
  isAuthenticated: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  salons: Salon[];
  activeSalonId: string;
  setActiveSalonId: (id: string) => void;
  activeSalon: Salon;
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

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salons, setSalons] = useState<Salon[]>(INITIAL_SALONS);
  const [activeSalonId, setActiveSalonId] = useState<string>('salon-1');
  const [partnerView, setPartnerView] = useState<PartnerView>('live-queue');
  const [partnerUser, setPartnerUser] = useState<AuthUser | null>(null);
  const [memberships, setMemberships] = useState<SalonMembership[]>([]);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const activeSalon = salons.find((s) => s.id === activeSalonId) || salons[0];

  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  // Restore authenticated session from localStorage
  useEffect(() => {
    let isMounted = true;
    const savedToken = localStorage.getItem('kumbhakaran_partner_token');
    if (savedToken) {
      defaultApiClient.setAuthToken(savedToken);
      defaultApiClient.getCurrentUser().then((res) => {
        if (isMounted) {
          if (res?.user) {
            setPartnerUser(res.user);
            setMemberships(res.memberships || []);
          } else {
            localStorage.removeItem('kumbhakaran_partner_token');
            defaultApiClient.setAuthToken(null);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, []);

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const res = await defaultApiClient.loginWithGoogle(credential);
      if (res && res.accessToken) {
        localStorage.setItem('kumbhakaran_partner_token', res.accessToken);
        setPartnerUser(res.user);
        setMemberships(res.memberships || []);
        triggerNotification(`Welcome, ${res.user.name}!`);
        return true;
      }
    } catch {
      // Ignored
    }
    triggerNotification('Google Sign-In failed. Please try again.');
    return false;
  };

  const logout = async () => {
    try {
      await defaultApiClient.logout();
    } catch {}
    localStorage.removeItem('kumbhakaran_partner_token');
    defaultApiClient.setAuthToken(null);
    setPartnerUser(null);
    setMemberships([]);
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
      isVerified: false,
      status: 'active',
      todayCustomersServed: 0,
      todayRevenue: 0,
      monthlyRevenue: 0,
    };

    setSalons((prev) => [newSalon, ...prev]);
    setActiveSalonId(newId);
    setPartnerView('live-queue');
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

        return {
          ...salon,
          currentQueue: newQueue,
          lastQueueUpdate: new Date().toISOString(),
          todayCustomersServed: salon.todayCustomersServed + customersServedDelta,
          todayRevenue: salon.todayRevenue + revenueDelta,
          monthlyRevenue: salon.monthlyRevenue + revenueDelta,
        };
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
        return { ...s, ...updates };
      }),
    );
    triggerNotification('Salon information updated successfully');
  };

  const addService = (salonId: string, serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: `svc-${Date.now()}`,
    };
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        return { ...s, services: [...s.services, newService] };
      }),
    );
    triggerNotification(`Added service "${newService.name}" (₹${newService.price})`);
  };

  const updateService = (salonId: string, serviceId: string, updates: Partial<Service>) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        return {
          ...s,
          services: s.services.map((svc) => (svc.id === serviceId ? { ...svc, ...updates } : svc)),
        };
      }),
    );
    triggerNotification('Service updated successfully');
  };

  const deleteService = (salonId: string, serviceId: string) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        return {
          ...s,
          services: s.services.filter((svc) => svc.id !== serviceId),
        };
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
        return { ...s, staff: [...s.staff, newMember] };
      }),
    );
    triggerNotification(`Stylist ${newMember.name} added to roster`);
  };

  const updateStaff = (salonId: string, staffId: string, updates: Partial<Staff>) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        return {
          ...s,
          staff: s.staff.map((st) => (st.id === staffId ? { ...st, ...updates } : st)),
        };
      }),
    );
    triggerNotification('Staff details updated');
  };

  const deleteStaff = (salonId: string, staffId: string) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        return { ...s, staff: s.staff.filter((st) => st.id !== staffId) };
      }),
    );
    triggerNotification('Staff member removed');
  };

  const replyToReview = (salonId: string, reviewId: string, replyComment: string) => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        return {
          ...s,
          reviews: s.reviews.map((r) =>
            r.id === reviewId
              ? { ...r, ownerReply: { comment: replyComment, date: 'Just now' } }
              : r,
          ),
        };
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
