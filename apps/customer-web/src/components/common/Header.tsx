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
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-b border-[#E8E2D8] px-3 sm:px-6 py-2 transition-all w-full max-w-full overflow-hidden shadow-[0_2px_10px_rgba(40,20,10,0.03)]">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-1.5 text-xs w-full">
        {/* ROW 1: Centered Kumbhkaran Salons Brand Logo */}
        <div className="w-full flex items-center justify-center py-0.5">
          <button
            type="button"
            onClick={() => {
              setSelectedSalonForDetail(null);
              setCustomerTab('home');
            }}
            className="flex items-center justify-center cursor-pointer select-none group focus:outline-none"
            title="Kumbhkaran Salons Home"
          >
            <img
              src="/logo-transparent.png"
              alt="Kumbhkaran Salons"
              className="h-8 sm:h-10 md:h-11 w-auto max-w-[190px] sm:max-w-[240px] md:max-w-[280px] object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
          </button>
        </div>

        {/* ROW 2: Down the Logo - Location (Left) | Men/Women Switch (Center) | User Profile (Right) */}
        <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3 pt-0.5">
          {/* Left: Location Selector Pill */}
          <div className="relative shrink min-w-0">
            <button
              type="button"
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-xs max-w-[110px] xs:max-w-[145px] sm:max-w-[200px] ${
                userLocation
                  ? 'bg-white border border-[#E2DDD5] hover:border-[#FF6422] text-xs text-stone-800 font-semibold'
                  : 'bg-orange-50 border border-orange-200 hover:border-[#FF6422] text-xs text-[#FF6422] font-bold'
              }`}
              title={userLocation ? `Current location: ${userLocation.name}` : 'Set your location'}
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF6422] shrink-0" />
              <span className={`truncate text-[11px] sm:text-xs ${!userLocation ? 'text-[#FF6422] font-bold' : ''}`}>
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

          {/* Center: Men / Women Switching Option */}
          <div className="flex items-center bg-[#F3ECE4] border border-[#E2DDD5] p-0.5 rounded-full shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setGenderFilter('all')}
              className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs transition-all ${
                genderFilter === 'all'
                  ? 'bg-[#FF6422] text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 font-semibold'
              }`}
              title="Show all studios & salons"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('men')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs transition-all ${
                genderFilter === 'men'
                  ? 'bg-[#FF6422] text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 font-semibold'
              }`}
              title="Filter for Men's Grooming"
            >
              <span>👨</span>
              <span>Men</span>
            </button>
            <button
              type="button"
              onClick={() => setGenderFilter('women')}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-[11px] sm:text-xs transition-all ${
                genderFilter === 'women'
                  ? 'bg-[#FF6422] text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 font-semibold'
              }`}
              title="Filter for Women's Salons & Beauty"
            >
              <span>👩</span>
              <span>Women</span>
            </button>
          </div>

          {/* Right: User Profile / Sign In Pill */}
          <button
            type="button"
            onClick={() => {
              setSelectedSalonForDetail(null);
              setCustomerTab('profile');
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 shadow-xs ${
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
            <span className="hidden sm:inline truncate max-w-[80px]">
              {isAuthenticated ? authUser?.name?.split(' ')[0] : 'Sign In'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
