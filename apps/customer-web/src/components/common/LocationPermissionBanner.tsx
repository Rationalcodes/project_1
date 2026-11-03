import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, X, Sparkles } from 'lucide-react';
import { useCustomer, POPULAR_LOCATIONS } from '../../context/CustomerContext';

export const LocationPermissionBanner: React.FC = () => {
  const { requestDeviceLocation, setUserLocation, userLocation, triggerNotification } = useCustomer();
  const [isVisible, setIsVisible] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQuery, setManualQuery] = useState('');

  useEffect(() => {
    // Check if user has previously dismissed or accepted location prompt
    const prompted = localStorage.getItem('kumbhakaran_location_prompted');
    if (!prompted) {
      // Delay display slightly for smooth page load
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllowLocation = async () => {
    localStorage.setItem('kumbhakaran_location_prompted', 'true');
    setIsVisible(false);
    await requestDeviceLocation();
  };

  const handleDismiss = () => {
    localStorage.setItem('kumbhakaran_location_prompted', 'true');
    setIsVisible(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = manualQuery.trim();
    if (!q) return;

    const matched = POPULAR_LOCATIONS.find((l) =>
      l.name.toLowerCase().includes(q.toLowerCase()),
    );
    if (matched) {
      setUserLocation(matched);
    } else {
      setUserLocation({
        name: q,
        lat: 12.9716,
        lng: 77.5946,
      });
    }

    localStorage.setItem('kumbhakaran_location_prompted', 'true');
    setIsVisible(false);
    triggerNotification(`Location set to "${q}"`);
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-4 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-r from-amber-950/40 via-[#181822] to-[#121218] border border-amber-500/30 rounded-3xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <Navigation className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Precision Discovery
                </span>
                <span className="text-xs text-zinc-400">Current: {userLocation.name}</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                Share your location for live salon queues near you?
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Kumbhakaran measures live walk-in queues and walking distances using PostGIS spatial search.
              </p>

              {showManualInput ? (
                <form onSubmit={handleManualSubmit} className="mt-3 flex items-center gap-2 max-w-sm">
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Search city, locality or PIN code..."
                    className="flex-1 px-3 py-1.5 bg-black/70 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="p-1.5 text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAllowLocation}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-black" />
                    <span>Use My Current Location</span>
                  </button>
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Search City, Locality or PIN
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
