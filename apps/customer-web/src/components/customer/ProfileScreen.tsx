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
  Sparkles,
  Edit2,
  Check,
  ShieldCheck,
  LogOut,
  Mail,
  CheckCircle2,
} from 'lucide-react';

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
  } = useSalon();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [notificationsEnabled, setNotificationsEnabled] = useState(userProfile.notifyOnShortQueue);
  const [preferredRadius, setPreferredRadius] = useState('5 km');

  // Customer reviews across all salons
  const userReviews = salons.flatMap((s) =>
    s.reviews
      .filter((r) => r.customerName === userProfile.name)
      .map((r) => ({ ...r, salonName: s.name, salonId: s.id })),
  );

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateCustomerName(nameInput);
      setIsEditingName(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 text-slate-100">
      {/* Google Authentication Status Card */}
      {!isAuthenticated ? (
        <div className="bg-gradient-to-br from-[#1c1c28] via-[#14141c] to-[#0d0d12] border border-amber-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Google Account
                </span>
                <span className="text-xs text-zinc-400">Optional for customers</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-1.5 font-['Syne',sans-serif]">
                Sign in with Google
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mt-0.5">
                Sync your favourite studios, keep booking history across devices, and leave verified walk-in reviews.
              </p>
            </div>

            <div className="shrink-0 flex items-center justify-center">
              <GoogleSignInButton
                onSuccess={(credential) => loginWithGoogle(credential)}
                text="signin_with"
                theme="outline"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#121218] border border-emerald-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{authUser?.name}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Google Verified
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-zinc-500" />
                <span>{authUser?.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-red-500 text-xs text-red-400 font-bold hover:bg-red-950/20 transition-all flex items-center gap-1.5"
            title="Sign out of Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}

      {/* Customer Profile Header */}
      <div className="bg-gradient-to-br from-[#1c1c25] via-[#14141c] to-[#0c0c10] border border-zinc-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="relative">
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt={authUser.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-xl"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-extrabold text-2xl shadow-xl border-2 border-amber-300">
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'C'}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white font-extrabold shadow">
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
                  className="px-2.5 py-1 bg-zinc-900 border border-amber-400 rounded-xl text-sm font-bold text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-amber-500 text-black font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white truncate">
                  {authUser?.name || userProfile.name}
                </h2>
                {!authUser && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-amber-400 transition-colors"
                    title="Edit your display name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {isAuthenticated ? 'Authenticated Customer' : 'Zero-Sign Up Walk-In Access'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 mt-1">
              {isAuthenticated
                ? `Signed in as ${authUser?.email}`
                : 'No phone number or password required. Pure walk-in clarity.'}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-zinc-800/80 text-center">
          <div
            onClick={() => setCustomerTab('favourites')}
            className="cursor-pointer hover:bg-zinc-800/40 p-2 rounded-xl transition-colors"
          >
            <div className="text-lg font-black text-amber-400">{userProfile.savedSalons.length}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Favourites</div>
          </div>

          <div className="p-2">
            <div className="text-lg font-black text-white">{userProfile.recentlyViewed.length}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Viewed</div>
          </div>

          <div className="p-2">
            <div className="text-lg font-black text-emerald-400">{userReviews.length}</div>
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Reviews</div>
          </div>
        </div>
      </div>

      {/* Customer Name Setting Card */}
      {!authUser && (
        <section className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            Your Display Name
          </h3>

          <div className="flex items-center justify-between text-xs py-1">
            <div>
              <div className="text-zinc-200 font-semibold">Customer Name</div>
              <div className="text-[10px] text-zinc-500">Displayed when you leave salon reviews</div>
            </div>

            <button
              onClick={() => setIsEditingName(true)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-xs text-amber-400 font-bold"
            >
              {userProfile.name || 'Set Name'}
            </button>
          </div>
        </section>
      )}

      {/* Location & Discovery Preferences */}
      <section className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          Location & Discovery
        </h3>

        <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/80">
          <div>
            <div className="text-zinc-200 font-semibold">Active Area</div>
            <div className="text-[10px] text-zinc-500">{userLocation ? userLocation.name : 'Not set'}</div>
          </div>
          <span className="text-[11px] text-amber-400 font-medium">GPS Coordinates active</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="text-zinc-200 font-semibold">Default Search Radius</div>
            <div className="text-[10px] text-zinc-500">Distance limit for PostGIS ST_DWithin radius search</div>
          </div>
          <select
            value={preferredRadius}
            onChange={(e) => {
              setPreferredRadius(e.target.value);
              triggerNotification(`Search radius set to ${e.target.value}`);
            }}
            className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none"
          >
            <option value="2 km">2 km (Ultra-local)</option>
            <option value="5 km">5 km (Neighbourhood)</option>
            <option value="10 km">10 km (City sector)</option>
            <option value="25 km">25 km (Metro area)</option>
          </select>
        </div>
      </section>

      {/* Transparency Guarantee */}
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 space-y-1">
          <div className="font-bold text-zinc-200">The Kumbhkaran Salons Promise</div>
          <div>
            We never share your private phone number or email with salons. No booking fees, no upfront payments, and no marketing spam. Just pure walk-in transparency.
          </div>
        </div>
      </div>
    </div>
  );
};
