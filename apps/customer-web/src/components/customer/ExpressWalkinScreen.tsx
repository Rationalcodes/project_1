import React, { useState, useEffect } from 'react';
import { getTargetSalonFromUrl, useCustomer, getEstimatedWaitMinutes } from '../../context/CustomerContext';
import { Salon, QueueEntry } from '@kumbhakaran/shared-types';
import {
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Sparkles,
  Ticket,
  Check,
  RefreshCw,
  Phone,
  User,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { openGoogleMapsLocation } from '@kumbhakaran/ui';
import { SmartQueueAssist } from './SmartQueueAssist';

interface ExpressWalkinScreenProps {
  salon: Salon | null;
  onDismiss: () => void;
  onViewSalonDetails: () => void;
}

export const ExpressWalkinScreen: React.FC<ExpressWalkinScreenProps> = ({
  salon,
  onDismiss,
  onViewSalonDetails,
}) => {
  const {
    userProfile,
    updateCustomerName,
    activeTicket,
    joinLiveQueue,
    leaveLiveQueue,
    reportSalonCrowd,
    fetchSalonQueue,
    triggerNotification,
  } = useCustomer();

  const [name, setName] = useState<string>(userProfile.name || '');
  const [phone, setPhone] = useState<string>(userProfile.phone || '');
  const [selectedService, setSelectedService] = useState<string>('Haircut & Styling');
  const [partySize, setPartySize] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedTicket, setSubmittedTicket] = useState<QueueEntry | null>(activeTicket);
  const [checkInToken] = useState(() => getTargetSalonFromUrl().checkInToken);

  // Sync ticket when activeTicket changes
  useEffect(() => {
    if (activeTicket) {
      setSubmittedTicket(activeTicket);
    }
  }, [activeTicket]);

  // Sync initial user name/phone if available
  useEffect(() => {
    if (userProfile.name && !name) {
      setName(userProfile.name);
    }
    if (userProfile.phone && !phone) {
      setPhone(userProfile.phone);
    }
  }, [userProfile.name, userProfile.phone]);

  // Set default service from salon if available
  useEffect(() => {
    if (salon && salon.services && salon.services.length > 0) {
      setSelectedService(salon.services[0].name);
    }
  }, [salon?.id]);

  // Polling queue for this salon while on express screen
  useEffect(() => {
    if (salon?.id) {
      const sId = salon.id;
      fetchSalonQueue(sId);
      const interval = setInterval(() => {
        fetchSalonQueue(sId);
      }, 1500);

      const onFocus = () => fetchSalonQueue(sId);
      const onVisibility = () => {
        if (document.visibilityState === 'visible') fetchSalonQueue(sId);
      };
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onVisibility);

      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    }
  }, [salon?.id]);

  // Handle Form Submission: Immediately join queue
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      triggerNotification('Please enter your name to take a token');
      return;
    }

    if (!userProfile.name) {
      updateCustomerName(trimmedName);
    }

    setIsSubmitting(true);
    try {
      const ticket = await joinLiveQueue(
        salon.id,
        trimmedName,
        phone.trim() || undefined,
        selectedService,
        { partySize, checkInToken },
      );
      setSubmittedTicket(ticket);
    } catch (err: any) {
      triggerNotification(err?.message || 'Could not join live queue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!salon) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-orange-100 text-[#FF6422] flex items-center justify-center mb-4 animate-pulse">
          <Ticket className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-stone-900">Connecting to Salon Counter...</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Securing your live queue session with SLOON network.
        </p>
        <button
          onClick={onDismiss}
          className="mt-6 px-4 py-2 rounded-xl text-xs font-bold text-stone-600 bg-stone-100 hover:bg-stone-200"
        >
          Browse All Salons Instead
        </button>
      </div>
    );
  }

  const currentTicket = submittedTicket || (activeTicket?.salonId === salon.id ? activeTicket : null);
  const queueCount = salon.currentQueue;
  const estWait = getEstimatedWaitMinutes(queueCount, salon.avgServiceTimeMinutes || 20, salon.activeBarbers || salon.staff?.length || 2);

  return (
    <div className="w-full max-w-xl mx-auto py-3 sm:py-6 animate-in fade-in zoom-in-98 duration-200">
      {/* Express Top Header / Brand Banner */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-[#FF6422] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
            Express Counter Check-In
          </span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
        >
          <span>Browse App</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Salon Identification Card */}
      <div className="bg-white rounded-3xl p-5 shadow-xl shadow-stone-200/60 border border-stone-200/90 relative overflow-hidden mb-4">
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-orange-400/10 to-amber-400/5 rounded-bl-full pointer-events-none" />

        <div className="flex items-center gap-3.5">
          <img
            src={salon.coverImage}
            alt={salon.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-sm shrink-0 border border-stone-100"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-stone-900 truncate">
                {salon.name}
              </h1>
              {salon.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
            </div>

            <p className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
              <span>{salon.locality || salon.address}</span>
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1.5 ${
                queueCount === 0
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-orange-50 text-orange-900 border border-orange-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${queueCount === 0 ? 'bg-emerald-500' : 'bg-orange-500'} animate-pulse`} />
                {queueCount === 0 ? '0 Waiting • Immediate Chair' : `${queueCount} in Live Queue`}
              </span>

              {queueCount > 0 && (
                <span className="text-[11px] text-stone-500 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  ~{estWait}m wait
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container: Conditioned on whether customer already has a ticket */}
      {currentTicket ? (
        /* LIVE TOKEN / CHECK-IN ACTIVE CARD */
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-stone-200/70 border-2 border-orange-500/30 text-stone-900">
          <div className="text-center pb-4 border-b border-stone-100">
            <span className="text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-600" />
              You Are in Queue
            </span>
            <div className="mt-3">
              <div className="text-xs font-bold text-stone-400 uppercase tracking-widest">Your Live Token</div>
              <div className="text-5xl sm:text-6xl font-black text-[#FF6422] font-mono tracking-tight mt-1">
                #{(currentTicket.ticketNumber || String(currentTicket.position || '')).replace(/^#+/, '')}
              </div>
            </div>

            <div className="mt-2 text-sm font-bold text-stone-800">
              {currentTicket.customerName}
            </div>
            {currentTicket.serviceName && (
              <div className="text-xs text-stone-500">
                {currentTicket.serviceName}
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-3 my-4">
            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-center">
              <div className="text-[10px] uppercase font-bold text-stone-400">Position in Line</div>
              <div className="text-base font-black text-stone-800 mt-0.5">
                {currentTicket.status === 'in_service' ? (
                  <span className="text-emerald-600">On Chair ✂️</span>
                ) : currentTicket.position <= 1 ? (
                  <span className="text-emerald-600">You're Next!</span>
                ) : (
                  `#${currentTicket.position} in line`
                )}
              </div>
            </div>

            <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-100 text-center">
              <div className="text-[10px] uppercase font-bold text-stone-400">Estimated Turn</div>
              <div className="text-base font-black text-stone-800 mt-0.5">
                {currentTicket.status === 'in_service' ? 'Now' : currentTicket.position <= 1 ? 'Under 5m' : `~${estWait} mins`}
              </div>
            </div>
          </div>

          <SmartQueueAssist salon={salon} ticket={currentTicket} checkInToken={checkInToken} />

          {/* Customer ticket controls */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
              Ticket options
            </div>
            <div className="flex items-center gap-2 pt-1">
              {currentTicket.status !== 'in_service' && (
                <button
                  type="button"
                  onClick={() => leaveLiveQueue(salon.id, currentTicket.id)}
                  className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel / Leave Queue
                </button>
              )}
              <button
                type="button"
                onClick={onViewSalonDetails}
                className="flex-1 py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF6422] font-bold text-xs border border-orange-200 transition-colors cursor-pointer"
              >
                View Price Menu & Photos ↗
              </button>
            </div>
          </div>

          {/* Crowd confirmation helper */}
          <div className="mt-5 p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
              <span>Is salon crowd busy right now?</span>
              <span className="text-[10px] text-stone-400">1-tap update</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => reportSalonCrowd(salon.id, 'empty')}
                className="py-1.5 px-2 rounded-xl bg-white hover:bg-emerald-50 border border-stone-200 text-[11px] font-bold text-stone-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
              >
                0 Wait
              </button>
              <button
                type="button"
                onClick={() => reportSalonCrowd(salon.id, 'medium')}
                className="py-1.5 px-2 rounded-xl bg-white hover:bg-amber-50 border border-stone-200 text-[11px] font-bold text-stone-700 hover:text-amber-700 hover:border-amber-300 transition-colors"
              >
                1-2 Waiting
              </button>
              <button
                type="button"
                onClick={() => reportSalonCrowd(salon.id, 'busy')}
                className="py-1.5 px-2 rounded-xl bg-white hover:bg-rose-50 border border-stone-200 text-[11px] font-bold text-stone-700 hover:text-rose-700 hover:border-rose-300 transition-colors"
              >
                3+ Busy
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* THE EXPRESS NAME POPUP / CHECK-IN FORM */
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-stone-200/70 border border-stone-200 text-stone-900">
          <div className="mb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100 text-[#FF6422] text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Digital Token</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
              {checkInToken ? 'Check in at the salon' : 'Join the salon queue'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              No account needed. Your place stays in the queue unless you or salon staff change it.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Customer Name Input (Primary) */}
            <div>
              <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                Number of people
              </label>
              <select
                value={partySize}
                onChange={(event) => setPartySize(Number(event.target.value))}
                className="w-full rounded-xl border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-900"
              >
                {[1, 2, 3, 4, 5, 6].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                Your Name <span className="text-[#FF6422]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Enter your name (e.g. Rahul Sharma)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-sm font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
            </div>

            {/* Mobile Number (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-stone-800">
                  Mobile Number
                </label>
                <span className="text-[10px] text-stone-400 font-semibold">Optional</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  placeholder="10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-2xl text-sm font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>
              <p className="text-[10px] text-stone-400 mt-1">
                Allows the barber to dial you when your chair is ready if you step out.
              </p>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                Service Desired
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Haircut & Styling',
                  'Beard Grooming / Shave',
                  'Haircut + Beard Combo',
                  'Hair Wash & Massage',
                ].map((svc) => (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => setSelectedService(svc)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                      selectedService === svc
                        ? 'bg-orange-50 text-[#FF6422] border-orange-400 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {svc}
                  </button>
                ))}
              </div>
            </div>

            {/* Fast Benefit strip */}
            <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3 text-xs text-stone-600 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#FF6422] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold text-stone-800">No more waiting in dark.</span> Your token will be visible on the barber's live dashboard immediately upon submitting.
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#FF6422] hover:bg-orange-600 active:scale-98 disabled:opacity-40 disabled:hover:bg-[#FF6422] text-white font-black text-sm shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Assigning Token...</span>
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4" />
                  <span>Take Token & Join Queue</span>
                </>
              )}
            </button>
          </form>

          {/* Secondary Actions */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <button
              type="button"
              onClick={onViewSalonDetails}
              className="font-bold text-[#FF6422] hover:underline cursor-pointer"
            >
              View Full Salon Menu & Prices ↗
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="hover:text-stone-800 cursor-pointer"
            >
              Browse other salons
            </button>
          </div>
        </div>
      )}

      {/* Trust & Platform Guarantee */}
      <div className="mt-5 text-center text-[11px] text-stone-600">
        100% Free Live Queue Pass • Powered by <span className="font-extrabold text-stone-900">SLOON</span>
      </div>
    </div>
  );
};
