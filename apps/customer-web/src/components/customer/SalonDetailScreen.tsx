import { InstagramGradientIcon } from '../common/InstagramIcon';
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
  Plus,
  Sparkles,
  ShieldCheck,
  Compass,
  Map as MapIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { useSalon, getEstimatedWaitMinutes, formatDuration, formatWaitTime, getQueueDisplay, getQueueFreshness, getTargetSalonFromUrl } from '../../context/CustomerContext';
import { Service, Staff } from '@kumbhakaran/shared-types';
import { redirectToGoogleMaps, openGoogleMapsLocation, SalonMapboxView } from '@kumbhakaran/ui';
import { SmartQueueAssist } from './SmartQueueAssist';
import { SalonOffersModal } from './SalonOffersModal';

interface SalonDetailScreenProps {
  onBack: () => void;
  onOpenReviewModal: () => void;
  onOpenDirectionsModal?: () => void;
}

type SalonSubPageTab = 'queue' | 'services' | 'stylists' | 'gallery' | 'reviews' | 'location';

export const SalonDetailScreen: React.FC<SalonDetailScreenProps> = ({
  onBack,
  onOpenReviewModal,
  onOpenDirectionsModal
}) => {
  const {
    genderFilter,
    selectedSalonForDetail,
    setSelectedSalonForDetail,
    setCustomerTab,
    toggleFavorite,
    userProfile,
    toggleCompareSalon,
    comparisonList,
    triggerNotification,
    userLocation,
    queueEntries = [],
    activeTicket,
    otherTickets,
    removeOtherTicket,
    fetchSalonQueue,
    joinLiveQueue,
    leaveLiveQueue,
    reportSalonCrowd,
    updateCustomerName,
    latestCrowdReport,
    fetchLatestCrowdReport,
    submitLocationCrowdReport,
  } = useSalon();

  const isWomen = genderFilter === 'women';

  // Sub-page tab state (Page-in-Page human architecture)
  const [activeTab, setActiveTab] = useState<SalonSubPageTab>('queue');
  const [showOffersModal, setShowOffersModal] = useState(false);

  // Join Live Queue & Token states
  const [showJoinQueueModal, setShowJoinQueueModal] = useState(false);
  const [bookingFor, setBookingFor] = useState<'self' | 'other'>('self');
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

  // Gallery & media state
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('All');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [showVideoInHero, setShowVideoInHero] = useState(true);
  const [isLoopVideoMuted, setIsLoopVideoMuted] = useState(true);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'location' | 'work' | 'video'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
      // Notification handled in context
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
        color: { dark: '#1E130D', light: '#FFFFFF' },
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
    if (
      autoJoin &&
      !activeTicket &&
      selectedSalonForDetail?.isOpen &&
      selectedSalonForDetail?.queueStatus !== 'paused'
    ) {
      setShowJoinQueueModal(true);
    }
  }, [selectedSalonForDetail?.id, activeTicket, selectedSalonForDetail?.isOpen, selectedSalonForDetail?.queueStatus]);

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
      let inFlight = false;

      const refresh = async () => {
        if (typeof document !== 'undefined' && document.hidden) return;
        if (inFlight) return;
        inFlight = true;
        try {
          await fetchSalonQueue(sId);
        } finally {
          inFlight = false;
        }
      };

      refresh();
      const interval = setInterval(refresh, 25000);

      const onFocus = () => refresh();
      const onVisibility = () => {
        if (document.visibilityState === 'visible') refresh();
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
    const isOther = bookingFor === 'other';
    const cleanName = joinName.trim() || (isOther ? 'Guest' : 'Walk-in Guest');
    if (!isOther && !userProfile.name && cleanName !== 'Walk-in Guest') {
      updateCustomerName(cleanName);
    }
    try {
      setIsJoining(true);
      if (!isOther && activeTicket) {
        await leaveLiveQueue(activeTicket.salonId || selectedSalonForDetail.id, activeTicket.id);
      }
      await joinLiveQueue(
        selectedSalonForDetail.id,
        cleanName,
        joinPhone.trim() || undefined,
        joinService,
        { bookingForSomeoneElse: isOther }
      );
      setShowJoinQueueModal(false);
      setJoinName(userProfile.name || '');
      setJoinPhone(userProfile.phone || '');
      triggerNotification(
        isOther
          ? `Token booked for ${cleanName}!`
          : activeTicket
          ? `Moved to back of line (Token #${selectedSalonForDetail.currentQueue + 1})!`
          : `Token issued for ${selectedSalonForDetail.name}!`
      );
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to join queue');
    } finally {
      setIsJoining(false);
    }
  };

  if (!selectedSalonForDetail) return null;

  const salon = selectedSalonForDetail;
  const isSaved = userProfile.savedSalons.includes(salon.id);
  const queueInfo = getQueueDisplay(salon.currentQueue, salon.isOpen, salon.queueStatus);
  const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);
  const freshness = getQueueFreshness(salon.lastQueueUpdate);

  // Curated Location & Work media collections
  const locationPhotos = (salon.locationImages && salon.locationImages.length > 0)
    ? salon.locationImages.filter((url) => !url.includes('images.unsplash.com'))
    : [];

  const workPhotos = (salon.workImages && salon.workImages.length > 0)
    ? salon.workImages.filter((url) => !url.includes('images.unsplash.com'))
    : [];

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
      title: `Studio Interior #${i + 1}`,
      category: 'location' as const,
      categoryLabel: 'Studio Space'
    })),
    ...workPhotos.map((url, i) => ({
      id: `work-${i}`,
      url,
      type: 'image' as const,
      title: `Signature Cut #${i + 1}`,
      category: 'work' as const,
      categoryLabel: 'Styling Work'
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
        title: `${salon.name} · SLOON Live Queue`,
        text: `Live walk-in queue for ${salon.name}: ${salon.currentQueue} customers waiting right now.`,
        url: window.location.href
      }).catch(() => {});
    } else {
      triggerNotification(`Share link for ${salon.name} copied to clipboard`);
    }
  };

  // Bespoke editorial sub-page navigation (Human typography, no cartoon emojis)
  const navTabs: { id: SalonSubPageTab; label: string; count?: number | string }[] = [
    { id: 'queue', label: 'Live Queue', count: salon.currentQueue },
    { id: 'services', label: 'Menu & Rates', count: salon.services.length },
    { id: 'stylists', label: 'Stylists & Team', count: salon.staff.length },
    { id: 'gallery', label: 'Lookbook', count: galleryItems.length },
    { id: 'reviews', label: 'Guest Reviews', count: `${salon.rating}★` },
    { id: 'location', label: 'Location & Hours' },
  ];

  return (
    <div className="space-y-4 pb-28 text-[#241810] max-w-5xl mx-auto">
      {/* 1. TOP UTILITY BAR: Back & Quiet Studio Actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#E8E0D5] text-xs font-bold text-[#241810] hover:border-[#C85322] hover:text-[#C85322] transition-colors shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#C85322]" />
          <span>Back to Discovery</span>
        </button>

        <div className="flex items-center gap-1.5">
          {(salon.instagramUrl || salon.instagramHandle) && (
            <a
              href={
                salon.instagramUrl?.startsWith('http')
                  ? salon.instagramUrl
                  : `https://instagram.com/${(salon.instagramHandle || salon.instagramUrl || '').replace(/^@/, '')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-white border border-[#E8E0D5] text-stone-600 hover:text-pink-600 transition-colors shadow-xs cursor-pointer"
              title={`Visit ${salon.name} on Instagram`}
            >
              <InstagramGradientIcon className="w-4 h-4" />
            </a>
          )}

          {salon.phone && (
            <a
              href={`tel:${salon.phone}`}
              className="p-2 rounded-full bg-white border border-[#E8E0D5] text-stone-700 hover:text-emerald-700 hover:border-emerald-300 transition-colors shadow-xs cursor-pointer"
              title={`Call ${salon.name}`}
            >
              <PhoneCall className="w-4 h-4 text-emerald-700" />
            </a>
          )}

          <button
            type="button"
            onClick={() => toggleCompareSalon(salon.id)}
            className={`p-2 rounded-full border transition-colors shadow-xs cursor-pointer ${
              comparisonList.includes(salon.id)
                ? 'bg-[#C85322] text-white border-[#C85322]'
                : 'bg-white border-[#E8E0D5] text-stone-600 hover:text-stone-900'
            }`}
            title="Compare Studio"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-full bg-white border border-[#E8E0D5] text-stone-600 hover:text-stone-900 transition-colors shadow-xs cursor-pointer"
            title="Share Studio"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(salon.id)}
            className="p-2 rounded-full bg-white border border-[#E8E0D5] text-stone-500 hover:text-rose-500 transition-colors shadow-xs cursor-pointer"
            title="Save to Favourites"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. BESPOKE STUDIO HERO & STOREFRONT HEADER */}
      <div className="rounded-3xl overflow-hidden border border-[#E8E0D5] bg-white shadow-xs transition-all">
        {/* Cinematic Aspect Ratio Media Window */}
        <div className="h-60 sm:h-72 md:h-80 w-full relative overflow-hidden group bg-stone-950">
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
            <div className={`w-full h-full ${isWomen ? 'bg-[#351329]' : 'bg-[#1E130D]'} flex flex-col items-center justify-center text-white p-6 text-center`}>
              <Store className="w-12 h-12 text-[#C85322] mb-2" />
              <div className="text-xl font-bold tracking-tight">{salon.name}</div>
              <div className="text-xs text-amber-200/80 mt-1">{salon.locality}, {salon.city}</div>
            </div>
          )}

          {/* Warm Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15 pointer-events-none" />

          {/* Top Overlaid Studio Credentials */}
          <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between pointer-events-auto z-10">
            <div className="flex items-center gap-2">
              {salon.isVerified && (
                <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[#C85322] font-bold text-[11px] tracking-wider uppercase border border-white/60 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C85322]" /> Verified Partner Studio
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-xs ${
                salon.isOpen ? 'bg-white/95 text-emerald-800 border border-white/60' : 'bg-white/95 text-rose-800 border border-white/60'
              }`}>
                {salon.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            {/* Video / Photo Toggle Pill */}
            {salon.loopVideoUrl && (
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md border border-white/20 p-1 rounded-full text-white text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowVideoInHero(!showVideoInHero)}
                  className={`px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    showVideoInHero ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-300 hover:text-white'
                  }`}
                  title="Toggle loop video"
                >
                  <Film className="w-3 h-3" />
                  <span>{showVideoInHero ? 'Video' : 'Still'}</span>
                </button>
                {showVideoInHero && (
                  <button
                    type="button"
                    onClick={() => setIsLoopVideoMuted(!isLoopVideoMuted)}
                    className="p-1 rounded-full text-stone-300 hover:text-white transition-colors cursor-pointer"
                    title={isLoopVideoMuted ? 'Unmute' : 'Mute'}
                  >
                    {isLoopVideoMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3 text-[#C85322]" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Overlaid Quick Queue Status */}
          <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-white z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-white border border-white/15">
                <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass} animate-pulse`} />
                <span>{salon.currentQueue} waiting</span>
                <span className="text-amber-300">· ~{formatDuration(waitTime)} wait</span>
              </span>
            </div>

            {(!salon.loopVideoUrl || !showVideoInHero) && salon.images.length > 1 && (
              <div className="flex gap-1 pointer-events-auto">
                {salon.images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeGalleryIndex === idx ? 'w-5 bg-[#C85322]' : 'w-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Studio Identity Banner */}
        <div className="p-5 sm:p-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#241810] tracking-tight">
                  {salon.name}
                </h1>
                <span className="text-xs font-semibold text-stone-500">
                  {salon.locality}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xl">
                {salon.tagline || `${salon.address} · Professional Barbering, Styling & Grooming`}
              </p>
            </div>

            {/* Quick Actions & Booking CTA */}
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#E8E0D5] px-3 py-1.5 rounded-full text-stone-800 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{salon.rating}</span>
                <span className="text-stone-400 font-normal">({salon.reviewCount})</span>
              </div>

              {salon.isOpen && salon.queueStatus !== 'paused' && !activeTicket && (
                <button
                  type="button"
                  onClick={() => setShowJoinQueueModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#C85322] hover:bg-[#B34618] text-white text-xs font-extrabold tracking-wide shadow-xs transition-all cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Join Walk-In Queue</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => redirectToGoogleMaps({
                  lat: salon.coordinates.lat,
                  lng: salon.coordinates.lng,
                  name: salon.name,
                  address: salon.address
                }, userLocation || undefined)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1E130D] text-white text-xs font-bold hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                title="Directions in Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 fill-white" />
                <span>Navigate ↗</span>
              </button>

              <button
                type="button"
                onClick={() => setShowOffersModal(true)}
                className="relative group flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer active:scale-95 border border-amber-300/40"
                title="Spin the Fortune Wheel & View VIP Salon Offers"
              >
                <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
                <span>Spin & Deals 🎁</span>
                <span className="bg-stone-950 text-amber-300 text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase">
                  Win 50%
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 LUXURY STUDIO VIP DEALS & FORTUNE WHEEL TEASER */}
      <div
        onClick={() => setShowOffersModal(true)}
        className="relative overflow-hidden p-4 sm:p-4.5 rounded-3xl bg-gradient-to-r from-[#1C120C] via-[#2A180F] to-[#1C120C] border-2 border-amber-500/40 hover:border-amber-400 text-white cursor-pointer shadow-lg shadow-black/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-0.5 shadow-md shadow-amber-500/30 shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#18100C] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Fortune Spin Wheel Available
              </span>
              <span className="text-xs text-amber-300 font-extrabold hidden sm:inline">
                Instant Coupons Available
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black text-white mt-1 group-hover:text-amber-300 transition-colors">
              Spin to Win Flat ₹100 Off, 50% Jackpot & Free Beard Care
            </h4>
            <p className="text-xs text-stone-300 font-medium mt-0.5">
              Available for all walk-in and live queue customers at {salon.name}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-400 group-hover:to-orange-400 text-stone-950 text-xs font-black shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-stone-950" />
            <span>Spin Fortune Wheel ➔</span>
          </button>
        </div>
      </div>

      {/* 3. HUMAN EDITORIAL PAGE-IN-PAGE NAVIGATION BAR */}
      <div className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md pt-1 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-white border border-[#E8E0D5] rounded-full shadow-2xs">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1E130D] text-[#FAF5EE] shadow-xs'
                    : 'text-stone-600 hover:text-stone-950 hover:bg-[#FAF7F2]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. BESPOKE SUB-PAGE PANELS */}
      <div className="animate-in fade-in duration-200">
        {/* SUBPAGE 1: LIVE QUEUE (LOUNGE DISPLAY & VALET PASS) */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Live Queue Concierge Board */}
            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E0D5]">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${queueInfo.dotClass} animate-pulse`} />
                  <span className="text-xs font-black tracking-wider uppercase text-stone-900">
                    Front-Desk Walk-In Status
                  </span>
                  <span className="text-[11px] text-stone-500">· {freshness.text}</span>
                </div>

                <div className="text-xs text-stone-600 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C85322]" />
                  <span>Estimated Wait: ~{formatDuration(waitTime)}</span>
                </div>
              </div>

              {/* Dignified Status Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] text-center">
                  <div className="text-3xl font-extrabold text-[#241810] tracking-tight">{salon.currentQueue}</div>
                  <div className="text-[11px] font-bold text-stone-500 tracking-wider uppercase mt-1">Guests Ahead</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] text-center">
                  <div className="text-3xl font-extrabold text-[#C85322] tracking-tight">~{formatDuration(waitTime)}</div>
                  <div className="text-[11px] font-bold text-[#C85322] tracking-wider uppercase mt-1">Estimated Wait</div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] text-center">
                  <div className="text-3xl font-extrabold text-[#241810] tracking-tight">{salon.activeBarbers || 2}</div>
                  <div className="text-[11px] font-bold text-stone-500 tracking-wider uppercase mt-1">Chairs Serving</div>
                </div>
              </div>

              {/* Authentic Valet Walk-In Token Card */}
              {activeTicket && (activeTicket.salonId === salon.id || !activeTicket.salonId) ? (
                <div className="pt-2">
                  <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D5]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-stone-900">
                          Active Walk-In Pass
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {activeTicket.status === 'in_service' ? 'At Chair · In Service' : 'In Line'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-4xl font-extrabold text-[#241810] tracking-tight font-mono">
                          #{(activeTicket.ticketNumber || String(activeTicket.position || '')).replace(/^#+/, '')}
                        </div>
                        <p className="text-xs font-bold text-stone-800 mt-1">
                          {activeTicket.customerName} · {activeTicket.serviceName || 'Haircut & Styling'}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {activeTicket.status === 'in_service'
                            ? '✨ Your session is currently underway at the chair.'
                            : `Estimated time until your chair: ~${formatDuration(waitTime)}.`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <SmartQueueAssist salon={salon} ticket={activeTicket} />
                        <button
                          type="button"
                          onClick={() => {
                            setBookingFor('self');
                            setJoinName(userProfile.name || '');
                            setJoinPhone(userProfile.phone || '');
                            setShowJoinQueueModal(true);
                          }}
                          className="text-xs text-stone-700 bg-white border border-[#E8E0D5] hover:bg-stone-50 font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                        >
                          Move to Back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Cancel your walk-in token and leave the queue?')) {
                              leaveLiveQueue(salon.id, activeTicket.id);
                            }
                          }}
                          className="text-xs text-stone-500 hover:text-rose-600 font-bold px-3 py-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          Cancel Pass
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : salon.isOpen && salon.queueStatus !== 'paused' ? (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowJoinQueueModal(true)}
                    className="w-full sm:w-auto flex-1 py-3 px-6 rounded-full bg-[#C85322] hover:bg-[#B34618] text-white font-extrabold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Get Walk-In Pass on Your Phone</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCrowdModal}
                    className="text-xs font-bold text-stone-700 hover:text-[#C85322] px-4 py-3 rounded-full bg-[#FAF7F2] border border-[#E8E0D5] hover:bg-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-stone-500" />
                    <span>At the studio? Share wait update</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-stone-50 rounded-2xl text-center text-xs text-stone-500 font-medium">
                  Walk-in queue is temporarily paused or studio is closed for the day.
                </div>
              )}
            </div>

            {/* Passes for Friends & Family */}
            {otherTickets.filter((t) => t.salonId === salon.id || !t.salonId).length > 0 && (
              <div className="bg-white border border-[#E8E0D5] rounded-3xl p-5 shadow-xs space-y-3">
                <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#C85322]" />
                  <span>Passes issued for friends & family ({otherTickets.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {otherTickets.map((t) => (
                    <div
                      key={t.id}
                      className="text-xs bg-[#FAF7F2] border border-[#E8E0D5] px-3 py-1.5 rounded-full flex items-center gap-2"
                    >
                      <span className="font-mono font-bold text-stone-900">
                        #{(t.ticketNumber || String(t.position || '')).replace(/^#+/, '')}
                      </span>
                      <span className="text-stone-800 font-bold">{t.customerName}</span>
                      <span className="text-stone-500 text-[11px]">({t.serviceName || 'Service'})</span>
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

            {/* Verified Community Wait Time Report */}
            {latestCrowdReport && (
              <div className="bg-white border border-[#E8E0D5] rounded-3xl p-4 flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                    ✓
                  </div>
                  <div>
                    <div className="font-bold text-stone-900">
                      Verified On-Site Update: {latestCrowdReport.peopleCount} waiting ({latestCrowdReport.estimatedWaitMinutes} min wait)
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Submitted by a guest physically at {salon.name}.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCrowdModal}
                  className="text-xs font-bold text-[#C85322] underline hover:text-[#B34618] cursor-pointer shrink-0"
                >
                  Update
                </button>
              </div>
            )}

            {/* The Walk-in Experience Narrative */}
            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                The SLOON Walk-In Experience
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                  <div className="font-bold text-[#241810]">1. Claim Your Token</div>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    Hold your chair position before leaving home. No upfront fees or lock-ins.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                  <div className="font-bold text-[#241810]">2. Real-Time Tracking</div>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    Watch the front-desk counter progress live. Head over right as your turn approaches.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E0D5] space-y-1">
                  <div className="font-bold text-[#241810]">3. Settle at Counter</div>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    Sit right down with your barber. Settle regular counter prices via cash or UPI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 2: SERVICES & RATES (BESPOKE MENU) */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {serviceCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedServiceCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    selectedServiceCategory === cat
                      ? 'bg-[#1E130D] text-[#FAF5EE] border-[#1E130D] shadow-xs'
                      : 'bg-white border-[#E8E0D5] text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Service Catalogue List */}
            <div className="space-y-2.5">
              {filteredServices.length === 0 ? (
                <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 text-center text-xs text-stone-500 shadow-xs">
                  No services listed in this category.
                </div>
              ) : (
                filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white border border-[#E8E0D5] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-stone-400 transition-colors shadow-xs group"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-[#241810]">
                          {service.name}
                        </h3>
                        {service.popular && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                            Popular Choice
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 font-medium">
                          {service.category}
                        </span>
                      </div>

                      {service.description && (
                        <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-stone-400" /> ~{formatDuration(service.durationMinutes)}
                        </span>
                        <span>•</span>
                        <span>Standard counter rate</span>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E8E0D5]">
                      <div className="text-base sm:text-lg font-bold text-[#241810]">
                        ₹{service.price}
                      </div>

                      {salon.isOpen && salon.queueStatus !== 'paused' && (
                        <button
                          type="button"
                          onClick={() => {
                            setJoinService(service.name);
                            setShowJoinQueueModal(true);
                          }}
                          className="px-3 py-1.5 rounded-full bg-[#FAF7F2] hover:bg-[#1E130D] text-[#241810] hover:text-white border border-[#E8E0D5] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Select for Walk-In</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3.5 bg-white border border-[#E8E0D5] rounded-2xl text-xs text-stone-600 flex items-center gap-2.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-[#C85322] shrink-0" />
              <span>Standard salon prices. Zero online markups or platform booking charges.</span>
            </div>
          </div>
        )}

        {/* SUBPAGE 3: STYLISTS & ARTISANS */}
        {activeTab === 'stylists' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>The master barbers and styling professionals at {salon.name}.</span>
              <span className="font-bold">{salon.staff.length} Team Members</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {salon.staff.map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-[#E8E0D5] rounded-2xl p-4 flex items-start gap-4 shadow-xs hover:border-stone-400 transition-colors"
                >
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#E8E0D5]"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-[#241810] truncate">{member.name}</h4>
                      <span className="flex items-center gap-0.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {member.rating}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500">{member.role} · {member.experience}</p>

                    <div className="flex items-center gap-2 pt-0.5">
                      {member.status === 'break' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          ☕ On Break
                        </span>
                      ) : member.status === 'off' ? (
                        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                          ○ Off Duty
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Chair Active
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {member.specialties.map((spec, idx) => (
                        <span key={idx} className="text-[9px] bg-[#FAF7F2] text-stone-700 px-2 py-0.5 rounded border border-[#E8E0D5]">
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

        {/* SUBPAGE 4: LOOKBOOK & STUDIO SPACES */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            {/* Gallery Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all' as const, label: `All Media (${galleryItems.length})`, icon: LayoutGrid },
                { id: 'location' as const, label: `Studio Interior (${locationPhotos.length})`, icon: MapPin },
                { id: 'work' as const, label: `Signature Work (${workPhotos.length})`, icon: Scissors },
                ...(salon.loopVideoUrl ? [{ id: 'video' as const, label: `Video Tour (1)`, icon: Play }] : []),
              ].map((f) => {
                const Icon = f.icon;
                const isSelected = galleryFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setGalleryFilter(f.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#1E130D] text-[#FAF5EE]'
                        : 'bg-white text-stone-700 hover:border-stone-400 border border-[#E8E0D5]'
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
              <div className="bg-white border border-[#E8E0D5] rounded-3xl p-8 text-center text-xs text-stone-500 shadow-xs">
                No media uploaded in this category.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredGalleryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setLightboxIndex(galleryItems.findIndex(g => g.id === item.id))}
                    className="group relative h-48 sm:h-52 rounded-2xl overflow-hidden border border-[#E8E0D5] bg-stone-100 cursor-pointer shadow-xs hover:border-stone-400 transition-all"
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
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[#1E130D] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
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

                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md bg-white/95 text-stone-900 border border-stone-200">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white font-medium">
                      <span className="truncate drop-shadow-md">{item.title}</span>
                      <Maximize2 className="w-3.5 h-3.5 text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E0D5] flex items-center gap-2.5 text-xs text-stone-600 shadow-2xs">
              <Camera className="w-4 h-4 text-[#C85322] shrink-0" />
              <span>
                Verified photography captured on location at <strong className="text-stone-900">{salon.name}</strong>, {salon.locality}.
              </span>
            </div>
          </div>
        )}

        {/* SUBPAGE 5: GUEST REVIEWS & REPUTATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Rating Breakdown Header */}
            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#E8E0D5]">
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-extrabold text-[#241810] flex items-center justify-center sm:justify-start gap-2">
                    <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
                    <span>{salon.rating}</span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Based on {salon.reviewCount} verified guest reviews
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenReviewModal}
                  className="px-4 py-2 rounded-full bg-[#1E130D] text-white font-bold text-xs hover:bg-stone-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Rate & Review Studio</span>
                </button>
              </div>

              {/* 5 Rating Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  { label: 'Haircut & Finish Quality', score: salon.ratingBreakdown?.haircutQuality ?? 5 },
                  { label: 'Staff Hospitality', score: salon.ratingBreakdown?.staffBehaviour ?? 5 },
                  { label: 'Cleanliness & Hygiene', score: salon.ratingBreakdown?.cleanliness ?? 5 },
                  { label: 'Value & Counter Transparency', score: salon.ratingBreakdown?.pricing ?? 5 },
                  { label: 'Overall Guest Experience', score: salon.ratingBreakdown?.overallExperience ?? 5 }
                ].map((c) => (
                  <div key={c.label} className="bg-[#FAF7F2] border border-[#E8E0D5] p-3 rounded-xl flex items-center justify-between">
                    <span className="text-stone-700 font-medium">{c.label}</span>
                    <div className="flex items-center gap-2 font-bold text-amber-900">
                      <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C85322] rounded-full"
                          style={{ width: `${(c.score / 5) * 100}%` }}
                        />
                      </div>
                      <span>{c.score}★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Review List */}
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
                    <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 text-center space-y-2 shadow-xs">
                      <p className="text-stone-600 text-xs font-semibold">No guest reviews submitted yet.</p>
                      <p className="text-stone-500 text-[11px]">Be the first to share your grooming experience at {salon.name}!</p>
                    </div>
                  );
                }

                return uniqueReviews.map((rev) => {
                  return (
                    <div key={rev.id} className="bg-white border border-[#E8E0D5] rounded-2xl p-4 sm:p-5 space-y-2 shadow-xs">
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

                        <div className="flex items-center gap-0.5 text-xs text-amber-900 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{rev.rating}.0</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-700 leading-relaxed pt-1">
                        "{rev.comment}"
                      </p>

                      {rev.ownerReply && (
                        <div className="mt-2 bg-[#FAF7F2] border-l-2 border-[#C85322] p-3 rounded-r-xl text-xs border border-[#E8E0D5]">
                          <div className="text-[11px] font-bold text-[#C85322] mb-0.5">
                            Studio Director Response · {typeof rev.ownerReply === 'string' ? 'Verified Reply' : rev.ownerReply.date || 'Recent'}
                          </div>
                          <p className="text-stone-700 leading-relaxed">{typeof rev.ownerReply === 'string' ? rev.ownerReply : rev.ownerReply.comment}</p>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* SUBPAGE 6: STUDIO LOCATION & OPERATING HOURS */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            {/* Embedded Interactive Mapbox */}
            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-5 h-5 text-[#C85322]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#241810]">{salon.name} Pinned Location</h3>
                    <p className="text-xs text-stone-500">{salon.address} · {salon.locality} ({salon.distanceKm} km away)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSalonForDetail(null);
                      setCustomerTab('map');
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-[#C85322]" />
                    <span>Explore Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => redirectToGoogleMaps({
                      lat: salon.coordinates.lat,
                      lng: salon.coordinates.lng,
                      name: salon.name,
                      address: salon.address
                    }, userLocation || undefined)}
                    className="px-4 py-1.5 rounded-full bg-[#1E130D] text-white font-bold text-xs shadow-xs hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-white" />
                    <span>Navigate ↗</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOffersModal(true)}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
                    <span>Offers & Spin 🎁</span>
                  </button>
                </div>
              </div>

              {/* Map Canvas */}
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-[#E8E0D5] relative shadow-inner">
                <SalonMapboxView
                  salon={salon}
                  userLocation={userLocation}
                  height="100%"
                  className="w-full h-full"
                />
              </div>

              {/* Contact Actions Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E0D5]">
                <div className="flex items-center gap-2 flex-wrap">
                  {salon.phone && (
                    <a
                      href={`tel:${salon.phone}`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E0D5] text-stone-800 hover:border-emerald-500 text-xs font-bold shadow-2xs transition-all"
                      title="Call salon front-desk"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call Front-Desk</span>
                    </a>
                  )}

                  {(salon.instagramUrl || salon.instagramHandle) && (
                    <a
                      href={
                        salon.instagramUrl?.startsWith('http')
                          ? salon.instagramUrl
                          : `https://instagram.com/${(salon.instagramHandle || salon.instagramUrl || '').replace(/^@/, '')}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E0D5] text-stone-800 hover:text-pink-600 text-xs font-bold shadow-2xs transition-all"
                    >
                      <InstagramGradientIcon className="w-4 h-4" />
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                    </a>
                  )}
                </div>

                <div className="text-xs text-stone-500 font-mono">
                  Coordinates: {Number(salon.coordinates.lat).toFixed(4)}, {Number(salon.coordinates.lng).toFixed(4)}
                </div>
              </div>
            </div>

            {/* Operating Hours Table */}
            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E0D5]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C85322]" />
                  <h3 className="text-sm font-bold text-[#241810]">Weekly Studio Hours</h3>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  salon.isOpen ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {salon.isOpen ? 'Open Today' : 'Closed Today'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { day: 'Monday', hours: '09:00 AM - 09:30 PM' },
                  { day: 'Tuesday', hours: '09:00 AM - 09:30 PM' },
                  { day: 'Wednesday', hours: '09:00 AM - 09:30 PM' },
                  { day: 'Thursday', hours: '09:00 AM - 09:30 PM' },
                  { day: 'Friday', hours: '09:00 AM - 10:00 PM' },
                  { day: 'Saturday', hours: '08:30 AM - 10:00 PM' },
                  { day: 'Sunday', hours: '08:30 AM - 10:00 PM' },
                ].map((item) => (
                  <div key={item.day} className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E0D5]">
                    <span className="font-semibold text-stone-800">{item.day}</span>
                    <span className="text-stone-600 font-mono text-[11px]">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Studio Amenities */}
            <div className="bg-white border border-[#E8E0D5] rounded-3xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-[#241810]">Studio Amenities & Client Comfort</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  'Climate-Controlled Air Conditioning',
                  'High-Speed Guest WiFi',
                  'Client Lounge Seating',
                  'Instant UPI & Card Payments',
                  'Sanitized Fresh Linen & Tools',
                  'Dedicated Customer Parking',
                  'Complimentary Beverage Service'
                ].map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E8E0D5] text-stone-700 font-medium"
                  >
                    ✓ {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null && galleryItems[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 text-stone-300 border border-white/10">
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
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

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

            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex - 1 + galleryItems.length) % galleryItems.length)}
                  className="absolute left-2 sm:left-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-all shadow-lg cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((lightboxIndex + 1) % galleryItems.length)}
                  className="absolute right-2 sm:right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 backdrop-blur-md transition-all shadow-lg cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar border-t border-zinc-800">
            {galleryItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  idx === lightboxIndex ? 'border-white scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
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

      {/* JOIN LIVE WALK-IN QUEUE MODAL */}
      {showJoinQueueModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-stone-100 text-[#C85322] flex items-center justify-center">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#241810]">Claim Walk-In Token</h3>
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

            {/* Target Select */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-full mt-4">
              <button
                type="button"
                onClick={() => {
                  setBookingFor('self');
                  setJoinName(userProfile.name || '');
                  setJoinPhone(userProfile.phone || '');
                }}
                className={`py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  bookingFor === 'self'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                For Myself
              </button>
              <button
                type="button"
                onClick={() => {
                  setBookingFor('other');
                  setJoinName('');
                  setJoinPhone('');
                }}
                className={`py-2 text-xs font-bold rounded-full transition-all cursor-pointer ${
                  bookingFor === 'other'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                For Guest / Family
              </button>
            </div>

            {/* Warning if already holding token */}
            {bookingFor === 'self' && activeTicket && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1 mt-3">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>You currently hold Token #{(activeTicket.ticketNumber || String(activeTicket.position || '')).replace(/^#+/, '')}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Taking a new token for yourself replaces your earlier position and places you at the current back of the line.
                </p>
              </div>
            )}

            <form onSubmit={handleJoinQueueSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {bookingFor === 'other' ? "Guest's Full Name" : 'Your Full Name'} <span className="text-[#C85322]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={bookingFor === 'other' ? 'e.g. Priya Sharma' : 'e.g. Rahul Sharma'}
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C85322] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={joinPhone}
                  onChange={(e) => setJoinPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C85322] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Requested Service
                </label>
                <select
                  value={joinService}
                  onChange={(e) => setJoinService(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-[#C85322] focus:bg-white transition-all"
                >
                  {salon.services.length > 0 ? (
                    salon.services.map((svc) => (
                      <option key={svc.id} value={svc.name}>
                        {svc.name} — ₹{svc.price} ({formatDuration(svc.durationMinutes)})
                      </option>
                    ))
                  ) : (
                    <option value="Haircut & Styling">Haircut & Styling</option>
                  )}
                </select>
              </div>

              <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-2xl p-3 text-xs text-stone-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#C85322] shrink-0 mt-0.5" />
                <p>
                  Zero payment required now. Pay standard salon rates at the counter when your grooming is complete.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinQueueModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-stone-600 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining}
                  className="px-5 py-2.5 rounded-full bg-[#1E130D] hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isJoining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Issuing Token...</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>{bookingFor === 'other' ? `Take Pass for ${joinName.trim() || 'Guest'}` : 'Claim Walk-In Pass'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUEUE UPDATE MODAL (With 3-meter GPS Verification) */}
      {showCrowdModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-stone-100 text-[#C85322] flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#241810]">Submit Live Queue Report</h3>
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

            {/* GPS Status */}
            <div className="mt-4">
              {isCheckingLocation ? (
                <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-[#C85322] animate-spin" />
                  <span className="text-xs font-semibold text-stone-700">Verifying GPS on-site presence...</span>
                </div>
              ) : currentDistanceMeters !== null && currentDistanceMeters <= 3 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Location Verified on Site</div>
                    <div className="text-[11px] text-emerald-700">
                      Your update will be published immediately with a verified badge.
                    </div>
                  </div>
                </div>
              ) : currentDistanceMeters !== null ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col gap-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-900">
                        Distance from salon: {currentDistanceMeters >= 1000 ? `${(currentDistanceMeters / 1000).toFixed(1)} km` : `${Math.round(currentDistanceMeters)} meters`}
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        Crowd updates can only be submitted when physically within 3 meters of the studio.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCrowdModal}
                    className="self-start text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                  >
                    Re-check Location
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <span className="text-xs text-stone-600">Location permission required to verify on-site presence.</span>
                  <button
                    type="button"
                    onClick={handleOpenCrowdModal}
                    className="px-3 py-1.5 rounded-full bg-[#1E130D] text-white text-xs font-bold cursor-pointer"
                  >
                    Enable GPS
                  </button>
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  How many guests are currently waiting?
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setCrowdPeopleCount(cnt)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        crowdPeopleCount === cnt
                          ? 'bg-[#1E130D] text-white border-[#1E130D]'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {cnt === 0 ? '0' : cnt >= 6 ? '6+' : String(cnt)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Observed Wait Time
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
                          ? 'bg-[#C85322] text-white border-[#C85322]'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Active Barbers Working (Optional)
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
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Brief Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2 chairs open, line moving quickly"
                  value={crowdNotes}
                  onChange={(e) => setCrowdNotes(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#C85322] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8E0D5] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCrowdModal(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-stone-600 hover:text-stone-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCrowdSubmit}
                disabled={isSubmittingCrowd || isCheckingLocation}
                className="px-5 py-2.5 rounded-full bg-[#1E130D] hover:bg-stone-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmittingCrowd ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Publish Update</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proximity Location Required Alert */}
      {showLocationRequiredPopup && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-[#C85322]">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#241810]">
              Must Be Physically Present
            </h3>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              To guarantee 100% verified wait times for other customers, queue updates require you to be within 3 meters of {salon.name}.
            </p>
            <button
              type="button"
              onClick={() => setShowLocationRequiredPopup(false)}
              className="mt-5 w-full rounded-full bg-[#1E130D] px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-stone-800 cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}
      {/* 8. INTERACTIVE FORTUNE WHEEL & OFFERS MODAL */}
      <SalonOffersModal
        salon={salon}
        isOpen={showOffersModal}
        onClose={() => setShowOffersModal(false)}
      />
    </div>
  );
};
