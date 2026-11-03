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

  const handleApplyCustomLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLocalityInput.trim();
    if (!trimmed) return;

    // Check if matches known hub
    const matched = POPULAR_LOCATIONS.find((l) =>
      l.name.toLowerCase().includes(trimmed.toLowerCase()),
    );
    if (matched) {
      setUserLocation(matched);
    } else {
      // Use custom locality name with base Bengaluru coordinates or offset
      setUserLocation({
        name: trimmed,
        lat: 12.9716,
        lng: 77.5946,
      });
    }
    setCustomLocalityInput('');
    setLocationDropdownOpen(false);
    triggerNotification(`Location set to "${trimmed}"`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-6 py-2 sm:py-3 transition-all w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 text-xs w-full">
        {/* Brand */}
        <div
          onClick={() => {
            setSelectedSalonForDetail(null);
            setCustomerTab('home');
          }}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none shrink-0 min-w-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <span className="font-black text-black text-xs sm:text-sm tracking-tighter">K</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-slate-100 uppercase text-xs sm:text-[14px] font-['Syne',sans-serif]">
                Kumbhkaran
              </span>
              <span className="font-bold tracking-widest text-amber-400 uppercase text-[10px] sm:text-[12px] font-['Syne',sans-serif]">
                Salons
              </span>
              <span className="hidden sm:inline text-[9px] sm:text-[10px] uppercase tracking-widest px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shrink-0">
                Customer
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium hidden md:block">
              Too lazy to call. Too smart to wait.
            </p>
          </div>
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

                <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 px-2 py-1">
                  Popular Hubs
                </div>
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {POPULAR_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        setUserLocation(loc);
                        setLocationDropdownOpen(false);
                        triggerNotification(`Location set to ${loc.name}`);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between transition-colors ${
                        userLocation?.name === loc.name
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="truncate">{loc.name}</span>
                      {userLocation?.name === loc.name && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {userLocation && (
                  <button
                    type="button"
                    onClick={() => {
                      clearUserLocation();
                      setLocationDropdownOpen(false);
                      triggerNotification('Location reset. Showing all salons.');
                    }}
                    className="w-full mt-2 pt-2 border-t border-zinc-800 text-center text-[11px] text-zinc-400 hover:text-amber-400 transition-colors"
                  >
                    Clear Location
                  </button>
                )}
              </div>
            )}
          </div>

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
