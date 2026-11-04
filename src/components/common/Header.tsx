import React, { useState } from 'react';
import {
  MapPin,
  ChevronDown,
  ExternalLink,
  Navigation,
} from 'lucide-react';
import { useSalon } from '../../context/SalonContext';

export const Header: React.FC = () => {
  const {
    userLocation,
    setUserLocation,
    clearUserLocation,
    requestDeviceLocation,
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
              <span className="font-extrabold tracking-wider text-slate-100 uppercase text-xs sm:text-[14px] font-['Syne',sans-serif]">
                Kumbhkaran
              </span>
              <span className="font-bold tracking-widest text-amber-400 uppercase text-[10px] sm:text-[12px] font-['Syne',sans-serif]">
                Salons
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

        <div className="flex items-center gap-2 shrink min-w-0">
          {/* Partner / Salon Portal link */}
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

          {/* Location Selector */}
          <div className="relative min-w-0 shrink">
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
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          {locationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-2 z-50">
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
    </div>
  </header>
  );
};
