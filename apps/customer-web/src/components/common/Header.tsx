import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Navigation,
  Search,
  User,
  X,
  Scissors,
  LayoutGrid,
  Smile,
  Droplets,
  Palette,
  Package,
} from 'lucide-react';
import { useCustomer, POPULAR_LOCATIONS } from '../../context/CustomerContext';
import logoWhite from '../../assets/logo-white.png';
import logoTransparent from '../../assets/logo-transparent.png';
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
    <header className="sticky top-0 z-40 w-full max-w-full overflow-visible transition-colors duration-300">
      {/* 1. TOP ROOF BAR (JioMart Warm Wine / Auburn base behind tabs) */}
      <div
        className={`w-full px-3 pt-2 transition-colors duration-300 ${
          isWomen ? 'bg-[#780A1C]' : 'bg-[#852210]'
        }`}
      >
        <div className="max-w-md mx-auto flex items-end justify-center gap-2">
          {/* MEN TAB */}
          <button
            type="button"
            onClick={() => setGenderFilter('men')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer select-none ${
              !isWomen
                ? 'bg-[#FF723A] text-stone-950 font-black text-xs sm:text-sm tracking-wider rounded-t-2xl rounded-b-none border-none shadow-none translate-y-[1px] z-10'
                : 'bg-white text-[#FF723A] font-black text-xs sm:text-sm tracking-wider rounded-full shadow-sm hover:bg-stone-50 mb-1 active:scale-95'
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
                ? 'bg-[#FFDFD6] text-[#7A0D22] font-black text-xs sm:text-sm tracking-wider rounded-t-2xl rounded-b-none border-none shadow-none translate-y-[1px] z-10'
                : 'bg-white text-[#C93B57] font-black text-xs sm:text-sm tracking-wider rounded-full shadow-sm hover:bg-stone-50 mb-1 active:scale-95'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>WOMEN</span>
          </button>
        </div>
      </div>

      {/* 2. THE SEAMLESS CANOPY (Naturally fused with active tab, softly rounded at bottom) */}
      <div
        className={`w-full px-3 sm:px-6 pt-2 pb-3.5 rounded-b-3xl transition-colors duration-300 ${
          isWomen
            ? 'bg-[#FFDFD6] shadow-[0_8px_24px_rgba(225,29,72,0.08)]'
            : 'bg-[#FF723A] shadow-[0_8px_24px_rgba(255,114,58,0.18)]'
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
                  src={isWomen ? logoTransparent : logoWhite}
                  alt="SLOON - Unisex Grooming Network"
                  className="h-7 xs:h-8 sm:h-9 w-auto max-w-[170px] sm:max-w-[220px] object-contain transition-transform group-hover:scale-102 drop-shadow-xs"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = logoFallback;
                  }}
                />
              </button>

              {/* Location Selector (Directly beneath logo like JioMart Delivery Address) */}
              <div className="relative mt-0.5">
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold transition-opacity cursor-pointer ${
                    isWomen
                      ? 'text-[#7A0D22] hover:text-[#520917]'
                      : 'text-white/95 hover:text-white'
                  }`}
                  title={userLocation ? `Location: ${userLocation.name}` : 'Set your location'}
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[170px] xs:max-w-[230px] sm:max-w-[340px]">
                    {userLocation ? userLocation.name : 'Set Location'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-80 shrink-0" />
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
                          ? 'bg-rose-50 border-rose-200 text-[#E11D48] hover:bg-rose-100'
                          : 'bg-orange-50 border-orange-200 text-[#FF723A] hover:bg-orange-100'
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
                          className="w-full pl-8 pr-3 py-1.5 bg-[#FAF7F2] border border-[#E2DDD5] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF723A]"
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
                                ? 'bg-orange-500 text-white border-orange-500 font-bold'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-orange-300'
                            }`}
                          >
                            {loc.name.split(',')[0]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {userLocation ? (
                      <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E2DDD5]">
                        <div className="flex items-center justify-between text-xs text-stone-800">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#FF723A] shrink-0" />
                            <span className="font-bold truncate">{userLocation.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              clearUserLocation();
                              setLocationDropdownOpen(false);
                              triggerNotification('Location reset. Showing all salons.');
                            }}
                            className="text-[11px] text-stone-500 hover:text-[#FF723A] transition-colors shrink-0 ml-2 underline"
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

            {/* Right: Beside Logo -> User Profile Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedSalonForDetail(null);
                setCustomerTab('profile');
              }}
              className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isWomen
                  ? 'bg-white/90 hover:bg-white text-[#7A0D22] border border-rose-200/60'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/25 backdrop-blur-xs'
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
                  className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-black/10"
                />
              ) : (
                <User
                  className={`w-4 h-4 shrink-0 ${
                    isWomen ? 'text-[#7A0D22]' : 'text-white'
                  }`}
                />
              )}
              <span className="hidden sm:inline truncate max-w-[90px]">
                {isAuthenticated
                  ? authUser?.name?.split(' ')[0]
                  : userProfile.name
                  ? userProfile.name.split(' ')[0]
                  : 'Profile'}
              </span>
            </button>
          </div>

          {/* Search Row: JioMart-Style Crisp White Pill Embedded in Canopy */}
          <div className="relative w-full">
            <div className="relative flex items-center bg-white rounded-full shadow-md overflow-hidden transition-all focus-within:ring-2 focus-within:ring-black/10">
              <div className="pl-3.5 pr-2 flex items-center pointer-events-none">
                <Search
                  className={`w-4 h-4 ${
                    isWomen ? 'text-[#C93B57]' : 'text-[#FF723A]'
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
                  className="absolute right-2.5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Category Pills Bar: Scrollable Horizontal Strip inside Canopy - Only shown on Explore screen as requested */}
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
                          ? 'bg-[#E11D48] text-white shadow-xs scale-102'
                          : 'bg-white/70 text-[#7A0D22] hover:bg-white border border-rose-200/50'
                        : isActive
                          ? 'bg-white text-[#FF723A] font-black shadow-xs scale-102'
                          : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-xs border border-white/15'
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
