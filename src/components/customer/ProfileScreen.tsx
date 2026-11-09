import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
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
  X,
  ShieldCheck,
  LogOut,
  Mail,
  CheckCircle2,
  ExternalLink,
  Compass,
  Sliders,
  MessageSquare,
  Building2,
  Navigation,
  Smartphone,
  RefreshCw,
  ChevronRight,
  Eye,
  Scissors,
} from 'lucide-react';

type ProfileTab = 'profile' | 'location' | 'reviews' | 'portals';

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
    setPortal,
    setSelectedSalonForDetail,
    requestDeviceLocation,
    liveSimulatorActive,
    toggleLiveSimulator,
  } = useSalon();

  const isWomen = genderFilter === 'women';

  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userProfile.name);
  const [isLocating, setIsLocating] = useState(false);
  const [preferredRadius, setPreferredRadius] = useState('5 km');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userProfile.notifyOnShortQueue ?? true,
  );

  // Customer reviews across all salons
  const userReviews = salons.flatMap((s) =>
    s.reviews
      .filter((r) => r.customerName === userProfile.name || (authUser?.name && r.customerName === authUser.name))
      .map((r) => ({ ...r, salonName: s.name, salonId: s.id, salonAddress: s.address })),
  );

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateCustomerName(nameInput.trim());
      setIsEditingName(false);
      triggerNotification('Display name updated successfully');
    }
  };

  const handleRefreshLocation = async () => {
    setIsLocating(true);
    try {
      const ok = await requestDeviceLocation();
      if (ok) {
        triggerNotification('GPS coordinates refreshed from your device');
      } else {
        triggerNotification('Unable to fetch GPS. Defaulting to city locality.');
      }
    } catch {
      triggerNotification('Location request failed or permission was denied');
    } finally {
      setIsLocating(false);
    }
  };

  const handleTriggerTour = () => {
    try {
      window.dispatchEvent(new CustomEvent('open-customer-tour'));
    } catch {
      // fallback
    }
  };

  const handleOpenSalon = (salonId: string) => {
    const found = salons.find((s) => s.id === salonId);
    if (found) {
      setSelectedSalonForDetail(found);
    }
  };

  return (
    <div className="space-y-6 pb-28 text-stone-900 max-w-4xl mx-auto">
      {/* Breadcrumb & Section Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold flex items-center gap-1.5">
            <span>SLOON Discovery Network</span>
            <span>/</span>
            <span className={isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}>Account & Preferences</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
            Customer Profile & Settings
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Physical Queue Observer
          </span>
        </div>
      </div>

      {/* EXECUTIVE IDENTITY HEADER CARD */}
      <div className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all ${
        isWomen ? 'border-[#F1DDE3]' : 'border-[#E8E2D8]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar & Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              {authUser?.avatarUrl ? (
                <img
                  src={authUser.avatarUrl}
                  alt={authUser.name}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 shadow-xs ${
                    isWomen ? 'border-[#E11D48]/40' : 'border-[#FF6422]/40'
                  }`}
                />
              ) : (
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xs border ${
                  isWomen
                    ? 'bg-rose-50 text-[#E11D48] border-rose-200'
                    : 'bg-stone-100 text-stone-800 border-stone-200'
                }`}>
                  {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs ring-2 ring-white"
                title="Verified active walk-in user"
              >
                <Check className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Display Name Row */}
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-0.5">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter full name"
                    autoFocus
                    className={`px-3 py-1 bg-[#FAF7F2] border rounded-lg text-sm font-bold text-stone-900 focus:outline-none ring-2 ${
                      isWomen ? 'border-[#E11D48] ring-[#E11D48]/20' : 'border-[#FF6422] ring-[#FF6422]/20'
                    }`}
                  />
                  <button
                    type="submit"
                    className={`px-2.5 py-1 rounded-lg text-white font-bold text-xs flex items-center gap-1 shadow-xs ${
                      isWomen ? 'bg-[#E11D48] hover:bg-[#BE123C]' : 'bg-[#FF6422] hover:bg-orange-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(userProfile.name);
                      setIsEditingName(false);
                    }}
                    className="px-2 py-1 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 text-xs font-semibold"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight truncate">
                    {authUser?.name || userProfile.name}
                  </h2>
                  <button
                    onClick={() => {
                      setNameInput(authUser?.name || userProfile.name);
                      setIsEditingName(true);
                    }}
                    className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    title="Edit display name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Status & Email Row */}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  isAuthenticated
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-stone-100 text-stone-700 border-stone-200'
                }`}>
                  {isAuthenticated ? 'Google Verified Customer' : 'Walk-In Guest Mode (Local)'}
                </span>

                <span className="text-[11px] text-stone-500 font-mono">
                  ID: #SLN-{userProfile.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || '89214'}
                </span>
              </div>

              <div className="text-xs text-stone-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="truncate">
                  {isAuthenticated ? authUser?.email : 'No email attached · Zero sign-up browsing'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Auth Action / Google Connection */}
          <div className="shrink-0 flex items-center">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => logout()}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out of Google</span>
              </button>
            ) : (
              <div className="bg-stone-50/80 border border-stone-200/80 rounded-xl p-3 flex flex-col gap-2 w-full sm:w-72">
                <div className="text-[11px] text-stone-600 leading-tight">
                  <strong className="text-stone-800 font-bold block mb-0.5">Sync Your Account</strong>
                  Sign in with Google to bookmark studios and submit verified walk-in reviews across your devices.
                </div>
                <div className="flex justify-center">
                  <GoogleSignInButton
                    onSuccess={(credential) => loginWithGoogle(credential)}
                    text="signin_with"
                    theme="outline"
                    size="medium"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* High-density Metric Data Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-200/80 text-center">
          <button
            type="button"
            onClick={() => setCustomerTab('favourites')}
            className="p-2.5 rounded-xl bg-stone-50/60 hover:bg-stone-100/80 border border-stone-200/60 transition-all text-left group cursor-pointer"
          >
            <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Saved Studios</div>
            <div className={`text-xl font-black mt-0.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`}>
              {userProfile.savedSalons.length}
            </div>
            <div className="text-[10px] text-stone-500 flex items-center justify-between mt-1">
              <span>View Bookmarks</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
          </button>

          <div className="p-2.5 rounded-xl bg-stone-50/60 border border-stone-200/60 text-left">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Studios Viewed</div>
            <div className="text-xl font-black text-stone-900 mt-0.5">
              {userProfile.recentlyViewed.length}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              In this session
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className="p-2.5 rounded-xl bg-stone-50/60 hover:bg-stone-100/80 border border-stone-200/60 transition-all text-left group cursor-pointer"
          >
            <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Verified Reviews</div>
            <div className="text-xl font-black text-emerald-700 mt-0.5">
              {userReviews.length}
            </div>
            <div className="text-[10px] text-stone-500 flex items-center justify-between mt-1">
              <span>Authored by you</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
          </button>

          <div className="p-2.5 rounded-xl bg-stone-50/60 border border-stone-200/60 text-left">
            <div className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Active Locality</div>
            <div className="text-sm font-bold text-stone-900 mt-1 truncate" title={userLocation?.name || 'Local Area'}>
              {userLocation?.name?.split(',')[0] || 'Bengaluru'}
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              GPS Synchronized
            </div>
          </div>
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? isWomen
                ? 'bg-rose-50 text-[#E11D48] border-b-2 border-[#E11D48]'
                : 'bg-stone-100 text-stone-900 border-b-2 border-[#FF6422]'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile & Experience</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('location')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'location'
              ? isWomen
                ? 'bg-rose-50 text-[#E11D48] border-b-2 border-[#E11D48]'
                : 'bg-stone-100 text-stone-900 border-b-2 border-[#FF6422]'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Discovery & GPS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'reviews'
              ? isWomen
                ? 'bg-rose-50 text-[#E11D48] border-b-2 border-[#E11D48]'
                : 'bg-stone-100 text-stone-900 border-b-2 border-[#FF6422]'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>My Reviews ({userReviews.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('portals')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
            activeTab === 'portals'
              ? isWomen
                ? 'bg-rose-50 text-[#E11D48] border-b-2 border-[#E11D48]'
                : 'bg-stone-100 text-stone-900 border-b-2 border-[#FF6422]'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Ecosystem & Portals</span>
        </button>
      </div>

      {/* TAB 1: PROFILE & EXPERIENCE */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Experience Switcher: Men's Grooming vs Women's Parlours */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Scissors className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
                Grooming & Salon Category Preference
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Customize your neighbourhood discovery feed to highlight salons and parlours tailored to your preference.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setGenderFilter('men');
                  triggerNotification('Switched discovery feed to Men\'s Grooming & Barbershops');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                  !isWomen
                    ? 'border-[#FF6422] bg-orange-50/40 shadow-xs ring-1 ring-[#FF6422]'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">Men&apos;s Grooming &amp; Barbershops</span>
                  {!isWomen && (
                    <span className="w-4 h-4 rounded-full bg-[#FF6422] text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                  Curated for haircuts, beard styling, head massage, and traditional grooming parlours.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGenderFilter('women');
                  triggerNotification('Switched discovery feed to Women\'s Salons & Beauty Parlours');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isWomen
                    ? 'border-[#E11D48] bg-rose-50/40 shadow-xs ring-1 ring-[#E11D48]'
                    : 'border-stone-200 hover:border-stone-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">Women&apos;s Salons &amp; Beauty Parlours</span>
                  {isWomen && (
                    <span className="w-4 h-4 rounded-full bg-[#E11D48] text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 mt-1 leading-snug">
                  Curated for hair spas, bridal grooming, facial treatments, waxing, and women-exclusive studios.
                </p>
              </button>
            </div>
          </div>

          {/* Account Details Table */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
              Personal Account &amp; Identity
            </h3>

            <div className="divide-y divide-stone-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">Customer Display Name</div>
                  <div className="text-[11px] text-stone-500">Publicly credited when you write verified walk-in reviews</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-800">{userProfile.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNameInput(userProfile.name);
                      setIsEditingName(true);
                    }}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">Connected Identity</div>
                  <div className="text-[11px] text-stone-500">Authentication provider used for cloud synchronization</div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-stone-800">
                    {isAuthenticated ? 'Google OAuth2 Session' : 'Device Local Storage (Zero-Sign Up)'}
                  </span>
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-stone-900">Notification Alerts for Queue Drops</div>
                  <div className="text-[11px] text-stone-500">Notify me when a bookmarked salon waiting count drops to 0–2 people</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => {
                      setNotificationsEnabled(e.target.checked);
                      triggerNotification(e.target.checked ? 'Short queue alerts enabled' : 'Short queue alerts disabled');
                    }}
                    className="sr-only peer"
                  />
                  <div className={`w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                    isWomen ? 'peer-checked:bg-[#E11D48]' : 'peer-checked:bg-[#FF6422]'
                  }`} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DISCOVERY & GEOLOCATION */}
      {activeTab === 'location' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Active Geolocation Card */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
                  Active Geolocation &amp; Neighborhood
                </h3>
                <p className="text-xs text-stone-600 mt-1">
                  SLOON computes distance directly from your GPS coordinates using geospatial spherical distance queries.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshLocation}
                disabled={isLocating}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs ${
                  isWomen
                    ? 'border-[#F1DDE3] bg-rose-50/60 text-[#E11D48] hover:bg-rose-100'
                    : 'border-[#E8E2D8] bg-stone-100 text-stone-800 hover:bg-stone-200'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Acquiring GPS...' : 'Refresh GPS Location'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-stone-500 font-medium block">Detected Locality</span>
                <span className="text-stone-900 font-bold mt-0.5 block">{userLocation?.name || 'Indiranagar, Bengaluru'}</span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">Coordinates (WGS 84)</span>
                <span className="text-stone-900 font-mono text-[11px] mt-0.5 block">
                  {userLocation ? `${userLocation.lat.toFixed(4)}° N, ${userLocation.lng.toFixed(4)}° E` : '12.9784° N, 77.6408° E'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 font-medium block">Geofence Accuracy</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High Precision GPS
                </span>
              </div>
            </div>
          </div>

          {/* Search Radius Preference */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
                Default Proximity Search Radius
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Distance limit for PostGIS <code className="font-mono text-stone-800 bg-stone-100 px-1 py-0.5 rounded">ST_DWithin</code> radius filtering across neighbourhood salons.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {[
                { value: '2 km', label: '2 km', desc: 'Walking distance (10–15 min)' },
                { value: '5 km', label: '5 km', desc: 'Neighbourhood (Recommended)' },
                { value: '10 km', label: '10 km', desc: 'City sector radius' },
                { value: '25 km', label: '25 km', desc: 'Metropolitan territory' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setPreferredRadius(item.value);
                    triggerNotification(`Search radius updated to ${item.value}`);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    preferredRadius === item.value
                      ? isWomen
                        ? 'border-[#E11D48] bg-rose-50/50 text-[#E11D48] ring-1 ring-[#E11D48]'
                        : 'border-[#FF6422] bg-orange-50/50 text-[#FF6422] ring-1 ring-[#FF6422]'
                      : 'border-stone-200 hover:border-stone-300 bg-white text-stone-800'
                  }`}
                >
                  <div className="font-black text-sm text-stone-900">{item.label}</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Simulator Toggle */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-stone-900 flex items-center gap-2">
                <span>Real-Time Traffic Simulator</span>
                <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Developer &amp; Testing
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Simulate spontaneous physical customer arrivals and haircut completions across local salons in real time.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleLiveSimulator}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                liveSimulatorActive
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
              }`}
            >
              {liveSimulatorActive ? 'Active (Running)' : 'Inactive (Off)'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: MY REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                Verified Walk-In Reviews Authored by You
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Public feedback you have left for neighbourhood barbershops, parlours, and salons.
              </p>
            </div>
            <span className="text-xs font-bold text-stone-600 font-mono bg-stone-100 px-2.5 py-1 rounded-lg">
              {userReviews.length} total
            </span>
          </div>

          {userReviews.length > 0 ? (
            <div className="space-y-3">
              {userReviews.map((review, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-xs space-y-2 hover:border-stone-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => handleOpenSalon(review.salonId)}
                        className="text-sm font-black text-stone-900 hover:underline flex items-center gap-1.5 text-left cursor-pointer"
                      >
                        <span>{review.salonName}</span>
                        <ExternalLink className="w-3 h-3 text-stone-400" />
                      </button>
                      <div className="text-[11px] text-stone-500">{review.salonAddress}</div>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{review.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 italic bg-[#FAF7F2] p-3 rounded-xl border border-stone-200/60">
                    &ldquo;{review.comment}&rdquo;
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Verified Walk-In Experience
                    </span>
                    <span>{review.date}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-stone-200/80 rounded-2xl p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                <Star className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-sm font-bold text-stone-900">No Walk-In Reviews Submitted Yet</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  When you visit a neighbourhood salon or grooming studio through SLOON, share your honest feedback regarding waiting accuracy, barbers, and service quality.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomerTab('explore')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-all cursor-pointer ${
                  isWomen ? 'bg-[#E11D48] hover:bg-[#BE123C]' : 'bg-[#FF6422] hover:bg-orange-600'
                }`}
              >
                <span>Explore Salons in Your Area</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ECOSYSTEM, PORTALS & CHARTER */}
      {activeTab === 'portals' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Operational Portals Switcher */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className={`w-3.5 h-3.5 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
                SLOON Platform Ecosystem Portals
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                Access the operational interfaces built for salon owners, receptionists, and system administrators.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPortal('partner')}
                className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/60 hover:bg-amber-50/40 text-left transition-all cursor-pointer group shadow-xs"
              >
                <div className="text-xs font-black text-stone-900 group-hover:text-amber-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Scissors className="w-3.5 h-3.5 text-amber-600" />
                    SLOON Partner OS
                  </span>
                  <span className="text-xs text-amber-600 font-extrabold group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
                <div className="text-[11px] text-stone-600 mt-1.5 leading-snug">
                  Operational console for salon owners &amp; receptionists to update the physical walk-in queue count, services, and staff.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPortal('admin')}
                className="p-4 rounded-xl border border-stone-200 hover:border-red-400 bg-stone-50/60 hover:bg-red-50/40 text-left transition-all cursor-pointer group shadow-xs"
              >
                <div className="text-xs font-black text-stone-900 group-hover:text-red-900 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    SLOON HQ Admin Console
                  </span>
                  <span className="text-xs text-red-600 font-extrabold group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
                <div className="text-[11px] text-stone-600 mt-1.5 leading-snug">
                  Authorize pending salon onboarding requests, oversee verified partners, audit physical queue reports, and platform telemetry.
                </div>
              </button>
            </div>
          </div>

          {/* Interactive Walkthrough Tour */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Product Onboarding Walkthrough</span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Replay the 4-step interactive mobile visual guide detailing how real-time walk-in transparency operates.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTriggerTour}
              className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs ${
                isWomen
                  ? 'bg-rose-50 text-[#E11D48] border-rose-200 hover:bg-rose-100'
                  : 'bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200'
              }`}
            >
              Replay Guide
            </button>
          </div>

          {/* The SLOON Walk-In Charter */}
          <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white tracking-tight">The SLOON Walk-In Transparency Charter</h4>
                <p className="text-[11px] text-stone-400">Our immutable commitment to customers and salon partners</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="bg-stone-800/60 border border-stone-700/60 p-3 rounded-xl space-y-1">
                <div className="font-bold text-stone-200 flex items-center gap-1.5">
                  <span className="text-amber-400 font-black">01.</span> No Virtual Queue Speculation
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Reported queue counts represent real human beings physically seated or waiting in the salon right now.
                </p>
              </div>

              <div className="bg-stone-800/60 border border-stone-700/60 p-3 rounded-xl space-y-1">
                <div className="font-bold text-stone-200 flex items-center gap-1.5">
                  <span className="text-amber-400 font-black">02.</span> Zero Contact Sharing
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Your phone number is never shared with salons, marketers, or third parties. Zero unwanted calls.
                </p>
              </div>

              <div className="bg-stone-800/60 border border-stone-700/60 p-3 rounded-xl space-y-1">
                <div className="font-bold text-stone-200 flex items-center gap-1.5">
                  <span className="text-amber-400 font-black">03.</span> No Booking Fees or Penalties
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  SLOON is not a booking platform. You pay nothing upfront, and there are no cancellation fees ever.
                </p>
              </div>

              <div className="bg-stone-800/60 border border-stone-700/60 p-3 rounded-xl space-y-1">
                <div className="font-bold text-stone-200 flex items-center gap-1.5">
                  <span className="text-amber-400 font-black">04.</span> Front-Desk Accountable
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  Queue updates are recorded directly by on-premise front-desk staff, giving you authentic walk-in clarity.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
