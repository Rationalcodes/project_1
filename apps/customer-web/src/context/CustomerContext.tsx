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
import { calculateHaversineDistance } from '@kumbhakaran/ui';
import { INITIAL_SALONS, INITIAL_USER } from '../data/mockSalons';

// Explicitly sync API client base URL with Vite environment or production fallback
const configuredApiBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' && window.location?.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://kumbhakaran-salons.onrender.com/api/v1'
    : 'http://localhost:3001/api/v1');

defaultApiClient.setBaseUrl(configuredApiBaseUrl);

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
  activeSalon: Salon | null;
  isLoadingSalons: boolean;
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
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salons, setSalons] = useState<Salon[]>(INITIAL_SALONS);
  const [activeSalonId, setActiveSalonId] = useState<string>('salon-1');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  const [selectedSalonForDetail, setSelectedSalonForDetail] = useState<Salon | null>(null);
  const [userProfile, setUserProfile] = useState<CustomerProfile>(INITIAL_USER);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  // Strictly take location from user only — never assume or force a default locality
  const [userLocation, setUserLocationState] = useState<LocationOption | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kumbhakaran_user_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.lat && parsed?.lng && parsed?.name) return parsed;
        }
      } catch {}
    }
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

  const setUserLocation = (loc: LocationOption) => {
    setUserLocationState(loc);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kumbhakaran_user_location', JSON.stringify(loc));
    }
  };

  const clearUserLocation = () => {
    setUserLocationState(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kumbhakaran_user_location');
    }
  };

  const requestDeviceLocation = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      triggerNotification('Geolocation is not supported by your browser');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLoc: LocationOption = {
            name: 'Current Location',
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
          };
          setUserLocation(newLoc);
          triggerNotification(`📍 Position acquired (${newLoc.lat}, ${newLoc.lng})`);
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation denied or failed:', err.message);
          triggerNotification('Location permission was denied. Select locality manually.');
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
    localStorage.removeItem('kumbhakaran_customer_token');
    defaultApiClient.setAuthToken(null);
    setAuthUser(null);
    triggerNotification('Signed out successfully');
  };

    // Synchronize discovery with NestJS PostGIS Backend & dynamic Haversine distance engine
  useEffect(() => {
    let isMounted = true;
    setIsLoadingSalons(true);

    const queryLat = userLocation?.lat ?? 12.9716;
    const queryLng = userLocation?.lng ?? 77.5946;
    const queryRadius = userLocation ? 25 : 50;

    defaultApiClient.getNearbySalons(queryLat, queryLng, queryRadius, lazyFilter)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.salons && res.salons.length > 0) {
          const mapped: Salon[] = res.salons.map((item) => {
            const calculatedDist = userLocation
              ? calculateHaversineDistance(
                  userLocation.lat,
                  userLocation.lng,
                  item.latitude,
                  item.longitude,
                )
              : null;
            const dist = calculatedDist ?? item.distanceKm;

            return {
              id: item.id,
              name: item.name,
              tagline: item.tagline || 'Verified Kumbhakaran Salon Partner',
              coverImage: item.coverImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
              images: [item.coverImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80'],
              rating: Number(item.rating) || 5.0,
              reviewCount: Number(item.reviewCount) || 0,
              currentQueue: item.currentQueue,
              avgServiceTimeMinutes: 20,
              activeBarbers: 2,
              distanceKm: dist,
              startingPrice: Number(item.startingPrice) || 150,
              isOpen: item.isOpen,
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
              services: [
                { id: `svc-${item.id}-1`, name: 'Signature Haircut', category: 'Hair', price: Number(item.startingPrice) || 150, durationMinutes: 25, isAvailable: true, description: 'Master stylist haircut' },
              ],
              staff: [
                { id: `st-${item.id}-1`, name: 'Master Barber', role: 'Stylist', experience: '5 Years', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', specialties: ['Fade', 'Beard'], status: 'active', rating: 4.9 },
              ],
              ratingBreakdown: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 5, pricing: 5, overallExperience: 5 },
              reviews: (() => {
                let cached: Review[] = [];
                if (typeof window !== 'undefined') {
                  try {
                    const raw: Review[] = JSON.parse(localStorage.getItem(`kumbhakaran_reviews_${item.id}`) || '[]');
                    const seen = new Set<string>();
                    cached = raw.filter((r) => {
                      const sig = `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}`;
                      if (seen.has(sig)) return false;
                      seen.add(sig);
                      return true;
                    });
                    if (cached.length !== raw.length) {
                      localStorage.setItem(`kumbhakaran_reviews_${item.id}`, JSON.stringify(cached));
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
          setSalons(mapped);
        } else {
          setSalons([]);
        }
        setIsLoadingSalons(false);
      })
      .catch((err) => {
        console.warn('Discovery API call failed:', err);
        if (isMounted) {
          setSalons([]);
          setIsLoadingSalons(false);
        }
      });

    return () => {
      isMounted = false;
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
      if (typeof window !== 'undefined') {
        try {
          localReviews = JSON.parse(localStorage.getItem(`kumbhakaran_reviews_${salonId}`) || '[]');
        } catch {}
      }

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

      // Synchronize localStorage so stale or duplicate local copies are immediately purged
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`kumbhakaran_reviews_${salonId}`, JSON.stringify(combinedReviews));
        } catch {}
      }

      setSelectedSalonForDetail((prev) => {
        if (!prev || prev.id !== salonId) return prev;
        return {
          ...prev,
          rating: Number(publicData.rating) || prev.rating,
          reviewCount: Math.max(combinedReviews.length, Number(publicData.reviewCount) || prev.reviewCount),
          reviews: combinedReviews,
          currentQueue: publicData.currentQueue !== undefined ? publicData.currentQueue : prev.currentQueue,
          isOpen: publicData.isOpen !== undefined ? publicData.isOpen : prev.isOpen,
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

  const addReview = async (salonId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    // 1. Persist to PostgreSQL backend database
    let createdReviewId = `rev-${Date.now()}`;
    let createdDate = 'Just now';

    try {
      const persisted = await defaultApiClient.submitSalonReview(salonId, {
        customerName: reviewData.customerName,
        customerAvatar: reviewData.customerAvatar,
        rating: reviewData.rating,
        comment: reviewData.comment,
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
      id: createdReviewId,
      date: createdDate,
    };

    const contentKey = `${(newReview.customerName || '').trim().toLowerCase()}|${(newReview.comment || '').trim().toLowerCase()}`;

    // 2. Cache cleanly in localStorage with deduplication
    if (typeof window !== 'undefined') {
      try {
        const key = `kumbhakaran_reviews_${salonId}`;
        const existing: Review[] = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = existing.filter(
          (r) => `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}` !== contentKey && r.id !== newReview.id
        );
        localStorage.setItem(key, JSON.stringify([newReview, ...filtered]));
      } catch (e) {
        console.warn('Failed to cache review in localStorage:', e);
      }
    }

    // 3. Update local React state with content deduplication
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        const existingReviews = (s.reviews || []).filter(
          (r) => `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}` !== contentKey && r.id !== newReview.id
        );
        const nextReviews = [newReview, ...existingReviews];
        const newCount = nextReviews.length;
        const newRating = Number(
          (nextReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / newCount).toFixed(1)
        );
        const updated = {
          ...s,
          reviews: nextReviews,
          reviewCount: newCount,
          rating: newRating,
        };
        if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
        return updated;
      })
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
        isLoadingSalons,
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
