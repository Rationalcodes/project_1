import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Salon,
  Service,
  Staff,
  Review,
  LazyFilter,
  AppPortal,
  CustomerTab,
  PartnerView,
  AdminTab,
  CustomerProfile,
  SalonRegistrationInput
} from '../types';
import { INITIAL_SALONS, INITIAL_USER } from '../data/mockSalons';
import { api } from '../services/api';

export interface LocationOption {
  name: string;
  lat: number;
  lng: number;
}

export type GenderFilter = 'all' | 'men' | 'women';

export const matchesGenderFilter = (salon: Salon, filter: GenderFilter): boolean => {
  if (filter === 'all') return true;
  const combined = (
    salon.name + ' ' +
    (salon.tagline || '') + ' ' +
    salon.services.map((s) => s.name + ' ' + s.category).join(' ')
  ).toLowerCase();

  if (filter === 'men') {
    if (
      combined.includes('ladies only') ||
      combined.includes('women only') ||
      combined.includes('ladies beauty parlour') ||
      combined.includes('women beauty parlour')
    ) {
      return false;
    }
    return true;
  }

  if (filter === 'women') {
    if (
      (combined.includes('gents only') ||
        combined.includes('men only') ||
        combined.includes('barber shop') ||
        combined.includes('barbershop') ||
        combined.includes('mens salon')) &&
      !combined.includes('unisex') &&
      !combined.includes('women') &&
      !combined.includes('ladies')
    ) {
      return false;
    }
    return true;
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
  { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295 }
];

interface SalonContextType {
  salons: Salon[];
  activeSalonId: string;
  setActiveSalonId: (id: string) => void;
  activeSalon: Salon;
  portal: AppPortal;
  setPortal: (p: AppPortal) => void;
  appMode: AppPortal;
  setAppMode: (p: AppPortal) => void;
  customerTab: CustomerTab;
  setCustomerTab: (tab: CustomerTab) => void;
  partnerView: PartnerView;
  setPartnerView: (view: PartnerView) => void;
  ownerTab: PartnerView;
  setOwnerTab: (view: PartnerView) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  selectedSalonForDetail: Salon | null;
  setSelectedSalonForDetail: (salon: Salon | null) => void;
  userProfile: CustomerProfile;
  updateCustomerName: (name: string) => void;
  registerSalon: (data: SalonRegistrationInput) => Salon;
  toggleFavorite: (salonId: string) => void;
  addToRecentlyViewed: (salonId: string) => void;
  updateQueue: (salonId: string, delta: number, manualValue?: number) => void;
  updateSalonInfo: (salonId: string, updates: Partial<Salon>) => void;
  addService: (salonId: string, service: Omit<Service, 'id'>) => void;
  updateService: (salonId: string, serviceId: string, updates: Partial<Service>) => void;
  deleteService: (salonId: string, serviceId: string) => void;
  addStaff: (salonId: string, staffMember: Omit<Staff, 'id'>) => void;
  updateStaff: (salonId: string, staffId: string, updates: Partial<Staff>) => void;
  deleteStaff: (salonId: string, staffId: string) => void;
  addReview: (salonId: string, review: Omit<Review, 'id' | 'date'>) => Promise<void> | void;
  replyToReview: (salonId: string, reviewId: string, replyComment: string) => void;
  flagReview: (salonId: string, reviewId: string) => void;
  moderateReview: (salonId: string, reviewId: string, action: 'keep' | 'delete') => void;
  verifySalon: (salonId: string, isVerified: boolean) => void;
  updateSalonStatus: (salonId: string, status: 'active' | 'suspended' | 'pending') => void;
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
  deviceViewMode: 'mobile-frame' | 'responsive';
  setDeviceViewMode: (mode: 'mobile-frame' | 'responsive') => void;
  comparisonList: string[];
  toggleCompareSalon: (salonId: string) => void;
  clearComparison: () => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
  notificationMessage: string | null;
  triggerNotification: (msg: string) => void;
  genderFilter: GenderFilter;
  setGenderFilter: (filter: GenderFilter) => void;
}

const SalonContext = createContext<SalonContextType | undefined>(undefined);

export const SalonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salons, setSalons] = useState<Salon[]>(() => {
    return INITIAL_SALONS.map(s => {
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`kumbhakaran_reviews_${s.id}`);
          if (cached) {
            const raw = JSON.parse(cached);
            if (Array.isArray(raw) && raw.length > 0) {
              const seen = new Set<string>();
              const parsedReviews = raw.filter((r) => {
                const sig = `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}`;
                if (seen.has(sig)) return false;
                seen.add(sig);
                return true;
              });
              if (parsedReviews.length !== raw.length) {
                localStorage.setItem(`kumbhakaran_reviews_${s.id}`, JSON.stringify(parsedReviews));
              }
              const combined = [
                ...parsedReviews,
                ...s.reviews.filter(r => !parsedReviews.some((pr: any) => pr.id === r.id || `${(pr.customerName || '').trim().toLowerCase()}|${(pr.comment || '').trim().toLowerCase()}` === `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}`))
              ];
              const avg = Number((combined.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / combined.length).toFixed(1));
              return {
                ...s,
                reviews: combined,
                reviewCount: combined.length,
                rating: avg,
              };
            }
          }
        } catch {}
      }
      return s;
    });
  });
  const [activeSalonId, setActiveSalonId] = useState<string>('salon-1');
  const [portal, setPortal] = useState<AppPortal>('customer');
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  const [partnerView, setPartnerView] = useState<PartnerView>('live-queue');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [selectedSalonForDetail, setSelectedSalonForDetail] = useState<Salon | null>(null);
  const [userProfile, setUserProfile] = useState<CustomerProfile>(INITIAL_USER);
  const [genderFilter, setGenderFilterState] = useState<GenderFilter>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kumbhakaran_gender_filter');
      if (saved === 'men' || saved === 'women' || saved === 'all') return saved;
    }
    return 'all';
  });

  const setGenderFilter = (filter: GenderFilter) => {
    setGenderFilterState(filter);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kumbhakaran_gender_filter', filter);
    }
    triggerNotification(
      filter === 'all'
        ? 'Showing all studios'
        : filter === 'men'
        ? "Switched to Men's Grooming"
        : "Switched to Women's Salons & Beauty"
    );
  };
  const [userLocation, setUserLocationState] = useState<LocationOption | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kumbhakaran_user_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.lat && parsed?.lng && parsed?.name) {
            // Automatically clear stale Bellandur / Koramangala default
            if (
              parsed.name.toLowerCase().includes('bellandur') ||
              parsed.name.toLowerCase().includes('koramangala')
            ) {
              localStorage.removeItem('kumbhakaran_user_location');
              return null;
            }
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  });

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
  const [lazyFilter, setLazyFilter] = useState<LazyFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('All');
  const [liveSimulatorActive, setLiveSimulatorActive] = useState<boolean>(false);
  // Default to clean responsive view for production web app
  const [deviceViewMode, setDeviceViewMode] = useState<'mobile-frame' | 'responsive'>('responsive');
  const [comparisonList, setComparisonList] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const activeSalon = salons.find(s => s.id === activeSalonId) || salons[0];

  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  // Synchronize discovery with NestJS PostGIS Backend
  useEffect(() => {
    let isMounted = true;
    const queryLat = userLocation?.lat;
    const queryLng = userLocation?.lng;
    const queryRadius = userLocation ? 25 : undefined;

    api.getNearbySalons(queryLat, queryLng, queryRadius, lazyFilter).then(res => {
      if (res && res.salons && isMounted) {
        setSalons(prev => {
          const updated = [...prev];
          for (const item of res.salons) {
            const matchIdx = updated.findIndex(s => s.id === item.id);
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
    return () => { isMounted = false; };
  }, [userLocation, lazyFilter]);

  // Synchronize salon profile and public reviews from PostgreSQL database
  useEffect(() => {
    if (!selectedSalonForDetail?.id) return;
    let isMounted = true;
    const salonId = selectedSalonForDetail.id;

    api.getPublicSalonById(salonId).then((publicData) => {
      if (!isMounted || !publicData) return;

      let localReviews: Review[] = [];
      if (typeof window !== 'undefined') {
        try {
          localReviews = JSON.parse(localStorage.getItem(`kumbhakaran_reviews_${salonId}`) || '[]');
        } catch {}
      }

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

      // Synchronize localStorage so duplicate stale local copies are immediately purged
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
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [selectedSalonForDetail?.id]);

  const updateCustomerName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserProfile(prev => ({
      ...prev,
      name: trimmed
    }));
    triggerNotification(`Name updated to "${trimmed}"`);
  };

  const registerSalon = (data: SalonRegistrationInput): Salon => {
    const newId = `salon-partner-${Date.now()}`;

    // Haversine distance formula from user's active discovery location (if set)
    let dist = 1.0;
    if (userLocation) {
      const R = 6371;
      const dLat = ((data.coordinates.lat - userLocation.lat) * Math.PI) / 180;
      const dLon = ((data.coordinates.lng - userLocation.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userLocation.lat * Math.PI) / 180) *
          Math.cos((data.coordinates.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      dist = Number((R * c).toFixed(1));
    }

    const startingPrice =
      data.services && data.services.length > 0
        ? Math.min(...data.services.map(s => s.price))
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
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 5.0,
      reviewCount: 0,
      currentQueue: 0,
      avgServiceTimeMinutes: 20,
      activeBarbers: data.activeBarbers || 2,
      distanceKm: dist || 1.8,
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
        ...s,
        id: `svc-${Date.now()}-${idx}`,
        isAvailable: true
      })),
      staff: [
        {
          id: `st-${Date.now()}-1`,
          name: data.masterBarberName || data.ownerName,
          role: 'Master Barber / Proprietor',
          experience: '6 Years',
          photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          specialties: ['Fade Cut', 'Razor Lining'],
          status: 'active',
          rating: 5.0
        }
      ],
      ratingBreakdown: {
        haircutQuality: 5.0,
        staffBehaviour: 5.0,
        cleanliness: 5.0,
        pricing: 5.0,
        overallExperience: 5.0
      },
      reviews: [],
      featured: true,
      isVerified: true,
      status: 'active',
      todayCustomersServed: 0,
      todayRevenue: 0,
      monthlyRevenue: 0
    };

    setSalons(prev => [newSalon, ...prev]);
    setActiveSalonId(newId);
    setPartnerView('live-queue');
    triggerNotification(`🎉 Salon "${newSalon.name}" registered successfully! Your live walk-in queue is ready.`);

    // Asynchronously register into NestJS PostGIS backend
    api.registerSalon({
      name: data.name,
      tagline: data.tagline,
      ownerName: data.ownerName,
      phone: data.phone,
      address: data.address,
      locality: data.locality,
      city: data.city,
      pincode: data.pincode,
      latitude: data.coordinates.lat,
      longitude: data.coordinates.lng,
      coverImage: data.coverImage,
      activeBarbers: data.activeBarbers,
      services: data.services.map(s => ({
        name: s.name,
        category: s.category,
        price: s.price,
        durationMinutes: s.durationMinutes
      }))
    });

    return newSalon;
  };

  const toggleFavorite = (salonId: string) => {
    setUserProfile(prev => {
      const exists = prev.savedSalons.includes(salonId);
      const nextSaved = exists
        ? prev.savedSalons.filter(id => id !== salonId)
        : [...prev.savedSalons, salonId];
      const salon = salons.find(s => s.id === salonId);
      triggerNotification(exists ? `Removed ${salon?.name || 'salon'} from Favourites` : `Added ${salon?.name || 'salon'} to Favourites ❤️`);
      return { ...prev, savedSalons: nextSaved };
    });
  };

  const addToRecentlyViewed = (salonId: string) => {
    setUserProfile(prev => {
      const filtered = prev.recentlyViewed.filter(id => id !== salonId);
      return { ...prev, recentlyViewed: [salonId, ...filtered].slice(0, 8) };
    });
  };

  const updateQueue = (salonId: string, delta: number, manualValue?: number) => {
    setSalons(prev => prev.map(salon => {
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
        monthlyRevenue: salon.monthlyRevenue + revenueDelta
      };

      if (selectedSalonForDetail?.id === salonId) {
        setSelectedSalonForDetail(updated);
      }

      return updated;
    }));

    const salon = salons.find(s => s.id === salonId);
    triggerNotification(`Queue updated for ${salon?.name || 'salon'}: ${manualValue !== undefined ? manualValue : Math.max(0, (salon?.currentQueue || 0) + delta)} waiting`);

    // Asynchronously synchronize queue delta with NestJS backend
    api.updateQueue(salonId, delta, manualValue);
  };

  const updateSalonInfo = (salonId: string, updates: Partial<Salon>) => {
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const updated = { ...s, ...updates };
      if (selectedSalonForDetail?.id === salonId) {
        setSelectedSalonForDetail(updated);
      }
      return updated;
    }));
    api.updateSalon(salonId, updates);
    triggerNotification("Salon information and media updated successfully");
  };

  const addService = (salonId: string, serviceData: Omit<Service, 'id'>) => {
    const newService: Service = {
      ...serviceData,
      id: `svc-${Date.now()}`
    };
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const updated = { ...s, services: [...s.services, newService] };
      if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
      return updated;
    }));
    triggerNotification(`Added service "${newService.name}" (₹${newService.price})`);
  };

  const updateService = (salonId: string, serviceId: string, updates: Partial<Service>) => {
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const updatedServices = s.services.map(svc => svc.id === serviceId ? { ...svc, ...updates } : svc);
      const updated = { ...s, services: updatedServices };
      if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
      return updated;
    }));
    triggerNotification("Service updated");
  };

  const deleteService = (salonId: string, serviceId: string) => {
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const updated = { ...s, services: s.services.filter(svc => svc.id !== serviceId) };
      if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
      return updated;
    }));
    triggerNotification("Service removed");
  };

  const addStaff = (salonId: string, staffData: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      ...staffData,
      id: `st-${Date.now()}`
    };
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const updated = { ...s, staff: [...s.staff, newStaff], activeBarbers: s.activeBarbers + 1 };
      if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
      return updated;
    }));
    triggerNotification(`Added stylist "${newStaff.name}"`);
  };

  const updateStaff = (salonId: string, staffId: string, updates: Partial<Staff>) => {
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const updatedStaff = s.staff.map(st => st.id === staffId ? { ...st, ...updates } : st);
      const activeCount = updatedStaff.filter(st => st.status === 'active').length;
      const updated = { ...s, staff: updatedStaff, activeBarbers: Math.max(1, activeCount) };
      if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
      return updated;
    }));
    triggerNotification("Stylist status updated");
  };

  const deleteStaff = (salonId: string, staffId: string) => {
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const updatedStaff = s.staff.filter(st => st.id !== staffId);
      const updated = { ...s, staff: updatedStaff, activeBarbers: Math.max(1, updatedStaff.length) };
      if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
      return updated;
    }));
    triggerNotification("Stylist profile removed");
  };

  const addReview = async (salonId: string, reviewData: Omit<Review, 'id' | 'date'>) => {
    // 1. Submit to PostgreSQL database first
    let createdReviewId = `rev-${Date.now()}`;
    let createdDate = 'Just now';

    try {
      const persisted = await api.submitSalonReview(salonId, {
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
      console.warn('Backend sync for review warning:', err);
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
        const storageKey = `kumbhakaran_reviews_${salonId}`;
        const existing: Review[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const filtered = existing.filter(
          (r) => `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}` !== contentKey && r.id !== newReview.id
        );
        localStorage.setItem(storageKey, JSON.stringify([newReview, ...filtered]));
      } catch (e) {
        console.warn('Failed to cache review in localStorage', e);
      }
    }

    // 3. Update local React state with deduplication
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const existingReviews = (s.reviews || []).filter(
        (r) => `${(r.customerName || '').trim().toLowerCase()}|${(r.comment || '').trim().toLowerCase()}` !== contentKey && r.id !== newReview.id
      );
      const nextReviews = [newReview, ...existingReviews];
      const newCount = nextReviews.length;
      const avgRating = Number((nextReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / newCount).toFixed(1));
      const updated = {
        ...s,
        reviews: nextReviews,
        reviewCount: newCount,
        rating: avgRating,
      };
      if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
      return updated;
    }));

    triggerNotification("Your review was posted successfully!");
  };

  const replyToReview = (salonId: string, reviewId: string, replyComment: string) => {
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      const updatedReviews = s.reviews.map(r => r.id === reviewId ? {
        ...r,
        ownerReply: { comment: replyComment, date: 'Just now' }
      } : r);
      const updated = { ...s, reviews: updatedReviews };
      if (selectedSalonForDetail?.id === salonId) setSelectedSalonForDetail(updated);
      return updated;
    }));
    triggerNotification("Replied to customer review");
  };

  const flagReview = (salonId: string, reviewId: string) => {
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      return {
        ...s,
        reviews: s.reviews.map(r => r.id === reviewId ? { ...r, flagged: true } : r)
      };
    }));
    triggerNotification("Review flagged for moderation review");
  };

  const moderateReview = (salonId: string, reviewId: string, action: 'keep' | 'delete') => {
    setSalons(prev => prev.map(s => {
      if (s.id !== salonId) return s;
      if (action === 'delete') {
        const remaining = s.reviews.filter(r => r.id !== reviewId);
        return { ...s, reviews: remaining, reviewCount: Math.max(0, s.reviewCount - 1) };
      } else {
        return {
          ...s,
          reviews: s.reviews.map(r => r.id === reviewId ? { ...r, flagged: false } : r)
        };
      }
    }));
    triggerNotification(action === 'delete' ? "Review removed by administrator" : "Review approved and retained");
  };

  const verifySalon = (salonId: string, isVerified: boolean) => {
    setSalons(prev => prev.map(s => s.id === salonId ? { ...s, isVerified, status: isVerified ? 'active' : s.status } : s));
    triggerNotification(isVerified ? "Salon officially verified! Badge issued" : "Salon verification revoked");
  };

  const updateSalonStatus = (salonId: string, status: 'active' | 'suspended' | 'pending') => {
    setSalons(prev => prev.map(s => s.id === salonId ? { ...s, status } : s));
    triggerNotification(`Salon status updated to "${status.toUpperCase()}"`);
  };

  const toggleCompareSalon = (salonId: string) => {
    setComparisonList(prev => {
      if (prev.includes(salonId)) {
        return prev.filter(id => id !== salonId);
      }
      if (prev.length >= 3) {
        triggerNotification("You can compare up to 3 salons at once");
        return prev;
      }
      const salon = salons.find(s => s.id === salonId);
      triggerNotification(`Added ${salon?.name || 'salon'} to comparison`);
      return [...prev, salonId];
    });
  };

  const clearComparison = () => {
    setComparisonList([]);
    setIsCompareOpen(false);
  };

  const toggleLiveSimulator = () => {
    setLiveSimulatorActive(prev => {
      const next = !prev;
      triggerNotification(next ? "Live Queue Simulation started (simulating customer walk-ins & completions)" : "Live Simulation paused");
      return next;
    });
  };

  // Real-time live simulator effect
  useEffect(() => {
    if (!liveSimulatorActive) return;

    const interval = setInterval(() => {
      setSalons(prev => {
        const randomIndex = Math.floor(Math.random() * prev.length);
        const target = prev[randomIndex];
        if (!target.isOpen) return prev;

        const isWalkIn = Math.random() > 0.4;
        let delta = isWalkIn ? 1 : -1;
        if (target.currentQueue <= 0 && delta < 0) delta = 1;
        if (target.currentQueue >= 9 && delta > 0) delta = -1;

        return prev.map((s, idx) => {
          if (idx !== randomIndex) return s;
          const nextQueue = Math.max(0, s.currentQueue + delta);
          return {
            ...s,
            currentQueue: nextQueue,
            lastQueueUpdate: new Date().toISOString(),
            todayCustomersServed: delta < 0 ? s.todayCustomersServed + 1 : s.todayCustomersServed
          };
        });
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [liveSimulatorActive]);

  return (
    <SalonContext.Provider
      value={{
        salons,
        activeSalonId,
        setActiveSalonId,
        activeSalon,
        portal,
        setPortal,
        appMode: portal,
        setAppMode: setPortal,
        customerTab,
        setCustomerTab,
        partnerView,
        setPartnerView,
        ownerTab: partnerView,
        setOwnerTab: setPartnerView,
        adminTab,
        setAdminTab,
        selectedSalonForDetail,
        setSelectedSalonForDetail,
        userProfile,
        updateCustomerName,
        registerSalon,
        toggleFavorite,
        addToRecentlyViewed,
        updateQueue,
        updateSalonInfo,
        addService,
        updateService,
        deleteService,
        addStaff,
        updateStaff,
        deleteStaff,
        addReview,
        replyToReview,
        flagReview,
        moderateReview,
        verifySalon,
        updateSalonStatus,
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
        deviceViewMode,
        setDeviceViewMode,
        comparisonList,
        toggleCompareSalon,
        clearComparison,
        isCompareOpen,
        setIsCompareOpen,
        notificationMessage,
        triggerNotification,
        genderFilter,
        setGenderFilter
      }}
    >
      {children}
    </SalonContext.Provider>
  );
};

export const useSalon = () => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error('useSalon must be used within a SalonProvider');
  }
  return context;
};

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
      badgeClass: 'bg-stone-100 text-stone-600 border border-stone-200',
      pillClass: 'bg-stone-100 text-stone-600 border-stone-200',
      dotClass: 'bg-stone-400',
      textClass: 'text-stone-500'
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
      textClass: 'text-emerald-700'
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
      textClass: 'text-emerald-700'
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
      textClass: 'text-orange-700'
    };
  }
  return {
    label: 'High Queue • Extended Wait',
    shortLabel: `${currentQueue < 10 ? '0' + currentQueue : currentQueue} waiting`,
    color: 'rose',
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    pillClass: 'bg-rose-50 text-rose-700 border-rose-200',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-700'
  };
};

export const getQueueFreshness = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));

  if (diffMins < 2) {
    return {
      text: 'Updated just now',
      isStale: false,
      color: 'text-emerald-700',
      badgeClass: 'text-emerald-700 bg-emerald-50 border border-emerald-200'
    };
  }
  if (diffMins < 6) {
    return {
      text: `Updated ${diffMins} mins ago`,
      isStale: false,
      color: 'text-stone-700',
      badgeClass: 'text-stone-700 bg-stone-100 border border-stone-200'
    };
  }
  if (diffMins < 20) {
    return {
      text: `Updated ${diffMins} mins ago`,
      isStale: false,
      color: 'text-stone-600',
      badgeClass: 'text-stone-600 bg-stone-100 border border-stone-200'
    };
  }
  return {
    text: `Updated ${diffMins}m ago • Stale`,
    isStale: true,
    color: 'text-orange-700',
    badgeClass: 'text-orange-700 bg-orange-50 border border-orange-200'
  };
};
