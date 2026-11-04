import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Navigation,
  Search,
  User,
  Home,
  Compass,
  Map as MapIcon,
  Heart,
  X,
  ExternalLink,
} from 'lucide-react';
import { useCustomer, POPULAR_LOCATIONS } from '../../context/CustomerContext';
import { CustomerTab } from '@kumbhakaran/shared-types';

export const Header: React.FC = () => {
  const {
    userLocation,
    setUserLocation,
    clearUserLocation,
    requestDeviceLocation,
    triggerNotification,
    authUser,
    isAuthenticated,
    customerTab,
    setCustomerTab,
    setSelectedSalonForDetail,
    userProfile,
  } = useCustomer();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [customLocalityInput, setCustomLocalityInput] = useState('');

  const desktopNavItems: { id: CustomerTab; label: string; icon: React.FC<{ className?: string }>; badgeCount?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'favourites', label: 'Favourites', icon: Heart, badgeCount: userProfile.savedSalons.length },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleApplyCustomLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLocalityInput.trim();
    if (!trimmed) return;

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed + ', India')}&limit=1`,
        { headers: { 'User-Agent': 'KumbhkaranSalons/1.0' } }
      );
      if (geoRes.ok) {
        const results = await geoRes.json();
        if (results && results.length > 0) {
          const item = results[0];
          setUserLocation({
            name: trimmed,
            lat: Number(parseFloat(item.lat).toFixed(5)),
            lng: Number(parseFloat(item.lon).toFixed(5)),
          });
          setCustomLocalityInput('');
          setLocationDropdownOpen(false);
          triggerNotification(`📍 Location set to "${trimmed}"`);
          return;
        }
      }
    } catch {}

    setUserLocation({
      name: trimmed,
      lat: 0,
      lng: 0,
    });
    setCustomLocalityInput('');
    setLocationDropdownOpen(false);
    triggerNotification(`Location set to "${trimmed}"`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-6 py-2 sm:py-3 transition-all w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 text-xs w-full">
        {/* Official Brand Logo */}
        <div
          onClick={() => {
            setSelectedSalonForDetail(null);
            setCustomerTab('home');
          }}
          className="flex items-center cursor-pointer select-none shrink-0 min-w-0 group"
        >
          <img
            src="/logo-white.png"
            alt="Kumbhkaran Salons"
            className="h-7 sm:h-8 md:h-9 w-auto max-w-[145px] sm:max-w-[185px] md:max-w-[215px] object-contain transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
        </div>

        {/* Desktop Responsive Navigation (Visible on tablet & desktop >= md) */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl shadow-inner">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = customerTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab(item.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all relative ${
                  isActive
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-black text-amber-400' : 'bg-amber-500 text-black'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Location Dropdown & Profile Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink min-w-0">
          {/* Location Selector Dropdown */}
          <div className="relative min-w-0">
            <button
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-sm max-w-[140px] xs:max-w-[180px] sm:max-w-[240px] ${
                userLocation
                  ? 'bg-zinc-900/90 border border-zinc-700/80 hover:border-amber-400 text-xs text-white'
                  : 'bg-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-xs text-amber-300 font-bold'
              }`}
              title={userLocation ? `Current location: ${userLocation.name}` : 'Set your location'}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className={`font-semibold truncate max-w-[65px] xs:max-w-[95px] sm:max-w-[180px] ${!userLocation ? 'text-amber-400 font-bold' : ''}`}>
                {userLocation ? userLocation.name.split(',')[0] : 'Set Location'}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
            </button>

            {locationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 z-50">
                {/* Option to use live device GPS */}
                <button
                  type="button"
                  onClick={async () => {
                    await requestDeviceLocation();
                    setLocationDropdownOpen(false);
                  }}
                  className="w-full mb-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Use My Current Location</span>
                </button>

                {/* Search city or locality form */}
                <form onSubmit={handleApplyCustomLocation} className="mb-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={customLocalityInput}
                      onChange={(e) => setCustomLocalityInput(e.target.value)}
                      placeholder="Search city, locality or PIN..."
                      className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </form>

                {userLocation ? (
                  <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 mb-2">
                    <div className="flex items-center justify-between text-xs text-white">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-bold truncate">{userLocation.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          clearUserLocation();
                          setLocationDropdownOpen(false);
                          triggerNotification('Location reset. Showing all salons.');
                        }}
                        className="text-[11px] text-zinc-400 hover:text-amber-400 transition-colors shrink-0 ml-2 underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-2 py-1.5 text-[11px] text-zinc-400 text-center mb-1">
                    No filter applied. Showing verified salons across India.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Partner / Salon Portal link */}
          <a
            href="https://project-1-xq1k.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all shrink-0"
            title="Kumbhkaran Salons Partner Portal"
          >
            <span className="hidden sm:inline">For </span>
            <span>Salons</span>
            <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
          </a>

          {/* Profile / Sign In Pill */}
          <button
            onClick={() => {
              setSelectedSalonForDetail(null);
              setCustomerTab('profile');
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 ${
              isAuthenticated
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-zinc-900 border-zinc-700/80 hover:border-amber-400 text-zinc-300'
            }`}
            title={isAuthenticated ? `Profile: ${authUser?.name}` : 'Sign in with Google'}
          >
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt=""
                className="w-4 h-4 rounded-full object-cover shrink-0"
              />
            ) : (
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="hidden sm:inline truncate max-w-[100px]">
              {isAuthenticated ? authUser?.name?.split(' ')[0] : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
