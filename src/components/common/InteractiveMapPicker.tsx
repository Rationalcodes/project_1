import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, CheckCircle2, Crosshair, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { openGoogleMapsLocation } from '@kumbhakaran/ui';

interface InteractiveMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onCoordinatesChange: (coords: { lat: number; lng: number; locality?: string }) => void;
}

export const InteractiveMapPicker: React.FC<InteractiveMapPickerProps> = ({
  initialLat = 12.9344,
  initialLng = 77.6258,
  onCoordinatesChange
}) => {
  const [lat, setLat] = useState<number>(initialLat);
  const [lng, setLng] = useState<number>(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoLocating, setGeoLocating] = useState(false);
  const [pinOffset, setPinOffset] = useState({ x: 50, y: 50 }); // percentage within viewport
  const [isValidated, setIsValidated] = useState(true);

  // Address search presets
  const popularPresets = [
    { name: 'Koramangala 4th Block, Bengaluru', lat: 12.9344, lng: 77.6258, locality: 'Koramangala' },
    { name: '100 Feet Road, Indiranagar, Bengaluru', lat: 12.9719, lng: 77.6412, locality: 'Indiranagar' },
    { name: 'Sector 1, HSR Layout, Bengaluru', lat: 12.9121, lng: 77.6446, locality: 'HSR Layout' },
    { name: 'BTM 2nd Stage, Bengaluru', lat: 12.9165, lng: 77.6101, locality: 'BTM Layout' },
    { name: 'Linking Road, Bandra West, Mumbai', lat: 19.0596, lng: 72.8295, locality: 'Bandra West' },
    { name: 'Outer Ring Road, Bellandur, Bengaluru', lat: 12.9260, lng: 77.6762, locality: 'Bellandur' }
  ];

  const handleSelectPreset = (p: typeof popularPresets[0]) => {
    setLat(p.lat);
    setLng(p.lng);
    setSearchQuery(p.name);
    setPinOffset({ x: 50, y: 50 });
    setIsValidated(true);
    onCoordinatesChange({ lat: p.lat, lng: p.lng, locality: p.locality });
  };

  // Click on map to place pin
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    setPinOffset({ x: percentX, y: percentY });

    // Map pixel offset to small delta from base coords
    const deltaLat = ((50 - percentY) / 100) * 0.04;
    const deltaLng = ((percentX - 50) / 100) * 0.04;

    const newLat = Number((lat + deltaLat).toFixed(6));
    const newLng = Number((lng + deltaLng).toFixed(6));

    setLat(newLat);
    setLng(newLng);
    setIsValidated(true);
    onCoordinatesChange({ lat: newLat, lng: newLng });
  };

  // HTML5 Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = Number(pos.coords.latitude.toFixed(6));
        const userLng = Number(pos.coords.longitude.toFixed(6));
        setLat(userLat);
        setLng(userLng);
        setPinOffset({ x: 50, y: 50 });
        setIsValidated(true);
        setGeoLocating(false);
        onCoordinatesChange({ lat: userLat, lng: userLng });
      },
      (err) => {
        setGeoLocating(false);
        alert(`Location permission denied or unavailable: ${err.message}. You can manually pick on the map!`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Filtered search results
  const filteredPresets = searchQuery.trim()
    ? popularPresets.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="space-y-3">
      {/* Option A: Search Address / Locality */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search salon street, locality, or landmark..."
              className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoLocating}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-xs font-semibold text-zinc-300 hover:text-white transition-colors shrink-0"
          >
            <Crosshair className={`w-3.5 h-3.5 text-amber-400 ${geoLocating ? 'animate-spin' : ''}`} />
            <span>{geoLocating ? 'Detecting...' : 'Use My GPS'}</span>
          </button>
        </div>

        {/* Instant Search Suggestions */}
        {filteredPresets.length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-1 z-30">
            {filteredPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 rounded-lg flex items-center justify-between"
              >
                <span>{p.name}</span>
                <span className="text-[10px] text-amber-400">Select</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Option B: Interactive Map Pin Dropper */}
      <div className="rounded-2xl border-2 border-zinc-700/80 overflow-hidden relative shadow-inner">
        <div
          onClick={handleMapClick}
          className="h-56 sm:h-64 w-full bg-[#08080b] relative cursor-crosshair overflow-hidden select-none"
        >
          {/* Map Grid Pattern */}
          <svg className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="picker-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3f3f46" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#picker-grid)" />
            {/* Arteries */}
            <path d="M 0,120 Q 200,80 400,160 T 800,140" fill="none" stroke="#52525b" strokeWidth="12" />
            <path d="M 180,0 Q 220,180 180,350" fill="none" stroke="#52525b" strokeWidth="10" />
            <path d="M 0,220 L 800,220" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" opacity="0.4" />
          </svg>

          {/* Interactive Dropped Salon Pin */}
          <div
            style={{ left: `${pinOffset.x}%`, top: `${pinOffset.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-200"
          >
            <div className="flex flex-col items-center">
              <div className="bg-amber-500 text-black px-2.5 py-1 rounded-xl font-black text-[10px] shadow-2xl flex items-center gap-1 border border-white">
                <MapPin className="w-3 h-3 fill-black text-black" />
                <span>Exact Salon Location</span>
              </div>
              <div className="w-3 h-3 bg-amber-500 rotate-45 -mt-1.5 shadow" />
              <div className="w-4 h-4 rounded-full bg-amber-400/40 animate-ping -mt-1" />
            </div>
          </div>

          {/* Instructions banner */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <span className="text-[10px] bg-black/80 backdrop-blur-sm border border-zinc-700 text-zinc-300 px-2 py-1 rounded-lg">
              🎯 Click anywhere on the map to reposition your salon pin
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              Pin Ready
            </span>
          </div>
        </div>

        {/* Validated Coordinates Output Footer */}
        <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-zinc-400">Validated Coordinates:</span>
            <span className="font-mono text-amber-400 font-bold">
              {lat}°, {lng}°
            </span>
          </div>

          <button
            type="button"
            onClick={() => openGoogleMapsLocation(lat, lng)}
            className="text-[10px] text-amber-400 hover:text-white flex items-center gap-1 font-semibold"
            title="Open in Google Maps"
          >
            <span>Verify in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
