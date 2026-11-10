import React, { useState } from 'react';
import { useSalon, formatDuration } from '../../context/PartnerContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { SalonLocationPicker } from './SalonLocationPicker';
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
import { SalonRegistrationInput, SalonType, ProviderType, ServiceMode } from '@kumbhakaran/shared-types';
import logoFallback from '../../assets/logo.png';

interface SalonRegistrationWizardProps {
  onSuccess: () => void;
}

export const SalonRegistrationWizard: React.FC<SalonRegistrationWizardProps> = ({ onSuccess }) => {
  const { registerSalon, partnerUser, activeSalon, setPartnerView } = useSalon();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Form State: Pre-fill with existing salon if available for this Gmail ID
  const [salonName, setSalonName] = useState(activeSalon?.name || '');
  const [salonType, setSalonType] = useState<SalonType>(activeSalon?.salonType || 'unisex');
  const [providerType, setProviderType] = useState<ProviderType>(activeSalon?.providerType || 'traditional_salon');
  const [serviceModes, setServiceModes] = useState<ServiceMode[]>(activeSalon?.serviceModes || ['at_salon']);
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(activeSalon?.serviceRadiusKm || 10);
  const [experienceYears, setExperienceYears] = useState<number>(activeSalon?.experienceYears || 5);
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
  ]);

  const [coverImage, setCoverImage] = useState(activeSalon?.coverImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80');

  const handleServicePriceChange = (index: number, newPrice: number) => {
    const updated = [...services];
    updated[index].price = newPrice;
    setServices(updated);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionError(null);

    const regData: SalonRegistrationInput = {
      name: salonName,
      tagline,
      salonType,
      providerType,
      serviceModes,
      serviceRadiusKm,
      experienceYears,
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
    <div className="max-w-3xl mx-auto bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-8 shadow-xs text-stone-900">
      {/* Studio Registration Dossier Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <img
            src={logoFallback}
            alt="SLOON"
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFF5ED] text-[#C85322] border border-[#FED7CC]">
            Partner Registration
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 font-serif tracking-tight">
          Register Your Salon & Studio
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
          Join the live walk-in network. Pin your exact coordinates, publish service pricing, and give clients real-time chair visibility.
        </p>
      </div>

      {activeSalon && (
        <div className="mb-6 p-4 rounded-2xl bg-[#FFF3EC] border border-[#FED7CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div>
            <div className="text-xs font-bold text-[#E05326] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#E05326]" />
              <span>Studio Already Registered for {email}</span>
            </div>
            <div className="text-xs text-stone-800 font-semibold mt-0.5">{activeSalon.name} • {activeSalon.city}</div>
            <p className="text-[11px] text-stone-500">
              Your salon is already live on SLOON. Submitting will update your studio profile.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPartnerView('live-queue');
              if (onSuccess) onSuccess();
            }}
            className="px-4 py-2 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white text-xs font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
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
                  ? 'bg-[#E05326] text-white shadow-xs font-bold'
                  : currentStep > s.step
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-stone-100 text-stone-400'
              }`}
            >
              {currentStep > s.step ? '✓' : s.step}
            </div>
            <span className={`text-[10px] mt-1 ${currentStep === s.step ? 'text-[#E05326] font-bold' : 'text-stone-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmitRegistration}>
        {/* STEP 1: BUSINESS IDENTITY */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif">
              <Store className="w-4 h-4 text-[#E05326]" /> {t.step1Title}
            </h3>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Salon / Studio Name *
              </label>
              <input
                type="text"
                required
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="e.g. Blade & Timber Grooming Co."
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Provider Operating Model *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'traditional_salon',
                    label: 'Traditional Salon',
                    desc: 'Commercial storefront with chairs, staff & walk-in queue',
                    defaultModes: ['at_salon'] as ServiceMode[],
                  },
                  {
                    id: 'home_studio',
                    label: 'Home Studio',
                    desc: 'Private residential studio (appointment scheduled)',
                    defaultModes: ['studio_visit'] as ServiceMode[],
                  },
                  {
                    id: 'freelance_pro',
                    label: 'Freelance Professional',
                    desc: 'Mobile artist traveling directly to clients (Sloon Home)',
                    defaultModes: ['home_visit'] as ServiceMode[],
                  },
                  {
                    id: 'independent_pro',
                    label: 'Independent Specialist',
                    desc: 'Solo expert offering studio appointments & home visits',
                    defaultModes: ['studio_visit', 'home_visit'] as ServiceMode[],
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setProviderType(item.id as ProviderType);
                      setServiceModes(item.defaultModes);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      providerType === item.id
                        ? 'bg-[#FFF3EC] border-[#E05326] text-stone-900 shadow-2xs'
                        : 'bg-[#FAF7F2] border-[#E8E2D8] text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${providerType === item.id ? 'text-[#E05326]' : 'text-stone-800'}`}>
                        {item.label}
                      </span>
                      {providerType === item.id && <span className="text-[#E05326] text-xs font-bold">✓</span>}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Enabled Service Modes (Select all offered) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'at_salon' as ServiceMode, label: 'At Salon (Walk-In Queue)' },
                  { id: 'home_visit' as ServiceMode, label: 'Home Visit (Doorstep)' },
                  { id: 'studio_visit' as ServiceMode, label: 'Studio Visit (Slot Booking)' },
                ].map((mode) => {
                  const isChecked = serviceModes.includes(mode.id);
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setServiceModes((prev) =>
                          prev.includes(mode.id)
                            ? prev.length > 1
                              ? prev.filter((m) => m !== mode.id)
                              : prev
                            : [...prev, mode.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-amber-500/10 border-[#E05326] text-stone-900'
                          : 'bg-stone-50 border-stone-200 text-stone-500'
                      }`}
                    >
                      <span>{mode.label}</span>
                      <span>{isChecked ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1.5">
                Studio Category / Client Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'unisex', label: 'Unisex', desc: 'Serves both Men & Women' },
                  { id: 'men', label: 'Men Only', desc: 'Gents grooming & barbershop' },
                  { id: 'women', label: 'Women Only', desc: 'Ladies beauty & styling' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSalonType(item.id as SalonType)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      salonType === item.id
                        ? 'bg-[#FFF3EC] border-[#E05326] text-stone-900 shadow-2xs'
                        : 'bg-[#FAF7F2] border-[#E8E2D8] text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${salonType === item.id ? 'text-[#E05326]' : 'text-stone-800'}`}>
                        {item.label}
                      </span>
                      {salonType === item.id && <span className="text-[#E05326] text-xs font-bold">✓</span>}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-0.5 line-clamp-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Salon Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Master cuts, beard sculpting & premium lounge"
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Owner Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Raghav Sharma"
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Owner Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98450 00000"
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Business Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@yourstudio.com"
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
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
                className="px-6 py-2.5 rounded-xl bg-[#E05326] text-white font-bold text-xs hover:bg-[#D0481E] flex items-center gap-2 shadow-xs cursor-pointer"
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
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif">
                <MapPin className="w-4 h-4 text-[#E05326]" /> {t.step2Title}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
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
                className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-900 text-xs flex items-center gap-1.5 cursor-pointer"
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
                className="px-6 py-2.5 rounded-xl bg-[#E05326] text-white font-bold text-xs hover:bg-[#D0481E] flex items-center gap-2 shadow-xs cursor-pointer"
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
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif">
              <Clock className="w-4 h-4 text-[#E05326]" /> {t.step3Title}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Opening Time
                </label>
                <input
                  type="text"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  placeholder="09:00 AM"
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Closing Time
                </label>
                <input
                  type="text"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  placeholder="09:30 PM"
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Active Barber Chairs / Stations
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setActiveBarbers(num)}
                    className={`w-10 h-10 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                      activeBarbers === num
                        ? 'bg-[#E05326] text-white border-[#E05326] shadow-xs'
                        : 'bg-[#FAF7F2] text-stone-600 border-[#E8E2D8] hover:border-stone-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                The more active chairs, the faster wait times decrease on the customer application.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Head Stylist / Master Barber Name
              </label>
              <input
                type="text"
                value={masterBarber}
                onChange={(e) => setMasterBarber(e.target.value)}
                placeholder="e.g. Master Arjun"
                className="w-full p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white"
              />
            </div>

            {/* Salon Photograph Presets */}
            <div>
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5 mb-1.5">
                <Camera className="w-3.5 h-3.5 text-[#E05326]" /> Studio Cover Photograph
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Paste image URL or click Upload"
                  className="flex-1 p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
                <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0 border border-stone-200">
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
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          let width = img.width;
                          let height = img.height;
                          const maxDim = 900;
                          if (width > maxDim || height > maxDim) {
                            if (width > height) {
                              height = Math.round((height * maxDim) / width);
                              width = maxDim;
                            } else {
                              width = Math.round((width * maxDim) / height);
                              height = maxDim;
                            }
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.drawImage(img, 0, 0, width, height);
                            setCoverImage(canvas.toDataURL('image/jpeg', 0.78));
                          } else {
                            setCoverImage(dataUrl);
                          }
                        };
                        img.onerror = () => setCoverImage(dataUrl);
                        img.src = dataUrl;
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              {coverImage ? (
                <div className="h-32 rounded-xl overflow-hidden border border-[#E8E2D8] relative">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="absolute top-2 right-2 px-2 py-0.5 bg-black/70 hover:bg-rose-600 text-white text-[10px] rounded-lg font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-[#FAF7F2] border border-dashed border-[#E8E2D8] rounded-xl text-center text-xs text-stone-500">
                  Optional: Upload now or set your cover photo & loop video anytime in your studio dashboard.
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-900 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-[#E05326] text-white font-bold text-xs hover:bg-[#D0481E] flex items-center gap-2 shadow-xs cursor-pointer"
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
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 font-serif">
                <Scissors className="w-4 h-4 text-[#E05326]" /> {t.step4Title}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Customize your starting prices. You can edit or add more anytime in your partner dashboard.
              </p>
            </div>

            <div className="space-y-2.5">
              {services.map((svc, idx) => (
                <div
                  key={idx}
                  className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-3 flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div>
                    <span className="font-bold text-stone-900">{svc.name}</span>
                    <span className="text-[10px] text-stone-400 ml-2">~{formatDuration(svc.durationMinutes)}</span>
                    <p className="text-[11px] text-stone-500 line-clamp-1">{svc.description}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-stone-400 font-semibold">₹</span>
                    <input
                      type="number"
                      value={svc.price}
                      onChange={(e) => handleServicePriceChange(idx, Number(e.target.value))}
                      className="w-20 px-2 py-1 bg-white border border-stone-300 rounded-xl text-[#E05326] font-bold text-sm text-right focus:outline-none focus:border-[#E05326]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Launch Guarantee */}
            <div className="bg-[#FFF3EC] border border-[#FED7CC] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-stone-700">
              <ShieldCheck className="w-5 h-5 text-[#E05326] shrink-0 mt-0.5" />
              <div>
                <strong className="text-stone-900">Walk-in Transparency Activation:</strong> Upon registering, your studio will immediately appear on the SLOON Discovery Map with coordinates ({coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°). Customers will see your live waiting count!
              </div>
            </div>

            {submissionError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <strong>Registration Error:</strong> {submissionError}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-900 text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-2xl bg-[#E05326] text-white font-bold text-sm hover:bg-[#D0481E] shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Registering Studio...' : t.launchStudio}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
