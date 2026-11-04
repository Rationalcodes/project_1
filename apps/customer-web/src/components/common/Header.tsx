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
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8E2D8] px-2.5 sm:px-6 py-2 sm:py-2.5 transition-all w-full max-w-full overflow-hidden shadow-[0_2px_10px_rgba(40,20,10,0.03)]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 sm:gap-2.5 text-xs w-full">
        {/* ROW 1: Centered Brand Logo with Left and Right Controls */}
        <div className="w-full flex items-center justify-between relative min-h-[38px] sm:min-h-[46px]">
          {/* Left: Location Selector Dropdown */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            <div className="relative min-w-0">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-xs max-w-[130px] xs:max-w-[170px] sm:max-w-[220px] ${
                  userLocation
                    ? 'bg-white border border-[#E2DDD5] hover:border-[#FF6422] text-xs text-stone-800 font-semibold'
                    : 'bg-orange-50 border border-orange-200 hover:border-[#FF6422] text-xs text-[#FF6422] font-bold'
                }`}
                title={userLocation ? `Current location: ${userLocation.name}` : 'Set your location'}
              >
                <MapPin className="w-3.5 h-3.5 text-[#FF6422] shrink-0" />
                <span className={`truncate max-w-[65px] xs:max-w-[95px] sm:max-w-[160px] ${!userLocation ? 'text-[#FF6422] font-bold' : ''}`}>
                  {userLocation ? userLocation.name.split(',')[0] : 'Set Location'}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white border border-[#E2DDD5] rounded-2xl shadow-xl p-2.5 z-50 text-stone-900">
                  {/* Option to use live device GPS */}
                  <button
                    type="button"
                    onClick={async () => {
                      await requestDeviceLocation();
                      setLocationDropdownOpen(false);
                    }}
                    className="w-full mb-2 p-2.5 rounded-xl bg-orange-50 border border-orange-200 text-[#FF6422] hover:bg-orange-100 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#FF6422] animate-pulse" />
                    <span>Use My Current Location</span>
                  </button>

                  {/* Search city or locality form */}
                  <form onSubmit={handleApplyCustomLocation} className="mb-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={customLocalityInput}
                        onChange={(e) => setCustomLocalityInput(e.target.value)}
                        placeholder="Search city, locality or PIN..."
                        className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422]"
                      />
                    </div>
                  </form>

                  {userLocation ? (
                    <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E2DDD5] mb-2">
                      <div className="flex items-center justify-between text-xs text-stone-800">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6422] shrink-0" />
                          <span className="font-bold truncate">{userLocation.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clearUserLocation();
                            setLocationDropdownOpen(false);
                            triggerNotification('Location reset. Showing all salons.');
                          }}
                          className="text-[11px] text-stone-500 hover:text-[#FF6422] transition-colors shrink-0 ml-2 underline"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-2 py-1.5 text-[11px] text-stone-500 text-center mb-1">
                      No filter applied. Showing verified salons across India.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center: Brand Logo */}
          <div
            onClick={() => {
              setSelectedSalonForDetail(null);
              setCustomerTab('home');
            }}
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer select-none group z-10"
          >
            <img
              src="/logo-transparent.png"
              alt="Kumbhkaran Salons"
              className="h-8 sm:h-9 md:h-11 w-auto max-w-[160px] sm:max-w-[210px] md:max-w-[260px] object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>

          {/* Right Section: Partner Link & Profile Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            {/* Partner / Salon Portal link */}
            <a
              href="https://project-1-xq1k.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-[#FF6422] hover:bg-orange-100 text-xs font-semibold transition-all shrink-0 shadow-xs"
              title="Kumbhkaran Salons Partner Portal"
            >
              <span className="hidden sm:inline">For </span>
              <span>Salons</span>
              <ExternalLink className="w-3 h-3 text-[#FF6422] shrink-0" />
            </a>

            {/* Profile / Sign In Pill */}
            <button
              onClick={() => {
                setSelectedSalonForDetail(null);
                setCustomerTab('profile');
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 shadow-xs ${
                isAuthenticated
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-white border-[#E2DDD5] hover:border-[#FF6422] text-stone-700'
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
                <User className="w-3.5 h-3.5 text-[#FF6422] shrink-0" />
              )}
              <span className="hidden sm:inline truncate max-w-[100px]">
                {isAuthenticated ? authUser?.name?.split(' ')[0] : 'Sign In'}
              </span>
            </button>
          </div>
        </div>

        {/* ROW 2: Navigation Bar Centered Below Logo */}
        <nav className="flex items-center justify-center gap-1 bg-[#F3ECE4] border border-[#E2DDD5] p-1 rounded-2xl shadow-inner">
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
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl font-semibold transition-all relative ${
                  isActive
                    ? 'bg-[#FF6422] text-white shadow-md shadow-orange-500/25 font-bold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                <span>{item.label}</span>
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-white text-[#FF6422]' : 'bg-[#FF6422] text-white'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
