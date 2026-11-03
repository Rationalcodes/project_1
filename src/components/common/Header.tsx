import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { useSalon, POPULAR_LOCATIONS } from '../../context/SalonContext';

export const Header: React.FC = () => {
  const {
    userLocation,
    setUserLocation,
    deviceViewMode,
    setDeviceViewMode,
    triggerNotification,
  } = useSalon();

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="font-black text-black text-sm tracking-tighter">K</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-slate-100 uppercase text-[13px] font-['Syne',sans-serif]">
                Kumbhakaran
              </span>
              <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30">
                Customer App
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
              Too lazy to call. Too smart to wait.
            </p>
          </div>
        </div>

        {/* Location Dropdown & Controls */}
        <div className="flex items-center gap-2">
          {/* Location Selector */}
          <div className="relative">
            <button
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-700 hover:border-amber-400 text-xs text-white transition-all shadow-sm"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">
                {userLocation.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {locationDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-1.5 z-50">
                <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 px-3 py-1.5">
                  Popular Hubs
                </div>
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
                    <span>{loc.name}</span>
                    {userLocation.name === loc.name && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toggle View Mode: Smartphone frame vs Responsive */}
          <div className="hidden sm:flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            <button
              onClick={() => setDeviceViewMode('mobile-frame')}
              title="View in mobile smartphone frame"
              className={`p-1.5 rounded ${
                deviceViewMode === 'mobile-frame'
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setDeviceViewMode('responsive')}
              title="View in full expansive responsive view"
              className={`p-1.5 rounded ${
                deviceViewMode === 'responsive'
                  ? 'bg-zinc-800 text-amber-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
