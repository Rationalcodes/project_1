import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, X } from 'lucide-react';
import { useCustomer, POPULAR_LOCATIONS } from '../../context/CustomerContext';
import { safeStorage } from '../../utils/safeStorage';

export const LocationPermissionBanner: React.FC = () => {
  const { requestDeviceLocation, setUserLocation, userLocation, triggerNotification } = useCustomer();
  const [isVisible, setIsVisible] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualQuery, setManualQuery] = useState('');

  useEffect(() => {
    // Check if user has previously dismissed or accepted location prompt
    const prompted = safeStorage.getItem('kumbhakaran_location_prompted');
    if (!prompted) {
      // Delay display slightly for smooth page load
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllowLocation = async () => {
    safeStorage.setItem('kumbhakaran_location_prompted', 'true');
    setIsVisible(false);
    await requestDeviceLocation();
  };

  const handleDismiss = () => {
    safeStorage.setItem('kumbhakaran_location_prompted', 'true');
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

    safeStorage.setItem('kumbhakaran_location_prompted', 'true');
    setIsVisible(false);
    triggerNotification(`Location set to "${q}"`);
  };

  if (!isVisible) return null;

  return (
    <div className="relative mb-4 animate-in slide-in-from-top-4 duration-300 w-full max-w-full overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 via-amber-50/50 to-white border border-orange-200 rounded-3xl p-3.5 sm:p-4 shadow-[0_4px_16px_rgba(40,20,10,0.04)]">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-orange-100 text-[#FF6422] border border-orange-200 flex items-center justify-center shrink-0 shadow-sm">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6422]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-100 text-[#FF6422] border border-orange-200">
                  Precision Discovery
                </span>
                <span className="text-[11px] sm:text-xs text-stone-500 truncate max-w-[160px] sm:max-w-[240px]">
                  {userLocation ? `Current: ${userLocation.name}` : 'Location: Not set'}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 mt-1">
                Share your location for live salon queues near you?
              </h4>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 leading-relaxed">
                SLOON measures live walk-in queues and walking distances using PostGIS spatial search.
              </p>

              {showManualInput ? (
                <form onSubmit={handleManualSubmit} className="mt-3 flex items-center gap-2 max-w-sm w-full">
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => setManualQuery(e.target.value)}
                    placeholder="Search city, locality or PIN code..."
                    className="flex-1 min-w-0 px-3 py-1.5 bg-white border border-[#E2DDD5] rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 shrink-0 shadow-xs"
                  >
                    Set
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualInput(false)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 shrink-0"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleAllowLocation}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-white" />
                    <span>Use My Current Location</span>
                  </button>
                  <button
                    onClick={() => setShowManualInput(true)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-white border border-[#E2DDD5] text-stone-700 hover:border-[#FF6422] text-xs font-semibold transition-colors text-center shadow-xs"
                  >
                    Search City, Locality or PIN
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-lg transition-colors shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
