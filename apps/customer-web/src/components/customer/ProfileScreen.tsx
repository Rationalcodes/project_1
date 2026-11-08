import React, { useState } from 'react';
import { useSalon } from '../../context/CustomerContext';
import { GoogleSignInButton } from '@kumbhakaran/ui';
import {
  User,
  MapPin,
  Heart,
  Clock,
  Bell,
  Star,
  Edit2,
  Check,
  ShieldCheck,
  LogOut,
  Mail,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { getTheme } from '../../theme';

export const ProfileScreen: React.FC = () => {
  const {
    userProfile,
    authUser,
    isAuthenticated,
    loginWithGoogle,
    logout,
    updateCustomerName,
    salons,
    setCustomerTab,
    triggerNotification,
    userLocation,
    genderFilter,
  } = useSalon();

  const theme = getTheme(genderFilter);
  const isWomen = genderFilter === 'women';

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [preferredRadius, setPreferredRadius] = useState('5 km');

  // Customer reviews across all salons
  const userReviews = salons.flatMap((s) =>
    (s.reviews || [])
      .filter((r) => r.customerName === userProfile.name)
      .map((r) => ({ ...r, salonName: s.name, salonId: s.id })),
  );

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateCustomerName(nameInput.trim());
      setIsEditingName(false);
      triggerNotification('Display name updated');
    }
  };

  return (
    <div className="space-y-5 pb-28 text-stone-900 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Google Authentication Status Card */}
      {!isAuthenticated ? (
        <div
          className="bg-white border rounded-3xl p-5 shadow-2xs relative overflow-hidden"
          style={{ borderColor: theme.border }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: `${theme.primary}10`,
                    color: theme.primary,
                    borderColor: `${theme.primary}33`,
                  }}
                >
                  Google Account
                </span>
                <span className="text-xs text-stone-500 font-medium">Optional for walk-in discovery</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 mt-1.5 tracking-tight">
                Sign in with Google
              </h2>
              <p className="text-xs text-stone-600 max-w-md mt-0.5 leading-relaxed">
                Sync your saved studios across devices, maintain verified visit status, and leave genuine reviews.
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center">
              <GoogleSignInButton
                onSuccess={(credential, clientId) => loginWithGoogle(credential, clientId)}
                text="signin_with"
                theme="outline"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900">{authUser?.name}</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  Google Verified
                </span>
              </div>
              <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-stone-400" />
                <span>{authUser?.email}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs text-rose-600 font-bold hover:bg-rose-50 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Sign out of Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}

      {/* Customer Profile Header */}
      <div
        className="bg-white border rounded-3xl p-5 shadow-2xs relative overflow-hidden"
        style={{ borderColor: theme.border }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt={authUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 shadow-2xs"
                style={{ borderColor: theme.primary }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-2xs"
                style={{ backgroundColor: theme.primary }}
              >
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white font-extrabold shadow-sm">
              ✓
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your name..."
                  autoFocus
                  className="px-3 py-1.5 bg-[#FAF7F2] border rounded-xl text-sm font-bold text-stone-900 focus:outline-none"
                  style={{ borderColor: theme.primary }}
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl text-white font-bold cursor-pointer"
                  style={{ backgroundColor: theme.primary }}
                >
                  <Check className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2
                  onClick={() => !authUser && setIsEditingName(true)}
                  className={`text-lg font-black text-stone-900 truncate ${!authUser ? 'cursor-pointer hover:underline' : ''}`}
                >
                  {authUser?.name || userProfile.name || 'Walk-In Guest'}
                </h2>
                {!authUser && (
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                    title="Edit display name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="mt-1 flex items-center gap-1.5">
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  color: theme.primary,
                  backgroundColor: `${theme.primary}10`,
                  borderColor: `${theme.primary}33`,
                }}
              >
                {isAuthenticated
                  ? 'Verified Google Customer'
                  : userProfile.name
                  ? 'Local Profile Active'
                  : 'Walk-In Explorer'}
              </span>
            </div>

            <p className="text-[11px] text-stone-500 mt-1">
              {isAuthenticated
                ? `Signed in as ${authUser?.email}`
                : 'No login required for live queue transparency. Your preferences remain saved on this device.'}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div
          className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t text-center"
          style={{ borderColor: theme.border }}
        >
          <div
            onClick={() => setCustomerTab('favourites')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setCustomerTab('favourites');
            }}
            className="cursor-pointer p-2.5 rounded-2xl hover:bg-stone-50 transition-colors"
          >
            <div className="text-xl font-black" style={{ color: theme.primary }}>
              {userProfile.savedSalons.length}
            </div>
            <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mt-0.5">
              Saved Studios
            </div>
          </div>

          <div className="p-2.5">
            <div className="text-xl font-black text-stone-900">
              {userProfile.recentlyViewed.length}
            </div>
            <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mt-0.5">
              Recently Viewed
            </div>
          </div>

          <div className="p-2.5">
            <div className="text-xl font-black text-emerald-700">
              {userReviews.length}
            </div>
            <div className="text-[10px] text-stone-500 uppercase font-bold tracking-wider mt-0.5">
              Reviews Shared
            </div>
          </div>
        </div>
      </div>

      {/* Location & Discovery Settings */}
      <section
        className="bg-white border rounded-3xl p-5 space-y-3.5 shadow-2xs"
        style={{ borderColor: theme.border }}
      >
        <h3 className="text-xs font-black text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          <span>Location & Discovery Radius</span>
        </h3>

        <div
          className="flex items-center justify-between text-xs py-2 border-b"
          style={{ borderColor: theme.border }}
        >
          <div>
            <div className="text-stone-900 font-bold">Active Geolocation Area</div>
            <div className="text-[11px] text-stone-500">{userLocation ? userLocation.name : 'Bengaluru (Default)'}</div>
          </div>
          <span className="text-[11px] font-bold" style={{ color: theme.primary }}>
            {userLocation ? 'GPS Calibrated' : 'City Center'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="text-stone-900 font-bold">Default Search Radius</div>
            <div className="text-[11px] text-stone-500">Distance radius for immediate walk-in discovery</div>
          </div>
          <select
            value={preferredRadius}
            onChange={(e) => {
              setPreferredRadius(e.target.value);
              triggerNotification(`Search radius updated to ${e.target.value}`);
            }}
            className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-stone-900 font-semibold focus:outline-none"
          >
            <option value="2 km">2 km (Walking distance)</option>
            <option value="5 km">5 km (Neighbourhood)</option>
            <option value="10 km">10 km (City Sector)</option>
            <option value="25 km">25 km (Metro Area)</option>
          </select>
        </div>
      </section>

      {/* SLOON Walk-in Transparency Guarantee */}
      <div
        className="p-5 rounded-3xl bg-white border flex items-start gap-3.5 shadow-2xs"
        style={{ borderColor: theme.border }}
      >
        <ShieldCheck className="w-6 h-6 shrink-0 mt-0.5 text-emerald-600" />
        <div className="text-xs text-stone-600 space-y-1">
          <div className="font-black text-stone-900 text-sm">The SLOON Transparency Guarantee</div>
          <p className="leading-relaxed">
            SLOON is an open walk-in discovery network. We never charge reservation fees, mandate advance payments, or share your contact info with third parties. Walk in with full confidence.
          </p>
        </div>
      </div>
    </div>
  );
};
