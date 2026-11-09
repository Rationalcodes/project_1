import React from 'react';
import { useSalon, formatDuration } from '../../context/SalonContext';
import { X, Navigation, Car, Bike, Footprints, ExternalLink, MapPin } from 'lucide-react';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({ isOpen, onClose }) => {
  const { selectedSalonForDetail, userLocation } = useSalon();

  if (!isOpen || !selectedSalonForDetail) return null;

  const salon = selectedSalonForDetail;
  const carMins = Math.max(3, Math.round(salon.distanceKm * 4.5));
  const bikeMins = Math.max(2, Math.round(salon.distanceKm * 2.8));
  const walkMins = Math.max(5, Math.round(salon.distanceKm * 13));

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    salon.name + ', ' + salon.address
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E8E2D8] rounded-3xl max-w-md w-full p-5 shadow-2xl relative text-stone-900">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6422] flex items-center justify-center">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Directions to {salon.name}
              </h3>
              <p className="text-[11px] text-stone-500">
                {salon.distanceKm} km from {userLocation ? userLocation.name.split(',')[0] : 'Current Location'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Travel Mode Time Estimates */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-3 text-center">
            <Bike className="w-5 h-5 text-[#FF6422] mx-auto mb-1" />
            <div className="text-sm font-bold text-stone-900">{formatDuration(bikeMins)}</div>
            <div className="text-[10px] text-stone-500">Two-Wheeler</div>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-3 text-center">
            <Car className="w-5 h-5 text-emerald-700 mx-auto mb-1" />
            <div className="text-sm font-bold text-stone-900">{formatDuration(carMins)}</div>
            <div className="text-[10px] text-stone-500">Car / Cab</div>
          </div>

          <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-3 text-center">
            <Footprints className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-stone-900">{formatDuration(walkMins)}</div>
            <div className="text-[10px] text-stone-500">Walking</div>
          </div>
        </div>

        {/* Studio Address details */}
        <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8E2D8] text-xs space-y-1 mb-4">
          <div className="font-semibold text-stone-900 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#FF6422]" /> Complete Address
          </div>
          <p className="text-stone-700 pl-5">{salon.address}, {salon.city} - {salon.pincode}</p>
          <p className="text-[11px] text-stone-500 pl-5">Phone: {salon.phone}</p>
        </div>

        {/* Open in Google Maps link */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-2xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
        >
          <span>Open in Google Maps Navigation</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
