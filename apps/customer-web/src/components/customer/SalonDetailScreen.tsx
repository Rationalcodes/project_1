import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  MapPin,
  Phone,
  Navigation,
  CheckCircle2,
  Heart,
  Share2,
  Scissors,
  User,
  LayoutGrid,
  Camera,
  AlertTriangle,
  Info,
  Calendar,
  MessageSquarePlus,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Film,
  Play,
  Volume2,
  VolumeX,
  Eye,
  Maximize2,
  X,
  ChevronLeft,
  Store,
  Ticket,
  PhoneCall,
  Check,
  RefreshCw,
  QrCode,
  Download,
  Printer,
  Copy,
  Plus
} from 'lucide-react';
import QRCode from 'qrcode';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness, getTargetSalonFromUrl } from '../../context/CustomerContext';
import { Service, Staff } from '@kumbhakaran/shared-types';
import { redirectToGoogleMaps, openGoogleMapsLocation, SalonMapboxView } from '@kumbhakaran/ui';

interface SalonDetailScreenProps {
  onBack: () => void;
  onOpenReviewModal: () => void;
  onOpenDirectionsModal?: () => void;
}

export const SalonDetailScreen: React.FC<SalonDetailScreenProps> = ({
  onBack,
  onOpenReviewModal,
  onOpenDirectionsModal
}) => {
  const {
    selectedSalonForDetail,
    toggleFavorite,
    userProfile,
    toggleCompareSalon,
    comparisonList,
    triggerNotification,
    userLocation,
    queueEntries = [],
    activeTicket,
    fetchSalonQueue,
    joinLiveQueue,
    leaveLiveQueue,
    completeLiveQueue,
    markTicketInService,
    reportSalonCrowd,
    updateCustomerName,
    latestCrowdReport,
    fetchLatestCrowdReport,
    submitLocationCrowdReport,
  } = useSalon();

  // Join Live Queue & Token states
  const [showJoinQueueModal, setShowJoinQueueModal] = useState(false);
  const [joinName, setJoinName] = useState(userProfile.name || '');
  const [joinPhone, setJoinPhone] = useState(userProfile.phone || '');
  const [joinService, setJoinService] = useState('Haircut & Styling');
  const [isJoining, setIsJoining] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Customer-submitted queue update state
  const [showCrowdModal, setShowCrowdModal] = useState(false);
  const [crowdPeopleCount, setCrowdPeopleCount] = useState(2);
  const [crowdWaitMinutes, setCrowdWaitMinutes] = useState(15);
  const [crowdBarbers, setCrowdBarbers] = useState(2);
  const [crowdNotes, setCrowdNotes] = useState('');
  const [isSubmittingCrowd, setIsSubmittingCrowd] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [currentDistanceMeters, setCurrentDistanceMeters] = useState<number | null>(null);
  const [showLocationRequiredPopup, setShowLocationRequiredPopup] = useState(false);

  const getSalonDistanceMeters = (userLat: number, userLng: number, salonLat: number, salonLng: number): number => {
    const R = 6371000;
    const dLat = ((salonLat - userLat) * Math.PI) / 180.0;
    const dLon = ((salonLng - userLng) * Math.PI) / 180.0;
    const a =
      Math.sin(dLat / 2.0) ** 2 +
      Math.cos((userLat * Math.PI) / 180.0) *
        Math.cos((salonLat * Math.PI) / 180.0) *
        Math.sin(dLon / 2.0) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (selectedSalonForDetail?.id && fetchLatestCrowdReport) {
      fetchLatestCrowdReport(selectedSalonForDetail.id);
    }
  }, [selectedSalonForDetail?.id]);

  const handleOpenCrowdModal = () => {
    setIsCheckingLocation(true);
    setCurrentDistanceMeters(null);
    setShowCrowdModal(true);

    const s = selectedSalonForDetail as any;
    const sLat = s?.coordinates?.lat ?? s?.latitude;
    const sLng = s?.coordinates?.lng ?? s?.longitude;

    if (
      navigator.geolocation &&
      Number.isFinite(sLat) &&
      Number.isFinite(sLng)
    ) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const dist = getSalonDistanceMeters(pos.coords.latitude, pos.coords.longitude, sLat, sLng);
          setCurrentDistanceMeters(dist);
          setIsCheckingLocation(false);
        },
        () => {
          setIsCheckingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsCheckingLocation(false);
    }
  };

  const handleCrowdSubmit = async () => {
    if (!selectedSalonForDetail) return;
    if (currentDistanceMeters === null || currentDistanceMeters > 3) {
      setShowLocationRequiredPopup(true);
      return;
    }

    setIsSubmittingCrowd(true);
    try {
      await submitLocationCrowdReport(selectedSalonForDetail.id, {
        peopleCount: crowdPeopleCount,
        estimatedWaitMinutes: crowdWaitMinutes,
        activeBarbers: crowdBarbers,
        notes: crowdNotes || undefined,
      });
      setShowCrowdModal(false);
    } catch {
      // Error notification handled in context
    } finally {
      setIsSubmittingCrowd(false);
    }
  };

  // Generate QR Code for direct deep link
  useEffect(() => {
    if (selectedSalonForDetail?.id) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sloon.in';
      const url = `${origin}/?salon=${selectedSalonForDetail.id}&join=true`;
      QRCode.toDataURL(url, {
        width: 360,
        margin: 2,
        color: { dark: '#1F1F1F', light: '#FFFFFF' },
      })
        .then(setQrDataUrl)
        .catch(() => {});
    }
  }, [selectedSalonForDetail?.id]);

  // Auto-open Join Queue modal if link or QR included join=true or action=queue
  useEffect(() => {
    const { autoJoin, serviceName } = getTargetSalonFromUrl();
    if (serviceName) {
      setJoinService(serviceName);
    }
    if (autoJoin && !activeTicket && selectedSalonForDetail?.isOpen) {
      setShowJoinQueueModal(true);
    }
  }, [selectedSalonForDetail?.id, activeTicket, selectedSalonForDetail?.isOpen]);

  useEffect(() => {
    if (userProfile.name && !joinName) {
      setJoinName(userProfile.name);
    }
    if (userProfile.phone && !joinPhone) {
      setJoinPhone(userProfile.phone);
    }
  }, [userProfile.name, userProfile.phone]);

  useEffect(() => {
    if (selectedSalonForDetail?.id) {
      const sId = selectedSalonForDetail.id;
      fetchSalonQueue(sId);
      // High-frequency 1.5s live polling while viewing active salon details
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
  }, [selectedSalonForDetail?.id]);

  const handleJoinQueueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSalonForDetail) return;
    const cleanName = joinName.trim() || 'Walk-in Guest';
    if (!userProfile.name && cleanName !== 'Walk-in Guest') {
      updateCustomerName(cleanName);
    }
    try {
      setIsJoining(true);
      await joinLiveQueue(
        selectedSalonForDetail.id,
        cleanName,
        joinPhone.trim() || undefined,
        joinService
      );
      setShowJoinQueueModal(false);
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to join queue');
    } finally {
      setIsJoining(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'services' | 'staff' | 'reviews' | 'gallery'>('services');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('All');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [showVideoInHero, setShowVideoInHero] = useState(true);
  const [isLoopVideoMuted, setIsLoopVideoMuted] = useState(true);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'location' | 'work' | 'video'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!selectedSalonForDetail) return null;

  const salon = selectedSalonForDetail;
  const isSaved = userProfile.savedSalons.includes(salon.id);
  const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen);
  const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);
  const freshness = getQueueFreshness(salon.lastQueueUpdate);

  // Curated Location & Work media collections
  const locationPhotos = (salon.locationImages && salon.locationImages.length > 0)
    ? salon.locationImages.filter((url) => !url.includes('images.unsplash.com'))
    : [];

  const workPhotos = (salon.workImages && salon.workImages.length > 0)
    ? salon.workImages.filter((url) => !url.includes('images.unsplash.com'))
    : [];

  // Aggregated gallery items for filtering and interactive lightbox
  const galleryItems = [
    ...(salon.loopVideoUrl ? [{
      id: 'loop-vid',
      url: salon.loopVideoUrl,
      type: 'video' as const,
      title: `${salon.name} Studio Loop Video`,
      category: 'video' as const,
      categoryLabel: 'Loop Video'
    }] : []),
    ...locationPhotos.map((url, i) => ({
      id: `loc-${i}`,
      url,
      type: 'image' as const,
      title: `Location & Studio Space #${i + 1}`,
      category: 'location' as const,
      categoryLabel: 'Salon Location'
    })),
    ...workPhotos.map((url, i) => ({
      id: `work-${i}`,
      url,
      type: 'image' as const,
      title: `Styling & Cut Work #${i + 1}`,
      category: 'work' as const,
      categoryLabel: 'Our Work'
    })),
  ];

  const filteredGalleryItems = galleryFilter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === galleryFilter);

  const serviceCategories = ['All', 'Hair', 'Beard', 'Combos', 'Spa', 'Facial', 'Color'];

  const filteredServices = selectedServiceCategory === 'All'
    ? salon.services
    : salon.services.filter(s => s.category === selectedServiceCategory);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${salon.name} - SLOON Live Queue`,
        text: `Check out live queue at ${salon.name}: ${salon.currentQueue} people waiting right now!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      triggerNotification(`Share link for ${salon.name} copied to clipboard`);
    }
  };

  return (
    <div className="space-y-5 pb-32 text-stone-900">
      {/* Top Navigation Bar with Warm Orange Back Chevron */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2DDD5] text-xs font-bold text-stone-800 hover:border-[#FF6422] hover:text-[#FF6422] transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF6422]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleCompareSalon(salon.id)}
            className={`p-2 rounded-xl border transition-colors shadow-xs ${
              comparisonList.includes(salon.id)
                ? 'bg-[#FF6422] text-white border-orange-500'
                : 'bg-white border-[#E2DDD5] text-stone-600 hover:text-stone-900'
            }`}
            title="Compare Salon"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-white border border-[#E2DDD5] text-stone-600 hover:text-stone-900 shadow-xs transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleFavorite(salon.id)}
            className="p-2 rounded-xl bg-white border border-[#E2DDD5] text-stone-500 hover:text-rose-500 shadow-xs transition-colors"
            title="Save to Favourites"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cover Image Carousel, Poster & Loop Video Showcase */}
      <div className="rounded-3xl overflow-hidden border border-[#E8E2D8] bg-white relative shadow-sm">
        <div className="h-64 sm:h-80 w-full relative overflow-hidden group">
          {salon.loopVideoUrl && showVideoInHero ? (
            <video
              autoPlay
              loop
              muted={isLoopVideoMuted}
              playsInline
              poster={salon.posterImage || salon.coverImage}
              className="w-full h-full object-cover transition-all duration-700"
              key={salon.loopVideoUrl}
            >
              <source src={salon.loopVideoUrl} type="video/mp4" />
            </video>
          ) : ((salon.images && salon.images[activeGalleryIndex]) || salon.posterImage || salon.coverImage) ? (
            <img
              src={(salon.images && salon.images[activeGalleryIndex]) || salon.posterImage || salon.coverImage}
              alt={salon.name}
              className="w-full h-full object-cover transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 flex flex-col items-center justify-center text-white p-6 text-center">
              <Store className="w-12 h-12 text-[#FF6422] mb-2" />
              <div className="text-xl font-black">{salon.name}</div>
              <div className="text-xs text-stone-400 mt-1">{salon.locality}, {salon.city}</div>
              <div className="mt-3 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-stone-300 border border-white/10">
                Verified SLOON Walk-In Studio
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10 pointer-events-none" />

          {/* Top Controls: Badges + Video/Poster Toggle */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10">
            <div className="flex items-center gap-2">
              {salon.isVerified && (
                <span className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[#FF6422] font-bold text-xs border border-orange-200 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6422]" /> Verified Salon
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-xs ${
                salon.isOpen ? 'bg-white/95 text-emerald-800 border border-emerald-200' : 'bg-white/95 text-rose-800 border border-rose-200'
              }`}>
                {salon.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            {salon.loopVideoUrl && (
              <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-[#E2DDD5] p-1 rounded-full shadow-md">
                <button
                  type="button"
                  onClick={() => setShowVideoInHero(!showVideoInHero)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 ${
                    showVideoInHero
                      ? 'bg-[#FF6422] text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                  title="Toggle between loop video and still poster"
                >
                  <Film className="w-3 h-3" />
                  <span>{showVideoInHero ? 'Loop Video' : 'Poster'}</span>
                </button>
                {showVideoInHero && (
                  <button
                    type="button"
                    onClick={() => setIsLoopVideoMuted(!isLoopVideoMuted)}
                    className="p-1 rounded-full text-stone-600 hover:text-stone-900 transition-colors"
                    title={isLoopVideoMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isLoopVideoMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-[#FF6422]" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Gallery image selector dots when in poster mode */}
          {(!salon.loopVideoUrl || !showVideoInHero) && salon.images.length > 1 && (
            <div className="absolute bottom-3 left-4 flex gap-1.5 z-10">
              {salon.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveGalleryIndex(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    activeGalleryIndex === idx ? 'w-6 bg-[#FF6422]' : 'w-2 bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Salon Header Titles */}
        <div className="p-5 pt-4 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {salon.name}
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                {salon.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl text-amber-800 font-bold text-sm shadow-xs">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{salon.rating}</span>
                <span className="text-stone-500 text-xs font-normal">({salon.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Location & Quick Actions */}
          <div className="mt-4 pt-3 border-t border-[#E8E2D8] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-700">
              <MapPin className="w-4 h-4 text-[#FF6422] shrink-0" />
              <span className="truncate max-w-xs">{salon.address}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${salon.phone}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E2DDD5] text-stone-700 hover:text-stone-900 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-stone-500" />
                <span>Call Studio</span>
              </a>

              <button
                onClick={() => redirectToGoogleMaps({
                  lat: salon.coordinates.lat,
                  lng: salon.coordinates.lng,
                  name: salon.name,
                  address: salon.address
                }, userLocation || undefined)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF6422] text-white font-bold hover:bg-orange-600 transition-all shadow-md shadow-orange-500/20 active:scale-95"
                title="Navigate in Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 fill-white" />
                <span>{salon.distanceKm} km • Navigate ↗</span>
              </button>
              <button
                onClick={() => openGoogleMapsLocation(salon.coordinates.lat, salon.coordinates.lng)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-[#E2DDD5] text-[#FF6422] hover:border-[#FF6422] text-xs font-semibold shadow-xs"
                title="View exact pin on Google Maps"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">Maps Pin ↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PROMINENT LIVE QUEUE CARD */}
      <section className="bg-white border-2 border-orange-200 rounded-3xl p-5 shadow-[0_4px_20px_rgba(255,100,34,0.06)] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-orange-400/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E8E2D8]">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${queueInfo.dotClass}`} />
            <span className="text-xs font-black uppercase tracking-wider text-[#FF6422]">
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
          <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl p-4 sm:w-56 shrink-0 shadow-xs">
            <div className="text-[10px] text-stone-500 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#FF6422]" /> Estimated Wait Time
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
                  <span className="text-[#FF6422]">#</span>
                  <span>{(activeTicket.ticketNumber || String(activeTicket.position || '')).replace(/^#+/, '')}</span>
                </div>
                <p className="text-xs text-stone-700 font-semibold mt-0.5">
                  {activeTicket.customerName} • {activeTicket.serviceName || 'Haircut & Styling'}
                </p>
              </div>

              {/* Customer Self-Service Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {activeTicket.status !== 'in_service' && (
                  <button
                    type="button"
                    onClick={() => markTicketInService(salon.id, activeTicket.id)}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>I'm on Chair</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    completeLiveQueue(salon.id, activeTicket.id);
                    onOpenReviewModal();
                  }}
                  className="text-xs font-extrabold px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Done / Service Finished</span>
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
                  Leave
                </button>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 mt-2.5 bg-white/80 p-2.5 rounded-xl border border-orange-200/50">
              💡 <strong>Customer Self-Service:</strong> When you take your seat or finish your haircut, tap above so the barber doesn't have to touch their phone while working!
            </p>
          </div>
        ) : salon.isOpen ? (
          /* JOIN LIVE QUEUE CTA */
          <div className="mt-4 pt-4 border-t border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-stone-600">
              <strong className="text-stone-900">Heading to the studio?</strong> Join the live queue to get your token so the salon can call you when your turn arrives.
            </div>
            <button
              type="button"
              onClick={() => setShowJoinQueueModal(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#FF6422] hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
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

        {/* Customer queue updates */}
        <div className="mt-4 pt-3.5 border-t border-[#E8E2D8] bg-stone-50/80 -mx-5 -mb-5 px-5 py-3.5 rounded-b-3xl">
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
              <Navigation className="w-3.5 h-3.5 text-[#FF6422]" />
              <span>Share a quick update</span>
            </button>
          </div>
        </div>

        {/* LIVE WAITING CUSTOMER LIST (PUBLIC TICKETS & NAMES) */}
        {queueEntries.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#E8E2D8]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#FF6422]" />
                Waiting in Studio ({queueEntries.length})
              </span>
              <span className="text-[11px] text-stone-500 font-medium">Synced live</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {queueEntries.map((entry, idx) => {
                const isServing = entry.status === 'in_service';
                const isMyEntry = activeTicket?.id === entry.id;
                return (
                  <div
                    key={entry.id || idx}
                    className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                      isMyEntry
                        ? 'bg-[#FF6422] text-white border-orange-600 font-bold shadow-xs'
                        : isServing
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                        : 'bg-[#FAF7F2] text-stone-700 border-[#E8E2D8]'
                    }`}
                  >
                    <span className="font-black">
                      {entry.ticketNumber || `#0${idx + 1}`.slice(-3)}
                    </span>
                    <span>{entry.customerName}</span>
                    {isServing && <span className="text-[10px] text-emerald-600 font-bold">(In Chair)</span>}
                    {isMyEntry && <span className="text-[10px] bg-white/25 px-1 rounded font-bold">(You)</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Important Business Rule Banner */}
        <div className="mt-4 pt-3 border-t border-[#E8E2D8] flex items-start gap-2.5 text-xs text-stone-600 bg-orange-50/50 p-3 rounded-2xl border border-orange-100">
          <Info className="w-4 h-4 text-[#FF6422] shrink-0 mt-0.5" />
          <p>
            <strong className="text-stone-900">Walk-in policy:</strong> SLOON eliminates blind waiting. Check the live queue or take a token to walk straight in without wasting time.
          </p>
        </div>
      </section>

      {/* Interactive Mapbox Studio Location */}
      <section className="bg-white border border-[#E8E2D8] rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FF6422]" />
            <h3 className="text-sm font-bold text-stone-900">
              Studio Location & Map
            </h3>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            {salon.distanceKm} km away • {salon.locality}
          </span>
        </div>

        <SalonMapboxView
          salon={salon}
          userLocation={userLocation}
          height="280px"
        />
      </section>

      {/* Tabs navigation: Services, Staff, Reviews, Gallery */}
      <div className="flex border-b border-[#E8E2D8] text-xs font-bold">
        {[
          { id: 'services', label: `Services (${salon.services.length})` },
          { id: 'staff', label: `Stylists (${salon.staff.length})` },
          { id: 'reviews', label: `Reviews (${salon.reviewCount})` },
          { id: 'gallery', label: `Showcase (${galleryItems.length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-center border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-[#FF6422] text-[#FF6422] bg-orange-50/50'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: SERVICES & PRICING */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {serviceCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedServiceCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                  selectedServiceCategory === cat
                    ? 'bg-[#FF6422] text-white border-orange-500 shadow-xs'
                    : 'bg-white border-[#E2DDD5] text-stone-700 hover:border-orange-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Service Catalogue List */}
          <div className="space-y-2.5">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-4 flex items-start justify-between gap-3 hover:border-orange-300 transition-colors shadow-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-900">
                      {service.name}
                    </h3>
                    {service.popular && (
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-orange-50 text-[#FF6422] border border-orange-200">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" /> ~{service.durationMinutes} mins
                    </span>
                    <span>•</span>
                    <span className="text-stone-500">Category: {service.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-[#FF6422]">
                    ₹{service.price}
                  </div>
                  <span className="text-[10px] text-stone-500 block mt-0.5">
                    Pay at salon
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: STAFF & STYLISTS */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="text-xs text-stone-500">
            Meet the master barbers and grooming artisans at {salon.name}.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {salon.staff.map((member) => (
              <div
                key={member.id}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs"
              >
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[#E2DDD5]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-stone-900 truncate">{member.name}</h4>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {member.rating}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{member.role} • {member.experience}</p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.specialties.map((spec, idx) => (
                      <span key={idx} className="text-[9px] bg-[#FAF7F2] text-stone-700 px-2 py-0.5 rounded border border-[#E2DDD5]">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: RATINGS & REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-5">
          {/* Ratings Overview & 5 Criteria Breakdown */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
              <div className="text-center sm:text-left">
                <div className="text-4xl font-black text-stone-900 flex items-center justify-center sm:justify-start gap-2">
                  <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
                  <span>{salon.rating}</span>
                </div>
                <div className="text-xs text-stone-500 mt-1">
                  Based on {salon.reviewCount} customer reviews
                </div>
              </div>

              <button
                onClick={onOpenReviewModal}
                className="px-4 py-2 rounded-xl bg-[#FF6422] text-white font-bold text-xs hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Rate & Review Salon</span>
              </button>
            </div>

            {/* The 5 Required Criteria Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 text-xs">
              {[
                { label: 'Haircut Quality', score: salon.ratingBreakdown?.haircutQuality ?? 5 },
                { label: 'Staff Behaviour', score: salon.ratingBreakdown?.staffBehaviour ?? 5 },
                { label: 'Cleanliness & Hygiene', score: salon.ratingBreakdown?.cleanliness ?? 5 },
                { label: 'Pricing & Value', score: salon.ratingBreakdown?.pricing ?? 5 },
                { label: 'Overall Experience', score: salon.ratingBreakdown?.overallExperience ?? 5 }
              ].map((c) => (
                <div key={c.label} className="bg-[#FAF7F2] border border-[#E2DDD5] p-2 rounded-xl flex items-center justify-between">
                  <span className="text-stone-700">{c.label}</span>
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#FF6422] rounded-full"
                        style={{ width: `${(c.score / 5) * 100}%` }}
                      />
                    </div>
                    <span>{c.score}★</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Reviews List */}
          <div className="space-y-3">
            {(() => {
              const seen = new Set<string>();
              const uniqueReviews = (salon.reviews || []).filter((rev) => {
                const key = `${(rev.customerName || '').trim().toLowerCase()}|${(rev.comment || '').trim().toLowerCase()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });

              if (uniqueReviews.length === 0) {
                return (
                  <div className="bg-white border border-[#E8E2D8] rounded-2xl p-6 text-center space-y-2 shadow-xs">
                    <p className="text-stone-600 text-xs">No reviews submitted yet.</p>
                    <p className="text-stone-500 text-[11px]">Be the first customer to share your grooming experience!</p>
                  </div>
                );
              }

              return uniqueReviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-[#E8E2D8] rounded-2xl p-4 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={rev.customerAvatar} alt={rev.customerName} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span>{rev.customerName}</span>
                          {rev.verifiedVisit && (
                            <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                              Verified Visit
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-500">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-xs text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed">
                    "{rev.comment}"
                  </p>

                  {/* Owner Reply if any */}
                  {rev.ownerReply && (
                    <div className="mt-2 bg-orange-50/50 border-l-2 border-[#FF6422] p-2.5 rounded-r-xl text-xs border border-orange-100">
                      <div className="text-[11px] font-bold text-[#FF6422] mb-0.5">
                        Salon Owner Response • {typeof rev.ownerReply === 'string' ? 'Verified Response' : rev.ownerReply.date || 'Recent'}
                      </div>
                      <p className="text-stone-700">{typeof rev.ownerReply === 'string' ? rev.ownerReply : rev.ownerReply.comment}</p>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SHOWCASE & GALLERY */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {/* Sub-Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all' as const, label: `All Media (${galleryItems.length})`, icon: LayoutGrid },
              { id: 'location' as const, label: `Location (${locationPhotos.length})`, icon: MapPin },
              { id: 'work' as const, label: `Our Work (${workPhotos.length})`, icon: Scissors },
              ...(salon.loopVideoUrl ? [{ id: 'video' as const, label: `Video Tour (1)`, icon: Play }] : []),
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = galleryFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setGalleryFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
                    isSelected
                      ? 'bg-[#FF6422] text-white shadow-sm shadow-orange-500/20'
                      : 'bg-white text-stone-700 hover:border-orange-300 border border-[#E2DDD5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Media Grid */}
          {filteredGalleryItems.length === 0 ? (
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 text-center text-xs text-stone-500 shadow-xs">
              No media in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredGalleryItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(galleryItems.findIndex(g => g.id === item.id))}
                  className="group relative h-44 rounded-2xl overflow-hidden border border-[#E8E2D8] bg-stone-100 cursor-pointer shadow-xs hover:border-orange-400 transition-all"
                >
                  {item.type === 'video' ? (
                    <div className="w-full h-full relative">
                      <video
                        src={item.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-[#FF6422] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-90 group-hover:opacity-100 transition-opacity" />

                  {/* Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md bg-white/90 text-stone-900 border border-stone-200">
                      {item.categoryLabel}
                    </span>
                  </div>

                  {/* Title & Enlarge icon */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white font-medium">
                    <span className="truncate drop-shadow-md">{item.title}</span>
                    <Maximize2 className="w-3.5 h-3.5 text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informational Callout */}
          <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200 flex items-center gap-2.5 text-xs text-stone-700">
            <Camera className="w-4 h-4 text-[#FF6422] shrink-0" />
            <span>
              Real photos and loop video captured directly on location at <strong className="text-stone-900">{salon.name}</strong>, {salon.locality}.
            </span>
          </div>
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null && galleryItems[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#FF6422]/20 text-orange-400 border border-orange-500/30">
                {galleryItems[lightboxIndex].categoryLabel}
              </span>
              <h4 className="text-xs font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-md">
                {galleryItems[lightboxIndex].title}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 font-mono">
                {lightboxIndex + 1} / {galleryItems.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 rounded-full bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Player / Image Area */}
          <div className="flex-1 flex items-center justify-center relative my-2 min-h-0">
            {galleryItems[lightboxIndex].type === 'video' ? (
              <video
                src={galleryItems[lightboxIndex].url}
                autoPlay
                loop
                controls
                playsInline
                className="max-h-full max-w-full rounded-2xl shadow-2xl object-contain"
              />
            ) : (
              <img
                src={galleryItems[lightboxIndex].url}
                alt={galleryItems[lightboxIndex].title}
                className="max-h-full max-w-full rounded-2xl shadow-2xl object-contain select-none"
              />
            )}

            {/* Left/Right Navigation */}
            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + galleryItems.length) % galleryItems.length)}
                  className="absolute left-2 sm:left-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-all shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % galleryItems.length)}
                  className="absolute right-2 sm:right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-all shadow-lg"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar border-t border-zinc-800/80">
            {galleryItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  idx === lightboxIndex ? 'border-[#FF6422] scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-white text-white" />
                  </div>
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* JOIN LIVE QUEUE MODAL FOR CUSTOMERS */}
      {showJoinQueueModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-100 text-[#FF6422] flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Join Live Walk-In Queue</h3>
                  <p className="text-xs text-stone-500">{salon.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJoinQueueModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleJoinQueueSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Your Full Name <span className="text-[#FF6422]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mobile Number <span className="text-stone-500">(So studio can call your turn)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
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
                  className="px-5 py-2.5 rounded-xl bg-[#FF6422] hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isJoining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>Take Token & Join Queue</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Queue update form */}
      {showCrowdModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#FF6422] flex items-center justify-center text-lg">
                  📍
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">Share a queue update</h3>
                  <p className="text-xs text-stone-500">
                    {salon.name}
                  </p>
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

            {/* Location Verification Status Box */}
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

            {/* Input Controls */}
            <div className="mt-5 space-y-4">
              {/* Question 1: Number of people */}
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

              {/* Question 2: Estimated Wait Time */}
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

              {/* Question 3: Active Stylists / Barbers */}
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

              {/* Observation note */}
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

            {/* Modal Actions */}
            <div className="mt-6 pt-4 border-t border-[#E8E2D8] flex items-center justify-end gap-2.5">
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
                disabled={
                  isSubmittingCrowd ||
                  isCheckingLocation
                }
                className="px-5 py-2.5 rounded-xl bg-[#FF6422] hover:bg-orange-600 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmittingCrowd ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Share update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationRequiredPopup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="location-required-title"
          aria-describedby="location-required-message"
        >
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-xl">
              📍
            </div>
            <h3 id="location-required-title" className="text-base font-bold text-stone-900">
              You need to be at the salon
            </h3>
            <p id="location-required-message" className="mt-2 text-sm text-stone-600">
              You can only contribute or update when you are at the salon.
            </p>
            <button
              type="button"
              onClick={() => setShowLocationRequiredPopup(false)}
              className="mt-5 w-full rounded-xl bg-[#FF6422] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
