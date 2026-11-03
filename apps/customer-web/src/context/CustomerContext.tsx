import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Salon,
  Service,
  Review,
  LazyFilter,
  CustomerProfile,
  LocationOption,
} from '@kumbhakaran/shared-types';
import { defaultApiClient, AuthUser } from '@kumbhakaran/api-client';
import { INITIAL_SALONS, INITIAL_USER } from '../data/mockSalons';

export type CustomerTab = 'home' | 'explore' | 'map' | 'favourites' | 'profile';

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
  activeSalon: Salon;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;
  selectedSalonForDetail: Salon | null;
  setSelectedSalonForDetail: (salon: Salon | null) => void;
  userProfile: CustomerProfile;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCustomerName: (name: string) => void;
  toggleFavorite: (salonId: string) => void;
  addToRecentlyViewed: (salonId: string) => void;
  addReview: (salonId: string, review: Omit<Review, 'id' | 'date'>) => void;
  userLocation: LocationOption;
  setUserLocation: (loc: LocationOption) => void;
  lazyFilter: LazyFilter;
  setLazyFilter: (filter: LazyFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedServiceFilter: string;
  setSelectedServiceFilter: (service: string) => void;
  liveSimulatorActive: boolean;
  toggleLiveSimulator: () => void;
  deviceViewMode: 'mobile-frame' | 'responsive';
  setDeviceViewMode: (mode: 'mobile-frame' | 'responsive') => void;
  comparisonList: string[];
  toggleCompareSalon: (salonId: string) => void;
  clearComparison: () => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
  notificationMessage: string | null;
  triggerNotification: (msg: string) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salons, setSalons] = useState<Salon[]>(INITIAL_SALONS);
  const [activeSalonId, setActiveSalonId] = useState<string>('salon-1');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  const [selectedSalonForDetail, setSelectedSalonForDetail] = useState<Salon | null>(null);
  const [userProfile, setUserProfile] = useState<CustomerProfile>(INITIAL_USER);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [userLocation, setUserLocation] = useState<LocationOption>(POPULAR_LOCATIONS[0]);
  const [lazyFilter, setLazyFilter] = useState<LazyFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('All');
  const [liveSimulatorActive, setLiveSimulatorActive] = useState<boolean>(false);
  // Default to clean responsive view for production web app
  const [deviceViewMode, setDeviceViewMode] = useState<'mobile-frame' | 'responsive'>('responsive');
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
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
    const savedToken = localStorage.getItem('kumbhakaran_customer_token');
    if (savedToken) {
      defaultApiClient.setAuthToken(savedToken);
      defaultApiClient.getCurrentUser().then((res) => {
        if (isMounted) {
          if (res?.user) {
            setAuthUser(res.user);
            setUserProfile((prev) => ({
              ...prev,
              name: res.user.name,
              avatar: res.user.avatarUrl || prev.avatar,
            }));
          } else {
            localStorage.removeItem('kumbhakaran_customer_token');
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
        localStorage.setItem('kumbhakaran_customer_token', res.accessToken);
        setAuthUser(res.user);
        setUserProfile((prev) => ({
          ...prev,
          name: res.user.name,
          avatar: res.user.avatarUrl || prev.avatar,
        }));
        triggerNotification(`Welcome, ${res.user.name}!`);
        return true;
      }
    } catch {
      // Handled below
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
    localStorage.removeItem('kumbhakaran_customer_token');
    defaultApiClient.setAuthToken(null);
    setAuthUser(null);
    triggerNotification('Signed out successfully');
  };

  // Synchronize discovery with NestJS PostGIS Backend
  useEffect(() => {
    let isMounted = true;
    defaultApiClient.getNearbySalons(userLocation.lat, userLocation.lng, 25, lazyFilter).then((res) => {
      if (res && res.salons && isMounted) {
        setSalons((prev) => {
          const updated = [...prev];
          for (const item of res.salons) {
            const matchIdx = updated.findIndex((s) => s.id === item.id);
            if (matchIdx !== -1) {
              updated[matchIdx] = {
                ...updated[matchIdx],
                currentQueue: item.currentQueue,
                distanceKm: item.distanceKm,
                lastQueueUpdate: item.lastQueueUpdate,
                rating: item.rating,
                isOpen: item.isOpen,
              };
            }
          }
          return updated;
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [userLocation, lazyFilter]);

  const updateCustomerName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserProfile((prev) => ({
      ...prev,
      name: trimmed,
    }));
    triggerNotification(`Name updated to "${trimmed}"`);
  };

  const toggleFavorite = (salonId: string) => {
    setUserProfile((prev) => {
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
    setUserProfile((prev) => {
      const filtered = prev.recentlyViewed.filter((id) => id !== salonId);
      return { ...prev, recentlyViewed: [salonId, ...filtered].slice(0, 8) };
    });
  };

  const addReview = (salonId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      date: 'Just now',
    };
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const newReviews = [newReview, ...s.reviews];
        const newCount = s.reviewCount + 1;
        const newRating = Number(
          ((s.rating * s.reviewCount + newReview.rating) / newCount).toFixed(1),
        );
        const updated = {
          ...s,
          reviews: newReviews,
          reviewCount: newCount,
          rating: newRating,
        };
        if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
        return updated;
      }),
    );
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
        customerTab,
        setCustomerTab,
        selectedSalonForDetail,
        setSelectedSalonForDetail,
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
        lazyFilter,
        setLazyFilter,
        searchQuery,
        setSearchQuery,
        selectedServiceFilter,
        setSelectedServiceFilter,
        liveSimulatorActive,
        toggleLiveSimulator,
        deviceViewMode,
        setDeviceViewMode,
        comparisonList,
        toggleCompareSalon,
        clearComparison,
        isCompareOpen,
        setIsCompareOpen,
        notificationMessage,
        triggerNotification,
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
