import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useSalon, POPULAR_LOCATIONS } from '../../context/SalonContext';

export const Header: React.FC = () => {
  const {
    userLocation,
    setUserLocation,
    triggerNotification,
  } = useSalon();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-4 py-2.5 sm:py-3 transition-all w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3 text-xs w-full">
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <span className="font-black text-black text-xs sm:text-sm tracking-tighter">K</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold tracking-wider text-slate-100 uppercase text-xs sm:text-[13px] font-['Syne',sans-serif] truncate">
                Kumbhakaran
              </span>
              <span className="hidden sm:inline text-[10px] uppercase tracking-widest px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shrink-0">
                Customer App
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium hidden md:block">
              Too lazy to call. Too smart to wait.
            </p>
          </div>
        </div>

        {/* Location Selector */}
        <div className="relative min-w-0 shrink">
          <button
            onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-amber-400 text-xs text-white transition-all shadow-sm max-w-[150px] xs:max-w-[190px] sm:max-w-[240px]"
          >
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-medium truncate max-w-[70px] xs:max-w-[100px] sm:max-w-[180px]">
              {userLocation.name.split(',')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          {locationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-24px)] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-1.5 z-50">
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 px-3 py-1.5">
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
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                      userLocation.name === loc.name
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="truncate">{loc.name}</span>
                    {userLocation.name === loc.name && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
