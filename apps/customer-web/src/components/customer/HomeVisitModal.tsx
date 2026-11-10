import React, { useState } from 'react';
import { defaultApiClient } from '@kumbhakaran/api-client';
import {
  X,
  Sparkles,
  Crown,
  HeartHandshake,
  Smile,
  Scissors,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  MapPin,
  Phone,
  User,
  ArrowRight,
  ArrowLeft,
  Share2,
  FileText,
  BadgeCheck,
  ChevronRight,
  Home,
} from 'lucide-react';
import {
  HomeVisitCategory,
  HOME_VISIT_CATEGORIES,
  HOME_VISIT_SERVICE_CATALOG,
  HomeVisitServiceItem,
  HomeVisitBookingRequest,
  Salon,
  formatDuration,
} from '@kumbhakaran/shared-types';

export interface HomeVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon?: Salon | null;
  initialCategory?: HomeVisitCategory;
}

export const HomeVisitModal: React.FC<HomeVisitModalProps> = ({
  isOpen,
  onClose,
  salon,
  initialCategory = 'senior_care',
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<HomeVisitCategory>(initialCategory);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [specialCareNotes, setSpecialCareNotes] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 12:00 PM');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<HomeVisitBookingRequest | null>(null);

  if (!isOpen) return null;

  const currentCategoryMeta =
    HOME_VISIT_CATEGORIES.find((c) => c.id === selectedCategory) || HOME_VISIT_CATEGORIES[0];

  const categoryServices = HOME_VISIT_SERVICE_CATALOG.filter(
    (s) => s.categoryId === selectedCategory,
  );

  const selectedServices = HOME_VISIT_SERVICE_CATALOG.filter((s) =>
    selectedServiceIds.includes(s.id),
  );

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalMinutes = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSpecialCare = (tag: string) => {
    setSpecialCareNotes((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crown':
        return <Crown className="w-5 h-5" />;
      case 'HeartHandshake':
        return <HeartHandshake className="w-5 h-5" />;
      case 'Smile':
        return <Smile className="w-5 h-5" />;
      case 'Scissors':
        return <Scissors className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress || selectedServices.length === 0) {
      return;
    }

    const booking: HomeVisitBookingRequest = {
      id: `hvb-${Date.now()}`,
      salonId: salon?.id || 'sloon-direct-home',
      salonName: salon?.name || 'Sloon Doorstep Professional Service',
      customerName,
      customerPhone,
      customerAddress: `${customerAddress}${landmark ? `, Near: ${landmark}` : ''}`,
      category: selectedCategory,
      categoryTitle: currentCategoryMeta.title,
      selectedServices,
      scheduledDate,
      timeSlot,
      specialInstructions,
      specialCareRequirements: specialCareNotes,
      totalPrice,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Save to Database via Backend API
    if (salon?.id) {
      try {
        await defaultApiClient.createHomeVisitBooking(salon.id, booking);
      } catch (err) {
        console.warn('Could not post doorstep booking to database:', err);
      }
    }

    try {
      const existingStr = localStorage.getItem('sloon_home_visit_bookings') || '[]';
      const existing: HomeVisitBookingRequest[] = JSON.parse(existingStr);
      localStorage.setItem(
        'sloon_home_visit_bookings',
        JSON.stringify([booking, ...existing.slice(0, 20)]),
      );
    } catch {}

    setConfirmedBooking(booking);
    setActiveStep(4);
  };

  const openWhatsAppConfirmation = () => {
    if (!confirmedBooking) return;
    const phone = salon?.phone ? salon.phone.replace(/[^0-9]/g, '') : '919876543210';
    const text = encodeURIComponent(
      `*SLOON DOORSTEP SERVICE REQUEST*\n` +
        `-------------------------------\n` +
        `*Category:* ${confirmedBooking.categoryTitle}\n` +
        `*Customer:* ${confirmedBooking.customerName} (${confirmedBooking.customerPhone})\n` +
        `*Date & Slot:* ${confirmedBooking.scheduledDate} @ ${confirmedBooking.timeSlot}\n` +
        `*Address:* ${confirmedBooking.customerAddress}\n` +
        `*Services:*\n` +
        confirmedBooking.selectedServices.map((s) => ` • ${s.name} (Rs. ${s.price})`).join('\n') +
        `\n*Total Amount:* Rs. ${confirmedBooking.totalPrice}\n` +
        (confirmedBooking.specialCareRequirements &&
        confirmedBooking.specialCareRequirements.length > 0
          ? `*Special Care:* ${confirmedBooking.specialCareRequirements.join(', ')}\n`
          : '') +
        (confirmedBooking.specialInstructions
          ? `*Instructions:* ${confirmedBooking.specialInstructions}\n`
          : '') +
        `-------------------------------\n` +
        `Please confirm stylist dispatch from Sloon. Thank you!`,
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-800 text-stone-100 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="relative px-5 py-4 border-b border-stone-800 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-900/30 text-white">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Sloon At-Home
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Doorstep Salon
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {salon ? `By ${salon.name}` : 'Certified Stylists & Barbers Delivered to Your Home'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        {activeStep < 4 && (
          <div className="bg-stone-950/60 px-5 py-2.5 border-b border-stone-800/80 flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  activeStep === 1
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                1
              </span>
              <span className={activeStep === 1 ? 'text-amber-400' : 'text-stone-400'}>
                Select Category
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  activeStep === 2
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                2
              </span>
              <span className={activeStep === 2 ? 'text-amber-400' : 'text-stone-400'}>
                Services & Care
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  activeStep === 3
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                3
              </span>
              <span className={activeStep === 3 ? 'text-amber-400' : 'text-stone-400'}>
                Address & Slot
              </span>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: CATEGORY SELECTION */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-stone-300">
                  Choose Visiting Category
                </h4>
                <p className="text-xs text-stone-400">
                  Select specialized care tailored for brides, senior citizens, kids, or personal grooming.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HOME_VISIT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group ${
                        isSelected
                          ? 'border-amber-400 bg-stone-800/90 shadow-lg shadow-amber-950/20'
                          : 'border-stone-800 bg-stone-950/40 hover:border-stone-700 hover:bg-stone-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr ${cat.gradient} text-white shadow-md`}
                        >
                          {getCategoryIcon(cat.iconName)}
                        </div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300">
                          {cat.badge}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-sm font-bold text-white group-hover:text-amber-300 transition">
                          {cat.title}
                        </h5>
                        <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5 leading-snug">
                          {cat.subtitle}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-stone-800/80 flex items-center justify-between text-[10px] text-stone-400">
                        <span className="font-semibold text-amber-400/90">{cat.industryTag}</span>
                        {isSelected && (
                          <span className="flex items-center gap-1 font-bold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Category Guarantee Highlight */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-300">
                    {currentCategoryMeta.title} Hygiene Protocols:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {currentCategoryMeta.hygieneGuarantees.map((h, i) => (
                      <span
                        key={i}
                        className="bg-stone-900 text-stone-300 text-[10px] px-2 py-0.5 rounded-md border border-stone-800"
                      >
                        ✓ {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SERVICE SELECTION & SPECIAL CARE */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/40">
                      {currentCategoryMeta.title}
                    </span>
                    <span className="text-xs text-stone-400">Pick one or more services</span>
                  </div>
                </div>
                {selectedServiceIds.length > 0 && (
                  <div className="text-right">
                    <span className="text-xs text-stone-400">Estimated: </span>
                    <span className="text-sm font-black text-amber-400">₹{totalPrice}</span>
                    <span className="text-xs text-stone-500"> ({formatDuration(totalMinutes)})</span>
                  </div>
                )}
              </div>

              {/* Service List */}
              <div className="space-y-3">
                {categoryServices.map((service) => {
                  const isChecked = selectedServiceIds.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-amber-400 bg-stone-800/90 shadow-md'
                          : 'border-stone-800 bg-stone-950/50 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 mt-1 rounded border-stone-700 text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-bold text-white">{service.name}</h5>
                              {service.popular && (
                                <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-400 mt-0.5">{service.tagline}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {service.features.map((f, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-stone-900 text-stone-300 px-2 py-0.5 rounded border border-stone-800"
                                >
                                  • {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-sm font-black text-amber-400">₹{service.price}</div>
                          <div className="text-[11px] text-stone-400 flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3 text-stone-500" />
                            {service.durationMinutes} min
                          </div>
                        </div>
                      </div>

                      {/* Hygiene Seal note */}
                      <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Hygiene Kit: {service.hygieneKit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special Care Checklist (Industry Specific) */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-amber-400" />
                  Special Care Instructions for Stylist:
                </h5>
                <p className="text-[11px] text-stone-400">
                  Select any special accommodations so our professional arrives fully equipped:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    'Bed-Bound / Low-Mobility Setup',
                    'Wheelchair Accessible Grooming',
                    'Diabetic-Safe Antiseptic Precautions',
                    'Tear-Free Low-Noise Baby Clippers',
                    'Hypoallergenic / Sensitive Skin',
                    'Saree Draping / Pleating Assistant',
                  ].map((care) => {
                    const active = specialCareNotes.includes(care);
                    return (
                      <button
                        key={care}
                        type="button"
                        onClick={() => toggleSpecialCare(care)}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-medium border transition ${
                          active
                            ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-300'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}
                        {care}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ADDRESS, DATE & TIME */}
          {activeStep === 3 && (
            <form id="home-visit-form" onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-stone-300">
                  Appointment & Location Details
                </h4>
                <p className="text-xs text-stone-400">
                  Stylist will arrive with sanitized mobile kit, disposable sheets and power equipment.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-400" /> Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" /> Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Complete Home / Residence Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Flat/House No., Building Name, Society, Wing, Floor..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-sm focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-500" /> Nearest Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Metro Pillar 42"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Preferred Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Preferred Time Slot *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    '9:00 AM - 11:00 AM',
                    '11:00 AM - 1:00 PM',
                    '2:00 PM - 5:00 PM',
                    '5:00 PM - 8:00 PM',
                  ].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition ${
                        timeSlot === slot
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                          : 'border-stone-800 bg-stone-950 text-stone-400 hover:text-stone-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-500" /> Additional Notes for Stylist
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Ring the bell twice, elevator under maintenance, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-950 border border-stone-800 text-white text-sm focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Order Summary Pill */}
              <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-stone-400">Total Services: </span>
                  <span className="text-xs font-bold text-white">
                    {selectedServices.length} service(s) ({formatDuration(totalMinutes)})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400">Total: </span>
                  <span className="text-base font-black text-amber-400">₹{totalPrice}</span>
                </div>
              </div>
            </form>
          )}

          {/* STEP 4: CONFIRMATION & WHATSAPP DISPATCH */}
          {activeStep === 4 && confirmedBooking && (
            <div className="space-y-5 text-center py-2 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 mx-auto flex items-center justify-center text-stone-950 shadow-xl shadow-emerald-950/40 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/40">
                  Request Dispatched
                </span>
                <h4 className="text-xl font-black text-white mt-2">
                  Doorstep Service Confirmed!
                </h4>
                <p className="text-xs text-stone-400 max-w-md mx-auto mt-1">
                  We have assigned a certified grooming professional for{' '}
                  <strong className="text-amber-300">{confirmedBooking.customerName}</strong>.
                </p>
              </div>

              {/* Booking Summary Card */}
              <div className="text-left p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs">
                  <span className="text-stone-400">Booking ID:</span>
                  <span className="font-mono text-amber-400 font-bold">{confirmedBooking.id}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Category:</span>
                  <span className="font-bold text-white">{confirmedBooking.categoryTitle}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Schedule:</span>
                  <span className="font-bold text-white">
                    {confirmedBooking.scheduledDate} ({confirmedBooking.timeSlot})
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400">Destination:</span>
                  <span className="font-medium text-stone-300 text-right max-w-[240px] truncate">
                    {confirmedBooking.customerAddress}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                  <span className="text-xs text-stone-400">Payable Upon Service:</span>
                  <span className="text-lg font-black text-amber-400">
                    ₹{confirmedBooking.totalPrice}
                  </span>
                </div>
              </div>

              {/* WhatsApp 1-Tap Trigger */}
              <button
                type="button"
                onClick={openWhatsAppConfirmation}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-98"
              >
                <Share2 className="w-4 h-4" />
                Confirm on WhatsApp with Salon
              </button>

              <p className="text-[11px] text-stone-500">
                You will receive a call 30 minutes before arrival. Zero travel fee within 5 km.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          {activeStep === 1 && (
            <>
              <div className="text-xs text-stone-400">
                Category: <strong className="text-white">{currentCategoryMeta.title}</strong>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition active:scale-95"
              >
                Continue to Services <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {activeStep === 2 && (
            <>
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="py-2 px-3 rounded-xl border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="button"
                disabled={selectedServiceIds.length === 0}
                onClick={() => setActiveStep(3)}
                className={`py-2.5 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                  selectedServiceIds.length === 0
                    ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-md shadow-amber-900/30'
                }`}
              >
                Set Location & Slot ({selectedServiceIds.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {activeStep === 3 && (
            <>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="py-2 px-3 rounded-xl border border-stone-800 text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="submit"
                form="home-visit-form"
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs shadow-md shadow-amber-900/30 transition active:scale-95 flex items-center gap-1.5"
              >
                Confirm Home Booking <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {activeStep === 4 && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs transition"
            >
              Done & Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
