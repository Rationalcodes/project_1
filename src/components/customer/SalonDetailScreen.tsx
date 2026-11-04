import React, { useState } from 'react';
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
  Sparkles,
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
  ChevronLeft
} from 'lucide-react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/SalonContext';
import { Service, Staff } from '../../types';
import { SalonMapboxView } from '@kumbhakaran/ui';

interface SalonDetailScreenProps {
  onBack: () => void;
  onOpenReviewModal: () => void;
  onOpenDirectionsModal: () => void;
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
    triggerNotification
  } = useSalon();

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
    ? salon.locationImages
    : [
        salon.posterImage || salon.coverImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&w=1200&q=80'
      ];

  const workPhotos = (salon.workImages && salon.workImages.length > 0)
    ? salon.workImages
    : [
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517832606589-7629c339590a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80'
      ];

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
        title: `${salon.name} - Kumbhakaran Live Queue`,
        text: `Check out live queue at ${salon.name}: ${salon.currentQueue} people waiting right now!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      triggerNotification(`Share link for ${salon.name} copied to clipboard`);
    }
  };

  return (
    <div className="space-y-5 pb-32 text-slate-100">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleCompareSalon(salon.id)}
            className={`p-2 rounded-xl border transition-colors ${
              comparisonList.includes(salon.id)
                ? 'bg-amber-400 text-black border-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Compare Salon"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => toggleFavorite(salon.id)}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
            title="Save to Favourites"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Cover Image Carousel, Poster & Loop Video Showcase */}
      <div className="rounded-3xl overflow-hidden border border-zinc-800/80 bg-zinc-950 relative shadow-2xl">
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
          ) : (
            <img
              src={salon.images[activeGalleryIndex] || salon.posterImage || salon.coverImage}
              alt={salon.name}
              className="w-full h-full object-cover transition-all duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e13] via-black/40 to-black/20 pointer-events-none" />

          {/* Top Controls: Badges + Video/Poster Toggle */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-10">
            <div className="flex items-center gap-2">
              {salon.isVerified && (
                <span className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full text-amber-400 font-bold text-xs border border-amber-400/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Verified Salon
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md ${
                salon.isOpen ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {salon.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            {salon.loopVideoUrl && (
              <div className="flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-zinc-700/80 p-1 rounded-full shadow-lg">
                <button
                  type="button"
                  onClick={() => setShowVideoInHero(!showVideoInHero)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 ${
                    showVideoInHero
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'text-zinc-300 hover:text-white'
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
                    className="p-1 rounded-full text-zinc-300 hover:text-white transition-colors"
                    title={isLoopVideoMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isLoopVideoMuted ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
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
                    activeGalleryIndex === idx ? 'w-6 bg-amber-400' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Salon Header Titles */}
        <div className="p-5 pt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-['Syne',sans-serif]">
                {salon.name}
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                {salon.tagline}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-2xl text-amber-400 font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{salon.rating}</span>
                <span className="text-zinc-400 text-xs font-normal">({salon.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          {/* Location & Quick Actions */}
          <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate max-w-xs">{salon.address}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${salon.phone}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              >
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <span>Call Studio</span>
              </a>

              <button
                onClick={onOpenDirectionsModal}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Directions ({salon.distanceKm} km)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PROMINENT LIVE QUEUE CARD (Requirement: "The queue information must be prominent... CURRENT QUEUE: 03 PEOPLE WAITING... Last updated: 2 minutes ago") */}
      <section className="bg-gradient-to-b from-[#181822] via-[#14141c] to-[#0f0f15] border-2 border-amber-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${queueInfo.dotClass}`} />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Live Walk-In Visibility
            </span>
          </div>

          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${freshness.badgeClass}`}>
            {freshness.text}
          </span>
        </div>

        {/* Big Counter Display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 mb-1">
              Current Queue
            </div>
            <div className="text-4xl sm:text-5xl font-black text-white flex items-baseline gap-3 tracking-tight">
              <span>{salon.currentQueue < 10 ? `0${salon.currentQueue}` : salon.currentQueue}</span>
              <span className="text-sm sm:text-base font-semibold text-zinc-400 uppercase tracking-wider">
                People Waiting
              </span>
            </div>
            <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl ${queueInfo.badgeClass}`}>
              <Users className="w-3.5 h-3.5" />
              <span>{queueInfo.label}</span>
            </div>
          </div>

          {/* Estimated Wait Card */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:w-56 shrink-0 shadow-lg">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Estimated Wait Time
            </div>
            <div className="text-2xl font-black text-white mt-1">
              ~{waitTime} <span className="text-xs font-normal text-zinc-400">minutes</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1 leading-snug">
              Based on {salon.activeBarbers} active stylist{salon.activeBarbers > 1 ? 's' : ''} at chairs.
            </p>
          </div>
        </div>

        {/* Important Business Rule Banner */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-start gap-2.5 text-xs text-zinc-400 bg-black/40 p-3 rounded-2xl">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-zinc-200">No appointments or tokens needed:</strong> Kumbhakaran eliminates blind walk-ins by giving you live visibility. Just check the queue, decide if it suits you, and walk right in.
          </p>
        </div>
      </section>

      {/* Interactive Mapbox Studio Location */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-['Syne',sans-serif]">
              Studio Location & Map
            </h3>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium">
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
      <div className="flex border-b border-zinc-800 text-xs font-bold">
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
                ? 'border-amber-400 text-amber-400 bg-amber-400/5'
                : 'border-transparent text-zinc-400 hover:text-white'
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
                    ? 'bg-amber-400 text-black border-amber-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
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
                className="bg-[#14141b] border border-zinc-800/80 rounded-2xl p-4 flex items-start justify-between gap-3 hover:border-zinc-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">
                      {service.name}
                    </h3>
                    {service.popular && (
                      <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" /> ~{service.durationMinutes} mins
                    </span>
                    <span>•</span>
                    <span className="text-zinc-400">Category: {service.category}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-amber-400">
                    ₹{service.price}
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
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
          <div className="text-xs text-zinc-400">
            Meet the master barbers and grooming artisans at {salon.name}.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {salon.staff.map((member) => (
              <div
                key={member.id}
                className="bg-[#14141b] border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5"
              >
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-zinc-700"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                    <span className="flex items-center gap-0.5 text-xs font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" /> {member.rating}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{member.role} • {member.experience}</p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.specialties.map((spec, idx) => (
                      <span key={idx} className="text-[9px] bg-zinc-900 text-zinc-300 px-2 py-0.5 rounded border border-zinc-800">
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
          <div className="bg-[#14141b] border border-zinc-800 rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="text-center sm:text-left">
                <div className="text-4xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
                  <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
                  <span>{salon.rating}</span>
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Based on {salon.reviewCount} customer reviews
                </div>
              </div>

              <button
                onClick={onOpenReviewModal}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5"
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
                <div key={c.label} className="bg-zinc-900/60 p-2 rounded-xl flex items-center justify-between">
                  <span className="text-zinc-400">{c.label}</span>
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
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
                  <div className="bg-[#14141b] border border-zinc-800/80 rounded-2xl p-6 text-center space-y-2">
                    <p className="text-zinc-400 text-xs">No reviews submitted yet.</p>
                    <p className="text-zinc-500 text-[11px]">Be the first customer to share your grooming experience!</p>
                  </div>
                );
              }

              return uniqueReviews.map((rev) => (
                <div key={rev.id} className="bg-[#14141b] border border-zinc-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={rev.customerAvatar} alt={rev.customerName} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{rev.customerName}</span>
                          {rev.verifiedVisit && (
                            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              Verified Visit
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">{rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 text-xs text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{rev.rating}.0</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    "{rev.comment}"
                  </p>

                  {/* Owner Reply if any */}
                  {rev.ownerReply && (
                    <div className="mt-2 bg-zinc-900/80 border-l-2 border-amber-400 p-2.5 rounded-r-xl text-xs">
                      <div className="text-[11px] font-bold text-amber-400 mb-0.5">
                        Salon Owner Response • {rev.ownerReply.date}
                      </div>
                      <p className="text-zinc-300">{rev.ownerReply.comment}</p>
                    </div>
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SHOWCASE & GALLERY (LOCATION, WORK, LOOP VIDEO) */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {/* Sub-Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all' as const, label: `All Media (${galleryItems.length})`, icon: Sparkles },
              { id: 'location' as const, label: `📍 Location (${locationPhotos.length})`, icon: MapPin },
              { id: 'work' as const, label: `💈 Our Work (${workPhotos.length})`, icon: Scissors },
              ...(salon.loopVideoUrl ? [{ id: 'video' as const, label: `🎥 Loop Video (1)`, icon: Film }] : []),
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = galleryFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setGalleryFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                      : 'bg-[#14141c] text-zinc-400 hover:text-white border border-zinc-800'
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
            <div className="bg-[#14141c] border border-zinc-800/80 rounded-2xl p-8 text-center text-xs text-zinc-500">
              No media in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredGalleryItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxIndex(galleryItems.findIndex(g => g.id === item.id))}
                  className="group relative h-44 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 cursor-pointer shadow-md hover:border-amber-400/50 transition-all"
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
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-amber-400/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
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
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md bg-black/70 border border-white/10 text-amber-400">
                      {item.categoryLabel}
                    </span>
                  </div>

                  {/* Title & Enlarge icon */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white font-medium">
                    <span className="truncate drop-shadow-md">{item.title}</span>
                    <Maximize2 className="w-3.5 h-3.5 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Informational Callout */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center gap-2.5 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Real photos and loop video captured directly on location at <strong className="text-white">{salon.name}</strong>, {salon.locality}.
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
              <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">
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
                  idx === lightboxIndex ? 'border-amber-400 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                }`}
              >
                {item.type === 'video' ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
