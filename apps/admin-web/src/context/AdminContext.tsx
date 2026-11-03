import React, { createContext, useContext, useState, useEffect } from 'react';
import { Salon, AdminTab } from '@kumbhakaran/shared-types';
import { defaultApiClient, AuthUser } from '@kumbhakaran/api-client';
import { INITIAL_SALONS } from '../data/mockSalons';

// Explicitly sync API client base URL with Vite environment or production fallback
const configuredApiBaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
  (typeof window !== 'undefined' && window.location?.hostname && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://kumbhakaran-salons.onrender.com/api/v1'
    : 'http://localhost:3001/api/v1');

defaultApiClient.setBaseUrl(configuredApiBaseUrl);

interface AdminContextType {
  adminUser: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  logout: () => Promise<void>;
  salons: Salon[];
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;
  verifySalon: (salonId: string, isVerified: boolean) => void;
  updateSalonStatus: (salonId: string, status: 'active' | 'suspended' | 'pending') => void;
  moderateReview: (salonId: string, reviewId: string, action: 'keep' | 'delete') => void;
  notificationMessage: string | null;
  triggerNotification: (msg: string) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [salons, setSalons] = useState<Salon[]>(INITIAL_SALONS);
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotificationMessage(msg);
    setTimeout(() => {
      setNotificationMessage(null);
    }, 4000);
  };

  // Restore authenticated session from localStorage
  useEffect(() => {
    let isMounted = true;
    const savedToken = localStorage.getItem('kumbhakaran_admin_token');
    if (savedToken) {
      defaultApiClient.setAuthToken(savedToken);
      defaultApiClient.getCurrentUser().then((res) => {
        if (isMounted) {
          if (res?.user) {
            setAdminUser(res.user);
          } else {
            localStorage.removeItem('kumbhakaran_admin_token');
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
        localStorage.setItem('kumbhakaran_admin_token', res.accessToken);
        setAdminUser(res.user);
        if (res.user.role === 'ADMIN') {
          triggerNotification(`Welcome to Kumbhakaran HQ, ${res.user.name}`);
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

  const logout = async () => {
    try {
      await defaultApiClient.logout();
    } catch {}
    localStorage.removeItem('kumbhakaran_admin_token');
    defaultApiClient.setAuthToken(null);
    setAdminUser(null);
    triggerNotification('Signed out from Admin HQ');
  };

  const verifySalon = (salonId: string, isVerified: boolean) => {
    setSalons((prev) =>
      prev.map((s) => (s.id === salonId ? { ...s, isVerified } : s)),
    );
    const salon = salons.find((s) => s.id === salonId);
    triggerNotification(
      isVerified
        ? `✅ Salon "${salon?.name}" verified on Kumbhakaran network!`
        : `Verification badge revoked for "${salon?.name}"`,
    );
  };

  const updateSalonStatus = (salonId: string, status: 'active' | 'suspended' | 'pending') => {
    setSalons((prev) =>
      prev.map((s) => (s.id === salonId ? { ...s, status } : s)),
    );
    const salon = salons.find((s) => s.id === salonId);
    triggerNotification(`Salon "${salon?.name}" status updated to "${status}"`);
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

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        isAuthenticated: Boolean(adminUser),
        isAdmin: adminUser?.role === 'ADMIN',
        loginWithGoogle,
        logout,
        salons,
        adminTab,
        setAdminTab,
        verifySalon,
        updateSalonStatus,
        moderateReview,
        notificationMessage,
        triggerNotification,
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

// Aliased export for compatibility
export const useSalon = useAdmin;
