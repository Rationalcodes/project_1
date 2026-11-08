import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Ticket,
  Navigation,
  Info,
  CheckCircle2,
  RefreshCw,
  X,
  AlertTriangle,
  ChevronRight,
  Store,
  MapPin,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  useCustomer,
  getEstimatedWaitMinutes,
  getQueueDisplay,
} from '../../context/CustomerContext';
import { Salon } from '@kumbhakaran/shared-types';
import { calculateHaversineDistance } from '@kumbhakaran/ui';
import { SmartQueueAssist } from './SmartQueueAssist';

interface LiveQueueTrackerViewProps {
  initialSalon?: Salon | null;
  onOpenSalonDetails?: (salon: Salon) => void;
  onSwitchToMap?: () => void;
}

export const LiveQueueTrackerView: React.FC<LiveQueueTrackerViewProps> = ({
  initialSalon,
  onOpenSalonDetails,
  onSwitchToMap,
}) => {
  const {
    salons,
    userLocation,
    genderFilter,
    activeTicket,
    otherTickets,
    removeOtherTicket,
    fetchSalonQueue,
    joinLiveQueue,
    leaveLiveQueue,
    latestCrowdReport,
    fetchLatestCrowdReport,
    submitLocationCrowdReport,
    triggerNotification,
    userProfile,
  } = useCustomer();

  const isWomen = genderFilter === 'women';
  const primaryThemeColor = isWomen ? '#F47B70' : '#FF6422';

  // 1. Determine currently active/selected salon
  const ticketSalon = activeTicket?.salonId
    ? salons.find((s) => s.id === activeTicket.salonId)
    : null;

  const [selectedSalonId, setSelectedSalonId] = useState<string>(
    initialSalon?.id || ticketSalon?.id || (salons.length > 0 ? salons[0].id : '')
  );

  useEffect(() => {
    if (initialSalon?.id) {
      setSelectedSalonId(initialSalon.id);
    } else if (ticketSalon?.id && !selectedSalonId) {
      setSelectedSalonId(ticketSalon.id);
    } else if (!selectedSalonId && salons.length > 0) {
      setSelectedSalonId(salons[0].id);
    }
  }, [initialSalon, ticketSalon, salons]);

  const salon = salons.find((s) => s.id === selectedSalonId) || salons[0] || null;

  // Modals state
  const [showJoinQueueModal, setShowJoinQueueModal] = useState(false);
  const [joinName, setJoinName] = useState(userProfile.name || '');
  const [joinPhone, setJoinPhone] = useState(userProfile.phone || '');
  const [joinService, setJoinService] = useState<string>('Haircut & Styling');
  const [isJoining, setIsJoining] = useState(false);
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self');

  const [showCrowdModal, setShowCrowdModal] = useState(false);
  const [crowdPeopleCount, setCrowdPeopleCount] = useState<number>(0);
  const [crowdWaitMinutes, setCrowdWaitMinutes] = useState<number>(0);
  const [crowdBarbers, setCrowdBarbers] = useState<number>(1);
  const [crowdNotes, setCrowdNotes] = useState<string>('');
  const [isSubmittingCrowd, setIsSubmittingCrowd] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [currentDistanceMeters, setCurrentDistanceMeters] = useState<number | null>(null);

  // Poll salon queue & crowd updates when salon changes
  useEffect(() => {
    if (salon?.id) {
      fetchSalonQueue(salon.id);
      fetchLatestCrowdReport(salon.id);
    }
  }, [salon?.id]);

  useEffect(() => {
    if (salon && salon.services && salon.services.length > 0) {
      setJoinService(salon.services[0].name);
    }
  }, [salon]);

  if (!salon) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-stone-200">
        <Store className="w-12 h-12 text-stone-300 mx-auto mb-3" />
        <p className="text-stone-600 font-bold text-sm">No salons available for live tracking.</p>
      </div>
    );
  }

  // Queue and wait time calculations
  const waitTime = getEstimatedWaitMinutes(
    salon.currentQueue,
    salon.avgServiceTimeMinutes || 20,
    salon.activeBarbers || 2
  );
  const queueInfo = getQueueDisplay(
    salon.currentQueue,
    salon.isOpen,
    salon.queueStatus
  );

  // Compute Freshness Badge
  const getFreshness = () => {
    if (!salon.lastQueueUpdate) {
      return {
        text: 'Live • Synced',
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      };
    }
    const diffMin = Math.round(
      (Date.now() - new Date(salon.lastQueueUpdate).getTime()) / 60000
    );
    if (diffMin <= 15) {
      return {
        text: diffMin <= 1 ? 'Updated just now' : `Updated ${diffMin}m ago`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      };
    } else if (diffMin <= 45) {
      return {
        text: `Updated ${diffMin}m ago`,
        badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      };
    } else {
      return {
        text: `Updated ${diffMin}m ago • Stale`,
        badgeClass: 'bg-orange-50 text-orange-800 border border-orange-200',
      };
    }
  };

  const freshness = getFreshness();

  // Handlers
  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOther = bookingFor === 'other';
    if (!joinName.trim()) {
      triggerNotification(isOther ? "Please enter the person's name" : 'Please enter your name');
      return;
    }
    setIsJoining(true);
    try {
      if (!isOther && activeTicket) {
        // Must forfeit earlier booking before rejoining at current queue position
        await leaveLiveQueue(activeTicket.salonId || salon.id, activeTicket.id);
      }
      await joinLiveQueue(
        salon.id,
        joinName.trim(),
        joinPhone.trim() || undefined,
        joinService,
        { bookingForSomeoneElse: isOther }
      );
      setShowJoinQueueModal(false);
      setJoinName(userProfile.name || '');
      setJoinPhone(userProfile.phone || '');
      triggerNotification(
        isOther
          ? `Token booked for ${joinName.trim()}!`
          : activeTicket
          ? `Left previous ticket and rejoined at current position (Position #${salon.currentQueue + 1})!`
          : `Token issued for ${salon.name}!`
      );
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to join queue');
    } finally {
      setIsJoining(false);
    }
  };

  const handleOpenCrowdModal = () => {
    setShowCrowdModal(true);
    setIsCheckingLocation(true);
    if (navigator.geolocation && salon.coordinates) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const distKm = calculateHaversineDistance(
            pos.coords.latitude,
            pos.coords.longitude,
            salon.coordinates.lat,
            salon.coordinates.lng
          );
          setCurrentDistanceMeters(distKm * 1000);
          setIsCheckingLocation(false);
        },
        () => {
          setCurrentDistanceMeters(null);
          setIsCheckingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsCheckingLocation(false);
    }
  };

  const handleCrowdSubmit = async () => {
    setIsSubmittingCrowd(true);
    try {
      const res = await submitLocationCrowdReport(salon.id, {
        peopleCount: crowdPeopleCount,
        estimatedWaitMinutes: crowdWaitMinutes,
        activeBarbers: crowdBarbers,
        notes: crowdNotes.trim() || undefined,
      });
      if (res.success) {
        setShowCrowdModal(false);
        triggerNotification('Thank you! Queue update shared successfully.');
      } else {
        triggerNotification(res.message || 'Location verification failed.');
      }
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to submit update');
    } finally {
      setIsSubmittingCrowd(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* 1. Pro Studio Quick Switcher Bar */}
      <div className="bg-white border border-[#E7DED5] rounded-2xl p-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Store className={`w-3.5 h-3.5 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
            <span>Select Studio</span>
          </label>
          {onSwitchToMap && (
            <button
              onClick={onSwitchToMap}
              className="text-[11px] font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3 h-3 text-[#FF6422]" />
              <span>Locate on Map</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {salons.map((s) => {
            const isSelected = s.id === salon.id;
            const hasMyTicket = activeTicket?.salonId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSalonId(s.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? isWomen
                      ? 'bg-rose-50 border-[#F47B70] text-rose-950 shadow-xs ring-1 ring-rose-500/20'
                      : 'bg-orange-50 border-[#FF6422] text-orange-950 shadow-xs ring-1 ring-orange-500/20'
                    : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.isOpen ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                <span className="truncate max-w-[130px]">{s.name}</span>
                {hasMyTicket && (
                  <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    Token #{activeTicket?.ticketNumber || activeTicket?.position}
                  </span>
                )}
                <span className="text-[10px] text-stone-500 font-semibold">
                  {s.currentQueue} in Q
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Focused Studio Header Card */}
      <div className="bg-white border border-[#E7DED5] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-black text-stone-900 truncate">
              {salon.name}
            </h2>
            {salon.isVerified && (
              <CheckCircle2 className={`w-4 h-4 shrink-0 ${isWomen ? 'text-rose-500' : 'text-[#FF6422]'}`} />
            )}
          </div>
          <p className="text-xs text-stone-500 truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>{salon.locality}{salon.city ? `, ${salon.city}` : ''} • {salon.distanceKm || 0.8} km away</span>
          </p>
        </div>

        {onOpenSalonDetails && (
          <button
            onClick={() => onOpenSalonDetails(salon)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-stone-400 text-xs font-bold text-stone-700 hover:text-stone-900 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          >
            <span>View Studio</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. PROMINENT LIVE QUEUE CARD (MATCHING USER SCREENSHOT EXACTLY) */}
      <section className="bg-white border-2 border-orange-200 rounded-3xl p-5 shadow-[0_4px_20px_rgba(255,100,34,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E7DED5]">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${queueInfo.dotClass}`} />
            <span className={`text-xs font-black uppercase tracking-wider ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`}>
              Live Queue Status
            </span>
          </div>

          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${freshness.badgeClass}`}>
            {freshness.text}
          </span>
        </div>

        {/* Big Counter Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-stone-500 mb-1">
              Current Queue
            </div>
            <div className="text-4xl sm:text-5xl font-black text-stone-900 flex items-baseline gap-3 tracking-tight">
              <span>{salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue}</span>
              <span className="text-sm sm:text-base font-semibold text-stone-500 uppercase tracking-wider">
                People in Queue
              </span>
            </div>
            <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl ${queueInfo.badgeClass}`}>
              <Users className="w-3.5 h-3.5" />
              <span>{queueInfo.label}</span>
            </div>
          </div>

          {/* Estimated Wait Card */}
          <div className="bg-[#FAF7F2] border border-[#E7DED5] rounded-2xl p-4 sm:w-56 shrink-0 shadow-xs">
            <div className="text-[10px] text-stone-500 uppercase font-semibold flex items-center gap-1">
              <Clock className={`w-3.5 h-3.5 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} /> Estimated Wait Time
            </div>
            <div className="text-2xl font-black text-stone-900 mt-1">
              ~{waitTime} <span className="text-xs font-normal text-stone-500">minutes</span>
            </div>
            <p className="text-[10px] text-stone-500 mt-1 leading-snug">
              Direct walk-in counter synced live with salon.
            </p>
          </div>
        </div>

        {/* CUSTOMER'S ACTIVE TICKET (IF CURRENTLY IN QUEUE) */}
        {activeTicket && (activeTicket.salonId === salon.id || !activeTicket.salonId) ? (
          <div className="mt-4 pt-4 border-t border-orange-200 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 rounded-2xl p-4 border border-amber-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Your Live Walk-In Token
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {activeTicket.status === 'in_service' ? 'At Chair • In Service' : 'Waiting in Queue'}
              </span>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-3xl font-black text-stone-900 tracking-tight flex items-baseline gap-1">
                  <span className={isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}>#</span>
                  <span>{(activeTicket.ticketNumber || String(activeTicket.position || '')).replace(/^#+/, '')}</span>
                </div>
                <p className="text-xs text-stone-700 font-semibold mt-0.5">
                  {activeTicket.customerName} • {activeTicket.serviceName || 'Haircut & Styling'}
                </p>
              </div>

              <SmartQueueAssist salon={salon} ticket={activeTicket} />

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setBookingFor('other');
                    setJoinName('');
                    setJoinPhone('');
                    setShowJoinQueueModal(true);
                  }}
                  className="text-xs text-stone-700 bg-white border border-stone-300 hover:border-stone-400 font-bold px-3 py-2 rounded-xl shadow-2xs hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-stone-600" />
                  <span>Book for Someone Else</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBookingFor('self');
                    setJoinName(userProfile.name || '');
                    setJoinPhone(userProfile.phone || '');
                    setShowJoinQueueModal(true);
                  }}
                  className="text-xs text-amber-900 bg-amber-100/90 border border-amber-300 hover:bg-amber-200 font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  <span>Rejoin Queue</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Leave the queue and give up your ticket?')) {
                      leaveLiveQueue(salon.id, activeTicket.id);
                    }
                  }}
                  className="text-xs text-stone-500 hover:text-rose-600 font-bold px-2.5 py-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Leave Queue
                </button>
              </div>
            </div>

            {/* TICKETS BOOKED FOR OTHERS */}
            {otherTickets.filter((t) => t.salonId === salon.id || !t.salonId).length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-300/60">
                <div className="text-[11px] font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-700" />
                  <span>Tokens booked for friends / family ({otherTickets.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {otherTickets.map((t) => (
                    <div
                      key={t.id}
                      className="text-xs bg-white/95 border border-amber-300 px-2.5 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                      <span className="font-black text-stone-900">
                        #{(t.ticketNumber || String(t.position || '')).replace(/^#+/, '')}
                      </span>
                      <span className="text-stone-800 font-bold">{t.customerName}</span>
                      <span className="text-[10px] text-stone-500">({t.serviceName || 'Service'})</span>
                      <button
                        type="button"
                        onClick={() => removeOtherTicket(t.id)}
                        className="text-stone-400 hover:text-rose-600 text-xs font-bold ml-1 cursor-pointer"
                        title="Dismiss"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-stone-600 mt-2.5 bg-white/80 p-2.5 rounded-xl border border-orange-200/50">
              Salon staff will update your ticket when service starts and finishes. Your location never changes service status automatically.
            </p>
          </div>
        ) : salon.isOpen && salon.queueStatus === 'paused' ? (
          <div className="mt-4 pt-4 border-t border-amber-200 bg-amber-50 rounded-2xl p-4 text-sm text-amber-900">
            <strong>New queue entries are temporarily paused.</strong>
            <span className="block mt-1 text-xs">The current queue is being served. Please check back shortly.</span>
          </div>
        ) : salon.isOpen ? (
          /* JOIN LIVE QUEUE CTA (Matches Screenshot) */
          <div className="mt-4 pt-4 border-t border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-stone-600">
              <strong className="text-stone-900">Heading to the studio?</strong> Join the live queue to get your token so the salon can call you when your turn arrives.
            </div>
            <button
              type="button"
              onClick={() => setShowJoinQueueModal(true)}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl ${
                isWomen
                  ? 'bg-[#F47B70] hover:bg-rose-700 shadow-rose-500/25'
                  : 'bg-[#FF6422] hover:bg-orange-600 shadow-orange-500/25'
              } active:scale-95 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0`}
            >
              <Ticket className="w-4 h-4" />
              <span>Join Live Queue & Get Token</span>
            </button>
          </div>
        ) : null}

        {/* LATEST VERIFIED LOCATION REPORT SHOWCASE */}
        {latestCrowdReport && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5 flex-wrap">
                  <span>📍 Update from a customer at the salon</span>
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  A customer nearby shared: <strong>{latestCrowdReport.peopleCount} waiting</strong> • about <strong>{latestCrowdReport.estimatedWaitMinutes} min wait</strong>
                  {latestCrowdReport.notes && <span className="italic text-emerald-700"> • "{latestCrowdReport.notes}"</span>}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-xl shrink-0 shadow-2xs">
              Location Verified
            </span>
          </div>
        )}

        {/* Customer queue updates / Location Crowdsourcing (Matches Screenshot) */}
        <div className="mt-4 pt-3.5 border-t border-[#E7DED5] bg-stone-50/80 -mx-5 -mb-5 px-5 py-3.5 rounded-b-3xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-sm shrink-0 mt-0.5">
                📍
              </div>
              <div>
                <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <span>At {salon.name} right now?</span>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  {currentDistanceMeters !== null && currentDistanceMeters <= 3 ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      You’re nearby. Share a quick update to help others know what to expect.
                    </span>
                  ) : currentDistanceMeters !== null ? (
                    <span className="text-stone-500">
                      You’re about {currentDistanceMeters >= 1000 ? `${(currentDistanceMeters / 1000).toFixed(1)} km` : `${Math.round(currentDistanceMeters)} m`} away. You can share an update when you’re within 3 m.
                    </span>
                  ) : (
                    <span>We’ll check that you’re near the salon before you share an update.</span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCrowdModal}
              className="px-3.5 py-2 rounded-xl bg-[#1F1F1F] hover:bg-stone-800 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Navigation className={`w-3.5 h-3.5 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
              <span>Share a quick update</span>
            </button>
          </div>
        </div>

        {/* PRIVACY-COMPLIANT STUDIO QUEUE OVERVIEW */}
        {salon.currentQueue > 0 && (
          <div className="mt-4 pt-3 border-t border-[#E7DED5]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Users className={`w-3.5 h-3.5 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'}`} />
                Live Studio Queue ({salon.currentQueue} waiting)
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Synced live</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">
              Active tokens are called in sequence by studio staff. Take a token to reserve your position.
            </p>
          </div>
        )}

        {/* Important Business Rule Banner */}
        <div className="mt-4 pt-3 border-t border-[#E7DED5] flex items-start gap-2.5 text-xs text-stone-600 bg-orange-50/50 p-3 rounded-2xl border border-orange-100">
          <Info className={`w-4 h-4 ${isWomen ? 'text-[#F47B70]' : 'text-[#FF6422]'} shrink-0 mt-0.5`} />
          <p>
            <strong className="text-stone-900">Walk-in policy:</strong> SLOON eliminates blind waiting. Check the live queue or take a token to walk straight in without wasting time.
          </p>
        </div>
      </section>

      {/* JOIN QUEUE MODAL */}
      {showJoinQueueModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7DED5]">
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl ${isWomen ? 'bg-rose-100 text-[#F47B70]' : 'bg-orange-100 text-[#FF6422]'} flex items-center justify-center`}>
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Join Live Queue</h3>
                  <p className="text-xs text-stone-500">{salon.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinQueueModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BOOKING TARGET SELECTOR */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl mt-4">
              <button
                type="button"
                onClick={() => {
                  setBookingFor('self');
                  setJoinName(userProfile.name || '');
                  setJoinPhone(userProfile.phone || '');
                }}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  bookingFor === 'self'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                👤 For Myself
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookingFor('other');
                  setJoinName('');
                  setJoinPhone('');
                }}
                className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                  bookingFor === 'other'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                👥 For Someone Else
              </button>
            </div>

            {/* NOTICE: REJOIN / ACTIVE TICKET INVARIANT */}
            {bookingFor === 'self' && activeTicket && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5 mt-3">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>You already hold Token #{(activeTicket.ticketNumber || String(activeTicket.position || '')).replace(/^#+/, '')}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You can only hold one active token for yourself. Rejoining will cancel your earlier token and place you at the <strong>current end of the line (Position #{salon.currentQueue + 1})</strong>, not your old position.
                </p>
              </div>
            )}

            {bookingFor === 'other' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-start gap-2 mt-3">
                <Users className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Booking for a friend or family member</span>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    {activeTicket
                      ? `Your own token #${(activeTicket.ticketNumber || String(activeTicket.position || '')).replace(/^#+/, '')} remains active. A separate token will be issued for them.`
                      : 'A separate walk-in token will be issued for them under their name.'}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleJoinQueue} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {bookingFor === 'other' ? "Person's Full Name" : 'Your Full Name'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={bookingFor === 'other' ? 'e.g. Priya Sharma' : 'e.g. Rahul Sharma'}
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {bookingFor === 'other' ? 'Their Mobile Number (Optional)' : 'Phone Number (for SMS & Turn Alerts)'}
                </label>
                <input
                  type="tel"
                  placeholder={bookingFor === 'other' ? 'e.g. 9876543210 (Optional)' : 'e.g. 9876543210'}
                  value={joinPhone}
                  onChange={(e) => setJoinPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Service Interested In
                </label>
                <select
                  value={joinService}
                  onChange={(e) => setJoinService(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#FF6422] focus:bg-white transition-all"
                >
                  {salon.services.length > 0 ? (
                    salon.services.map((svc) => (
                      <option key={svc.id} value={svc.name}>
                        {svc.name} — ₹{svc.price} ({svc.durationMinutes}m)
                      </option>
                    ))
                  ) : (
                    <option value="Haircut & Styling">Haircut & Styling</option>
                  )}
                </select>
              </div>

              <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-3 text-xs text-stone-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#FF6422] shrink-0 mt-0.5" />
                <p>
                  Your ticket position will be assigned instantly. The salon will receive your name and number on their dashboard to call you when ready.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinQueueModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className={`px-5 py-2.5 rounded-xl ${
                    bookingFor === 'self' && activeTicket
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                      : isWomen
                      ? 'bg-[#F47B70] hover:bg-rose-700 shadow-rose-500/25'
                      : 'bg-[#FF6422] hover:bg-orange-600 shadow-orange-500/25'
                  } text-white font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50`}
                >
                  {isJoining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{bookingFor === 'self' && activeTicket ? 'Leaving & Rejoining...' : 'Joining...'}</span>
                    </>
                  ) : bookingFor === 'self' && activeTicket ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Leave Earlier & Rejoin at Current Position</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>{bookingFor === 'other' ? `Take Token for ${joinName.trim() || 'Guest'}` : 'Take Token & Join Queue'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CROWD UPDATE MODAL */}
      {showCrowdModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7DED5]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF6422] flex items-center justify-center text-lg">
                  📍
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Share a queue update</h3>
                  <p className="text-xs text-stone-500">{salon.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCrowdModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              {isCheckingLocation ? (
                <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-[#FF6422] animate-spin" />
                  <span className="text-xs font-semibold text-stone-700">
                    Checking your location...
                  </span>
                </div>
              ) : currentDistanceMeters !== null && currentDistanceMeters <= 3 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900">
                      You’re near {salon.name}
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Thanks for helping others plan their visit. Your update will be marked as verified.
                    </div>
                  </div>
                </div>
              ) : currentDistanceMeters !== null ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-900">
                        You’re about {currentDistanceMeters >= 1000 ? `${(currentDistanceMeters / 1000).toFixed(1)} km` : `${Math.round(currentDistanceMeters)} m`} away
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        To share an update, you’ll need to be within 3 m of the salon.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCrowdModal}
                    className="self-start text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                  >
                    Check my location again
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <span className="text-xs text-stone-600 font-medium">We couldn’t verify your location. Enable device location and try again.</span>
                  <button
                    type="button"
                    onClick={handleOpenCrowdModal}
                    className="px-3 py-1.5 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
                  >
                    Check my location
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                  How many people are waiting?
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCrowdPeopleCount(cnt)}
                      className={`py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        crowdPeopleCount === cnt
                          ? 'bg-[#FF6422] text-white border-[#FF6422] shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {cnt === 0 ? '0 (Clear)' : cnt >= 6 ? '6+' : String(cnt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                  About how long is the wait?
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'No wait (0m)', val: 0 },
                    { label: '~10 mins', val: 10 },
                    { label: '~15 mins', val: 15 },
                    { label: '~20 mins', val: 20 },
                    { label: '~30 mins', val: 30 },
                    { label: '~45 mins', val: 45 },
                    { label: '60+ mins', val: 60 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setCrowdWaitMinutes(opt.val)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        crowdWaitMinutes === opt.val
                          ? 'bg-[#1F1F1F] text-white border-[#1F1F1F] shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1.5">
                  How many stylists or barbers are working? (Optional)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '1 Stylist', val: 1 },
                    { label: '2 Stylists', val: 2 },
                    { label: '3+ Stylists', val: 3 },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setCrowdBarbers(s.val)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        crowdBarbers === s.val
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-stone-800 mb-1">
                  Anything else to share? (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. The queue is moving quickly"
                  value={crowdNotes}
                  onChange={(e) => setCrowdNotes(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E7DED5] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCrowdModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCrowdSubmit}
                disabled={isSubmittingCrowd || isCheckingLocation}
                className="px-5 py-2.5 rounded-xl bg-[#FF6422] hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmittingCrowd ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    <span>Share update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
