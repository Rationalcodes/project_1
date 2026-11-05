import React, { useState } from 'react';
import { useSalon } from '../../context/PartnerContext';
import { SalonLocationPicker } from './SalonLocationPicker';
// Address & Location step
import {
  Store,
  MapPin,
  Clock,
  Scissors,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Camera,
  Upload,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { SalonRegistrationInput, SalonType } from '@kumbhakaran/shared-types';

interface SalonRegistrationWizardProps {
  onSuccess: () => void;
}

export const SalonRegistrationWizard: React.FC<SalonRegistrationWizardProps> = ({ onSuccess }) => {
  const { registerSalon, partnerUser, activeSalon, setPartnerView } = useSalon();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Form State: Pre-fill with existing salon if available for this Gmail ID
  const [salonName, setSalonName] = useState(activeSalon?.name || '');
  const [salonType, setSalonType] = useState<SalonType>(activeSalon?.salonType || 'unisex');
  const [tagline, setTagline] = useState(activeSalon?.tagline || 'Premium cuts & authentic walk-in transparency');
  const [ownerName, setOwnerName] = useState(activeSalon?.ownerName || partnerUser?.name || '');
  const [phone, setPhone] = useState(activeSalon?.phone || '+91 ');
  const [email, setEmail] = useState(activeSalon?.email || partnerUser?.email || '');

  // Location State
  const [address, setAddress] = useState(activeSalon?.address || '');
  const [locality, setLocality] = useState(activeSalon?.locality || '');
  const [city, setCity] = useState(activeSalon?.city || '');
  const [state, setState] = useState(activeSalon?.state || '');
  const [pincode, setPincode] = useState(activeSalon?.pincode || '');
  const [coordinates, setCoordinates] = useState(activeSalon?.coordinates || { lat: 0, lng: 0 });

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
  const [coverImage, setCoverImage] = useState('');

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

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim() || !ownerName.trim()) {
      alert("Please fill in Salon Name and Owner Name.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    const regData: SalonRegistrationInput = {
      name: salonName,
      tagline,
      salonType,
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

    try {
      await registerSalon(regData);
      onSuccess();
    } catch (err: any) {
      setSubmissionError(err?.message || 'Failed to register salon. Please check your network and details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-[#13131b] border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      {/* Wizard Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-2">
          <Store className="w-3.5 h-3.5" />
          <span>Kumbhkaran Salons Partner Onboarding</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
          Register Your Salon
        </h2>
        <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
          Join the walk-in transparency network. Pin your exact location, set prices, and let customers see your live waiting count.
        </p>
      </div>

      {activeSalon && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div>
            <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Studio Already Registered for {email}</span>
            </div>
            <div className="text-xs text-zinc-300 font-semibold mt-0.5">{activeSalon.name} • {activeSalon.city}</div>
            <p className="text-[11px] text-zinc-400">
              Your salon is already live on Kumbhkaran. Submitting will update your studio profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPartnerView('live-queue');
              if (onSuccess) onSuccess();
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shrink-0 transition-colors"
          >
            Open Live Studio Dashboard →
          </button>
        </div>
      )}

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
              <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                Studio Category / Client Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'unisex', label: 'Unisex', desc: 'Serves both Men & Women' },
                  { id: 'men', label: 'Men Only', desc: 'Gents grooming & barbershop' },
                  { id: 'women', label: 'Women Only', desc: 'Ladies beauty & styling' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSalonType(t.id as SalonType)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      salonType === t.id
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${salonType === t.id ? 'text-amber-400' : 'text-zinc-300'}`}>
                        {t.label}
                      </span>
                      {salonType === t.id && <span className="text-amber-400 text-xs">✓</span>}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{t.desc}</p>
                  </button>
                ))}
              </div>
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

            {/* Salon Location, Map & Address */}
            <SalonLocationPicker
              value={{
                address,
                locality,
                city,
                state,
                pincode,
                latitude: coordinates.lat,
                longitude: coordinates.lng,
              }}
              onChange={(res) => {
                setAddress(res.address);
                setLocality(res.locality);
                setCity(res.city);
                setState(res.state);
                setPincode(res.pincode);
                setCoordinates({ lat: res.latitude, lng: res.longitude });
              }}
            />

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
                onClick={() => {
                  if (!locality.trim() || !city.trim() || !address.trim()) {
                    alert("Please specify your salon's locality, city, and nearest famous landmark / chowk before proceeding.");
                    return;
                  }
                  setCurrentStep(3);
                }}
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
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" /> Studio Cover Photograph
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Paste image URL or click Upload"
                  className="flex-1 p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
                />
                <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setCoverImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              {coverImage ? (
                <div className="h-32 rounded-xl overflow-hidden border border-zinc-700 relative">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 hover:bg-rose-600 text-white text-[10px] rounded-lg font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-zinc-900/50 border border-dashed border-zinc-700 rounded-xl text-center text-xs text-zinc-500">
                  Optional: Upload now or set your cover photo & loop video anytime in your studio dashboard.
                </div>
              )}
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
                <strong className="text-white">Walk-in Transparency Activation:</strong> Upon registering, your studio will immediately appear on the Kumbhkaran Salons Discovery Map with coordinates ({coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°). Customers will see your live waiting count!
              </div>
            </div>

            {submissionError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                <strong>Registration Error:</strong> {submissionError}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-sm hover:from-amber-300 hover:to-amber-400 shadow-xl shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering Studio...' : 'Launch & Open Live Queue'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

