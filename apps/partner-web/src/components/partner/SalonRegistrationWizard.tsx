import React, { useState } from 'react';
import { useSalon } from '../../context/PartnerContext';
// Address & Location step
import {
  Store,
  MapPin,
  Clock,
  Scissors,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Camera,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { SalonRegistrationInput } from '@kumbhakaran/shared-types';

interface SalonRegistrationWizardProps {
  onSuccess: () => void;
}

export const SalonRegistrationWizard: React.FC<SalonRegistrationWizardProps> = ({ onSuccess }) => {
  const { registerSalon, partnerUser } = useSalon();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [salonName, setSalonName] = useState('');
  const [tagline, setTagline] = useState('Premium cuts & authentic walk-in transparency');
  const [ownerName, setOwnerName] = useState(partnerUser?.name || '');
  const [phone, setPhone] = useState('+91 ');
  const [email, setEmail] = useState(partnerUser?.email || '');

  // Location State
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('Koramangala');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560034');
  const [coordinates, setCoordinates] = useState({ lat: 12.9344, lng: 77.6258 });

  // Hours & Stations
  const [openTime, setOpenTime] = useState('09:00 AM');
  const [closeTime, setCloseTime] = useState('09:30 PM');
  const [activeBarbers, setActiveBarbers] = useState<number>(3);
  const [masterBarber, setMasterBarber] = useState('');

  // Starter Services
  const [services, setServices] = useState([
    { name: 'Signature Haircut', category: 'Hair' as const, price: 150, durationMinutes: 25, description: 'Hair wash, precision scissor & clipper cut, hot towel finish.' },
    { name: 'Beard Sculpt & Shave', category: 'Beard' as const, price: 80, durationMinutes: 15, description: 'Razor edging, beard butter massage, steam towel.' },
    { name: 'Haircut + Beard Styling Combo', category: 'Combos' as const, price: 220, durationMinutes: 35, description: 'Complete gentleman makeover package.' },
    { name: 'Scalp Detox Hair Spa', category: 'Spa' as const, price: 400, durationMinutes: 40, description: 'Anti-dandruff massage and keratin restoration.' },
    { name: 'Activated Charcoal Facial', category: 'Facial' as const, price: 350, durationMinutes: 30, description: 'Deep pore cleanse and radiant glow treatment.' }
  ]);

  // Photo
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80');

  const photoPresets = [
    { label: 'Gentleman Barbershop', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Modern Fade Studio', url: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Leather Lounge Club', url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Unisex Spa Suite', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80' }
  ];

  const handleServicePriceChange = (index: number, newPrice: number) => {
    const updated = [...services];
    updated[index].price = newPrice;
    setServices(updated);
  };

  const handleCoordinatesChange = (coords: { lat: number; lng: number; locality?: string }) => {
    setCoordinates({ lat: coords.lat, lng: coords.lng });
    if (coords.locality) {
      setLocality(coords.locality);
    }
  };

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim() || !ownerName.trim()) {
      alert("Please fill in Salon Name and Owner Name.");
      return;
    }

    const regData: SalonRegistrationInput = {
      name: salonName,
      tagline,
      ownerName,
      phone,
      email: email || `${salonName.toLowerCase().replace(/\s+/g, '')}@kumbhakaran.app`,
      address: address || `${locality}, ${city}`,
      locality,
      city,
      state,
      pincode,
      coordinates,
      coverImage,
      openingHours: {
        open: openTime,
        close: closeTime,
        formatted: `${openTime} – ${closeTime} (All Days)`
      },
      services,
      activeBarbers,
      masterBarberName: masterBarber || ownerName
    };

    registerSalon(regData);
    onSuccess();
  };

  return (
    <div className="max-w-3xl mx-auto bg-[#13131b] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      {/* Wizard Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
          <Store className="w-3.5 h-3.5" />
          <span>Kumbhakaran Partner Onboarding</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
          Register Your Salon
        </h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
          Join the walk-in transparency network. Pin your exact location, set prices, and let customers see your live waiting count.
        </p>
      </div>

      {/* 4 Step Progress Pills */}
      <div className="flex items-center justify-between gap-1 mb-8 max-w-md mx-auto text-[11px] font-bold">
        {[
          { step: 1, label: 'Identity' },
          { step: 2, label: 'Location' },
          { step: 3, label: 'Hours & Chairs' },
          { step: 4, label: 'Services & Launch' }
        ].map((s) => (
          <div key={s.step} className="flex-1 flex flex-col items-center">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                currentStep === s.step
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-black'
                  : currentStep > s.step
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {currentStep > s.step ? '✓' : s.step}
            </div>
            <span className={`text-[10px] mt-1 ${currentStep === s.step ? 'text-amber-400' : 'text-zinc-500'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmitRegistration}>
        {/* STEP 1: BUSINESS IDENTITY */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-400" /> Step 1: Salon & Owner Details
            </h3>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Salon / Studio Name *
              </label>
              <input
                type="text"
                required
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="e.g. Blade & Timber Grooming Co."
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Salon Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Master cuts, beard sculpting & premium lounge"
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Raghav Sharma"
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Owner Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 00000"
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@yourstudio.com"
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  if (!salonName.trim() || !ownerName.trim()) {
                    alert("Please enter Salon Name and Owner Name to continue.");
                    return;
                  }
                  setCurrentStep(2);
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>Next: Salon Address & Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: INTERACTIVE MAP & LOCATION */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" /> Step 2: Salon Address & Location
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Search your address or click directly on the interactive map to position your salon marker.
              </p>
            </div>

            {/* Location selector */}
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">Fill in your physical location details below.</div>

            {/* Detailed Street Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Street Address & Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 42, 80 Feet Road, Near Sony Signal"
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Locality / Neighborhood *
                </label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="Koramangala 4th Block"
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  City & State *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="560034"
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>Next: Hours & Chairs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OPERATING HOURS & CHAIRS */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" /> Step 3: Operating Hours & Capacity
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Opening Time
                </label>
                <input
                  type="text"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Closing Time
                </label>
                <input
                  type="text"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  placeholder="09:30 PM"
                  className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Active Barber Chairs / Stations
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveBarbers(num)}
                    className={`w-10 h-10 rounded-xl font-bold text-xs border transition-all ${
                      activeBarbers === num
                        ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-500/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                The more active chairs, the faster wait times decrease on the customer application.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Head Stylist / Master Barber Name
              </label>
              <input
                type="text"
                value={masterBarber}
                onChange={(e) => setMasterBarber(e.target.value)}
                placeholder="e.g. Master Arjun"
                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-2xl text-xs text-white"
              />
            </div>

            {/* Salon Photograph Presets */}
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" /> Select Studio Photograph Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {photoPresets.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCoverImage(p.url)}
                    className={`cursor-pointer rounded-xl overflow-hidden border-2 relative transition-all ${
                      coverImage === p.url ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-zinc-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p.url} alt={p.label} className="w-full h-16 object-cover" />
                    <div className="p-1 bg-black/80 text-[10px] text-zinc-300 truncate text-center">
                      {p.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>Next: Services & Launch</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SERVICES & INSTANT LAUNCH */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-amber-400" /> Step 4: Confirm Services & Walk-In Pricing
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Customize your starting prices. You can edit or add more anytime in your partner dashboard.
              </p>
            </div>

            <div className="space-y-2.5">
              {services.map((svc, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-900/90 border border-zinc-700/80 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{svc.name}</span>
                    <span className="text-[10px] text-zinc-400 ml-2">~{svc.durationMinutes} mins</span>
                    <p className="text-[11px] text-zinc-500 line-clamp-1">{svc.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-zinc-400 font-semibold">₹</span>
                    <input
                      type="number"
                      value={svc.price}
                      onChange={(e) => handleServicePriceChange(idx, Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-zinc-800 border border-zinc-600 rounded-xl text-amber-400 font-bold text-sm text-right focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Launch Guarantee */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-zinc-300">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Walk-in Transparency Activation:</strong> Upon registering, your studio will immediately appear on the Kumbhakaran Discovery Map with coordinates ({coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°). Customers will see your live waiting count!
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="submit"
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-sm hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch & Open Live Queue</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

