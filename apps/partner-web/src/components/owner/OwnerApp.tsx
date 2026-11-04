import React, { useState, useEffect } from 'react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness } from '../../context/PartnerContext';
import {
  LayoutDashboard,
  Users,
  Scissors,
  UserCheck,
  Star,
  BarChart3,
  Settings,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Calendar,
  MessageSquare,
  Edit2,
  Trash2,
  Save,
  Check,
  MapPin,
  Phone,
  Sparkles,
  Info,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Video,
  Upload,
  Play,
  Eye,
  Store,
} from 'lucide-react';
import { OwnerTab, Service, Staff } from '@kumbhakaran/shared-types';
import { openGoogleMapsLocation } from '@kumbhakaran/ui';

export const OwnerApp: React.FC = () => {
  const {
    activeSalon,
    updateQueue,
    ownerTab,
    setOwnerTab,
    updateSalonInfo,
    addService,
    updateService,
    deleteService,
    addStaff,
    updateStaff,
    deleteStaff,
    replyToReview,
    triggerNotification
  } = useSalon();

  // Local state for queue manual input
  const [manualQueueInput, setManualQueueInput] = useState<string>('');
  const [isEditingManual, setIsEditingManual] = useState(false);

  // Local state for adding/editing services
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(150);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(20);
  const [newServiceCategory, setNewServiceCategory] = useState<'Hair' | 'Beard' | 'Combos' | 'Spa' | 'Facial'>('Hair');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);

  // Local state for adding staff
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Senior Barber');
  const [newStaffExp, setNewStaffExp] = useState('4 Years');
  const [newStaffSpec, setNewStaffSpec] = useState('Fade Cut, Shave');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  // Local state for review replies
  const [replyTextMap, setReplyTextMap] = useState<{ [key: string]: string }>({});

  // Local state for salon settings form (declared unconditionally)
  const [salonForm, setSalonForm] = useState(() => ({
    name: activeSalon?.name || '',
    tagline: activeSalon?.tagline || '',
    phone: activeSalon?.phone || '',
    address: activeSalon?.address || '',
    openingHours: activeSalon?.openingHours?.formatted || (activeSalon as any)?.openingHoursFormatted || '09:00 AM – 09:30 PM (All Days)',
    isOpen: activeSalon?.isOpen ?? true,
    googlePlaceId: (activeSalon as any)?.googlePlaceId || ''
  }));

  // Media & Showcase Studio state (declared unconditionally)
  const [mediaSubTab, setMediaSubTab] = useState<'poster-video' | 'location' | 'work'>('poster-video');
  const [posterUrlInput, setPosterUrlInput] = useState(activeSalon?.posterImage || activeSalon?.coverImage || '');
  const [loopVideoUrlInput, setLoopVideoUrlInput] = useState(activeSalon?.loopVideoUrl || '');
  const [newLocationUrl, setNewLocationUrl] = useState('');
  const [newLocationTitle, setNewLocationTitle] = useState('');
  const [newWorkUrl, setNewWorkUrl] = useState('');
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkTag, setNewWorkTag] = useState<'Fade' | 'Beard' | 'Classic' | 'Color' | 'Spa'>('Fade');

  // Sync form when activeSalon changes
  useEffect(() => {
    if (activeSalon) {
      setSalonForm({
        name: activeSalon.name || '',
        tagline: activeSalon.tagline || '',
        phone: activeSalon.phone || '',
        address: activeSalon.address || '',
        openingHours: activeSalon.openingHours?.formatted || (activeSalon as any)?.openingHoursFormatted || '09:00 AM – 09:30 PM (All Days)',
        isOpen: activeSalon.isOpen ?? true,
        googlePlaceId: (activeSalon as any)?.googlePlaceId || ''
      });
      setPosterUrlInput(activeSalon.posterImage || activeSalon.coverImage || '');
      setLoopVideoUrlInput(activeSalon.loopVideoUrl || '');
    }
  }, [activeSalon?.id]);

  // Safe fallback if activeSalon is not available
  if (!activeSalon) {
    return (
      <div className="p-12 text-center text-zinc-400 space-y-3">
        <Store className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
        <p className="text-sm font-semibold text-white">Loading your salon workspace...</p>
        <p className="text-xs text-zinc-500">Connecting to live walk-in queue telemetry</p>
      </div>
    );
  }

  const queueInfo = getQueueDisplay(activeSalon.currentQueue, activeSalon.isOpen);
  const freshness = getQueueFreshness(activeSalon.lastQueueUpdate);
  const waitTime = getEstimatedWaitMinutes(activeSalon.currentQueue, activeSalon.avgServiceTimeMinutes, activeSalon.activeBarbers);

  // Navigation Items
  const navTabs: { id: OwnerTab; label: string; icon: React.FC<{ className?: string }>; highlight?: boolean }[] = [
    { id: 'live-queue', label: 'Live Queue', icon: Users, highlight: true },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'Services & Pricing', icon: Scissors },
    { id: 'staff', label: 'Staff Management', icon: UserCheck },
    { id: 'reviews', label: 'Customer Reviews', icon: Star },
    { id: 'gallery', label: 'Media & Loop Video', icon: Film },
    { id: 'analytics', label: 'Traffic Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Salon Settings', icon: Settings }
  ];

  const locationPhotosList = (activeSalon.locationImages && activeSalon.locationImages.length > 0)
    ? activeSalon.locationImages
    : [
        activeSalon.posterImage || activeSalon.coverImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80'
      ];

  const workPhotosList = (activeSalon.workImages && activeSalon.workImages.length > 0)
    ? activeSalon.workImages
    : [
        'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517832606589-7629c339590a?auto=format&fit=crop&w=1200&q=80'
      ];

  const handleSaveHeroMedia = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalonInfo(activeSalon.id, {
      posterImage: posterUrlInput.trim() || activeSalon.coverImage,
      coverImage: posterUrlInput.trim() || activeSalon.coverImage,
      loopVideoUrl: loopVideoUrlInput.trim()
    });
    triggerNotification('Poster and loop video showcase updated!');
  };

  const handleAddLocationPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationUrl.trim()) return;
    const updated = [newLocationUrl.trim(), ...locationPhotosList];
    updateSalonInfo(activeSalon.id, {
      locationImages: updated,
      images: [newLocationUrl.trim(), ...(activeSalon.images || [])]
    });
    setNewLocationUrl('');
    setNewLocationTitle('');
    triggerNotification('Location photo added to showcase!');
  };

  const handleRemoveLocationPhoto = (photoUrl: string) => {
    const updated = locationPhotosList.filter(url => url !== photoUrl);
    updateSalonInfo(activeSalon.id, { locationImages: updated });
    triggerNotification('Location photo removed');
  };

  const handleAddWorkPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkUrl.trim()) return;
    const updated = [newWorkUrl.trim(), ...workPhotosList];
    updateSalonInfo(activeSalon.id, { workImages: updated });
    setNewWorkUrl('');
    setNewWorkTitle('');
    triggerNotification('Styling work added to customer portfolio!');
  };

  const handleRemoveWorkPhoto = (photoUrl: string) => {
    const updated = workPhotosList.filter(url => url !== photoUrl);
    updateSalonInfo(activeSalon.id, { workImages: updated });
    triggerNotification('Work portfolio photo removed');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'poster' | 'video' | 'location' | 'work') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === 'poster') {
        setPosterUrlInput(result);
      } else if (target === 'video') {
        setLoopVideoUrlInput(result);
      } else if (target === 'location') {
        setNewLocationUrl(result);
      } else if (target === 'work') {
        setNewWorkUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualQueueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(manualQueueInput, 10);
    if (!isNaN(val) && val >= 0) {
      updateQueue(activeSalon.id, 0, val);
      setIsEditingManual(false);
      setManualQueueInput('');
    }
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    addService(activeSalon.id, {
      name: newServiceName,
      price: newServicePrice,
      durationMinutes: newServiceDuration,
      category: newServiceCategory,
      description: newServiceDesc || 'High quality grooming service performed by master stylists.',
      isAvailable: true
    });
    setNewServiceName('');
    setNewServiceDesc('');
    setShowAddServiceModal(false);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    addStaff(activeSalon.id, {
      name: newStaffName,
      role: newStaffRole,
      experience: newStaffExp,
      specialties: newStaffSpec.split(',').map(s => s.trim()),
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      status: 'active',
      rating: 4.8
    });
    setNewStaffName('');
    setShowAddStaffModal(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSalon) return;
    updateSalonInfo(activeSalon.id, {
      name: salonForm.name,
      tagline: salonForm.tagline,
      phone: salonForm.phone,
      address: salonForm.address,
      isOpen: salonForm.isOpen,
      googlePlaceId: salonForm.googlePlaceId,
      openingHours: {
        open: activeSalon.openingHours?.open || '09:00 AM',
        close: activeSalon.openingHours?.close || '09:30 PM',
        formatted: salonForm.openingHours
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28 text-slate-100">
      {/* Top B2B Header & Operational Status Bar */}
      <div className="bg-gradient-to-r from-[#171720] via-[#13131a] to-[#0d0d12] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Salon Partner SaaS
            </span>
            <span className="text-xs text-zinc-400">ID: {activeSalon.id}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 font-['Syne',sans-serif]">
            {activeSalon.name}
          </h1>
          <p className="text-xs text-zinc-400">
            {activeSalon.address} • {activeSalon.activeBarbers} Active Stylists Today
          </p>
        </div>

        {/* Operating status switcher */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Walk-in Status</div>
            <div className="text-xs font-bold text-emerald-400">
              {activeSalon.isOpen ? 'Accepting Customers' : 'Currently Closed'}
            </div>
          </div>

          <button
            onClick={() => {
              updateSalonInfo(activeSalon.id, { isOpen: !activeSalon.isOpen });
              triggerNotification(activeSalon.isOpen ? "Salon marked as CLOSED" : "Salon marked as OPEN & Accepting Walk-ins");
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              activeSalon.isOpen
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
            }`}
          >
            {activeSalon.isOpen ? '🟢 Open for Walk-ins' : '🔴 Closed'}
          </button>
        </div>
      </div>

      {/* Owner Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-zinc-800">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = ownerTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setOwnerTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : tab.highlight
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE QUEUE MANAGEMENT (THE CORE B2B FUNCTIONALITY) */}
      {ownerTab === 'live-queue' && (
        <div className="space-y-6">
          {/* Stale Data Warning Banner if not updated recently */}
          {freshness.isStale && (
            <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-300">
                    Queue Update Recommended!
                  </h4>
                  <p className="text-zinc-300 text-[11px]">
                    Last updated {freshness.text}. Customers trust studios with fresh walk-in numbers.
                  </p>
                </div>
              </div>

              <button
                onClick={() => updateQueue(activeSalon.id, 0, activeSalon.currentQueue)}
                className="px-4 py-2 rounded-xl bg-amber-400 text-black font-extrabold hover:bg-amber-300 shadow transition-colors shrink-0"
              >
                Confirm Current Count ({activeSalon.currentQueue}) is Correct
              </button>
            </div>
          )}

          {/* Big Live Queue Control Station */}
          <div className="bg-gradient-to-b from-[#181822] via-[#13131c] to-[#0e0e13] border-2 border-zinc-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 mb-4">
              <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
              <span>Broadcasts Live to All Nearby Customers in Real-Time</span>
            </div>

            <div className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
              Current Waiting Customers
            </div>

            {/* Giant Counter Display */}
            <div className="my-6">
              <div className="text-7xl sm:text-9xl font-black text-white tracking-tight flex items-center justify-center gap-2 drop-shadow-2xl">
                <span className="text-amber-400 font-light text-5xl sm:text-7xl">#</span>
                <span>{activeSalon.currentQueue < 10 ? `0${activeSalon.currentQueue}` : activeSalon.currentQueue}</span>
              </div>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${queueInfo.badgeClass}`}>
                {queueInfo.label}
              </div>
            </div>

            {/* The Main Big Touch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto my-6">
              <button
                onClick={() => updateQueue(activeSalon.id, 1)}
                className="py-5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-lg sm:text-xl shadow-xl shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                <Plus className="w-7 h-7 stroke-[3]" />
                <span>+ ADD CUSTOMER</span>
              </button>

              <button
                onClick={() => updateQueue(activeSalon.id, -1)}
                disabled={activeSalon.currentQueue <= 0}
                className={`py-5 px-6 rounded-2xl font-black text-lg sm:text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer ${
                  activeSalon.currentQueue <= 0
                    ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 shadow-zinc-900/50'
                }`}
              >
                <Minus className="w-7 h-7 stroke-[3]" />
                <span>- REMOVE CUSTOMER</span>
              </button>
            </div>

            {/* Quick Adjustment Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
              <span className="text-xs text-zinc-400 mr-1">Quick:</span>
              <button
                onClick={() => updateQueue(activeSalon.id, 2)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-xs font-bold text-zinc-300"
              >
                +2 People
              </button>
              <button
                onClick={() => updateQueue(activeSalon.id, 5)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-xs font-bold text-zinc-300"
              >
                +5 Rush Group
              </button>
              <button
                onClick={() => updateQueue(activeSalon.id, 0, 0)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-xs font-bold text-rose-400"
              >
                Reset to 0
              </button>

              <button
                onClick={() => setIsEditingManual(!isEditingManual)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-xs font-bold text-amber-400"
              >
                Manual Entry
              </button>
            </div>

            {/* Manual Entry Form */}
            {isEditingManual && (
              <form onSubmit={handleManualQueueSubmit} className="mt-4 flex items-center justify-center gap-2 max-w-xs mx-auto animate-in fade-in">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={manualQueueInput}
                  onChange={(e) => setManualQueueInput(e.target.value)}
                  placeholder="Exact count..."
                  className="w-28 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white text-center font-bold focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400"
                >
                  Set Count
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingManual(false)}
                  className="px-2 py-2 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Live Queue Metadata */}
            <div className="mt-8 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Last updated: <strong className="text-white">{freshness.text}</strong></span>
              </div>

              <div>
                <span>Est. customer wait time: <strong className="text-emerald-400">~{waitTime} mins</strong></span>
              </div>

              <div>
                <span>Completed today: <strong className="text-white">{activeSalon.todayCustomersServed} customers</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD OVERVIEW */}
      {ownerTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Customers Today
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {activeSalon.todayCustomersServed}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +18% vs yesterday
              </div>
            </div>

            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Waiting Now
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                {activeSalon.currentQueue}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                ~{waitTime} min wait time
              </div>
            </div>

            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Today's Revenue
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                ₹{activeSalon.todayRevenue.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                Monthly: ₹{activeSalon.monthlyRevenue.toLocaleString()}
              </div>
            </div>

            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Average Rating
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                {activeSalon.rating}★
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                {activeSalon.reviewCount} customer reviews
              </div>
            </div>
          </div>

          {/* Peak Business Hours Visualization */}
          <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Peak Walk-In Rush Hours
                </h3>
                <p className="text-xs text-zinc-400">
                  Hourly customer density helps plan stylist staffing
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-xl">
                Peak: 5:00 PM – 8:00 PM
              </span>
            </div>

            {/* Visual Bar Graph */}
            <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 border-b border-zinc-800">
              {[
                { time: '9 AM', count: 2, height: '20%' },
                { time: '11 AM', count: 5, height: '45%' },
                { time: '1 PM', count: 7, height: '60%' },
                { time: '3 PM', count: 4, height: '35%' },
                { time: '5 PM', count: 12, height: '90%', peak: true },
                { time: '7 PM', count: 14, height: '100%', peak: true },
                { time: '9 PM', count: 6, height: '50%' }
              ].map((bar) => (
                <div key={bar.time} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-amber-400 mb-1 opacity-80">
                    {bar.count}
                  </span>
                  <div
                    style={{ height: bar.height }}
                    className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                      bar.peak
                        ? 'bg-amber-400 shadow-lg shadow-amber-400/20 group-hover:bg-amber-300'
                        : 'bg-zinc-700/80 group-hover:bg-zinc-600'
                    }`}
                  />
                  <span className="text-[10px] text-zinc-500 mt-2 font-medium">
                    {bar.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES & PRICING MANAGEMENT */}
      {ownerTab === 'services' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                Service Catalogue & Dynamic Pricing
              </h2>
              <p className="text-xs text-zinc-400">
                Update prices and service availability instantly for all walk-in customers
              </p>
            </div>

            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>

          {/* Add Service Modal */}
          {showAddServiceModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#14141c] border border-zinc-700 rounded-3xl max-w-md w-full p-5 shadow-2xl">
                <h3 className="text-sm font-bold text-white mb-3">Add New Service</h3>
                <form onSubmit={handleCreateService} className="space-y-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Service Name</label>
                    <input
                      type="text"
                      required
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g. Skin Fade Haircut"
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-zinc-400 block mb-1">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Duration (Mins)</label>
                      <input
                        type="number"
                        required
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Category</label>
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                    >
                      <option value="Hair">Hair</option>
                      <option value="Beard">Beard</option>
                      <option value="Combos">Combos</option>
                      <option value="Spa">Spa</option>
                      <option value="Facial">Facial</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">Description</label>
                    <textarea
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      placeholder="Brief details of service..."
                      rows={2}
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(false)}
                      className="px-3 py-1.5 text-zinc-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-500 text-black font-bold rounded-xl"
                    >
                      Add Service
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Service items */}
          <div className="space-y-2.5">
            {(activeSalon.services || []).map((svc) => (
              <div
                key={svc.id}
                className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{svc.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {svc.category}
                    </span>
                    {!svc.isAvailable && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-400 mt-1">{svc.description}</p>
                  <span className="text-zinc-500 text-[11px] mt-1 block">
                    Duration: ~{svc.durationMinutes} mins
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-zinc-500 text-[10px] block">Price</span>
                    <input
                      type="number"
                      value={svc.price}
                      onChange={(e) => updateService(activeSalon.id, svc.id, { price: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-amber-400 font-extrabold text-sm text-right focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={() => updateService(activeSalon.id, svc.id, { isAvailable: !svc.isAvailable })}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border ${
                      svc.isAvailable
                        ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {svc.isAvailable ? 'Pause' : 'Enable'}
                  </button>

                  <button
                    onClick={() => deleteService(activeSalon.id, svc.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400"
                    title="Delete service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STAFF MANAGEMENT */}
      {ownerTab === 'staff' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                Barber & Stylist Chairs ({(activeSalon.staff || []).length})
              </h2>
              <p className="text-xs text-zinc-400">
                Number of active chairs directly adjusts estimated wait times on the customer app
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stylist</span>
            </button>
          </div>

          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#14141c] border border-zinc-700 rounded-3xl max-w-md w-full p-5 shadow-2xl">
                <h3 className="text-sm font-bold text-white mb-3">Add Stylist</h3>
                <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Stylist Name</label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-zinc-400 block mb-1">Role</label>
                      <input
                        type="text"
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value)}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">Experience</label>
                      <input
                        type="text"
                        value={newStaffExp}
                        onChange={(e) => setNewStaffExp(e.target.value)}
                        className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Specialties (comma separated)</label>
                    <input
                      type="text"
                      value={newStaffSpec}
                      onChange={(e) => setNewStaffSpec(e.target.value)}
                      placeholder="Taper Fade, Beard Art"
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddStaffModal(false)} className="px-3 py-1.5 text-zinc-400">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-1.5 bg-amber-500 text-black font-bold rounded-xl">
                      Save Stylist
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(activeSalon.staff || []).map((member) => (
              <div key={member.id} className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={member.photo || (member as any).avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">{member.name}</h4>
                    <p className="text-zinc-400">{member.role} • {member.experience}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${
                        member.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-600'
                      }`} />
                      <span className="capitalize text-zinc-300 font-semibold">{member.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStaff(activeSalon.id, member.id, {
                      status: member.status === 'active' ? 'break' : 'active'
                    })}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                      member.status === 'active'
                        ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {member.status === 'active' ? 'Take Break' : 'On Chair'}
                  </button>

                  <button
                    onClick={() => deleteStaff(activeSalon.id, member.id)}
                    className="p-1.5 text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOMER REVIEWS & RESPONSES */}
      {ownerTab === 'reviews' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">
              Customer Feedback & Owner Replies
            </h2>
            <p className="text-xs text-zinc-400">
              Responding to reviews boosts salon trust and visibility score
            </p>
          </div>

          <div className="space-y-3">
            {(activeSalon.reviews || []).map((rev) => (
              <div key={rev.id} className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={rev.customerName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <span className="font-bold text-white">{rev.customerName}</span>
                      <span className="text-[10px] text-zinc-500 ml-2">{(rev as any).date || (rev as any).createdAt || 'Recently'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" /> {rev.rating}.0
                  </div>
                </div>

                <p className="text-zinc-300 italic">"{rev.comment}"</p>

                {/* Existing Reply */}
                {rev.ownerReply ? (
                  <div className="mt-2 bg-zinc-900/90 border-l-2 border-amber-400 p-2.5 rounded-r-xl">
                    <div className="text-[11px] font-bold text-amber-400">Your Response:</div>
                    <p className="text-zinc-300">{rev.ownerReply.comment}</p>
                  </div>
                ) : (
                  /* Reply Input */
                  <div className="mt-2 flex items-center gap-2 pt-2 border-t border-zinc-800">
                    <input
                      type="text"
                      placeholder="Write owner response..."
                      value={replyTextMap[rev.id] || ''}
                      onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs"
                    />
                    <button
                      onClick={() => {
                        const reply = replyTextMap[rev.id];
                        if (reply?.trim()) {
                          replyToReview(activeSalon.id, rev.id, reply);
                          setReplyTextMap({ ...replyTextMap, [rev.id]: '' });
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-500 text-black font-bold rounded-xl text-xs hover:bg-amber-400"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS & TRAFFIC REPORTS */}
      {ownerTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Weekly Walk-In Total</span>
              <div className="text-2xl font-black text-white mt-1">194 Customers</div>
              <span className="text-[10px] text-emerald-400">+14% growth</span>
            </div>
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Estimated Monthly Revenue</span>
              <div className="text-2xl font-black text-amber-400 mt-1">₹{activeSalon.monthlyRevenue.toLocaleString()}</div>
              <span className="text-[10px] text-zinc-500">Based on services logged</span>
            </div>
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Most Popular Service</span>
              <div className="text-2xl font-black text-white mt-1">Signature Fade</div>
              <span className="text-[10px] text-zinc-500">42% of all walk-ins</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MEDIA & LOOP VIDEO SHOWCASE STUDIO */}
      {ownerTab === 'gallery' && (
        <div className="space-y-6 max-w-4xl">
          {/* Studio Header */}
          <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">Media, Poster & Location Showcase</h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Upload high-res poster photos, background loop videos, physical salon location pictures, and haircut portfolio.
                </p>
              </div>

              {/* Sub-tab Switcher */}
              <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-2xl text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setMediaSubTab('poster-video')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    mediaSubTab === 'poster-video'
                      ? 'bg-amber-400 text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Poster & Loop Video
                </button>
                <button
                  type="button"
                  onClick={() => setMediaSubTab('location')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    mediaSubTab === 'location'
                      ? 'bg-amber-400 text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Location ({locationPhotosList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMediaSubTab('work')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                    mediaSubTab === 'work'
                      ? 'bg-amber-400 text-black shadow-sm font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Our Work ({workPhotosList.length})
                </button>
              </div>
            </div>
          </div>

          {/* SUBTAB 1: POSTER & LOOP VIDEO */}
          {mediaSubTab === 'poster-video' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Form Input */}
              <form onSubmit={handleSaveHeroMedia} className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
                    <Video className="w-4 h-4 text-amber-400" />
                    Cover Poster & Loop Video
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Set a cinematic looping video (MP4/WebM) or a high-res poster image for your salon's profile banner.
                  </p>
                </div>

                {/* Poster Image URL & File Upload */}
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">Poster Image URL (Hero Cover)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={posterUrlInput}
                      onChange={(e) => setPosterUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs"
                    />
                    <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'poster')}
                      />
                    </label>
                  </div>
                </div>

                {/* Loop Video URL & File Upload */}
                <div>
                  <label className="text-zinc-300 font-semibold block mb-1">
                    Loop Video URL (MP4 / WebM direct video link)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={loopVideoUrlInput}
                      onChange={(e) => setLoopVideoUrlInput(e.target.value)}
                      placeholder="https://assets.mixkit.co/videos/...mp4"
                      className="flex-1 p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs"
                    />
                    <label className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'video')}
                      />
                    </label>
                  </div>
                </div>

                {/* Quick Presets for Barber Studios */}
                <div className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                    ⚡ Quick Sample Studio Loops:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: '✂️ Master Barber Scissors & Fade',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-with-scissors-and-comb-41544-large.mp4'
                      },
                      {
                        label: '💈 Barber Styling & Comb',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-barber-styling-a-mans-hair-41545-large.mp4'
                      },
                      {
                        label: '✂️ Haircut Precision Cut',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-hairdresser-brushing-a-womans-hair-41540-large.mp4'
                      }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setLoopVideoUrlInput(preset.url)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 hover:text-amber-400 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-500 text-black font-bold rounded-xl text-xs hover:bg-amber-400 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Poster & Video</span>
                  </button>
                </div>
              </form>

              {/* Live Customer Preview */}
              <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-400" />
                    Customer Live View Preview
                  </h3>
                  <span className="text-[10px] text-zinc-500">How customers see your salon</span>
                </div>

                <div className="h-64 rounded-2xl overflow-hidden border border-zinc-700 relative bg-black shadow-inner">
                  {loopVideoUrlInput ? (
                    <video
                      src={loopVideoUrlInput}
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster={posterUrlInput}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={posterUrlInput || activeSalon.coverImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/80 text-amber-400 border border-amber-400/40">
                      {loopVideoUrlInput ? '🎥 Loop Video Active' : '🖼️ Poster Active'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="text-sm font-black">{activeSalon.name}</div>
                    <div className="text-[11px] text-zinc-300">{activeSalon.locality}, {activeSalon.city}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: LOCATION GALLERY (AMBIECE & PREMISES) */}
          {mediaSubTab === 'location' && (
            <div className="space-y-5">
              {/* Add Location Photo Form */}
              <form onSubmit={handleAddLocationPhoto} className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 text-xs space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Add Physical Salon Location Photo
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Upload clear photos of your chairs, waiting area, wash bar, and exterior front facade to build customer trust.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-zinc-300 font-semibold block mb-1">Image URL</label>
                    <input
                      type="url"
                      value={newLocationUrl}
                      onChange={(e) => setNewLocationUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">Upload File</label>
                    <label className="w-full p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>Choose Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'location')}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!newLocationUrl.trim()}
                    className="px-5 py-2 bg-amber-500 text-black font-bold rounded-xl text-xs hover:bg-amber-400 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Location Gallery</span>
                  </button>
                </div>
              </form>

              {/* Location Photos Grid */}
              <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-white">Active Location Photos ({locationPhotosList.length})</h4>
                  <span className="text-zinc-500">Visible to all nearby walk-in customers</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {locationPhotosList.map((url, idx) => (
                    <div key={idx} className="group relative h-36 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                      <img src={url} alt={`Location ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                      <button
                        type="button"
                        onClick={() => handleRemoveLocationPhoto(url)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-zinc-300 drop-shadow">
                        Space #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: OUR WORK & STYLES PORTFOLIO */}
          {mediaSubTab === 'work' && (
            <div className="space-y-5">
              {/* Add Work Photo Form */}
              <form onSubmit={handleAddWorkPhoto} className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 text-xs space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-amber-400" />
                  Add Client Haircut & Grooming Work
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Showcase real haircuts, beard trims, and styling transformations done by your stylists.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-zinc-300 font-semibold block mb-1">Image URL</label>
                    <input
                      type="url"
                      value={newWorkUrl}
                      onChange={(e) => setNewWorkUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-semibold block mb-1">Upload File</label>
                    <label className="w-full p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      <span>Choose Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'work')}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!newWorkUrl.trim()}
                    className="px-5 py-2 bg-amber-500 text-black font-bold rounded-xl text-xs hover:bg-amber-400 disabled:opacity-50 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Work Portfolio</span>
                  </button>
                </div>
              </form>

              {/* Work Photos Grid */}
              <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <h4 className="font-bold text-white">Client Styling Portfolio ({workPhotosList.length})</h4>
                  <span className="text-zinc-500">Inspires customers on what cut to request</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {workPhotosList.map((url, idx) => (
                    <div key={idx} className="group relative h-36 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
                      <img src={url} alt={`Work ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                      <button
                        type="button"
                        onClick={() => handleRemoveWorkPhoto(url)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-amber-400 drop-shadow">
                        💈 Style #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: SALON SETTINGS */}
      {ownerTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 space-y-4 max-w-2xl text-xs">
          <h2 className="text-sm font-bold text-white mb-2">Salon Profile Settings</h2>

          <div>
            <label className="text-zinc-400 block mb-1">Salon Name</label>
            <input
              type="text"
              value={salonForm.name}
              onChange={(e) => setSalonForm({ ...salonForm, name: e.target.value })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Tagline</label>
            <input
              type="text"
              value={salonForm.tagline}
              onChange={(e) => setSalonForm({ ...salonForm, tagline: e.target.value })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-zinc-400 block mb-1">Phone Number</label>
              <input
                type="text"
                value={salonForm.phone}
                onChange={(e) => setSalonForm({ ...salonForm, phone: e.target.value })}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Operating Hours</label>
              <input
                type="text"
                value={salonForm.openingHours}
                onChange={(e) => setSalonForm({ ...salonForm, openingHours: e.target.value })}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Full Address</label>
            <input
              type="text"
              value={salonForm.address}
              onChange={(e) => setSalonForm({ ...salonForm, address: e.target.value })}
              className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
            />
          </div>

          <div>
            <label className="text-zinc-400 block mb-1">Google Maps Place ID or Review URL (Optional)</label>
            <input
              type="text"
              value={salonForm.googlePlaceId}
              onChange={(e) => setSalonForm({ ...salonForm, googlePlaceId: e.target.value })}
              placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4 or https://g.page/r/.../review"
              className="w-full p-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Directs verified Kumbhkaran Salons customers to your official Google Business Profile review dialog after leaving feedback.
            </p>
          </div>

          {activeSalon.coordinates && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">GPS Coordinates</span>
                <span className="text-zinc-300 font-mono">{activeSalon.coordinates.lat.toFixed(5)}, {activeSalon.coordinates.lng.toFixed(5)}</span>
              </div>
              <button
                type="button"
                onClick={() => openGoogleMapsLocation(activeSalon.coordinates.lat, activeSalon.coordinates.lng)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold flex items-center gap-1 border border-zinc-700/80 transition-colors"
                title="Open coordinates in Google Maps"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Verify on Google Maps ↗</span>
              </button>
            </div>
          )}

          <div className="pt-3 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 text-black font-bold rounded-xl text-xs hover:bg-amber-400 flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Salon Profile</span>
            </button>
          </div>
        </form>
      )}

      {/* Mobile Sticky Bottom Nav for Salon Owners on Smartphones */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gradient-to-t from-black via-[#0c0c10] to-transparent pt-3 pb-safe">
        <div className="max-w-md mx-auto px-3 pb-2">
          <div className="bg-[#121218]/95 backdrop-blur-xl border border-zinc-800/90 rounded-3xl shadow-2xl p-1.5 flex items-center justify-around ring-1 ring-white/5">
            {[
              { id: 'live-queue' as const, label: 'Queue', icon: Users },
              { id: 'dashboard' as const, label: 'Stats', icon: LayoutDashboard },
              { id: 'services' as const, label: 'Prices', icon: Scissors },
              { id: 'gallery' as const, label: 'Media', icon: Film },
              { id: 'staff' as const, label: 'Staff', icon: UserCheck },
              { id: 'settings' as const, label: 'Setup', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = ownerTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setOwnerTab(item.id)}
                  className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
                    isActive
                      ? 'text-amber-400 font-bold bg-amber-500/15'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 text-amber-400' : ''}`} />
                  <span className={`text-[9px] mt-0.5 ${isActive ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}>
                    {item.label}
                  </span>
                  {isActive && <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};
