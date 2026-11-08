import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Navigation,
  Search,
  User,
  X,
  Scissors,
  SlidersHorizontal,
  Compass,
  Heart,
  Home,
} from 'lucide-react';
import { useCustomer, POPULAR_LOCATIONS } from '../../context/CustomerContext';
import { getTheme } from '../../theme';
import logoTransparent from '../../assets/logo-transparent.png';
import logoMen from '../../assets/logo-men.png';
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
  const theme = getTheme(genderFilter);

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
      {/* 1. TOP ROOF BAR: DUAL EXPERIENCE SWITCHER */}
      <div
        className={`w-full px-3 py-1.5 transition-colors duration-300 ${
          isWomen ? 'bg-[#5C0A19]' : 'bg-[#1F1F1F]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/70 hidden sm:inline">
              Experience:
            </span>
            <div className="inline-flex p-0.5 bg-black/30 rounded-full border border-white/10 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setGenderFilter('men')}
                className={`py-1 px-3 sm:px-4 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isWomen
                    ? 'bg-[#FF6422] text-white shadow-sm scale-102'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>MEN</span>
              </button>
              <button
                type="button"
                onClick={() => setGenderFilter('women')}
                className={`py-1 px-3 sm:px-4 rounded-full text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  isWomen
                    ? 'bg-[#E11D48] text-white shadow-sm scale-102'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>WOMEN</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-white/80">
            <span className="hidden md:inline tracking-tight text-white/60">
              Your Neighbourhood Salon Network
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-extrabold text-[11px] bg-white/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Queue Synced
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN BRAND & NAVIGATION CANOPY */}
      <div
        className={`w-full px-3 sm:px-6 pt-3 pb-3.5 transition-colors duration-300 border-b ${
          isWomen
            ? 'bg-[#FFDFD6] border-rose-200 shadow-[0_4px_24px_rgba(225,29,72,0.06)]'
            : 'bg-[#FF723A] border-orange-400 shadow-[0_4px_24px_rgba(255,100,34,0.12)]'
        }`}
      >
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Top Row: Logo, Location, Desktop Nav, Profile */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: Brand Logo + Location */}
            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab('home');
                }}
                className="cursor-pointer select-none group focus:outline-none shrink-0"
                title="SLOON Home"
              >
                <img
                  src={isWomen ? logoTransparent : logoMen}
                  alt="SLOON"
                  className="h-9 sm:h-11 w-auto max-w-[170px] sm:max-w-[240px] object-contain transition-transform group-hover:scale-102 drop-shadow-xs"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = logoFallback;
                  }}
                />
              </button>

              {/* Location Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl transition-all cursor-pointer text-left ${
                    isWomen
                      ? 'bg-white/80 hover:bg-white text-[#3B1910] border border-rose-200/80 shadow-2xs'
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/25 backdrop-blur-xs shadow-2xs'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-white fill-current shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[9px] uppercase font-black tracking-wider opacity-75 leading-none">
                      Your location
                    </span>
                    <span className="block text-xs font-black truncate max-w-[130px] sm:max-w-[200px] leading-tight mt-0.5">
                      {userLocation ? userLocation.name : 'Chandrapur, Maharashtra'}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 opacity-70 shrink-0 ml-0.5" />
                </button>

                {/* Dropdown sheet */}
                {locationDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white border border-stone-200 rounded-3xl shadow-2xl p-4 z-50 text-stone-900 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-stone-900">Select City / Hub</span>
                      <button
                        type="button"
                        onClick={() => setLocationDropdownOpen(false)}
                        className="text-stone-400 hover:text-stone-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await requestDeviceLocation();
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full mb-3 p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        isWomen
                          ? 'bg-rose-50 border-rose-200 text-[#E11D48] hover:bg-rose-100'
                          : 'bg-orange-50 border-orange-200 text-[#FF6422] hover:bg-orange-100'
                      }`}
                    >
                      <Navigation className="w-3.5 h-3.5 animate-pulse" />
                      <span>Use My Exact Current Location</span>
                    </button>

                    <form onSubmit={handleApplyCustomLocation} className="mb-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={customLocalityInput}
                          onChange={(e) => setCustomLocalityInput(e.target.value)}
                          placeholder="Search city, locality or area..."
                          className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422]"
                        />
                      </div>
                    </form>

                    <div className="mb-2">
                      <p className="text-[10px] uppercase font-bold text-stone-400 mb-1.5">
                        Popular Hubs
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto no-scrollbar">
                        {POPULAR_LOCATIONS.map((loc) => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => {
                              setUserLocation(loc);
                              setLocationDropdownOpen(false);
                              triggerNotification(`Location set to ${loc.name}`);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                              userLocation?.name === loc.name
                                ? 'bg-stone-900 text-white border-stone-900 font-bold'
                                : 'bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-400'
                            }`}
                          >
                            {loc.name.split(',')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Center/Right: Desktop Navigation links */}
            <nav className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab('home');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  customerTab === 'home'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab('explore');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  customerTab === 'explore'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab('map');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  customerTab === 'map'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Map</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedSalonForDetail(null);
                  setCustomerTab('favourites');
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  customerTab === 'favourites'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>Saved</span>
              </button>
            </nav>

            {/* Right: Customer Profile Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedSalonForDetail(null);
                setCustomerTab('profile');
              }}
              className={`flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                isWomen
                  ? 'bg-white/90 hover:bg-white text-[#3B1910] border border-rose-200/80'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/25 backdrop-blur-xs'
              }`}
              title="Customer Account"
            >
              {authUser?.avatarUrl ? (
                <img
                  src={authUser.avatarUrl}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-black/10"
                />
              ) : (
                <User className="w-4 h-4 shrink-0 text-current" />
              )}
              <span className="hidden sm:inline font-black truncate max-w-[100px]">
                {isAuthenticated
                  ? authUser?.name?.split(' ')[0]
                  : userProfile.name
                  ? userProfile.name.split(' ')[0]
                  : 'Account'}
              </span>
            </button>
          </div>

          {/* Bottom Row: Unified Search & Filter Bar */}
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1 flex items-center bg-white rounded-full shadow-md overflow-hidden transition-all focus-within:ring-2 focus-within:ring-stone-900/10">
              <div className="pl-4 pr-2 flex items-center pointer-events-none">
                <Search
                  className={`w-4 h-4 ${
                    isWomen ? 'text-[#E11D48]' : 'text-[#FF6422]'
                  }`}
                />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isWomen
                    ? 'Search salons, facials, hair colour, bridal studio...'
                    : 'Search barbershops, haircuts, beard groomers, studios...'
                }
                className="w-full py-2.5 pr-9 text-xs sm:text-sm text-stone-900 placeholder-stone-400 bg-transparent focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-700"
                  title="Clear"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedSalonForDetail(null);
                setCustomerTab('explore');
              }}
              className={`p-2.5 rounded-full font-bold shadow-md transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                customerTab === 'explore'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-800 hover:bg-stone-100'
              }`}
              title="Explore & Filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
