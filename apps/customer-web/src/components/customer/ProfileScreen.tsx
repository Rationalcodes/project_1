import React, { useState } from 'react';
import { useSalon } from '../../context/CustomerContext';
import { GoogleSignInButton } from '@kumbhakaran/ui';
import {
  User,
  MapPin,
  Heart,
  Bell,
  Star,
  Edit2,
  Check,
  X,
  ShieldCheck,
  LogOut,
  Mail,
  ChevronRight,
  ExternalLink,
  Sliders,
  Scissors,
  Sparkles,
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
    setGenderFilter,
    setShowOnboarding,
    setSelectedSalonForDetail,
  } = useSalon();

  const isWomen = genderFilter === 'women';

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [preferredRadius, setPreferredRadius] = useState('5 km');
  const [notifyShortQueue, setNotifyShortQueue] = useState(
    userProfile.notifyOnShortQueue ?? true,
  );
  const [showReviewsList, setShowReviewsList] = useState(false);

  // Reviews authored by the user
  const userReviews = salons.flatMap((s) =>
    s.reviews
      .filter(
        (r) =>
          r.customerName === userProfile.name ||
          (authUser?.name && r.customerName === authUser.name),
      )
      .map((r) => ({
        ...r,
        salonName: s.name,
        salonId: s.id,
        salonAddress: s.address,
      })),
  );

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateCustomerName(nameInput.trim());
      setIsEditingName(false);
      triggerNotification('Display name saved');
    }
  };

  const handleOpenSalon = (salonId: string) => {
    const found = salons.find((s) => s.id === salonId);
    if (found) setSelectedSalonForDetail(found);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-28 text-stone-900 font-sans">
      {/* Page Title */}
      <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900">Account</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Your personal profile and walk-in discovery preferences
          </p>
        </div>
        <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Walk-In Network Active
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar / Monogram */}
            <div className="relative shrink-0">
              {authUser?.avatarUrl ? (
                <img
                  src={authUser.avatarUrl}
                  alt={authUser.name}
                  className="w-14 h-14 rounded-full object-cover border border-stone-200"
                />
              ) : (
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl text-white ${
                    isWomen ? 'bg-[#C04A5C]' : 'bg-[#C85322]'
                  }`}
                >
                  {(authUser?.name || userProfile.name || 'C')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            {/* Name & Identity */}
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    autoFocus
                    placeholder="Your name"
                    className="text-base font-semibold px-2 py-0.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 text-stone-900"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(userProfile.name);
                      setIsEditingName(false);
                    }}
                    className="p-1 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-stone-900 truncate">
                    {authUser?.name || userProfile.name}
                  </h2>
                  <button
                    onClick={() => {
                      setNameInput(authUser?.name || userProfile.name);
                      setIsEditingName(true);
                    }}
                    className="p-1 text-stone-400 hover:text-stone-700 transition-colors"
                    title="Edit display name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500 truncate">
                {isAuthenticated ? (
                  <span className="flex items-center gap-1 text-stone-600 truncate">
                    <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate">{authUser?.email}</span>
                  </span>
                ) : (
                  <span>Guest account · Stored locally</span>
                )}
              </div>
            </div>
          </div>

          {/* Sign Out (if authenticated) */}
          {isAuthenticated && (
            <button
              onClick={() => logout()}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-400" />
              <span>Sign out</span>
            </button>
          )}
        </div>

        {/* Guest Google Callout */}
        {!isAuthenticated && (
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70 p-3 rounded-xl">
            <div className="text-xs text-stone-600">
              <span className="font-semibold text-stone-900 block">
                Save favorites across devices
              </span>
              Connect with Google to keep your saved salons and reviews synchronized.
            </div>
            <div className="shrink-0">
              <GoogleSignInButton
                onSuccess={(credential, clientId) => loginWithGoogle(credential, clientId)}
                text="signin_with"
                theme="outline"
                size="medium"
              />
            </div>
          </div>
        )}

        {/* Clean Activity Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-stone-100 text-center">
          <button
            onClick={() => setCustomerTab('favourites')}
            className="p-2 rounded-xl hover:bg-stone-50 transition-colors text-left sm:text-center cursor-pointer"
          >
            <div className="text-base font-bold text-stone-900">
              {userProfile.savedSalons.length}
            </div>
            <div className="text-[11px] text-stone-500 font-medium">Saved Salons</div>
          </button>

          <div className="p-2 rounded-xl text-left sm:text-center">
            <div className="text-base font-bold text-stone-900">
              {userProfile.recentlyViewed.length}
            </div>
            <div className="text-[11px] text-stone-500 font-medium">Viewed Salons</div>
          </div>

          <button
            onClick={() => setShowReviewsList(!showReviewsList)}
            className="p-2 rounded-xl hover:bg-stone-50 transition-colors text-left sm:text-center cursor-pointer"
          >
            <div className="text-base font-bold text-stone-900">
              {userReviews.length}
            </div>
            <div className="text-[11px] text-stone-500 font-medium flex items-center justify-start sm:justify-center gap-0.5">
              <span>My Reviews</span>
              <ChevronRight
                className={`w-3 h-3 text-stone-400 transition-transform ${
                  showReviewsList ? 'rotate-90' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Expandable Reviews Section */}
      {showReviewsList && (
        <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Your Written Reviews ({userReviews.length})
            </h3>
            <button
              onClick={() => setShowReviewsList(false)}
              className="text-xs text-stone-400 hover:text-stone-700"
            >
              Close
            </button>
          </div>

          {userReviews.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {userReviews.map((rev, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleOpenSalon(rev.salonId)}
                      className="text-xs font-semibold text-stone-900 hover:underline flex items-center gap-1"
                    >
                      <span>{rev.salonName}</span>
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                    </button>
                    <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 italic">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                  <div className="text-[11px] text-stone-400">{rev.date}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-stone-500">
              You haven&apos;t written any salon reviews yet. Reviews are submitted directly on a salon&apos;s page after your walk-in visit.
            </div>
          )}
        </div>
      )}

      {/* GROUP 1: PREFERENCES */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 px-1">
          Preferences
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 shadow-xs overflow-hidden">
          {/* Salon Category Selector */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 shrink-0 mt-0.5">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-900">
                  Discovery Focus
                </div>
                <div className="text-[11px] text-stone-500">
                  Filter salons by preferred service style
                </div>
              </div>
            </div>

            <div className="inline-flex p-0.5 rounded-lg bg-stone-100 text-xs font-medium self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setGenderFilter('men');
                  triggerNotification("Feed set to Men's Grooming");
                }}
                className={`px-3 py-1 rounded-md transition-all ${
                  !isWomen
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Men&apos;s Grooming
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenderFilter('women');
                  triggerNotification("Feed set to Women's Salons");
                }}
                className={`px-3 py-1 rounded-md transition-all ${
                  isWomen
                    ? 'bg-white text-stone-900 font-semibold shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Women&apos;s Salons
              </button>
            </div>
          </div>

          {/* Search Radius */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-900">
                  Search Radius
                </div>
                <div className="text-[11px] text-stone-500">
                  {userLocation ? userLocation.name.split(',')[0] : 'Bengaluru'}
                </div>
              </div>
            </div>

            <select
              value={preferredRadius}
              onChange={(e) => {
                setPreferredRadius(e.target.value);
                triggerNotification(`Search radius: ${e.target.value}`);
              }}
              className="text-xs font-medium text-stone-800 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="2 km">2 km (Immediate walk)</option>
              <option value="5 km">5 km (Neighbourhood)</option>
              <option value="10 km">10 km (City sector)</option>
              <option value="25 km">25 km (Metro area)</option>
            </select>
          </div>

          {/* Short Queue Alerts */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-900">
                  Short Wait Notifications
                </div>
                <div className="text-[11px] text-stone-500">
                  Alert when a saved salon has fewer than 3 people waiting
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyShortQueue}
                onChange={(e) => {
                  setNotifyShortQueue(e.target.checked);
                  triggerNotification(
                    e.target.checked ? 'Wait alerts enabled' : 'Wait alerts muted',
                  );
                }}
                className="sr-only peer"
              />
              <div
                className={`w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                  isWomen
                    ? 'peer-checked:bg-[#C04A5C]'
                    : 'peer-checked:bg-[#C85322]'
                }`}
              />
            </label>
          </div>
        </div>
      </div>

      {/* GROUP 2: TRUST & GUIDANCE */}
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-stone-500 px-1">
          Trust &amp; Information
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 shadow-xs overflow-hidden">
          {/* Replay Onboarding Tour */}
          <button
            type="button"
            onClick={() => setShowOnboarding(true)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50/80 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-stone-900">
                  How SLOON Works
                </div>
                <div className="text-[11px] text-stone-500">
                  Replay the 4-step walk-in discovery overview
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Privacy & Zero-Booking Pledge */}
          <div className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs text-stone-600 space-y-1">
              <div className="font-semibold text-stone-900">
                The SLOON Walk-In Guarantee
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                SLOON is strictly a physical walk-in queue transparency platform. We never share your phone number, charge booking fees, or handle online reservations. Waiting counts reflect real people waiting at the salon.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-2 text-[11px] text-stone-400">
        SLOON Walk-In Transparency Network · Version 2.4.0
      </div>
    </div>
  );
};
