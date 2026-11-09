import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Navigation,
  Search,
  User,
  X,
  Scissors,
  Sparkles,
  LayoutGrid,
  Smile,
  Droplets,
  Palette,
  Package,
} from 'lucide-react';
import { useCustomer, POPULAR_LOCATIONS } from '../../context/CustomerContext';
import logoWhite from '../../assets/logo-white.png';
import logoFallback from '../../assets/logo.png';

export const Header: React.FC = () => {
  const {
    userLocation,
    setUserLocation,
    clearUserLocation,
    requestDeviceLocation,
    triggerNotification,
    authUser,
    isAuthenticated,
    userProfile,
    customerTab,
    setCustomerTab,
    setSelectedSalonForDetail,
    genderFilter,
    setGenderFilter,
    searchQuery,
    setSearchQuery,
    selectedServiceFilter,
    setSelectedServiceFilter,
    setShowOnboarding,
  } = useCustomer();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [customLocalityInput, setCustomLocalityInput] = useState('');

  const isWomen = genderFilter === 'women';

  const groomingCategories = isWomen
    ? [
        { name: 'All', icon: LayoutGrid },
        { name: 'Hair', icon: Scissors },
        { name: 'Facial', icon: Smile },
        { name: 'Spa', icon: Droplets },
        { name: 'Color', icon: Palette },
        { name: 'Combos', icon: Package },
      ]
    : [
        { name: 'All', icon: LayoutGrid },
        { name: 'Hair', icon: Scissors },
        { name: 'Beard', icon: Scissors },
        { name: 'Combos', icon: Package },
        { name: 'Spa', icon: Droplets },
        { name: 'Facial', icon: Smile },
      ];

  const handleApplyCustomLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customLocalityInput.trim();
    if (!trimmed) return;

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed + ', India')}&limit=1`,
        { headers: { 'User-Agent': 'SloonSalons/1.0' } }
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
    <header className="sticky top-0 z-40 w-full max-w-full overflow-visible transition-colors duration-300">
      {/* 1. TOP ROOF BAR */}
      <div
        className={`w-full px-3 pt-2 transition-colors duration-300 ${
          isWomen ? 'bg-[#351329]' : 'bg-[#1E130D]'
        }`}
      >
        <div className="max-w-md mx-auto flex items-end justify-center gap-2">
          {/* MEN TAB */}
          <button
            type="button"
            onClick={() => setGenderFilter('men')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none ${
              !isWomen
                ? 'bg-[#C85322] text-white font-black text-xs sm:text-sm tracking-wider rounded-t-2xl rounded-b-none border-none shadow-none translate-y-[1px] z-10'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15 font-bold text-xs sm:text-sm tracking-wider rounded-full shadow-sm mb-1 active:scale-95'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 shrink-0" />
            <span>MEN</span>
          </button>

          {/* WOMEN TAB */}
          <button
            type="button"
            onClick={() => setGenderFilter('women')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none ${
              isWomen
                ? 'bg-[#F47B70] text-white font-black text-xs sm:text-sm tracking-wider rounded-t-2xl rounded-b-none border-none shadow-none translate-y-[1px] z-10'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15 font-bold text-xs sm:text-sm tracking-wider rounded-full shadow-sm mb-1 active:scale-95'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>WOMEN</span>
          </button>
        </div>
      </div>

      {/* 2. THE SEAMLESS CANOPY */}
      <div
        className={`w-full px-3 sm:px-6 pt-2 pb-3.5 rounded-b-3xl transition-all duration-300 ${
          isWomen
            ? 'bg-gradient-to-b from-[#54203F] via-[#54203F] to-[#351329] border-b border-[#783653]/40 shadow-[0_12px_28px_rgba(53,19,41,0.25)]'
            : 'bg-gradient-to-b from-[#2E1B10] via-[#24150D] to-[#1E130D] border-b border-[#763F22]/40 shadow-[0_12px_28px_rgba(30,19,13,0.35)]'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-2.5">
          {/* Top Row: Brand Logo + Location (Left) | Profile (Right) */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Official Brand Logo & Location directly beneath it */}
            <div className="flex flex-col items-start min-w-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab('home');
                }}
                className="flex items-center cursor-pointer select-none group focus:outline-none -ml-0.5"
                title="SLOON Home"
              >
                <img
                  src={logoWhite}
                  alt="SLOON - Unisex Grooming Network"
                  className="h-10 xs:h-11 sm:h-12 md:h-13 w-auto max-w-[210px] sm:max-w-[260px] md:max-w-[300px] object-contain transition-transform group-hover:scale-102 drop-shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = logoFallback;
                  }}
                />
              </button>

              {/* Location Selector (Directly beneath logo) */}
              <div className="relative mt-0.5">
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold transition-opacity cursor-pointer ${
                    isWomen
                      ? 'text-[#FFF8F5]/90 hover:text-[#FFF8F5]'
                      : 'text-[#FFF8F0]/90 hover:text-[#FFF8F0]'
                  }`}
                  title={userLocation ? `Location: ${userLocation.name}` : 'Set your location'}
                >
                  <MapPin
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isWomen ? 'text-[#E9A0AA]' : 'text-[#D97706]'
                    }`}
                  />
                  <span className="truncate max-w-[170px] xs:max-w-[230px] sm:max-w-[340px]">
                    {userLocation ? userLocation.name : 'Set Location'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
                </button>

                {/* Location Picker Dropdown */}
                {locationDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white border border-stone-200 rounded-2xl shadow-2xl p-3 z-50 text-stone-900 animate-in fade-in zoom-in-95">
                    {/* GPS Locator Button */}
                    <button
                      type="button"
                      onClick={async () => {
                        await requestDeviceLocation();
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full mb-2.5 p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                        isWomen
                          ? 'bg-[#FFF0F3] border-[#F1DDE3] text-[#F47B70] hover:bg-rose-100'
                          : 'bg-[#FFF5ED] border-[#E7DED5] text-[#FF6422] hover:bg-orange-100'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5 animate-pulse" />
                      <span>Use My Current Location</span>
                    </button>

                    {/* Manual search input */}
                    <form onSubmit={handleApplyCustomLocation} className="mb-2.5">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={customLocalityInput}
                          onChange={(e) => setCustomLocalityInput(e.target.value)}
                          placeholder="Search city, locality or PIN..."
                          className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none ${
                            isWomen
                              ? 'bg-[#FFFBF9] border border-[#F1DDE3] focus:border-[#F47B70]'
                              : 'bg-[#FAF7F2] border border-[#E7DED5] focus:border-[#FF6422]'
                          }`}
                        />
                      </div>
                    </form>

                    {/* Popular Location Chips */}
                    <div className="mb-2">
                      <p className="text-[10px] uppercase font-bold text-stone-400 mb-1 px-1">
                        Popular Hubs
                      </p>
                      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pr-1">
                        {POPULAR_LOCATIONS.map((loc) => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => {
                              setUserLocation(loc);
                              setLocationDropdownOpen(false);
                              triggerNotification(`Location set to ${loc.name}`);
                            }}
                            className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${
                              userLocation?.name === loc.name
                                ? isWomen
                                  ? 'bg-[#F47B70] text-white border-[#F47B70] font-bold'
                                  : 'bg-[#FF6422] text-white border-[#FF6422] font-bold'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400'
                            }`}
                          >
                            {loc.name.split(',')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {userLocation ? (
                      <div
                        className={`p-2 rounded-xl border ${
                          isWomen
                            ? 'bg-[#FFFBF9] border-[#F1DDE3]'
                            : 'bg-[#FAF7F2] border-[#E7DED5]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-stone-800">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'
                              }`}
                            />
                            <span className="font-bold truncate">{userLocation.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              clearUserLocation();
                              setLocationDropdownOpen(false);
                              triggerNotification('Location reset. Showing all salons.');
                            }}
                            className="text-[11px] text-stone-500 hover:text-stone-800 transition-colors shrink-0 ml-2 underline"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-2 py-1 text-[11px] text-stone-500 text-center">
                        Showing salons across India
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Beside Logo -> Welcome Greeting + User Profile Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              {customerTab === 'home' && (
                <div
                  onClick={() => {
                    setSelectedSalonForDetail(null);
                    setCustomerTab('profile');
                  }}
                  className="flex flex-col items-end text-right leading-tight select-none cursor-pointer group"
                >
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium tracking-wide ${
                      isWomen ? 'text-[#FFF8F5]/80' : 'text-[#FFF8F0]/80'
                    }`}
                  >
                    Welcome
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-black truncate max-w-[100px] xs:max-w-[130px] sm:max-w-[170px] ${
                      isWomen ? 'text-[#FFF8F5]' : 'text-[#FFF8F0]'
                    }`}
                  >
                    {isAuthenticated && authUser?.name
                      ? authUser.name.split(' ')[0]
                      : userProfile.name
                      ? userProfile.name.split(' ')[0]
                      : 'Guest'}
                  </span>
                </div>
              )}

              {/* Tour / Onboarding Replay Button */}
              <button
                type="button"
                onClick={() => setShowOnboarding(true)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  isWomen
                    ? 'bg-white/15 hover:bg-white/25 text-[#FFF8F5] border border-white/20'
                    : 'bg-white/15 hover:bg-white/25 text-[#FFF8F0] border border-white/20'
                }`}
                title="View 4-Screen Onboarding Tour"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Tour</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab('profile');
                }}
                className={`flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  isWomen
                    ? 'bg-white/10 hover:bg-white/20 text-[#FFF8F5] border border-white/15 backdrop-blur-xs'
                    : 'bg-white/10 hover:bg-white/20 text-[#FFF8F0] border border-white/15 backdrop-blur-xs'
                }`}
                title={
                  isAuthenticated
                    ? `Profile: ${authUser?.name}`
                    : userProfile.name
                    ? `Profile: ${userProfile.name}`
                    : 'Profile & Settings'
                }
              >
                {authUser?.avatarUrl ? (
                  <img
                    src={authUser.avatarUrl}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-white/30"
                  />
                ) : (
                  <User
                    className={`w-4 h-4 shrink-0 ${
                      isWomen ? 'text-[#E9A0AA]' : 'text-[#D97706]'
                    }`}
                  />
                )}
                {customerTab !== 'home' && (
                  <span className="hidden sm:inline truncate max-w-[90px]">
                    {isAuthenticated
                      ? authUser?.name?.split(' ')[0]
                      : userProfile.name
                      ? userProfile.name.split(' ')[0]
                      : 'Profile'}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search Row: Soft Ivory Pill Embedded in Canopy */}
          <div className="relative w-full">
            <div
              className={`relative flex items-center rounded-full shadow-md overflow-hidden transition-all focus-within:ring-2 ${
                isWomen
                  ? 'bg-[#FFF8F5] border border-[#F1DDE3] focus-within:ring-[#F47B70]/30'
                  : 'bg-[#FFF8F0] border border-[#E7DED5] focus-within:ring-[#FF6422]/30'
              }`}
            >
              <div className="pl-3.5 pr-2 flex items-center pointer-events-none">
                <Search
                  className={`w-4 h-4 ${
                    isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'
                  }`}
                />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isWomen
                    ? "Search beauty parlours, hair styling, facials, spa..."
                    : "Search barbers, haircuts, beard grooming, stylists..."
                }
                className="w-full py-2.5 pr-9 text-xs sm:text-sm text-stone-900 placeholder-stone-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Category Pills Bar (Explore Screen) */}
          {customerTab === 'explore' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-0.5">
              {groomingCategories.map((cat) => {
                const Icon = cat.icon;
                const isActive = selectedServiceFilter === cat.name;

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedServiceFilter(cat.name)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isWomen
                        ? isActive
                          ? 'bg-[#F47B70] text-white shadow-xs scale-102'
                          : 'bg-white/15 text-[#FFF8F5] hover:bg-white/25 border border-white/10'
                        : isActive
                          ? 'bg-[#FF6422] text-white shadow-xs scale-102'
                          : 'bg-white/15 text-[#FFF8F0] hover:bg-white/25 border border-white/10'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
