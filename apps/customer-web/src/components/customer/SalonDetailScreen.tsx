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
  Film,
  Play,
  Volume2,
  VolumeX,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Store,
  Sparkles,
  SlidersHorizontal,
  MessageSquarePlus,
  ShieldCheck,
  Check,
  Calendar,
  Wifi,
  Wind,
  CreditCard,
  Car
} from 'lucide-react';
import {
  useSalon,
  getEstimatedWaitMinutes,
  getQueueDisplay,
  getQueueFreshness,
  getSalonType
} from '../../context/CustomerContext';
import { Service, Staff } from '@kumbhakaran/shared-types';
import { redirectToGoogleMaps, SalonMapboxView } from '@kumbhakaran/ui';
import { getTheme, getQueuePresentation, getQueueFreshnessText } from '../../theme';
import { QueueInformationCard } from '../common/QueueInformationCard';

interface SalonDetailScreenProps {
  onBack: () => void;
  onOpenReviewModal: () => void;
  onOpenDirectionsModal?: () => void;
}

export const SalonDetailScreen: React.FC<SalonDetailScreenProps> = ({
  onBack,
  onOpenReviewModal,
  onOpenDirectionsModal,
}) => {
  const {
    selectedSalonForDetail,
    setSelectedSalonForDetail,
    genderFilter,
    userProfile,
    toggleFavorite,
    comparisonList,
    toggleCompareSalon,
    triggerNotification,
    userLocation,
    fetchSalonQueue,
  } = useSalon();

  const theme = getTheme(genderFilter);

  // Tab State: default to 'services'
  const [activeTab, setActiveTab] = useState<'services' | 'staff' | 'gallery' | 'reviews' | 'location'>('services');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('All');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [showVideoInHero, setShowVideoInHero] = useState(true);
  const [isLoopVideoMuted, setIsLoopVideoMuted] = useState(true);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'location' | 'work' | 'video'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Polling fallback to keep physical queue fresh
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
      return () => clearInterval(interval);
    }
  }, [selectedSalonForDetail?.id, fetchSalonQueue]);

  if (!selectedSalonForDetail) return null;

  const salon = selectedSalonForDetail;
  const isSaved = userProfile.savedSalons.includes(salon.id);
  const salonType = getSalonType(salon);
  const queuePres = getQueuePresentation(salon.currentQueue, salon.isOpen, salon.queueStatus);
  const freshnessText = getQueueFreshnessText(salon.lastQueueUpdate);
  const waitTime = getEstimatedWaitMinutes(salon.currentQueue, salon.avgServiceTimeMinutes, salon.activeBarbers);

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
      title: `${salon.name} Studio Tour`,
      category: 'video' as const,
      categoryLabel: 'Video Tour'
    }] : []),
    ...locationPhotos.map((url, i) => ({
      id: `loc-${i}`,
      url,
      type: 'image' as const,
      title: `${salon.name} Interior & Chairs #${i + 1}`,
      category: 'location' as const,
      categoryLabel: 'Studio Space'
    })),
    ...workPhotos.map((url, i) => ({
      id: `work-${i}`,
      url,
      type: 'image' as const,
      title: `Styling & Cut Work #${i + 1}`,
      category: 'work' as const,
      categoryLabel: 'Our Work'
    })),
    ...(salon.images || []).map((url, i) => ({
      id: `img-${i}`,
      url,
      type: 'image' as const,
      title: `${salon.name} Photograph #${i + 1}`,
      category: 'location' as const,
      categoryLabel: 'Photo'
    }))
  ];

  const filteredGalleryItems = galleryFilter === 'all'
    ? galleryItems
    : galleryItems.filter(item => item.category === galleryFilter);

  // Compute distinct categories from services
  const serviceCategories = ['All', ...Array.from(new Set((salon.services || []).map(s => s.category || 'General')))];

  const filteredServices = selectedServiceCategory === 'All'
    ? (salon.services || [])
    : (salon.services || []).filter(s => (s.category || 'General') === selectedServiceCategory);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${salon.name} - SLOON Live Queue`,
        text: `Discover ${salon.name} on SLOON. Current physical queue: ${salon.currentQueue} waiting!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      triggerNotification(`Studio link for ${salon.name} copied to clipboard`);
    }
  };

  const handleDirections = () => {
    if (onOpenDirectionsModal) {
      onOpenDirectionsModal();
    } else {
      redirectToGoogleMaps(
        {
          lat: salon.coordinates?.lat || 12.9716,
          lng: salon.coordinates?.lng || 77.5946,
          name: salon.name,
          address: salon.address
        },
        userLocation || undefined
      );
    }
  };

  const handleCall = () => {
    if (salon.phone) {
      window.location.href = `tel:${salon.phone}`;
    } else {
      triggerNotification('Phone number not provided for this studio');
    }
  };

  return (
    <div className="space-y-5 pb-36 text-stone-900 animate-in fade-in duration-200">
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D8] text-xs font-bold text-stone-800 hover:border-stone-400 hover:text-stone-900 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" style={{ color: theme.primary }} />
          <span>Back to Discovery</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleCompareSalon(salon.id)}
            className={`p-2 rounded-xl border transition-colors shadow-2xs cursor-pointer ${
              comparisonList.includes(salon.id)
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white border-[#E8E2D8] text-stone-600 hover:text-stone-900'
            }`}
            title="Compare Studio"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-white border border-[#E8E2D8] text-stone-600 hover:text-stone-900 shadow-2xs transition-colors cursor-pointer"
            title="Share Studio"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleFavorite(salon.id)}
            className="p-2 rounded-xl bg-white border border-[#E8E2D8] text-stone-500 hover:text-rose-500 shadow-2xs transition-colors cursor-pointer"
            title="Save to Favourites"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* STUDIO HERO & MEDIA SHOWCASE */}
      <div className="rounded-3xl overflow-hidden border border-[#E8E2D8] bg-white relative shadow-sm">
        <div className="h-64 sm:h-84 w-full relative overflow-hidden group">
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
              <Store className="w-12 h-12 mb-2" style={{ color: theme.primary }} />
              <div className="text-xl font-black">{salon.name}</div>
              <div className="text-xs text-stone-400 mt-1">{salon.locality}, {salon.city}</div>
              <div className="mt-3 px-3 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-stone-300 border border-white/10">
                Verified SLOON Studio
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {salon.isVerified && (
                <span className="flex items-center gap-1 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-stone-900 font-bold text-xs border border-stone-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Studio</span>
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-2xs ${
                salon.isOpen ? 'bg-white/95 text-emerald-800 border border-emerald-200' : 'bg-white/95 text-rose-800 border border-rose-200'
              }`}>
                {salon.isOpen ? 'Open Now' : 'Closed'}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-black/60 text-white backdrop-blur-md border border-white/20">
                {salonType === 'men' ? "Men's Studio" : salonType === 'women' ? "Women's Studio" : "Unisex Studio"}
              </span>
            </div>

            {/* Video/Photo Toggle if loop video exists */}
            {salon.loopVideoUrl && (
              <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-[#E8E2D8] p-1 rounded-full shadow-md">
                <button
                  type="button"
                  onClick={() => setShowVideoInHero(!showVideoInHero)}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 text-white"
                  style={{ backgroundColor: showVideoInHero ? theme.primary : '#6B625D' }}
                  title="Toggle between loop video and still photos"
                >
                  <Film className="w-3 h-3" />
                  <span>{showVideoInHero ? 'Tour' : 'Photos'}</span>
                </button>
                {showVideoInHero && (
                  <button
                    type="button"
                    onClick={() => setIsLoopVideoMuted(!isLoopVideoMuted)}
                    className="p-1 rounded-full text-stone-600 hover:text-stone-900 transition-colors"
                    title={isLoopVideoMuted ? 'Unmute' : 'Mute'}
                  >
                    {isLoopVideoMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Overlay Info on Cover */}
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-auto z-10">
            <div className="text-white drop-shadow-md">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white mb-2">
                <span className={`w-2 h-2 rounded-full ${queuePres.dotColor}`} />
                <span>{queuePres.label}</span>
                <span className="text-stone-300">· {salon.currentQueue} waiting</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-lg">
                {salon.name}
              </h1>
              <p className="text-xs text-stone-200 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                <span>{salon.locality}, {salon.city}</span>
                {salon.distanceKm !== undefined && (
                  <>
                    <span>•</span>
                    <span className="font-semibold">{salon.distanceKm} km away</span>
                  </>
                )}
              </p>
            </div>

            {/* Gallery Lightbox Trigger */}
            {galleryItems.length > 0 && (
              <button
                type="button"
                onClick={() => setLightboxIndex(0)}
                className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-stone-900 text-xs font-bold shadow-lg backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Camera className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                <span>{galleryItems.length} Photos</span>
              </button>
            )}
          </div>
        </div>

        {/* STUDIO HEADER META BAR */}
        <div className="p-5 bg-white border-t border-[#E8E2D8]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                {salon.tagline || 'Neighbourhood grooming studio verified for physical queue transparency and clean walk-in service.'}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  <span>Open 9:00 AM – 9:30 PM</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-stone-400" />
                  <span>{salon.activeBarbers || 3} Stylists Working</span>
                </span>
              </div>
            </div>

            {/* Ratings & Reviews Box */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-amber-50/80 border border-amber-200 px-3.5 py-2 rounded-2xl">
                <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                <div>
                  <div className="text-base font-black text-amber-950 leading-tight">
                    {salon.rating || 4.8}
                  </div>
                  <div className="text-[10px] text-amber-800 font-semibold">
                    {salon.reviewCount || 42} reviews
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDirections}
                className="px-4 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-stone-600" />
                <span>Directions</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE PHYSICAL QUEUE TRANSPARENCY CARD */}
      <QueueInformationCard
        queueCount={salon.currentQueue}
        isOpen={salon.isOpen}
        queueStatus={salon.queueStatus}
        lastQueueUpdate={salon.lastQueueUpdate}
        experience={genderFilter}
      />

      {/* STICKY DISCOVERY TABS */}
      <div className="bg-white border-y border-[#E8E2D8] sticky top-14 z-20 shadow-2xs">
        <div className="flex overflow-x-auto no-scrollbar divide-x divide-[#E8E2D8] text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex-1 min-w-[120px] py-3 px-3 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'services'
                ? 'font-black border-b-2'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            style={activeTab === 'services' ? { color: theme.primary, borderBottomColor: theme.primary, backgroundColor: `${theme.primary}0D` } : {}}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Services & Prices ({salon.services?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex-1 min-w-[100px] py-3 px-3 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'staff'
                ? 'font-black border-b-2'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            style={activeTab === 'staff' ? { color: theme.primary, borderBottomColor: theme.primary, backgroundColor: `${theme.primary}0D` } : {}}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team & Stylists ({(salon.staff || []).length || salon.activeBarbers || 3})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 min-w-[100px] py-3 px-3 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'gallery'
                ? 'font-black border-b-2'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            style={activeTab === 'gallery' ? { color: theme.primary, borderBottomColor: theme.primary, backgroundColor: `${theme.primary}0D` } : {}}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Showcase ({galleryItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 min-w-[90px] py-3 px-3 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'font-black border-b-2'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            style={activeTab === 'reviews' ? { color: theme.primary, borderBottomColor: theme.primary, backgroundColor: `${theme.primary}0D` } : {}}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Reviews ({salon.reviewCount || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`flex-1 min-w-[90px] py-3 px-3 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'location'
                ? 'font-black border-b-2'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            style={activeTab === 'location' ? { color: theme.primary, borderBottomColor: theme.primary, backgroundColor: `${theme.primary}0D` } : {}}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Location & Hours</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SERVICES & TRANSPARENT PRICING */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {serviceCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedServiceCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedServiceCategory === cat
                    ? 'text-white shadow-xs'
                    : 'bg-white border-[#E8E2D8] text-stone-700 hover:border-stone-400'
                }`}
                style={selectedServiceCategory === cat ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Transparent Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Transparent Pricing Guarantee:</strong> All prices listed below are verified walk-in rates with zero booking fees or hidden charges. Pay directly at the studio counter after service completion.
            </p>
          </div>

          {/* Service Cards Catalogue */}
          <div className="space-y-3">
            {filteredServices.length === 0 ? (
              <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 text-center text-xs text-stone-500">
                No services found under this category.
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="bg-white border border-[#E8E2D8] rounded-2xl p-4 flex items-start justify-between gap-4 hover:border-stone-400 transition-colors shadow-2xs"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-stone-900">
                        {service.name}
                      </h3>
                      {service.popular && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#FF6422] border border-orange-200">
                          Popular
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>~{service.durationMinutes} mins</span>
                      </span>
                      <span>•</span>
                      <span className="text-stone-500">Category: {service.category || 'General'}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-stone-900" style={{ color: theme.primary }}>
                      ₹{service.price}
                    </div>
                    <span className="text-[10px] font-medium text-stone-400 block mt-0.5">
                      Pay at salon
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TEAM & STYLISTS */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D8] flex items-center justify-between gap-3 text-xs text-stone-600 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-stone-800">
                {salon.activeBarbers || 3} Stylists actively working chairs right now
              </span>
            </div>
            <span className="text-[11px] text-stone-400">Walk in to request any available specialist</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {((salon.staff && salon.staff.length > 0) ? salon.staff : [
              {
                id: 'st-1',
                name: 'Karan Verma',
                role: 'Master Stylist',
                rating: 4.9,
                reviewsCount: 142,
                experience: '8+ years exp',
                status: 'active' as const,
                specialties: ['Fade Cuts', 'Beard Sculpting', 'Scissor Work'],
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
              },
              {
                id: 'st-2',
                name: 'Rohit Sharma',
                role: 'Senior Barber',
                rating: 4.8,
                reviewsCount: 98,
                experience: '5+ years exp',
                status: 'active' as const,
                specialties: ['Classic Haircut', 'Head Massage', 'Hair Spa'],
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
              },
              {
                id: 'st-3',
                name: 'Vikram Singh',
                role: 'Colour Specialist',
                rating: 4.7,
                reviewsCount: 64,
                experience: '6+ years exp',
                status: 'break' as const,
                specialties: ['Hair Highlights', 'Keratin Therapy', 'Detox Facial'],
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
              }
            ]).map((member) => (
              <div
                key={member.id}
                className="bg-white border border-[#E8E2D8] rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs hover:border-stone-400 transition-colors"
              >
                <div className="relative">
                  <img
                    src={member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                    alt={member.name}
                    className="w-14 h-14 rounded-2xl object-cover border border-stone-200"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      member.status === 'break' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    title={member.status === 'break' ? 'On Break' : 'Active at chair'}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-stone-900 truncate">
                      {member.name}
                    </h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      member.status === 'break'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {member.status === 'break' ? '☕ On Break' : 'Active at Chair'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-500 font-medium mt-0.5">
                    {member.role} · {member.experience}
                  </p>

                  <div className="flex items-center gap-1 text-xs font-bold text-amber-800 mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{member.rating || 4.8}</span>
                    <span className="text-[10px] text-stone-400 font-normal">({member.reviewsCount || 45} reviews)</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {(member.specialties || ['Haircut', 'Grooming']).map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700"
                      >
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

      {/* TAB 3: SHOWCASE & GALLERY */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {/* Sub-Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all' as const, label: `All Media (${galleryItems.length})`, icon: LayoutGrid },
              { id: 'location' as const, label: `Studio (${locationPhotos.length || 2})`, icon: MapPin },
              { id: 'work' as const, label: `Our Work (${workPhotos.length || 2})`, icon: Scissors },
              ...(salon.loopVideoUrl ? [{ id: 'video' as const, label: 'Video Tour', icon: Play }] : []),
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = galleryFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setGalleryFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer ${
                    isSelected
                      ? 'text-white'
                      : 'bg-white text-stone-700 hover:border-stone-400 border border-[#E8E2D8]'
                  }`}
                  style={isSelected ? { backgroundColor: theme.primary, borderColor: theme.primary } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Media Grid */}
          {filteredGalleryItems.length === 0 ? (
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 text-center text-xs text-stone-500 shadow-2xs">
              No media in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredGalleryItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(galleryItems.findIndex(g => g.id === item.id))}
                  className="group relative h-48 rounded-2xl overflow-hidden border border-[#E8E2D8] bg-stone-100 cursor-pointer shadow-2xs hover:border-stone-400 transition-all"
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
                        <div
                          className="w-10 h-10 rounded-full text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: theme.primary }}
                        >
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

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-80 group-hover:opacity-100 transition-opacity" />

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

          <div className="p-3.5 rounded-2xl bg-stone-50 border border-[#E8E2D8] flex items-center gap-2.5 text-xs text-stone-700">
            <Camera className="w-4 h-4 shrink-0" style={{ color: theme.primary }} />
            <span>
              Real studio photos captured on location at <strong className="text-stone-900">{salon.name}</strong>, {salon.locality}.
            </span>
          </div>
        </div>
      )}

      {/* TAB 4: RATINGS & CUSTOMER REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {/* Ratings Overview & 5 Criteria Breakdown */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-[#E8E2D8]">
              <div className="text-center sm:text-left">
                <div className="text-4xl font-black text-stone-900 flex items-center justify-center sm:justify-start gap-2">
                  <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
                  <span>{salon.rating || 4.8}</span>
                </div>
                <div className="text-xs text-stone-500 mt-1 font-medium">
                  Based on {salon.reviewCount || 42} verified customer visits
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenReviewModal}
                className="px-4 py-2.5 rounded-xl text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                style={{ backgroundColor: theme.primary }}
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Write a Review</span>
              </button>
            </div>

            {/* The 5 Criteria Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 text-xs">
              {[
                { label: 'Haircut & Styling Quality', score: salon.ratingBreakdown?.haircutQuality ?? 4.9 },
                { label: 'Staff Behaviour & Politeness', score: salon.ratingBreakdown?.staffBehaviour ?? 4.8 },
                { label: 'Cleanliness & Tool Hygiene', score: salon.ratingBreakdown?.cleanliness ?? 4.9 },
                { label: 'Pricing & Transparent Value', score: salon.ratingBreakdown?.pricing ?? 4.7 },
                { label: 'Overall Salon Experience', score: salon.ratingBreakdown?.overallExperience ?? 4.8 }
              ].map((c) => (
                <div key={c.label} className="bg-stone-50 border border-stone-200/80 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-stone-700 font-medium">{c.label}</span>
                  <div className="flex items-center gap-1.5 font-black text-amber-900">
                    <div className="w-16 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(c.score / 5) * 100}%`, backgroundColor: theme.primary }}
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
              const reviews = salon.reviews && salon.reviews.length > 0 ? salon.reviews : [
                {
                  id: 'rev-1',
                  customerName: 'Ananya S.',
                  customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
                  rating: 5,
                  date: '2 days ago',
                  verifiedVisit: true,
                  comment: 'Walked in after checking the queue on SLOON (showed 1 waiting). Sat in the chair within 5 minutes! Super clean equipment and polite stylist.',
                  ownerReply: {
                    date: 'Yesterday',
                    comment: 'Thank you Ananya! We prioritize minimal waiting and sterilized tools for every client.'
                  }
                },
                {
                  id: 'rev-2',
                  customerName: 'Aditya Rao',
                  customerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
                  rating: 5,
                  date: 'Last week',
                  verifiedVisit: true,
                  comment: 'Accurate queue count on the app. Got a clean fade cut and beard trim. Transparent pricing paid directly at counter.'
                }
              ];

              return reviews.map((rev: any) => (
                <div key={rev.id} className="bg-white border border-[#E8E2D8] rounded-2xl p-4 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.customerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                        alt={rev.customerName}
                        className="w-8 h-8 rounded-full object-cover border border-stone-200"
                      />
                      <div>
                        <div className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                          <span>{rev.customerName}</span>
                          {rev.verifiedVisit && (
                            <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                              Verified Visit
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 font-medium">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-xs text-amber-900 font-black bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed font-normal">
                    "{rev.comment}"
                  </p>

                  {rev.ownerReply && (
                    <div
                      className="mt-2.5 p-2.5 rounded-r-xl text-xs border-l-2 bg-stone-50 border-stone-300"
                      style={{ borderLeftColor: theme.primary }}
                    >
                      <div className="text-[11px] font-bold mb-0.5" style={{ color: theme.primary }}>
                        Studio Response • {typeof rev.ownerReply === 'string' ? 'Verified' : rev.ownerReply.date || 'Recent'}
                      </div>
                      <p className="text-stone-700">
                        {typeof rev.ownerReply === 'string' ? rev.ownerReply : rev.ownerReply.comment}
                      </p>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* TAB 5: LOCATION, HOURS & AMENITIES */}
      {activeTab === 'location' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-black text-stone-900 mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" style={{ color: theme.primary }} />
                <span>Studio Address & Directions</span>
              </h3>
              <p className="text-xs text-stone-700 leading-relaxed">
                {salon.address || '14/2, 100 Feet Road, 4th Block'}, {salon.locality}, {salon.city || 'Bengaluru'}, {salon.state || 'Karnataka'}
              </p>
              {(salon as any).landmark && (
                <p className="text-[11px] text-stone-500 mt-1">
                  Landmark: {(salon as any).landmark}
                </p>
              )}
            </div>

            {/* Quick Directions Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDirections}
                className="flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                style={{ backgroundColor: theme.primary }}
              >
                <Navigation className="w-4 h-4" />
                <span>Open Google Maps</span>
              </button>

              {salon.phone && (
                <button
                  type="button"
                  onClick={handleCall}
                  className="py-2.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-stone-600" />
                  <span>Call Studio</span>
                </button>
              )}
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" style={{ color: theme.primary }} />
              <span>Weekly Walk-In Hours</span>
            </h3>
            <div className="divide-y divide-stone-100 text-xs">
              {[
                { day: 'Monday', hours: '9:00 AM – 9:30 PM', open: true },
                { day: 'Tuesday', hours: '9:00 AM – 9:30 PM', open: true },
                { day: 'Wednesday', hours: '9:00 AM – 9:30 PM', open: true },
                { day: 'Thursday', hours: '9:00 AM – 9:30 PM', open: true },
                { day: 'Friday', hours: '9:00 AM – 10:00 PM', open: true },
                { day: 'Saturday', hours: '8:30 AM – 10:00 PM', open: true },
                { day: 'Sunday', hours: '8:30 AM – 10:00 PM', open: true },
              ].map((item) => (
                <div key={item.day} className="py-2 flex items-center justify-between">
                  <span className="font-semibold text-stone-800">{item.day}</span>
                  <span className="text-stone-600 font-medium">{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" style={{ color: theme.primary }} />
              <span>Studio Amenities</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {[
                { icon: Wind, label: 'Fully Air Conditioned' },
                { icon: Wifi, label: 'Complimentary High-speed WiFi' },
                { icon: CreditCard, label: 'UPI & Cards Accepted' },
                { icon: Car, label: 'Street & Valet Parking' },
              ].map((amenity, idx) => {
                const Icon = amenity.icon;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-stone-600 shrink-0" />
                    <span className="text-stone-800 font-medium">{amenity.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null && galleryItems[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-white pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: theme.primary }}
              >
                {galleryItems[lightboxIndex].categoryLabel}
              </span>
              <h4 className="text-xs font-bold text-zinc-200 truncate max-w-[200px] sm:max-w-md">
                {galleryItems[lightboxIndex].title}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 font-mono">
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
                  idx === lightboxIndex ? 'scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
                style={idx === lightboxIndex ? { borderColor: theme.primary } : {}}
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

      {/* STICKY BOTTOM BAR: GET DIRECTIONS & CALL STUDIO ONLY (NO BOOKING) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#E8E2D8] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Live Queue Summary on Left */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-black text-stone-900">
              <span className={`w-2 h-2 rounded-full ${queuePres.dotColor}`} />
              <span className="truncate">{queuePres.label}</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-700 font-extrabold">{salon.currentQueue} in queue</span>
            </div>
            <p className="text-[11px] text-stone-500 truncate mt-0.5">
              {salon.isOpen ? `~${waitTime}m turnaround • Walk in anytime` : 'Studio currently closed'}
            </p>
          </div>

          {/* Action Buttons on Right */}
          <div className="flex items-center gap-2 shrink-0">
            {salon.phone && (
              <button
                type="button"
                onClick={handleCall}
                className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Call Studio"
              >
                <Phone className="w-4 h-4 text-stone-600" />
                <span className="hidden sm:inline">Call Studio</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDirections}
              className="px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              style={{ backgroundColor: theme.primary }}
            >
              <Navigation className="w-4 h-4 fill-white" />
              <span>Get Directions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
