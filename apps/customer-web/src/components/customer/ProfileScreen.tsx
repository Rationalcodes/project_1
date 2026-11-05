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
  ExternalLink,
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
    genderFilter,
  } = useSalon();

  const isWomen = genderFilter === 'women';

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
    <div className="space-y-6 pb-28 text-stone-900">
      {/* Google Authentication Status Card */}
      {!isAuthenticated ? (
        <div className={`bg-white border rounded-3xl p-5 shadow-sm relative overflow-hidden ${
          isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded border ${
                  isWomen
                    ? 'bg-rose-50 text-[#E11D48] border-rose-200'
                    : 'bg-orange-50 text-[#FF6422] border-orange-200'
                }`}>
                  Google Account
                </span>
                <span className="text-xs text-stone-500">Optional for customers</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 mt-1.5 tracking-tight">
                Sign in with Google
              </h2>
              <p className="text-xs text-stone-600 max-w-md mt-0.5">
                Sync your favourite studios, keep booking history across devices, and leave verified walk-in reviews.
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
        <div className="bg-white border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3">
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
            onClick={() => logout()}
            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs text-rose-600 font-bold hover:bg-rose-50 transition-all flex items-center gap-1.5 shadow-xs"
            title="Sign out of Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}

      {/* Customer Profile Header */}
      <div className={`bg-white border rounded-3xl p-5 shadow-sm relative overflow-hidden ${
        isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
      }`}>
        <div className="flex items-center gap-4">
          <div className="relative">
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt={authUser.name}
                className={`w-16 h-16 rounded-2xl object-cover border-2 shadow-sm ${
                  isWomen ? 'border-[#E11D48]' : 'border-[#FF6422]'
                }`}
              />
            ) : (
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl shadow-sm border-2 ${
                isWomen
                  ? 'bg-gradient-to-br from-rose-400 to-[#E11D48] border-rose-300'
                  : 'bg-gradient-to-br from-orange-400 to-[#FF6422] border-orange-300'
              }`}>
                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
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
                  className={`px-2.5 py-1 bg-[#FAF7F2] border rounded-xl text-sm font-bold text-stone-900 focus:outline-none ${
                    isWomen ? 'border-[#E11D48]' : 'border-[#FF6422]'
                  }`}
                />
                <button
                  type="submit"
                  className={`p-1.5 rounded-lg text-white font-bold ${
                    isWomen ? 'bg-[#E11D48]' : 'bg-[#FF6422]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2
                  onClick={() => !authUser && setIsEditingName(true)}
                  className={`text-lg font-extrabold text-stone-900 truncate ${!authUser ? 'cursor-pointer hover:underline' : ''}`}
                >
                  {authUser?.name || userProfile.name || 'Set your name'}
                </h2>
                {!authUser && (
                  <button
                    onClick={() => setIsEditingName(true)}
                    className={`p-1 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors ${
                      isWomen ? 'hover:text-[#E11D48]' : 'hover:text-[#FF6422]'
                    }`}
                    title="Edit your display name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="mt-1 flex items-center gap-1.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isWomen
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-orange-700 bg-orange-50 border-orange-200'
              }`}>
                {isAuthenticated
                  ? 'Authenticated Customer'
                  : userProfile.name
                  ? 'Device-Synced Walk-In Profile'
                  : 'Walk-In Customer (No Sign-Up)'}
              </span>
            </div>

            <p className="text-[11px] text-stone-500 mt-1">
              {isAuthenticated
                ? `Signed in as ${authUser?.email}`
                : userProfile.name
                ? 'Your name and saved salons are remembered on this device across visits.'
                : 'No password required. Set your name so salons and reviews recognize you.'}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className={`grid grid-cols-3 gap-2 mt-5 pt-4 border-t text-center ${
          isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
        }`}>
          <div
            onClick={() => setCustomerTab('favourites')}
            className={`cursor-pointer p-2 rounded-xl transition-colors ${
              isWomen ? 'hover:bg-rose-50/50' : 'hover:bg-orange-50/50'
            }`}
          >
            <div className={`text-lg font-black ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`}>
              {userProfile.savedSalons.length}
            </div>
            <div className="text-[10px] text-stone-500 uppercase font-semibold">Favourites</div>
          </div>

          <div className="p-2">
            <div className="text-lg font-black text-stone-900">{userProfile.recentlyViewed.length}</div>
            <div className="text-[10px] text-stone-500 uppercase font-semibold">Viewed</div>
          </div>

          <div className="p-2">
            <div className="text-lg font-black text-emerald-700">{userReviews.length}</div>
            <div className="text-[10px] text-stone-500 uppercase font-semibold">Reviews</div>
          </div>
        </div>
      </div>

      {/* Customer Name Setting Card */}
      {!authUser && (
        <section className={`bg-white border rounded-2xl p-4 space-y-3 shadow-xs ${
          isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
        }`}>
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
            Your Display Name
          </h3>

          <div className="flex items-center justify-between text-xs py-1">
            <div>
              <div className="text-stone-900 font-semibold">Customer Name</div>
              <div className="text-[10px] text-stone-500">Displayed when you leave salon reviews</div>
            </div>

            <button
              onClick={() => setIsEditingName(true)}
              className={`px-3 py-1.5 rounded-xl bg-white border text-xs font-bold shadow-xs transition-colors ${
                isWomen
                  ? 'border-[#FED7CC] hover:border-[#E11D48] text-[#E11D48]'
                  : 'border-[#E2DDD5] hover:border-[#FF6422] text-[#FF6422]'
              }`}
            >
              {userProfile.name || 'Set Name'}
            </button>
          </div>
        </section>
      )}

      {/* Location & Discovery Preferences */}
      <section className={`bg-white border rounded-2xl p-4 space-y-3 shadow-xs ${
        isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
      }`}>
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
          Location & Discovery
        </h3>

        <div className={`flex items-center justify-between text-xs py-1 border-b ${
          isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
        }`}>
          <div>
            <div className="text-stone-900 font-semibold">Active Area</div>
            <div className="text-[10px] text-stone-500">{userLocation ? userLocation.name : 'Not set'}</div>
          </div>
          <span className={`text-[11px] font-semibold ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`}>
            GPS Coordinates active
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="text-stone-900 font-semibold">Default Search Radius</div>
            <div className="text-[10px] text-stone-500">Distance limit for PostGIS ST_DWithin radius search</div>
          </div>
          <select
            value={preferredRadius}
            onChange={(e) => {
              setPreferredRadius(e.target.value);
              triggerNotification(`Search radius set to ${e.target.value}`);
            }}
            className="px-2.5 py-1 bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl text-xs text-stone-900 focus:outline-none"
          >
            <option value="2 km">2 km (Ultra-local)</option>
            <option value="5 km">5 km (Neighbourhood)</option>
            <option value="10 km">10 km (City sector)</option>
            <option value="25 km">25 km (Metro area)</option>
          </select>
        </div>
      </section>

      {/* Transparency Guarantee */}
      <div className={`p-4 rounded-2xl bg-white border flex items-start gap-3 shadow-xs ${
        isWomen ? 'border-[#FED7CC]' : 'border-[#E8E2D8]'
      }`}>
        <ShieldCheck className={`w-5 h-5 shrink-0 mt-0.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
        <div className="text-xs text-stone-600 space-y-1">
          <div className="font-bold text-stone-900">The Kumbhkaran Salons Promise</div>
          <div>
            We never share your private phone number or email with salons. No booking fees, no upfront payments, and no marketing spam. Just pure walk-in transparency.
          </div>
        </div>
      </div>
    </div>
  );
};
