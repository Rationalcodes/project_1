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
  Map as MapIcon
} from 'lucide-react';
import QRCode from 'qrcode';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness, getTargetSalonFromUrl } from '../../context/CustomerContext';
import { Service, Staff } from '@kumbhakaran/shared-types';
import { redirectToGoogleMaps, openGoogleMapsLocation, SalonMapboxView } from '@kumbhakaran/ui';
import { SmartQueueAssist } from './SmartQueueAssist';

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

  // Sub-page tab state (Page-in-Page architecture)
  const [activeTab, setActiveTab] = useState<SalonSubPageTab>('queue');

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
        color: { dark: '#24140A', light: '#FFFFFF' },
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

  const navTabs: { id: SalonSubPageTab; label: string; icon: string; count?: number | string }[] = [
    { id: 'queue', label: 'Live Queue', icon: '⚡', count: salon.currentQueue },
    { id: 'services', label: 'Menu & Rates', icon: '✂️', count: salon.services.length },
    { id: 'stylists', label: 'Master Stylists', icon: '💈', count: salon.staff.length },
    { id: 'gallery', label: 'Lookbook', icon: '📸', count: galleryItems.length },
    { id: 'reviews', label: 'Reviews', icon: '⭐', count: `${salon.rating}★` },
    { id: 'location', label: 'Studio & Hours', icon: '📍' },
  ];

  return (
    <div className="space-y-4 pb-28 text-stone-900 max-w-5xl mx-auto">
      {/* 1. TOP HEADER BAR: Back + Quick Salon Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-[var(--border-subtle,#E7DED5)] text-xs font-extrabold text-stone-800 hover:border-[#FF6422] hover:text-[#FF6422] transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF6422]" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Quick Instagram link button */}
          {(salon.instagramUrl || salon.instagramHandle) && (
            <a
              href={
                salon.instagramUrl?.startsWith('http')
                  ? salon.instagramUrl
                  : `https://instagram.com/${(salon.instagramHandle || salon.instagramUrl || '').replace(/^@/, '')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-2xl bg-white border border-[var(--border-subtle,#E7DED5)] text-stone-700 hover:text-pink-600 shadow-2xs transition-colors cursor-pointer"
              title={`Visit ${salon.name} on Instagram`}
            >
              <InstagramGradientIcon className="w-4 h-4" />
            </a>
          )}

          {/* Quick Call Salon Button (Masked with Native Dialer) */}
          {salon.phone && (
            <a
              href={`tel:${salon.phone}`}
              className="p-2.5 rounded-2xl bg-white border border-[var(--border-subtle,#E7DED5)] text-emerald-700 hover:bg-emerald-50 shadow-2xs transition-colors cursor-pointer"
              title={`Call ${salon.name}`}
            >
              <PhoneCall className="w-4 h-4" />
            </a>
          )}

          {/* Compare Salon */}
          <button
            type="button"
            onClick={() => toggleCompareSalon(salon.id)}
            className={`p-2.5 rounded-2xl border transition-colors shadow-2xs cursor-pointer ${
              comparisonList.includes(salon.id)
                ? 'bg-[#FF6422] text-white border-[#FF6422]'
                : 'bg-white border-[var(--border-subtle,#E7DED5)] text-stone-600 hover:text-stone-900'
            }`}
            title="Compare Salon"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 rounded-2xl bg-white border border-[var(--border-subtle,#E7DED5)] text-stone-600 hover:text-stone-900 shadow-2xs transition-colors cursor-pointer"
            title="Share Salon"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Favourites */}
          <button
            type="button"
            onClick={() => toggleFavorite(salon.id)}
            className="p-2.5 rounded-2xl bg-white border border-[var(--border-subtle,#E7DED5)] text-stone-500 hover:text-rose-500 shadow-2xs transition-colors cursor-pointer"
            title="Save to Favourites"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SALON HERO STOREFRONT IDENTITY CARD */}
      <div className="rounded-3xl overflow-hidden border border-[var(--border-subtle,#E7DED5)] bg-white shadow-sm transition-all">
        {/* Cover Media Header */}
        <div className="h-56 sm:h-72 w-full relative overflow-hidden group">
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
            <div className={`w-full h-full ${isWomen ? 'bg-gradient-to-br from-[#351329] via-[#54203F] to-[#351329]' : 'bg-gradient-to-br from-[#24140A] via-[#381E10] to-[#24140A]'} flex flex-col items-center justify-center text-white p-6 text-center`}>
              <Store className="w-12 h-12 text-[#FF6422] mb-2" />
              <div className="text-xl font-black">{salon.name}</div>
              <div className="text-xs text-amber-200/80 mt-1">{salon.locality}, {salon.city}</div>
            </div>
          )}

          {/* Warm Dark Espresso Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 pointer-events-none" />

          {/* Top Overlaid Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {salon.isVerified && (
                <span className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[#FF6422] font-black text-[11px] border border-orange-200 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6422]" /> Verified Studio
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black backdrop-blur-md shadow-xs ${
                salon.isOpen ? 'bg-white/95 text-emerald-800 border border-emerald-200' : 'bg-white/95 text-rose-800 border border-rose-200'
              }`}>
                {salon.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            {/* Video / Still Poster Toggle */}
            {salon.loopVideoUrl && (
              <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md border border-[var(--border-subtle,#E7DED5)] p-1 rounded-full shadow-md">
                <button
                  type="button"
                  onClick={() => setShowVideoInHero(!showVideoInHero)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 ${
                    showVideoInHero ? 'bg-[#FF6422] text-white shadow-xs' : 'text-stone-700 hover:text-stone-900'
                  }`}
                  title="Toggle loop video"
                >
                  <Film className="w-3 h-3" />
                  <span>{showVideoInHero ? 'Video' : 'Photo'}</span>
                </button>
                {showVideoInHero && (
                  <button
                    type="button"
                    onClick={() => setIsLoopVideoMuted(!isLoopVideoMuted)}
                    className="p-1 rounded-full text-stone-600 hover:text-stone-900 transition-colors"
                    title={isLoopVideoMuted ? 'Unmute' : 'Mute'}
                  >
                    {isLoopVideoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#FF6422]" />}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Overlaid Quick Wait & Queue Badge */}
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white z-10 pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 shadow-xs">
                <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
                <span>{salon.currentQueue} waiting</span>
                <span className="text-amber-300 font-semibold">· ~{waitTime}m wait</span>
              </span>
            </div>

            {(!salon.loopVideoUrl || !showVideoInHero) && salon.images.length > 1 && (
              <div className="flex gap-1 pointer-events-auto">
                {salon.images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      activeGalleryIndex === idx ? 'w-5 bg-[#FF6422]' : 'w-1.5 bg-white/60'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Studio Info Row */}
        <div className="p-4 sm:p-5 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {salon.name}
                </h1>
                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                  {salon.locality}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-xl">
                {salon.tagline || `${salon.address} · Professional Grooming & Hair Care Studio`}
              </p>
            </div>

            {/* Quick Status Pill & Direct Directions CTA */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl text-amber-900 font-extrabold text-sm shadow-2xs">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{salon.rating}</span>
                <span className="text-stone-500 text-xs font-normal">({salon.reviewCount})</span>
              </div>

              {salon.isOpen && salon.queueStatus !== 'paused' && !activeTicket && (
                <button
                  type="button"
                  onClick={() => setShowJoinQueueModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-[#FF6422] to-orange-600 text-white font-extrabold text-xs shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 transition-all cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Get in line</span>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-all shadow-2xs text-xs cursor-pointer"
                title="Directions in Google Maps"
              >
                <Navigation className="w-3.5 h-3.5 fill-white" />
                <span>Directions ↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. UNIFIED PAGE-IN-PAGE NAVIGATION TABS (Professional Salon Storefront) */}
      <div className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md pt-1 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-white border border-[var(--border-subtle,#E7DED5)] rounded-2xl shadow-xs">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#FF6422] text-white shadow-sm shadow-orange-500/25 scale-[1.02]'
                    : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
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

      {/* 4. PAGE-IN-PAGE CONTENT PANELS (No Stacking, Zero Cluttered Endless Scrolling) */}
      <div className="animate-in fade-in duration-200">
        {/* SUBPAGE 1: LIVE QUEUE & WALK-IN DESK */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {/* Live Queue Status Hero Box */}
            <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-3xl p-5 shadow-xs relative overflow-hidden space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle,#E7DED5)]">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${queueInfo.dotClass} animate-pulse`} />
                  <span className="text-xs font-black uppercase tracking-wider text-[#FF6422]">
                    Front-Desk Live Queue
                  </span>
                  <span className="text-[11px] text-stone-500">· {freshness.text}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-600 font-bold">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Est. Wait Time: ~{waitTime} mins</span>
                </div>
              </div>

              {/* 3 Metric Counters */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[var(--border-subtle,#E7DED5)]">
                  <div className="text-2xl sm:text-3xl font-black text-stone-900">{salon.currentQueue}</div>
                  <div className="text-[11px] font-bold text-stone-500 uppercase mt-0.5">Waiting in Line</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-200">
                  <div className="text-2xl sm:text-3xl font-black text-[#FF6422]">~{waitTime}m</div>
                  <div className="text-[11px] font-bold text-[#FF6422] uppercase mt-0.5">Est. Wait</div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[var(--border-subtle,#E7DED5)]">
                  <div className="text-2xl sm:text-3xl font-black text-stone-900">{salon.activeBarbers || 2}</div>
                  <div className="text-[11px] font-bold text-stone-500 uppercase mt-0.5">Chairs Active</div>
                </div>
              </div>

              {/* Active Ticket Banner if User is in Queue */}
              {activeTicket && (activeTicket.salonId === salon.id || !activeTicket.salonId) ? (
                <div className="pt-2">
                  <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-500/10 rounded-2xl p-4 border border-amber-300">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                          Your Active Walk-In Token
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {activeTicket.status === 'in_service' ? 'At Chair · In Service' : 'Waiting in Queue'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-3xl font-black text-stone-900 tracking-tight flex items-baseline gap-1">
                          <span className="text-[#FF6422]">#</span>
                          <span>{(activeTicket.ticketNumber || String(activeTicket.position || '')).replace(/^#+/, '')}</span>
                        </div>
                        <p className="text-xs text-stone-700 font-semibold mt-0.5">
                          {activeTicket.customerName} · {activeTicket.serviceName || 'Haircut & Styling'}
                        </p>
                        <p className="text-[11px] text-emerald-800 font-medium mt-1">
                          {activeTicket.status === 'in_service'
                            ? '✨ You are at the chair right now! Enjoy your session.'
                            : `About ~${waitTime} mins remaining — head over comfortably.`}
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
                          className="text-xs text-amber-900 bg-white border border-amber-300 hover:bg-amber-50 font-bold px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                        >
                          🔄 Move to back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Leave the queue and give up your ticket?')) {
                              leaveLiveQueue(salon.id, activeTicket.id);
                            }
                          }}
                          className="text-xs text-stone-500 hover:text-rose-600 font-bold px-2.5 py-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          Leave
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
                    className="w-full sm:w-auto flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-[#FF6422] to-orange-600 text-white font-extrabold text-sm shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Get in line from your phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenCrowdModal}
                    className="text-xs font-bold text-stone-700 hover:text-[#FF6422] px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-[var(--border-subtle,#E7DED5)] hover:bg-orange-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-stone-500" />
                    <span>Are you here? Share wait update</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-2xl text-center text-xs text-stone-500 font-semibold">
                  Queue is currently paused or studio is closed.
                </div>
              )}
            </div>

            {/* Other Tickets Booked (Friends / Family) */}
            {otherTickets.filter((t) => t.salonId === salon.id || !t.salonId).length > 0 && (
              <div className="bg-white border border-amber-300 rounded-3xl p-4 shadow-xs space-y-2">
                <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-700" />
                  <span>Tokens booked for family & friends ({otherTickets.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {otherTickets.map((t) => (
                    <div
                      key={t.id}
                      className="text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-2"
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

            {/* Verified Community Wait Time Report */}
            {latestCrowdReport && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="font-extrabold text-emerald-950">
                      Verified On-Location Update: {latestCrowdReport.peopleCount} waiting ({latestCrowdReport.estimatedWaitMinutes}m wait)
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      Reported by a customer physically present at {salon.name}.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCrowdModal}
                  className="text-xs font-bold text-emerald-900 underline hover:text-emerald-950 cursor-pointer shrink-0"
                >
                  Update
                </button>
              </div>
            )}

            {/* Quick Walk-In How-It-Works Card */}
            <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-3xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-500">
                How SLOON Live Walk-In Works
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[var(--border-subtle,#E7DED5)] space-y-1">
                  <div className="font-black text-[#FF6422]">1. Take Token</div>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    Hold your chair spot from home or commute. Zero advance payment.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[var(--border-subtle,#E7DED5)] space-y-1">
                  <div className="font-black text-[#FF6422]">2. Track in Real-Time</div>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    Watch the counter move live so you only arrive when your turn is close.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[var(--border-subtle,#E7DED5)] space-y-1">
                  <div className="font-black text-[#FF6422]">3. Step In & Pay Direct</div>
                  <p className="text-stone-600 leading-relaxed text-[11px]">
                    Sit right at the chair. Pay regular salon counter rates by cash or UPI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBPAGE 2: SERVICES MENU & RATES */}
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
                      ? 'bg-[#FF6422] text-white border-[#FF6422] shadow-xs'
                      : 'bg-white border-[var(--border-subtle,#E7DED5)] text-stone-700 hover:border-orange-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Service Catalogue Grid */}
            <div className="space-y-2.5">
              {filteredServices.length === 0 ? (
                <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-2xl p-8 text-center text-xs text-stone-500 shadow-xs">
                  No services listed in this category.
                </div>
              ) : (
                filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-300 transition-colors shadow-xs group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-extrabold text-stone-900 group-hover:text-[#FF6422] transition-colors">
                          {service.name}
                        </h3>
                        {service.popular && (
                          <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-orange-50 text-[#FF6422] border border-orange-200">
                            Popular
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.2 rounded-full">
                          {service.category}
                        </span>
                      </div>

                      {service.description && (
                        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-stone-400" /> ~{service.durationMinutes} mins
                        </span>
                        <span>•</span>
                        <span>Pay at salon counter</span>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                      <div className="text-base sm:text-lg font-black text-[#FF6422]">
                        ₹{service.price}
                      </div>

                      {salon.isOpen && salon.queueStatus !== 'paused' && (
                        <button
                          type="button"
                          onClick={() => {
                            setJoinService(service.name);
                            setShowJoinQueueModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-[#FF6422] text-[#FF6422] hover:text-white border border-orange-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <Ticket className="w-3 h-3" />
                          <span>Select & Join Queue</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-2xl text-xs text-stone-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF6422] shrink-0" />
              <span>Standard salon pricing. Zero platform markup or hidden booking fees.</span>
            </div>
          </div>
        )}

        {/* SUBPAGE 3: MASTER BARBERS & STYLISTS */}
        {activeTab === 'stylists' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>Meet the team of grooming artisans at {salon.name}.</span>
              <span className="font-bold">{salon.staff.length} Stylists</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {salon.staff.map((member) => (
                <div
                  key={member.id}
                  className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-2xl p-4 flex items-start gap-3.5 shadow-xs hover:border-orange-300 transition-colors"
                >
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-[var(--border-subtle,#E7DED5)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-extrabold text-stone-900 truncate">{member.name}</h4>
                      <span className="flex items-center gap-0.5 text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded shrink-0">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {member.rating}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 mt-0.5">{member.role} • {member.experience}</p>

                    <div className="mt-2 flex items-center gap-2">
                      {member.status === 'break' ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          ☕ On Break
                        </span>
                      ) : member.status === 'off' ? (
                        <span className="text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-full">
                          ⚪ Off Duty
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          Available
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {member.specialties.map((spec, idx) => (
                        <span key={idx} className="text-[9px] bg-[#FAF7F2] text-stone-700 px-2 py-0.5 rounded border border-[var(--border-subtle,#E7DED5)]">
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

        {/* SUBPAGE 4: LOOKBOOK & STUDIO SPACE */}
        {activeTab === 'gallery' && (
          <div className="space-y-4">
            {/* Gallery Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all' as const, label: `All Media (${galleryItems.length})`, icon: LayoutGrid },
                { id: 'location' as const, label: `Studio Space (${locationPhotos.length})`, icon: MapPin },
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
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                      isSelected
                        ? 'bg-[#FF6422] text-white shadow-sm shadow-orange-500/20'
                        : 'bg-white text-stone-700 hover:border-orange-300 border border-[var(--border-subtle,#E7DED5)]'
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
              <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-2xl p-8 text-center text-xs text-stone-500 shadow-xs">
                No media uploaded in this category.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredGalleryItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setLightboxIndex(galleryItems.findIndex(g => g.id === item.id))}
                    className="group relative h-48 rounded-2xl overflow-hidden border border-[var(--border-subtle,#E7DED5)] bg-stone-100 cursor-pointer shadow-xs hover:border-orange-400 transition-all"
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
                          <div className="w-10 h-10 rounded-full bg-[#FF6422] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
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
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md bg-white/95 text-stone-900 border border-stone-200">
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

            <div className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200 flex items-center gap-2.5 text-xs text-stone-700">
              <Camera className="w-4 h-4 text-[#FF6422] shrink-0" />
              <span>
                Verified studio space & haircuts captured on location at <strong className="text-stone-900">{salon.name}</strong>, {salon.locality}.
              </span>
            </div>
          </div>
        )}

        {/* SUBPAGE 5: VERIFIED REVIEWS & RATINGS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {/* Rating Breakdown Header */}
            <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle,#E7DED5)]">
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
                  type="button"
                  onClick={onOpenReviewModal}
                  className="px-4 py-2.5 rounded-xl bg-[#FF6422] text-white font-extrabold text-xs hover:bg-orange-600 transition-colors flex items-center gap-1.5 shadow-sm shadow-orange-500/25 cursor-pointer"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Rate & Review Salon</span>
                </button>
              </div>

              {/* 5 Rating Criteria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {[
                  { label: 'Haircut Quality', score: salon.ratingBreakdown?.haircutQuality ?? 5 },
                  { label: 'Staff Behaviour', score: salon.ratingBreakdown?.staffBehaviour ?? 5 },
                  { label: 'Cleanliness & Hygiene', score: salon.ratingBreakdown?.cleanliness ?? 5 },
                  { label: 'Pricing & Value', score: salon.ratingBreakdown?.pricing ?? 5 },
                  { label: 'Overall Experience', score: salon.ratingBreakdown?.overallExperience ?? 5 }
                ].map((c) => (
                  <div key={c.label} className="bg-[#FAF7F2] border border-[var(--border-subtle,#E7DED5)] p-2.5 rounded-xl flex items-center justify-between">
                    <span className="text-stone-700 font-semibold">{c.label}</span>
                    <div className="flex items-center gap-2 font-black text-amber-900">
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

            {/* Customer Review List */}
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
                    <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-2xl p-6 text-center space-y-2 shadow-xs">
                      <p className="text-stone-600 text-xs font-semibold">No reviews submitted yet.</p>
                      <p className="text-stone-500 text-[11px]">Be the first to share your experience at {salon.name}!</p>
                    </div>
                  );
                }

                return uniqueReviews.map((rev) => {
                  return (
                    <div key={rev.id} className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-2xl p-4 space-y-2 shadow-xs">
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

                      {rev.ownerReply && (
                        <div className="mt-2 bg-orange-50/50 border-l-2 border-[#FF6422] p-2.5 rounded-r-xl text-xs border border-orange-100">
                          <div className="text-[11px] font-bold text-[#FF6422] mb-0.5">
                            Studio Owner Response • {typeof rev.ownerReply === 'string' ? 'Verified Reply' : rev.ownerReply.date || 'Recent'}
                          </div>
                          <p className="text-stone-700">{typeof rev.ownerReply === 'string' ? rev.ownerReply : rev.ownerReply.comment}</p>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* SUBPAGE 6: STUDIO LOCATION & HOURS */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            {/* Interactive Embedded Map View */}
            <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-3xl p-4 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#FF6422]" />
                  <div>
                    <h3 className="text-sm font-black text-stone-900">{salon.name} Pinned Location</h3>
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
                    className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <MapIcon className="w-3.5 h-3.5 text-[#FF6422]" />
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
                    className="px-3.5 py-1.5 rounded-xl bg-[#FF6422] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 hover:bg-orange-600 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-white" />
                    <span>Navigate ↗</span>
                  </button>
                </div>
              </div>

              {/* Embedded Map Canvas */}
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-[var(--border-subtle,#E7DED5)] relative shadow-inner">
                <SalonMapboxView
                  salon={salon}
                  userLocation={userLocation}
                  height="100%"
                  className="w-full h-full"
                />
              </div>

              {/* Quick Contact & Directions Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle,#E7DED5)]">
                <div className="flex items-center gap-2 flex-wrap">
                  {salon.phone && (
                    <a
                      href={`tel:${salon.phone}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[var(--border-subtle,#E7DED5)] text-stone-800 hover:border-emerald-500 text-xs font-bold shadow-2xs transition-all"
                      title="Call salon directly"
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
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[var(--border-subtle,#E7DED5)] text-stone-800 hover:text-pink-600 text-xs font-bold shadow-2xs transition-all"
                    >
                      <InstagramGradientIcon className="w-4 h-4" />
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3 text-stone-400" />
                    </a>
                  )}
                </div>

                <div className="text-xs text-stone-500 font-medium">
                  Lat: {Number(salon.coordinates.lat).toFixed(4)} · Lng: {Number(salon.coordinates.lng).toFixed(4)}
                </div>
              </div>
            </div>

            {/* Operating Hours Table */}
            <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle,#E7DED5)]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6422]" />
                  <h3 className="text-sm font-extrabold text-stone-900">Studio Operating Hours</h3>
                </div>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  salon.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {salon.isOpen ? 'Currently Open' : 'Currently Closed'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { day: 'Monday', hours: '09:00 AM - 09:30 PM', open: true },
                  { day: 'Tuesday', hours: '09:00 AM - 09:30 PM', open: true },
                  { day: 'Wednesday', hours: '09:00 AM - 09:30 PM', open: true },
                  { day: 'Thursday', hours: '09:00 AM - 09:30 PM', open: true },
                  { day: 'Friday', hours: '09:00 AM - 10:00 PM', open: true },
                  { day: 'Saturday', hours: '08:30 AM - 10:00 PM', open: true },
                  { day: 'Sunday', hours: '08:30 AM - 10:00 PM', open: true },
                ].map((item) => (
                  <div key={item.day} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2] border border-[var(--border-subtle,#E7DED5)]">
                    <span className="font-bold text-stone-800">{item.day}</span>
                    <span className="text-stone-600 font-mono">{item.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Studio Amenities */}
            <div className="bg-white border border-[var(--border-subtle,#E7DED5)] rounded-3xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-stone-900">Studio Amenities & Facilities</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  '❄️ Fully Air-Conditioned',
                  '📶 Free High-Speed WiFi',
                  '🛋️ Comfortable Waiting Lounge',
                  '💳 UPI & Card Accepted',
                  '🧼 Sanitized Fresh Tools & Towels',
                  '🚗 Dedicated Customer Parking',
                  '☕ Complimentary Refreshments'
                ].map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[var(--border-subtle,#E7DED5)] text-stone-800 font-semibold"
                  >
                    {amenity}
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
                className="p-1.5 rounded-full bg-zinc-800/90 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all cursor-pointer"
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

          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 no-scrollbar border-t border-zinc-800/80">
            {galleryItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
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
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle,#E7DED5)]">
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

            {/* Booking Target: Self or Someone Else */}
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

            {/* Active Ticket Rejoin Warning */}
            {bookingFor === 'self' && activeTicket && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5 mt-3">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>You already hold Token #{(activeTicket.ticketNumber || String(activeTicket.position || '')).replace(/^#+/, '')}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  You can only hold one active token for yourself. Rejoining will give up your current position and place you at the <strong>current back of the line (Position #{salon.currentQueue + 1})</strong>.
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

            <form onSubmit={handleJoinQueueSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {bookingFor === 'other' ? "Person's Full Name" : 'Your Full Name'} <span className="text-[#FF6422]">*</span>
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
                  {bookingFor === 'other' ? 'Their Mobile Number (Optional)' : 'Mobile Number (So front-desk can notify your turn)'}
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
                  Your ticket position is assigned immediately. No upfront fee — pay at the counter when your grooming is complete.
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
                      : 'bg-[#FF6422] hover:bg-orange-600 shadow-orange-500/25'
                  } text-white font-extrabold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50`}
                >
                  {isJoining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Joining...</span>
                    </>
                  ) : bookingFor === 'self' && activeTicket ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Move to back of line</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>{bookingFor === 'other' ? `Take Token for ${joinName.trim() || 'Guest'}` : 'Get my walk-in token'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUEUE UPDATE MODAL (With 3-meter Location Verification) */}
      {showCrowdModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle,#E7DED5)]">
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

            {/* Location Proximity Status Box */}
            <div className="mt-4">
              {isCheckingLocation ? (
                <div className="p-3.5 rounded-2xl bg-stone-100 border border-stone-200 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-[#FF6422] animate-spin" />
                  <span className="text-xs font-semibold text-stone-700">Checking your location...</span>
                </div>
              ) : currentDistanceMeters !== null && currentDistanceMeters <= 3 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-900">You’re near {salon.name}</div>
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

            {/* Questions */}
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
                      {cnt === 0 ? '0' : cnt >= 6 ? '6+' : String(cnt)}
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
                          ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
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
                  placeholder="e.g. Queue is moving quickly today"
                  value={crowdNotes}
                  onChange={(e) => setCrowdNotes(e.target.value)}
                  maxLength={100}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#FF6422] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--border-subtle,#E7DED5)] flex items-center justify-end gap-2.5">
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
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Share update</span>
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
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-2xl">
              📍
            </div>
            <h3 className="text-base font-black text-stone-900">
              You need to be at the salon
            </h3>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed">
              To keep queue updates accurate for everyone, you can only share or verify live wait updates when you are within 3 meters of {salon.name}.
            </p>
            <button
              type="button"
              onClick={() => setShowLocationRequiredPopup(false)}
              className="mt-5 w-full rounded-xl bg-[#FF6422] px-4 py-2.5 text-xs font-extrabold text-white transition-colors hover:bg-orange-600 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
