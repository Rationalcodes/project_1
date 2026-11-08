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
  Sparkles,
} from 'lucide-react';
import { useCustomer, POPULAR_LOCATIONS } from '../../context/CustomerContext';
import logoMen from '../../assets/logo-men.png';
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
          triggerNotification(`Location set to "${trimmed}"`);
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
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 space-y-2.5">
        {/* Main Nav Row: Logo + Location (Left) | Gender Switcher (Center) | Profile (Right) */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Brand Logo & Location */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setSelectedSalonForDetail(null);
                setCustomerTab('home');
              }}
              className="flex items-center cursor-pointer select-none group focus:outline-none shrink-0"
              title="SLOON Home"
            >
              <img
                src={isWomen ? logoTransparent : logoMen}
                alt="SLOON"
                className="h-8 sm:h-9 w-auto max-w-[140px] sm:max-w-[180px] object-contain transition-transform group-hover:scale-102"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = logoFallback;
                }}
              />
            </button>

            {/* Location Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-semibold transition-all cursor-pointer"
                title={userLocation ? `Location: ${userLocation.name}` : 'Set your location'}
              >
                <MapPin className={`w-3.5 h-3.5 shrink-0 ${isWomen ? 'text-rose-600' : 'text-[#FF6422]'}`} />
                <span className="truncate max-w-[110px] xs:max-w-[160px] sm:max-w-[220px]">
                  {userLocation ? userLocation.name : 'Select Area'}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-500 shrink-0" />
              </button>

              {/* Location Picker Dropdown */}
              {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white border border-stone-200 rounded-2xl shadow-xl p-3 z-50 text-stone-900 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={async () => {
                      await requestDeviceLocation();
                      setLocationDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-900 font-bold text-xs transition-colors cursor-pointer text-left border border-stone-200"
                  >
                    <Navigation className={`w-4 h-4 shrink-0 ${isWomen ? 'text-rose-600' : 'text-[#FF6422]'}`} />
                    <div>
                      <div className="font-bold">Use Current GPS Location</div>
                      <div className="text-[10px] text-stone-500 font-normal">Accurate walk-in distance to nearby salons</div>
                    </div>
                  </button>

                  <div className="my-2.5 border-t border-stone-100" />

                  <form onSubmit={handleApplyCustomLocation} className="space-y-1.5">
                    <label className="text-[11px] font-bold text-stone-700 block">
                      Search area or landmark
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. Koramangala, Indiranagar"
                        value={customLocalityInput}
                        onChange={(e) => setCustomLocalityInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-400"
                      />
                      <button
                        type="submit"
                        className={`px-3 py-1.5 text-white font-bold text-xs rounded-xl transition-all cursor-pointer ${
                          isWomen ? 'bg-[#E11D48] hover:bg-rose-700' : 'bg-[#FF6422] hover:bg-orange-600'
                        }`}
                      >
                        Set
                      </button>
                    </div>
                  </form>

                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                      Popular Areas
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
                      {POPULAR_LOCATIONS.map((loc) => (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => {
                            setUserLocation(loc);
                            setLocationDropdownOpen(false);
                            triggerNotification(`Location set to ${loc.name}`);
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium transition-colors cursor-pointer"
                        >
                          {loc.name.split(',')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {userLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        clearUserLocation();
                        setLocationDropdownOpen(false);
                        triggerNotification('Location reset to default');
                      }}
                      className="mt-2.5 w-full py-1 text-center text-[11px] text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                    >
                      Clear Location Filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center: Sleek Dual-Experience Switcher (MEN / WOMEN) */}
          <div className="bg-stone-100 p-1 rounded-full flex items-center shrink-0 border border-stone-200/60 shadow-2xs">
            <button
              type="button"
              onClick={() => setGenderFilter('men')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                !isWomen
                  ? 'bg-[#FF6422] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>MEN</span>
            </button>

            <button
              type="button"
              onClick={() => setGenderFilter('women')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isWomen
                  ? 'bg-[#E11D48] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>WOMEN</span>
            </button>
          </div>

          {/* Right: Profile Avatar Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedSalonForDetail(null);
              setCustomerTab('profile');
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-bold transition-all cursor-pointer"
            title={isAuthenticated ? `Profile: ${authUser?.name}` : 'Profile & Settings'}
          >
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt=""
                className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-black/10"
              />
            ) : (
              <User className="w-4 h-4 text-stone-600 shrink-0" />
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

        {/* Search Row: Clean modern search bar */}
        <div className="relative w-full">
          <div className="relative flex items-center bg-stone-100 hover:bg-stone-100/90 focus-within:bg-white rounded-2xl border border-stone-200/80 focus-within:border-stone-400 focus-within:shadow-sm transition-all overflow-hidden">
            <div className="pl-3.5 pr-2 flex items-center pointer-events-none text-stone-400">
              <Search className={`w-4 h-4 ${isWomen ? 'text-rose-600' : 'text-[#FF6422]'}`} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isWomen
                  ? 'Search beauty parlours, styling, facials, spa...'
                  : 'Search barbers, haircuts, beard grooming, stylists...'
              }
              className="w-full py-2.5 pr-9 text-xs sm:text-sm text-stone-900 placeholder-stone-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Pills Bar on Explore Screen */}
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
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isActive
                      ? isWomen
                        ? 'bg-[#E11D48] text-white border-rose-600 shadow-2xs'
                        : 'bg-[#FF6422] text-white border-orange-500 shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
