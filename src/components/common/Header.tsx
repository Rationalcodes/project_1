import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  ExternalLink,
  Navigation,
  Home,
  Compass,
  Heart,
  User,
} from 'lucide-react';
import { useSalon } from '../../context/SalonContext';
import { CustomerTab } from '@kumbhakaran/shared-types';

export const Header: React.FC = () => {
  const {
    userLocation,
    setUserLocation,
    clearUserLocation,
    requestDeviceLocation,
    triggerNotification,
    customerTab,
    setCustomerTab,
    setSelectedSalonForDetail,
    userProfile,
  } = useSalon();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const navItems: { id: CustomerTab; label: string; icon: React.FC<{ className?: string }>; badgeCount?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'favourites', label: 'Favourites', icon: Heart, badgeCount: userProfile?.savedSalons?.length || 0 },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-zinc-800/80 px-2.5 sm:px-6 py-2.5 sm:py-3 transition-all w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-2 sm:gap-2.5 text-xs w-full">
        {/* ROW 1: Centered Brand Logo with Left and Right Controls */}
        <div className="w-full flex items-center justify-between relative min-h-[36px] sm:min-h-[44px]">
          {/* Left: Location Selector */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            <div className="relative min-w-0">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-sm max-w-[150px] xs:max-w-[190px] sm:max-w-[240px] ${
                  userLocation
                    ? 'bg-zinc-900/90 border border-zinc-700 hover:border-amber-400 text-xs text-white'
                    : 'bg-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-xs text-amber-300 font-bold'
                }`}
                title={userLocation ? `Current location: ${userLocation.name}` : 'Set your location'}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className={`font-semibold truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[180px] ${!userLocation ? 'text-amber-400 font-bold' : ''}`}>
                  {userLocation ? userLocation.name.split(',')[0] : 'Set Location'}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 z-50">
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
              src="/logo-white.png"
              alt="Kumbhkaran Salons"
              className="h-8 sm:h-9 md:h-11 w-auto max-w-[160px] sm:max-w-[210px] md:max-w-[260px] object-contain transition-transform group-hover:scale-105 drop-shadow-md"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>

          {/* Right: Partner Link */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            <a
              href="https://project-1-xq1k.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all shrink-0"
              title="Kumbhkaran Salons Partner Portal"
            >
              <span className="hidden sm:inline">For </span>
              <span>Salons</span>
              <ExternalLink className="w-3 h-3 text-amber-400 shrink-0" />
            </a>
          </div>
        </div>

        {/* ROW 2: Navigation Bar Centered Below Logo */}
        <nav className="flex items-center justify-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl shadow-inner">
          {navItems.map((item) => {
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
      </div>
    </header>
  );
};
