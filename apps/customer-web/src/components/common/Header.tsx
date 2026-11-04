import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Navigation,
  Search,
  User,
  X,
} from 'lucide-react';
import { useCustomer, POPULAR_LOCATIONS } from '../../context/CustomerContext';

export const Header: React.FC = () => {
  const {
    userLocation,
    setUserLocation,
    clearUserLocation,
    requestDeviceLocation,
    triggerNotification,
    authUser,
    isAuthenticated,
    setCustomerTab,
    setSelectedSalonForDetail,
    genderFilter,
    setGenderFilter,
  } = useCustomer();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [customLocalityInput, setCustomLocalityInput] = useState('');

  const isWomen = genderFilter === 'women';

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
    <header className="sticky top-0 z-40 w-full max-w-full overflow-hidden shadow-xs transition-colors duration-300">
      {/* 1. TOP DUAL TAB STRIP: Men | Women (Full width top bar inspired by JioMart Quick / ShopAll) */}
      <div
        className={`w-full px-2 pt-2 pb-1.5 transition-colors duration-300 ${
          isWomen ? 'bg-[#3A101A]' : 'bg-[#23120C]'
        }`}
      >
        <div className="max-w-md mx-auto grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/25 backdrop-blur-xs">
          {/* MEN TAB */}
          <button
            type="button"
            onClick={() => setGenderFilter('men')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-1.5 ${
              !isWomen
                ? 'bg-[#FAF7F2] text-stone-900 shadow-md shadow-black/25 scale-[1.01]'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-sm">✂</span>
            <span className="tracking-wider">MEN</span>
          </button>

          {/* WOMEN TAB */}
          <button
            type="button"
            onClick={() => setGenderFilter('women')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-1.5 ${
              isWomen
                ? 'bg-[#FFF8F5] text-[#E11D48] shadow-md shadow-black/25 scale-[1.01]'
                : 'text-stone-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="text-sm">✨</span>
            <span className="tracking-wider">WOMEN</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN HEADER ROW: Logo & Location on Left | Profile on Right */}
      <div
        className={`px-3 sm:px-6 py-2.5 border-b transition-colors duration-300 ${
          isWomen
            ? 'bg-[#FFF5F2]/95 backdrop-blur-md border-[#FED7CC]'
            : 'bg-[#FFFDF9]/95 backdrop-blur-md border-[#E8E2D8]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Brand Logo + Location below it (like JioMart Delivery Info) */}
          <div className="flex flex-col items-start min-w-0">
            {/* Kumbhkaran Salons Official Logo */}
            <button
              type="button"
              onClick={() => {
                setSelectedSalonForDetail(null);
                setCustomerTab('home');
              }}
              className="flex items-center cursor-pointer select-none group focus:outline-none -ml-1"
              title="Kumbhkaran Salons Home"
            >
              <img
                src="/logo-transparent.png"
                alt="Kumbhkaran Salons"
                className="h-7 xs:h-8 sm:h-9 w-auto max-w-[170px] sm:max-w-[220px] object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logo.png';
                }}
              />
            </button>

            {/* Location Selector (Directly below the logo) */}
            <div className="relative mt-0.5">
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-colors ${
                  isWomen
                    ? 'text-[#C93B57] hover:text-[#A8223D]'
                    : 'text-[#D34D14] hover:text-[#9A340B]'
                }`}
                title={userLocation ? `Location: ${userLocation.name}` : 'Set your location'}
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[170px] xs:max-w-[230px] sm:max-w-[340px]">
                  {userLocation ? userLocation.name : 'Set Location'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
              </button>

              {/* Location Picker Dropdown */}
              {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-white border border-[#E2DDD5] rounded-2xl shadow-2xl p-2.5 z-50 text-stone-900 animate-in fade-in zoom-in-95">
                  {/* GPS Locator Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      await requestDeviceLocation();
                      setLocationDropdownOpen(false);
                    }}
                    className={`w-full mb-2 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                      isWomen
                        ? 'bg-rose-50 border-rose-200 text-[#E11D48] hover:bg-rose-100'
                        : 'bg-orange-50 border border-orange-200 text-[#FF6422] hover:bg-orange-100'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 animate-pulse" />
                    <span>Use My Current Location</span>
                  </button>

                  {/* Manual search input */}
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
                      No filter applied. Showing verified studios across India.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Beside Logo -> Profile Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedSalonForDetail(null);
              setCustomerTab('profile');
            }}
            className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold transition-all border shrink-0 shadow-xs ${
              isWomen
                ? isAuthenticated
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-white border-[#FED7CC] text-stone-700 hover:border-[#E11D48]'
                : isAuthenticated
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-white border-[#E2DDD5] text-stone-700 hover:border-[#FF6422]'
            }`}
            title={isAuthenticated ? `Profile: ${authUser?.name}` : 'Sign in with Google'}
          >
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt=""
                className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-black/5"
              />
            ) : (
              <User className={`w-4 h-4 shrink-0 ${isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'}`} />
            )}
            <span className="hidden sm:inline truncate max-w-[80px]">
              {isAuthenticated ? authUser?.name?.split(' ')[0] : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
