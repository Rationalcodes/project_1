import React, { createContext, useContext, useState, useEffect } from 'react';
import { Salon, AdminTab, HomeBanner, DEFAULT_HOME_BANNERS } from '@kumbhakaran/shared-types';
import { defaultApiClient, AuthUser } from '@kumbhakaran/api-client';
import { safeStorage } from '../utils/safeStorage';
import { INITIAL_SALONS } from '../data/mockSalons';

// Explicitly sync API client base URL with Vite environment or production fallback
const configuredApiBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' && window.location?.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://project-1-tt3c.onrender.com/api/v1'
    : 'http://localhost:3001/api/v1');

defaultApiClient.setBaseUrl(configuredApiBaseUrl);

interface AdminContextType {
  adminUser: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loginWithGoogle: (credential: string, clientId?: string) => Promise<boolean>;
  loginDirectAdmin: (email?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  salons: Salon[];
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  verifySalon: (salonId: string, isVerified: boolean) => Promise<void>;
  updateSalonStatus: (salonId: string, status: 'active' | 'suspended' | 'pending') => Promise<void>;
  deleteSalon: (salonId: string, confirmSalonName: string) => Promise<boolean>;
  moderateReview: (salonId: string, reviewId: string, action: 'keep' | 'delete') => void;
  refreshSalons: () => Promise<void>;
  notificationMessage: string | null;
  triggerNotification: (msg: string) => void;
  banners: HomeBanner[];
  updateBanner: (slot: number, updates: Partial<HomeBanner>) => void;
  saveBanners: (newBanners: HomeBanner[]) => void;
  resetBanners: () => void;
}

const BANNER_STORAGE_KEY = 'sloon_home_banners';

const getInitialBanners = (): HomeBanner[] => {
  try {
    const saved = safeStorage.getItem(BANNER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_HOME_BANNERS;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salons, setSalons] = useState<Salon[]>(INITIAL_SALONS);
  const [banners, setBanners] = useState<HomeBanner[]>(getInitialBanners);

  // Sync banners from backend database on load
  useEffect(() => {
    defaultApiClient.getBanners().then((fetched) => {
      if (Array.isArray(fetched) && fetched.length > 0) {
        setBanners(fetched);
        safeStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(fetched));
      }
    }).catch(() => {});
  }, []);
  const [adminTab, setAdminTabState] = useState<AdminTab>(() => {
    try {
      const saved = safeStorage.getItem('kumbhakaran_admin_tab') as AdminTab;
      if (saved && ['overview', 'salons', 'reviews', 'audit'].includes(saved)) {
        return saved;
      }
    } catch {}
    return 'overview';
  });

  const setAdminTab = (tab: AdminTab) => {
    setAdminTabState(tab);
    try {
      safeStorage.setItem('kumbhakaran_admin_tab', tab);
    } catch {}
  };

  const [adminUser, setAdminUser] = useState<AuthUser | null>(() => {
    try {
      const savedToken = safeStorage.getItem('kumbhakaran_admin_token');
      if (savedToken) {
        defaultApiClient.setAuthToken(savedToken);
      }
      const savedUser = safeStorage.getItem('kumbhakaran_admin_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.email || parsed.id)) return parsed;
      }
    } catch {}
    return null;
  });
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  const refreshSalons = async () => {
    try {
      let res: any[] | null = await defaultApiClient.getAdminSalons();
      if (!res || !Array.isArray(res)) {
        // Fallback to public discovery endpoint to ensure registered salons are always visible to admin
        const publicRes = await defaultApiClient.getNearbySalons(undefined, undefined, undefined);
        if (publicRes && Array.isArray(publicRes.salons)) {
          res = publicRes.salons;
        }
      }

      // Merge locally cached newly registered salon from partner in the same browser if not present
      try {
        const localActive = safeStorage.getItem('kumbhakaran_partner_active_salon');
        if (localActive) {
          const parsed = JSON.parse(localActive);
          if (parsed && parsed.id && !res?.some((s: any) => s.id === parsed.id)) {
            res = [parsed, ...(res || [])];
          }
        }
      } catch {}

      if (res && Array.isArray(res)) {
        setSalons(
          res.map((s: any) => ({
            id: s.id,
            name: s.name,
            tagline: s.tagline || 'Verified Kumbhakaran Salon Partner',
            ownerName: s.ownerName || s.owner_name || 'Salon Partner',
            ownerId: s.ownerId || s.owner_id || '',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || `${s.locality || ''}, ${s.city || ''}`,
            locality: s.locality || '',
            city: s.city || '',
            state: s.state || 'Chhattisgarh',
            pincode: s.pincode || '',
            coordinates: s.coordinates || {
              lat: Number(s.latitude) || 22.1385,
              lng: Number(s.longitude) || 82.1437,
            },
            currentQueue: Number(s.currentQueue ?? s.current_queue ?? 0),
            avgServiceTimeMinutes: Number(s.avgServiceTimeMinutes ?? s.avg_service_time_minutes ?? 20),
            activeBarbers: Number(s.activeBarbers ?? s.staffCount ?? 2),
            distanceKm: Number(s.distanceKm ?? 0),
            startingPrice: Number(s.startingPrice ?? s.starting_price ?? 150),
            isOpen: s.isOpen ?? true,
            isVerified: s.isVerified ?? false,
            status: s.status || 'active',
            rating: Number(s.rating) || 5.0,
            reviewCount: Number(s.reviewCount ?? s.review_count ?? 0),
            lastQueueUpdate: s.lastQueueUpdate || new Date().toISOString(),
            coverImage: s.coverImage || s.cover_image || '',
            images: s.coverImage ? [s.coverImage] : [],
            services: s.services || [],
            staff: s.staff || [],
            reviews: s.reviews || [],
            ratingBreakdown: { haircutQuality: 5, staffBehaviour: 5, cleanliness: 5, pricing: 5, overallExperience: 5 },
            openingHours: {
              open: s.openingHoursOpen || '09:00 AM',
              close: s.openingHoursClose || '09:30 PM',
              formatted: s.openingHoursFormatted || '09:00 AM – 09:30 PM (All Days)',
            },
            todayCustomersServed: 0,
            todayRevenue: 0,
            monthlyRevenue: 0,
          }))
        );
      } else {
        setSalons([]);
      }
    } catch (err: any) {
      console.error('Failed to load salons in admin:', err);
      setSalons([]);
    }
  };

  // Restore authenticated session from localStorage & populate salons with live telemetry sync
  useEffect(() => {
    let isMounted = true;
    refreshSalons();

    const savedToken = safeStorage.getItem('kumbhakaran_admin_token');
    if (savedToken) {
      defaultApiClient.setAuthToken(savedToken);
      defaultApiClient.getCurrentUser().then((res: any) => {
        if (isMounted) {
          const freshUser = res?.user || (res?.email ? res : null);
          if (freshUser) {
            setAdminUser(freshUser);
            try {
              safeStorage.setItem('kumbhakaran_admin_user', JSON.stringify(freshUser));
            } catch {}
            refreshSalons();
          }
        }
      }).catch(() => {
        // Network timeout / transient issue: retain optimistic session from localStorage
      });
    }

    // Live telemetry interval (Phase 3 Optimization: in-flight guard, visibility check, relaxed interval)
    let inFlight = false;

    const safeRefreshSalons = async () => {
      if (typeof document !== 'undefined' && document.hidden) return; // Tab in background
      if (inFlight) return; // Prevent overlapping queries
      inFlight = true;
      try {
        await refreshSalons();
      } finally {
        inFlight = false;
      }
    };

    const interval = setInterval(safeRefreshSalons, 15000);

    const onFocus = () => safeRefreshSalons();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') safeRefreshSalons();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('kumbhakaran_telemetry');
      bc.onmessage = (ev) => {
        if (
          ev?.data?.type === 'QUEUE_UPDATE' ||
          ev?.data?.type === 'SALON_REGISTERED' ||
          ev?.data?.type === 'SALON_VERIFIED'
        ) {
          refreshSalons();
        }
      };
    } catch {}

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
    };
  }, []);

  const loginWithGoogle = async (credential: string, clientId?: string): Promise<boolean> => {
    try {
      const res = await defaultApiClient.loginWithGoogle(credential, clientId);
      if (res && res.accessToken) {
        safeStorage.setItem('kumbhakaran_admin_token', res.accessToken);
        safeStorage.setItem('kumbhakaran_admin_user', JSON.stringify(res.user));
        defaultApiClient.setAuthToken(res.accessToken);
        setAdminUser(res.user);
        if (res.user.role === 'ADMIN') {
          triggerNotification(`Welcome to SLOON HQ, ${res.user.name}`);
          refreshSalons();
        } else {
          triggerNotification(`Signed in as ${res.user.email} (Role: ${res.user.role})`);
        }
        return true;
      }
    } catch (err: any) {
      console.error('Admin authentication error:', err);
      triggerNotification(err?.message || 'Admin authentication failed. Please try again.');
      return false;
    }
    triggerNotification('Admin authentication failed. Please try again.');
    return false;
  };

  const loginDirectAdmin = async (email?: string): Promise<boolean> => {
    try {
      const res = await defaultApiClient.loginAsAdmin(email);
      if (res && res.accessToken) {
        safeStorage.setItem('kumbhakaran_admin_token', res.accessToken);
        safeStorage.setItem('kumbhakaran_admin_user', JSON.stringify(res.user));
        defaultApiClient.setAuthToken(res.accessToken);
        setAdminUser(res.user);
        triggerNotification(`Welcome to SLOON HQ, ${res.user.name} (${res.user.email})`);
        await refreshSalons();
        return true;
      }
    } catch (err: any) {
      console.error('Direct admin login error:', err);
      triggerNotification(err?.message || 'Direct admin authorization failed.');
      return false;
    }
    return false;
  };

  const logout = async () => {
    try {
      await defaultApiClient.logout();
    } catch {}
    safeStorage.removeItem('kumbhakaran_admin_token');
    safeStorage.removeItem('kumbhakaran_admin_user');
    safeStorage.removeItem('kumbhakaran_admin_tab');
    defaultApiClient.setAuthToken(null);
    setAdminUser(null);
    setSalons([]);
    triggerNotification('Signed out from Admin HQ');
  };

  const verifySalon = async (salonId: string, isVerified: boolean) => {
    try {
      await defaultApiClient.verifyAdminSalon(salonId, isVerified);
      setSalons((prev) =>
        prev.map((s) => (s.id === salonId ? { ...s, isVerified, status: isVerified ? 'active' : 'pending' } : s)),
      );
      const salon = salons.find((s) => s.id === salonId);
      try {
        const bc = new BroadcastChannel('kumbhakaran_telemetry');
        bc.postMessage({
          type: 'SALON_VERIFIED',
          salonId,
          isVerified,
          status: isVerified ? 'active' : 'pending',
          timestamp: Date.now(),
        });
        bc.close();
      } catch {}
      triggerNotification(
        isVerified
          ? `✅ Salon "${salon?.name}" verified and platform access granted!`
          : `Authorization revoked for "${salon?.name}"`,
      );
    } catch (err: any) {
      triggerNotification(err?.message || 'Verification update failed');
    }
  };

  const updateSalonStatus = async (salonId: string, status: 'active' | 'suspended' | 'pending') => {
    try {
      await defaultApiClient.updateAdminSalonStatus(salonId, status);
      setSalons((prev) =>
        prev.map((s) => (s.id === salonId ? { ...s, status } : s)),
      );
      const salon = salons.find((s) => s.id === salonId);
      triggerNotification(`Salon "${salon?.name}" status updated to "${status.toUpperCase()}"`);
    } catch (err: any) {
      triggerNotification(err?.message || 'Status update failed');
    }
  };

  const deleteSalon = async (salonId: string, confirmSalonName: string): Promise<boolean> => {
    try {
      await defaultApiClient.deleteAdminSalon(salonId, confirmSalonName);
      setSalons((prev) => prev.filter((s) => s.id !== salonId));
      triggerNotification(`Salon "${confirmSalonName}" and all associated records permanently deleted.`);
      return true;
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to delete salon');
      return false;
    }
  };

  const moderateReview = (salonId: string, reviewId: string, action: 'keep' | 'delete') => {
    setSalons((prev) =>
      prev.map((s) => {
        if (s.id !== salonId) return s;
        if (action === 'delete') {
          return { ...s, reviews: s.reviews.filter((r) => r.id !== reviewId) };
        }
        return {
          ...s,
          reviews: s.reviews.map((r) => (r.id === reviewId ? { ...r, flagged: false } : r)),
        };
      }),
    );
    triggerNotification(
      action === 'delete'
        ? 'Flagged review deleted by platform administrator'
        : 'Review flag cleared - marked compliant',
    );
  };

  const updateBanner = (slot: number, updates: Partial<HomeBanner>) => {
    setBanners((prev) => {
      const updated = prev.map((b) => (b.slot === slot ? { ...b, ...updates } : b));
      safeStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(updated));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sloon_banners_updated', { detail: updated }));
      }
      return updated;
    });
  };

  const saveBanners = async (newBanners: HomeBanner[]) => {
    setBanners(newBanners);
    safeStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(newBanners));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sloon_banners_updated', { detail: newBanners }));
    }
    try {
      await defaultApiClient.saveBanners(newBanners);
      triggerNotification('Home banners & posters saved to database & live on customer UI!');
    } catch (err: any) {
      triggerNotification('Banners saved locally: ' + (err.message || 'saved'));
    }
  };

  const resetBanners = async () => {
    setBanners(DEFAULT_HOME_BANNERS);
    safeStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(DEFAULT_HOME_BANNERS));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sloon_banners_updated', { detail: DEFAULT_HOME_BANNERS }));
    }
    try {
      await defaultApiClient.saveBanners(DEFAULT_HOME_BANNERS);
      triggerNotification('Reset to 4 blank poster spaces on database.');
    } catch {
      triggerNotification('Reset to 4 blank poster spaces.');
    }
  };

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        isAuthenticated: Boolean(adminUser),
        isAdmin: adminUser?.role === 'ADMIN',
        loginWithGoogle,
        loginDirectAdmin,
        logout,
        salons,
        adminTab,
        setAdminTab,
        verifySalon,
        updateSalonStatus,
        deleteSalon,
        moderateReview,
        refreshSalons,
        notificationMessage,
        triggerNotification,
        banners,
        updateBanner,
        saveBanners,
        resetBanners,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const useSalon = useAdmin;
