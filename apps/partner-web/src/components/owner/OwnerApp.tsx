import React, { useState, useEffect, useMemo } from 'react';
import { useSalon, getEstimatedWaitMinutes, getQueueDisplay, getQueueFreshness, DEFAULT_AVATAR } from '../../context/PartnerContext';
import { useLanguage } from '../../i18n/LanguageContext';
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
  Info,
  ExternalLink,
  Film,
  Image as ImageIcon,
  Video,
  Upload,
  Play,
  Eye,
  Store,
  PhoneCall,
  UserPlus,
  RefreshCw,
  XCircle,
  QrCode,
  Printer,
  Download,
  Copy,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { OwnerTab, Service, Staff, QueueEntry } from '@kumbhakaran/shared-types';
import { openGoogleMapsLocation } from '@kumbhakaran/ui';
import { defaultApiClient } from '@kumbhakaran/api-client';

export const OwnerApp: React.FC = () => {
  const {
    activeSalon,
    updateQueue,
    updateQueueStatus,
    isUpdatingQueueStatus,
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
    fetchSalonReviews,
    triggerNotification,
    queueEntries = [],
    isLoadingQueue,
    refreshQueueEntries,
    addCustomerToQueue,
    updateCustomerStatus,
    confirmQueueDeparture,
    restoreQueueEntry,
    updateSmartQueueRadius,
    clearQueue,
    latestCrowdReport,
    setPartnerView,
  } = useSalon();

  const { t, languageInfo } = useLanguage();

  // Walk-in Counter QR Standee state & URL generator
  const [partnerQrDataUrl, setPartnerQrDataUrl] = useState<string>('');
  const [partnerQueueUrl, setPartnerQueueUrl] = useState<string>('');
  const [partnerQrError, setPartnerQrError] = useState<string | null>(null);
  const [copiedQueueLink, setCopiedQueueLink] = useState(false);
  const [showStandeeModal, setShowStandeeModal] = useState(false);
  const [geofenceRadius, setGeofenceRadius] = useState(100);

  const getCustomerQueueUrl = (salonId: string) => {
    return partnerQueueUrl.includes(`salon=${encodeURIComponent(salonId)}`) ? partnerQueueUrl : '';
  };

  useEffect(() => {
    if (!activeSalon?.id) return;
    let active = true;
    setPartnerQrDataUrl('');
    setPartnerQueueUrl('');
    setPartnerQrError(null);
    defaultApiClient.getSalonCheckInQr(activeSalon.id)
      .then(async ({ checkInToken, geofenceRadiusMeters }) => {
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        const baseUrl = isLocal ? `http://${window.location.hostname}:5173` : 'https://sloon.in';
        const url = new URL('/', baseUrl);
        url.searchParams.set('salon', activeSalon.id);
        url.searchParams.set('checkin', checkInToken);
        const qr = await QRCode.toDataURL(url.toString(), {
          width: 400,
          margin: 2,
          color: { dark: '#111111', light: '#FFFFFF' },
        });
        if (!active) return;
        setGeofenceRadius(geofenceRadiusMeters);
        setPartnerQueueUrl(url.toString());
        setPartnerQrDataUrl(qr);
      })
      .catch((error: Error) => {
        if (!active) return;
        setPartnerQrError(error.message || 'Could not load a secure salon QR code.');
      });
    return () => { active = false; };
  }, [activeSalon?.id]);

  // Real-time dynamic stats calculated from actual live queue and completed sessions
  const completedEntriesToday = useMemo(() => {
    return (queueEntries || []).filter((e) => e.status === 'completed');
  }, [queueEntries]);

  const realCustomersServed = useMemo(() => {
    return Math.max(activeSalon?.todayCustomersServed || 0, completedEntriesToday.length);
  }, [activeSalon?.todayCustomersServed, completedEntriesToday.length]);

  const realTodayRevenue = useMemo(() => {
    const queueRevenue = completedEntriesToday.reduce((sum, e) => {
      const p = Number((e as any).servicePrice);
      return sum + (Number.isFinite(p) && p > 0 ? p : (activeSalon?.startingPrice || 150));
    }, 0);
    return Math.max(activeSalon?.todayRevenue || 0, queueRevenue);
  }, [completedEntriesToday, activeSalon?.todayRevenue, activeSalon?.startingPrice]);

  const realMonthlyRevenue = useMemo(() => {
    return Math.max(activeSalon?.monthlyRevenue || 0, realTodayRevenue);
  }, [activeSalon?.monthlyRevenue, realTodayRevenue]);

  // Real-time hourly customer density
  const hourlyStats = useMemo(() => {
    const slots = [
      { label: '9 AM', startHour: 9, endHour: 10 },
      { label: '11 AM', startHour: 11, endHour: 12 },
      { label: '1 PM', startHour: 13, endHour: 14 },
      { label: '3 PM', startHour: 15, endHour: 16 },
      { label: '5 PM', startHour: 17, endHour: 18 },
      { label: '7 PM', startHour: 19, endHour: 20 },
      { label: '9 PM', startHour: 21, endHour: 23 },
    ];

    const counts = slots.map((slot) => {
      const count = (queueEntries || []).filter((e) => {
        const timeStr = (e as any).servedAt || e.joinedAt;
        if (!timeStr) return false;
        try {
          const d = new Date(timeStr);
          const h = d.getHours();
          return h >= slot.startHour && h <= slot.endHour;
        } catch {
          return false;
        }
      }).length;
      return { time: slot.label, count };
    });

    const maxCount = Math.max(...counts.map((c) => c.count), 0);
    const peakSlot = counts.find((c) => c.count > 0 && c.count === maxCount);

    const bars = counts.map((item) => ({
      time: item.time,
      count: item.count,
      height: maxCount > 0 ? `${Math.max(16, Math.round((item.count / maxCount) * 100))}%` : '8%',
      peak: maxCount > 0 && item.count === maxCount,
    }));

    return {
      bars,
      peakLabel: peakSlot
        ? `Peak Today: ${peakSlot.time} (${peakSlot.count} walk-in${peakSlot.count > 1 ? 's' : ''})`
        : (realCustomersServed > 0 ? 'Tracking walk-in distribution' : 'Awaiting walk-in rush data'),
      hasData: maxCount > 0,
    };
  }, [queueEntries, realCustomersServed]);

  // Real-time popular service
  const popularServiceStats = useMemo(() => {
    if (completedEntriesToday.length === 0) {
      const firstService = activeSalon?.services?.[0]?.name;
      return {
        name: firstService || 'Walk-In Haircut',
        note: 'Live percentage updates as walk-ins are served',
      };
    }

    const counts: Record<string, number> = {};
    completedEntriesToday.forEach((e) => {
      const sName = e.serviceName || 'Haircut';
      counts[sName] = (counts[sName] || 0) + 1;
    });

    let topName = '';
    let topCount = 0;
    Object.entries(counts).forEach(([name, count]) => {
      if (count > topCount) {
        topCount = count;
        topName = name;
      }
    });

    const pct = Math.round((topCount / completedEntriesToday.length) * 100);
    return {
      name: topName,
      note: `${pct}% of completed walk-ins today (${topCount} of ${completedEntriesToday.length})`,
    };
  }, [completedEntriesToday, activeSalon?.services]);

  const handlePrintDeskStandee = () => {
    if (!activeSalon || !partnerQrDataUrl) return;
    const printWindow = window.open('', '_blank', 'width=800,height=920');
    if (!printWindow) return;
    const directLink = partnerQueueUrl;
    if (!directLink) return;

    const salonBgImage =
      activeSalon.coverImage ||
      (activeSalon.images && activeSalon.images[0]) ||
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80';

    const localityText = activeSalon.locality
      ? `${activeSalon.locality} • ${activeSalon.city || 'Chhattisgarh'}`
      : activeSalon.address || 'SLOON Partner Studio';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>SLOON - Counter QR Standee - ${activeSalon.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=Syne:wght@700;800;900&display=swap');
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
            * {
              box-sizing: border-box;
            }
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              margin: 0;
              padding: 30px 16px;
              background: #09090c;
              color: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print-bar {
              position: fixed;
              top: 16px;
              left: 50%;
              transform: translateX(-50%);
              z-index: 999;
              display: flex;
              align-items: center;
              gap: 12px;
              background: rgba(20, 20, 28, 0.95);
              backdrop-filter: blur(12px);
              padding: 10px 20px;
              border-radius: 9999px;
              border: 1px solid rgba(255, 255, 255, 0.15);
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            .btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 8px 18px;
              font-size: 13px;
              font-weight: 800;
              border-radius: 9999px;
              cursor: pointer;
              border: none;
              transition: all 0.15s ease;
            }
            .btn-primary {
              background: #f59e0b;
              color: #000000;
              box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
            }
            .btn-primary:hover {
              background: #fbbf24;
            }
            .btn-secondary {
              background: #27272a;
              color: #e4e4e7;
            }
            .btn-secondary:hover {
              background: #3f3f46;
            }
            .standee-container {
              position: relative;
              max-width: 480px;
              width: 100%;
              margin: 45px auto 20px auto;
              border-radius: 36px;
              overflow: hidden;
              border: 3.5px solid #f59e0b;
              box-shadow: 0 25px 60px rgba(0, 0, 0, 0.65);
              background: #111116;
            }
            /* Salon Background Image with contrast darkening */
            .salon-bg-image {
              position: absolute;
              inset: 0;
              background-image: url('${salonBgImage}');
              background-size: cover;
              background-position: center;
              filter: brightness(0.32) saturate(1.2);
              z-index: 0;
            }
            .salon-bg-overlay {
              position: absolute;
              inset: 0;
              background: radial-gradient(circle at 50% 25%, rgba(12, 10, 9, 0.50) 0%, rgba(8, 8, 12, 0.92) 100%);
              z-index: 1;
            }
            .standee-body {
              position: relative;
              z-index: 2;
              padding: 44px 32px 36px 32px;
              text-align: center;
            }
            .brand-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(245, 158, 11, 0.2);
              border: 1px solid rgba(245, 158, 11, 0.5);
              color: #fbbf24;
              font-size: 11px;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              padding: 6px 16px;
              border-radius: 9999px;
              margin-bottom: 14px;
            }
            .salon-name {
              font-family: 'Syne', sans-serif;
              font-size: 32px;
              font-weight: 900;
              color: #ffffff;
              margin: 0 0 4px 0;
              letter-spacing: -0.5px;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85);
            }
            .salon-locality {
              font-size: 14px;
              font-weight: 600;
              color: #d4d4d8;
              margin: 0 0 20px 0;
              text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
            }
            /* High-contrast solid white container with padding & rounded borders for 100% QR camera scanning */
            .qr-card-wrapper {
              margin: 0 auto 20px auto;
              display: inline-block;
              background: #ffffff;
              padding: 20px 20px 16px 20px;
              border-radius: 28px;
              border: 3.5px solid #f59e0b;
              box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55), 0 0 0 4px rgba(255, 255, 255, 0.95);
            }
            .qr-code-img {
              width: 250px;
              height: 250px;
              display: block;
              border-radius: 12px;
            }
            .camera-label {
              margin-top: 10px;
              background: #18181b;
              color: #fbbf24;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 1px;
              padding: 4px 12px;
              border-radius: 9999px;
              display: inline-block;
              border: 1px solid rgba(245, 158, 11, 0.4);
            }
            .cta-title {
              font-size: 21px;
              font-weight: 900;
              color: #fbbf24;
              margin: 0 0 6px 0;
              text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
            }
            .cta-desc {
              font-size: 13px;
              color: #e4e4e7;
              line-height: 1.5;
              max-width: 360px;
              margin: 0 auto 20px auto;
              text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
            }
            .perks {
              display: flex;
              justify-content: center;
              gap: 8px;
              margin-bottom: 20px;
              flex-wrap: wrap;
            }
            .perk-item {
              background: rgba(255, 255, 255, 0.12);
              backdrop-filter: blur(8px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              padding: 5px 12px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              color: #ffffff;
            }
            .footer-note {
              border-top: 1px solid rgba(255, 255, 255, 0.15);
              padding-top: 16px;
              font-size: 10px;
              color: #a1a1aa;
              font-family: monospace;
            }
            @media print {
              body {
                padding: 0;
                background: transparent;
              }
              .no-print, .no-print-bar {
                display: none !important;
              }
              .standee-container {
                margin: 0 auto;
                box-shadow: none;
                max-width: 100%;
                border-width: 2.5px;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar no-print">
            <button class="btn btn-primary" onclick="window.print()">
              🖨️ Print Standee (A4 / Tabletop)
            </button>
            <button class="btn btn-secondary" onclick="window.close()">
              Close
            </button>
          </div>

          <div class="standee-container">
            <div class="salon-bg-image"></div>
            <div class="salon-bg-overlay"></div>

            <div class="standee-body">
              <div class="brand-badge">⚡ SLOON Live Pass</div>
              <h1 class="salon-name">${activeSalon.name}</h1>
              <p class="salon-locality">📍 ${localityText}</p>

              <!-- Solid white container with padding & rounded borders for 100% camera visibility -->
              <div class="qr-card-wrapper">
                <img src="${partnerQrDataUrl}" class="qr-code-img" alt="Counter QR Code" />
                <div class="camera-label">📸 SCAN WITH ANY PHONE CAMERA</div>
              </div>

              <div class="cta-title">Scan to Check Wait & Join Queue</div>
              <p class="cta-desc">
                Skip waiting in crowd. Scan to see live barber queue, select services, and take your token immediately.
              </p>

              <div class="perks">
                <span class="perk-item">⚡ Zero App Download</span>
                <span class="perk-item">💈 Live Chair Turn</span>
                <span class="perk-item">₹0 Extra Fee</span>
              </div>

              <div class="footer-note">
                ${directLink}
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Local state for queue manual input
  const [manualQueueInput, setManualQueueInput] = useState<string>('');
  const [isEditingManual, setIsEditingManual] = useState(false);

  // Local state for adding customer with Name & Phone
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [customerServiceInput, setCustomerServiceInput] = useState('Haircut & Styling');
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

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
  const rawInitialPoster = activeSalon?.posterImage || activeSalon?.coverImage || '';
  const cleanInitialPoster = rawInitialPoster.includes('images.unsplash.com') ? '' : rawInitialPoster;
  const [posterUrlInput, setPosterUrlInput] = useState(cleanInitialPoster);
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

  const queueInfo = getQueueDisplay(activeSalon.currentQueue, activeSalon.isOpen, activeSalon.queueStatus);
  const isQueuePaused = activeSalon.queueStatus === 'paused';
  const freshness = getQueueFreshness(activeSalon.lastQueueUpdate);
  const waitTime = getEstimatedWaitMinutes(activeSalon.currentQueue, activeSalon.avgServiceTimeMinutes, activeSalon.activeBarbers);

  // Navigation Items
  const navTabs: { id: OwnerTab; label: string; icon: React.FC<{ className?: string }>; highlight?: boolean }[] = [
    { id: 'live-queue', label: t.liveQueue, icon: Users, highlight: true },
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'services', label: t.services, icon: Scissors },
    { id: 'staff', label: t.staff, icon: UserCheck },
    { id: 'reviews', label: t.reviews, icon: Star },
    { id: 'gallery', label: t.gallery, icon: Film },
    { id: 'analytics', label: t.analytics, icon: BarChart3 },
    { id: 'settings', label: t.settings, icon: Settings }
  ];

  const locationPhotosList = (activeSalon.locationImages && Array.isArray(activeSalon.locationImages))
    ? activeSalon.locationImages.filter(url => !url.includes('images.unsplash.com'))
    : [];

  const workPhotosList = (activeSalon.workImages && Array.isArray(activeSalon.workImages))
    ? activeSalon.workImages.filter(url => !url.includes('images.unsplash.com'))
    : [];

  const handleSaveHeroMedia = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPoster = posterUrlInput.trim();
    const cleanVideo = loopVideoUrlInput.trim();
    const cover = cleanPoster || activeSalon.coverImage || (activeSalon.locationImages && activeSalon.locationImages[0]) || '';
    updateSalonInfo(activeSalon.id, {
      posterImage: cleanPoster || cover,
      coverImage: cover,
      loopVideoUrl: cleanVideo
    });
    triggerNotification('Poster and loop video showcase updated!');
  };

  const handleAddLocationPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationUrl.trim()) return;
    const cleanUrl = newLocationUrl.trim();
    const updated = [cleanUrl, ...locationPhotosList];
    const cover = activeSalon.coverImage || activeSalon.posterImage || cleanUrl;
    updateSalonInfo(activeSalon.id, {
      locationImages: updated,
      coverImage: cover,
      posterImage: activeSalon.posterImage || cover,
      images: [cleanUrl, ...(activeSalon.images || [])]
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
    const cleanUrl = newWorkUrl.trim();
    const updated = [cleanUrl, ...workPhotosList];
    const cover = activeSalon.coverImage || activeSalon.posterImage || cleanUrl;
    updateSalonInfo(activeSalon.id, {
      workImages: updated,
      coverImage: cover,
      posterImage: activeSalon.posterImage || cover,
    });
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

    if (target === 'video') {
      if (file.size > 30 * 1024 * 1024) {
        triggerNotification('Video file is large (>30MB). For fastest streaming, keep under 25MB or use MP4 link.');
      }
      const reader = new FileReader();
      reader.onload = () => {
        setLoopVideoUrlInput(reader.result as string);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Client-side image compression for instant uploads
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1280;
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
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          if (target === 'poster') setPosterUrlInput(compressed);
          else if (target === 'location') setNewLocationUrl(compressed);
          else if (target === 'work') setNewWorkUrl(compressed);
        } else {
          if (target === 'poster') setPosterUrlInput(dataUrl);
          else if (target === 'location') setNewLocationUrl(dataUrl);
          else if (target === 'work') setNewWorkUrl(dataUrl);
        }
      };
      img.onerror = () => {
        if (target === 'poster') setPosterUrlInput(dataUrl);
        else if (target === 'location') setNewLocationUrl(dataUrl);
        else if (target === 'work') setNewWorkUrl(dataUrl);
      };
      img.src = dataUrl;
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

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNameInput.trim()) {
      triggerNotification('Please enter customer name');
      return;
    }
    try {
      setIsSubmittingCustomer(true);
      await addCustomerToQueue(
        customerNameInput.trim(),
        customerPhoneInput.trim() || undefined,
        customerServiceInput.trim() || 'Haircut & Styling'
      );
      setCustomerNameInput('');
      setCustomerPhoneInput('');
      setShowAddCustomerModal(false);
    } catch (err: any) {
      triggerNotification(err?.message || 'Failed to add customer');
    } finally {
      setIsSubmittingCustomer(false);
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
            <div className={`text-xs font-bold ${isQueuePaused ? 'text-amber-300' : activeSalon.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isQueuePaused ? 'Temporarily Paused' : activeSalon.isOpen ? 'Accepting Customers' : 'Currently Closed'}
            </div>
          </div>

          <button
            type="button"
            disabled={!activeSalon.isOpen || isUpdatingQueueStatus}
            onClick={() => updateQueueStatus(activeSalon.id, isQueuePaused ? 'open' : 'paused')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border disabled:opacity-50 disabled:cursor-not-allowed ${
              isQueuePaused
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30'
                : 'bg-zinc-800 border-zinc-600 text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {isUpdatingQueueStatus ? 'Updating...' : isQueuePaused ? '▶ Resume Queue' : 'Ⅱ Pause New Customers'}
          </button>

          <button
            onClick={() => {
              updateSalonInfo(activeSalon.id, { isOpen: !activeSalon.isOpen });
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
          <div className="bg-gradient-to-b from-[#181822] via-[#13131c] to-[#0e0e13] border-2 border-zinc-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 mb-3">
              <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
              <span>Broadcasts Live to All Nearby Customers in Real-Time</span>
            </div>

            <div className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
              {t.currentQueue} ({t.peopleInQueue})
            </div>

            {/* Giant Counter Display */}
            <div className="my-4">
              <div className="text-6xl sm:text-8xl font-black text-white tracking-tight flex items-center justify-center gap-2 drop-shadow-2xl">
                <span className="text-amber-400 font-light text-4xl sm:text-6xl">#</span>
                <span>{activeSalon.currentQueue < 10 ? `0${activeSalon.currentQueue}` : activeSalon.currentQueue}</span>
              </div>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${queueInfo.badgeClass}`}>
                {queueInfo.label}
              </div>

              {/* Verified Location Crowd Report from Customers (Where Is My Train Style) */}
              {latestCrowdReport && (
                <div className="mt-4 max-w-md mx-auto p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left flex items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <div className="text-xs text-emerald-300">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>Customer On-Site Report</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md font-semibold">Verified Location</span>
                      </div>
                      <div className="mt-0.5">
                        <strong>{latestCrowdReport.peopleCount} waiting</strong> • ~<strong>{latestCrowdReport.estimatedWaitMinutes}m wait</strong>
                        {latestCrowdReport.notes && <span className="text-zinc-400 italic"> • "{latestCrowdReport.notes}"</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-xl shrink-0">
                    Live Feedback
                  </span>
                </div>
              )}
            </div>

            {/* The Main Big Touch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto my-4">
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-base sm:text-lg shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>+ {t.addCustomerToQueue.toUpperCase()}</span>
              </button>

              <button
                onClick={() => updateQueue(activeSalon.id, -1)}
                disabled={activeSalon.currentQueue <= 0}
                className={`py-3.5 px-5 rounded-2xl font-black text-base sm:text-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  activeSalon.currentQueue <= 0
                    ? 'bg-zinc-800 text-zinc-600 border border-zinc-700 cursor-not-allowed'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
                }`}
              >
                <Minus className="w-5 h-5 stroke-[3]" />
                <span>- {t.callNext.toUpperCase()}</span>
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
                <span>Completed today: <strong className="text-white">{realCustomersServed} customers</strong></span>
              </div>
            </div>
          </div>

          {/* Live Customer Calling & Queue Roster */}
          <div className="bg-[#14141d] border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl">
            {/* Small Barber Auto-Pilot Explainer Banner */}
            <div className="mb-5 p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 rounded-2xl flex items-start gap-3 text-xs">
              <span className="text-base shrink-0">🤖</span>
              <div className="flex-1">
                <span className="font-extrabold text-amber-300">Customer Self-Service Auto-Pilot Active:</span>
                <span className="text-zinc-300 ml-1">
                  Small barbers do not need to manually tally on the phone while cutting hair! Customers scan your counter QR standee to join, pick services, and tap "Done" when finished. Old tickets auto-expire after service time.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                    {t.waitingCustomersList}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
                      {queueEntries.length} {t.waiting}
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Live tickets from customers who scanned your counter QR standee or joined online.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowStandeeModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-amber-500/30 hover:border-amber-400 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  title={t.printStandee}
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>{t.counterStandee}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ {t.addCustomerToQueue}</span>
                </button>

                <button
                  type="button"
                  onClick={() => refreshQueueEntries(activeSalon.id)}
                  disabled={isLoadingQueue}
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingQueue ? 'animate-spin text-amber-400' : ''}`} />
                </button>

                {queueEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all waiting customers from queue?')) {
                        clearQueue();
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-900 text-zinc-400 hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Customer List or Empty State */}
            {queueEntries.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-zinc-300">No Customers Currently Waiting</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  When walk-ins arrive, use <strong className="text-amber-400">+ ADD CUSTOMER</strong> above or log their name & phone number so you can call them when their turn arrives.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-xs font-bold text-amber-400 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Log First Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStandeeModal(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-xs font-bold text-amber-300 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>Print Counter Standee</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {queueEntries.map((entry, index) => {
                  const isServing = entry.status === 'in_service';
                  const isAbsent = entry.status === 'no_show';
                  const joinedDate = entry.joinedAt ? new Date(entry.joinedAt) : null;
                  const minsAgo = joinedDate ? Math.max(0, Math.floor((Date.now() - joinedDate.getTime()) / 60000)) : null;

                  return (
                    <div
                      key={entry.id || index}
                      className={`rounded-2xl border p-4 transition-all ${
                        isServing
                          ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                          : isAbsent
                            ? 'bg-rose-950/20 border-rose-500/30 shadow-md'
                            : 'bg-[#181824] border-zinc-800 hover:border-zinc-700 shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Ticket Token Badge */}
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${
                            isServing
                              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                              : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                          }`}>
                            <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Token</span>
                            <span className="text-base font-black leading-tight">
                              {entry.ticketNumber || `#0${entry.position || index + 1}`.slice(-3)}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-white">
                                {entry.customerName || `Customer #${index + 1}`}
                              </h4>
                              {isAbsent ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  Marked absent
                                </span>
                              ) : isServing ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                                  At Chair • In Service
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  {entry.position === 1 ? 'Next in Turn' : `Position #${entry.position || 1}`}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                              <span>{entry.serviceName || 'Haircut & Styling'}</span>
                              {minsAgo !== null && (
                                <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  {minsAgo === 0 ? 'Just joined' : `${minsAgo}m waiting`}
                                </span>
                              )}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {entry.arrivalConfirmedAt && (
                                <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  {entry.checkInMethod === 'qr' ? 'QR check-in' : 'Arrived'}
                                </span>
                              )}
                              {entry.departureDetectedAt && !isAbsent && (
                                <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                  {entry.departureReviewRequired ? 'Staff review needed' : 'Departure pending'}
                                </span>
                              )}
                              {(entry.partySize || 1) > 1 && (
                                <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  Group of {entry.partySize}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Direct Calling Action */}
                        {entry.phone ? (
                          <a
                            href={`tel:${entry.phone}`}
                            className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/25 transition-all shrink-0 cursor-pointer"
                            title={`Call ${entry.customerName} on ${entry.phone}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-zinc-500 px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                            Walk-in
                          </span>
                        )}
                      </div>

                      {/* Phone number display if available */}
                      {entry.phone && (
                        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                          <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                            <Phone className="w-3 h-3 text-emerald-400" />
                            {entry.phone}
                          </span>
                        </div>
                      )}

                      {/* Status Action Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isAbsent ? (
                            <button
                              type="button"
                              onClick={() => restoreQueueEntry(entry.id).catch((error) =>
                                triggerNotification(error instanceof Error ? error.message : 'Could not restore ticket')
                              )}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Restore to Queue</span>
                            </button>
                          ) : !isServing && (
                            <button
                              type="button"
                              onClick={() => updateCustomerStatus(entry.id, 'in_service')}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-950/30 text-emerald-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Scissors className="w-3 h-3" />
                              <span>Take to Chair</span>
                            </button>
                          )}
                          {!isAbsent && (
                            <button
                              type="button"
                              onClick={() => updateCustomerStatus(entry.id, 'completed')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500 text-emerald-400 hover:text-black text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Done / Served</span>
                            </button>
                          )}
                          {!isAbsent && entry.departureDetectedAt && entry.departureReviewRequired && (
                            <button
                              type="button"
                              onClick={() => confirmQueueDeparture(entry.id).catch((error) =>
                                triggerNotification(error instanceof Error ? error.message : 'Could not confirm departure')
                              )}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Confirm left</span>
                            </button>
                          )}
                        </div>

                        {!isAbsent && <button
                          type="button"
                          onClick={() => updateCustomerStatus(entry.id, 'cancelled')}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove customer from queue"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD OVERVIEW */}
      {ownerTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards (Real-Time Dynamic Telemetry) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <div className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Customers Today
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {realCustomersServed}
              </div>
              {realCustomersServed > 0 ? (
                <div className="text-[10px] text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> {realCustomersServed} served today
                </div>
              ) : (
                <div className="text-[10px] text-zinc-500 font-medium mt-1">
                  Active tracking from start
                </div>
              )}
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
                ₹{realTodayRevenue.toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                Monthly: ₹{realMonthlyRevenue.toLocaleString()}
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

          {/* Peak Business Hours Visualization (Real-Time Dynamic Hourly Density) */}
          <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  Peak Walk-In Rush Hours
                </h3>
                <p className="text-xs text-zinc-400">
                  Real-time hourly customer density recorded as walk-ins are served
                </p>
              </div>
              <span className="text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-xl">
                {hourlyStats.peakLabel}
              </span>
            </div>

            {/* Visual Bar Graph */}
            <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 border-b border-zinc-800">
              {hourlyStats.bars.map((bar) => (
                <div key={bar.time} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-zinc-400 group-hover:text-amber-400 mb-1 opacity-80">
                    {bar.count}
                  </span>
                  <div
                    style={{ height: bar.height }}
                    className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 ${
                      bar.peak
                        ? 'bg-amber-400 shadow-lg shadow-amber-400/20 group-hover:bg-amber-300'
                        : bar.count > 0
                        ? 'bg-amber-500/60 group-hover:bg-amber-500'
                        : 'bg-zinc-800/80 group-hover:bg-zinc-700'
                    }`}
                  />
                  <span className="text-[10px] text-zinc-500 mt-2 font-medium">
                    {bar.time}
                  </span>
                </div>
              ))}
            </div>

            {!hourlyStats.hasData && (
              <div className="mt-3 text-center text-[11px] text-zinc-500">
                Density bars will dynamically record and spike as walk-in customers take tokens throughout the day.
              </div>
            )}
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
                    src={member.photo || (member as any).avatarUrl || DEFAULT_AVATAR}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                    }}
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">
                Customer Feedback & Owner Replies
              </h2>
              <p className="text-xs text-zinc-400">
                Responding to reviews boosts salon trust and visibility score
              </p>
            </div>
            <button
              onClick={() => fetchSalonReviews(activeSalon.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition-colors"
              title="Refresh reviews"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-3">
            {(activeSalon.reviews || []).length === 0 ? (
              <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-8 text-center text-xs space-y-2">
                <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-zinc-300 font-semibold">No reviews received yet</p>
                <p className="text-zinc-500 max-w-sm mx-auto">
                  When customers submit verified reviews for {activeSalon.name}, they will appear here instantly for you to read and reply.
                </p>
              </div>
            ) : (
              (activeSalon.reviews || []).map((rev) => (
              <div key={rev.id} className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={rev.customerAvatar || DEFAULT_AVATAR}
                      alt={rev.customerName}
                      className="w-7 h-7 rounded-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR;
                      }}
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
                    <p className="text-zinc-300">{typeof rev.ownerReply === "string" ? rev.ownerReply : rev.ownerReply.comment}</p>
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
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ANALYTICS & TRAFFIC REPORTS (Real-Time Dynamic Metrics) */}
      {ownerTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Customers Served Today</span>
              <div className="text-2xl font-black text-white mt-1">{realCustomersServed} Customers</div>
              <span className="text-[10px] text-emerald-400">
                {realCustomersServed > 0 ? `${realCustomersServed} completed walk-ins` : 'Starts from first walk-in today'}
              </span>
            </div>
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Total Revenue Tracked</span>
              <div className="text-2xl font-black text-amber-400 mt-1">₹{realMonthlyRevenue.toLocaleString()}</div>
              <span className="text-[10px] text-zinc-500">Based on live services completed</span>
            </div>
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-xs text-zinc-400">Top In-Demand Service</span>
              <div className="text-2xl font-black text-white mt-1 truncate">{popularServiceStats.name}</div>
              <span className="text-[10px] text-zinc-500 truncate block">{popularServiceStats.note}</span>
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

                {locationPhotosList.length === 0 ? (
                  <div className="p-8 border border-zinc-800 rounded-2xl text-center text-xs text-zinc-500 bg-zinc-900/40 space-y-1">
                    <MapPin className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <div className="font-semibold text-zinc-300">No studio location photos added yet</div>
                    <p className="text-zinc-500 text-[11px]">Upload photos of your salon chairs, waiting lounge, and exterior front facade.</p>
                  </div>
                ) : (
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
                )}
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

                {workPhotosList.length === 0 ? (
                  <div className="p-8 border border-zinc-800 rounded-2xl text-center text-xs text-zinc-500 bg-zinc-900/40 space-y-1">
                    <Scissors className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <div className="font-semibold text-zinc-300">No haircut portfolio photos added yet</div>
                    <p className="text-zinc-500 text-[11px]">Upload photos of real cuts, beard trims, and styling transformations done at your studio.</p>
                  </div>
                ) : (
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
                )}
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
              Directs verified SLOON customers to your official Google Business Profile review dialog after leaving feedback.
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

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPartnerView('register')}
              className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all hover:text-white"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Add Another Branch / Studio</span>
            </button>
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

      {/* Modal: Add Customer with Details (Name & Phone for Calling) */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14141d] border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white">Add Customer to Live Queue</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Customer Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Mobile / Phone Number <span className="text-zinc-500">(For 1-tap calling)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Service Requested
                </label>
                <input
                  type="text"
                  placeholder="e.g. Haircut & Beard Grooming"
                  value={customerServiceInput}
                  onChange={(e) => setCustomerServiceInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomer}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCustomer ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Generate Ticket & Add</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COUNTER QR STANDEE PREVIEW & PRINT MODAL */}
      {showStandeeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12121a] border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-['Syne',sans-serif]">
                    Counter QR Standee
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Tabletop poster with your salon photo background
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStandeeModal(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {partnerQrError && (
              <div className="my-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
                {partnerQrError}. Apply the SmartQueue database migration and reload this page.
              </div>
            )}

            {/* Standee Live Card Preview with Salon Background & White Padded Rounded QR Container */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl p-5 text-center my-4 group">
              {/* Salon Shop Photo in Background */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${
                    activeSalon.coverImage ||
                    (activeSalon.images && activeSalon.images[0]) ||
                    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80'
                  })`,
                  filter: 'brightness(0.32) saturate(1.2)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-stone-950/75 to-black/95" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
                  <span>⚡ Official Walk-In Partner</span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne',sans-serif] drop-shadow-md">
                  {activeSalon.name}
                </h3>
                <p className="text-[11px] text-zinc-300 mb-2 drop-shadow">
                  📍 {activeSalon.locality || activeSalon.address}
                </p>

                {/* Solid White Padded Container with Rounded Borders for 100% Camera Scannability */}
                <div className="bg-white p-3.5 pb-2.5 rounded-3xl border-3 border-amber-500 shadow-2xl shadow-black/80 my-1">
                  {partnerQrDataUrl ? (
                    <img
                      src={partnerQrDataUrl}
                      alt={`QR Code for ${activeSalon.name}`}
                      className="w-40 h-40 object-contain rounded-xl"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center text-zinc-400 text-xs">
                      Generating QR...
                    </div>
                  )}
                  <div className="mt-1.5 px-2 py-0.5 rounded-full bg-zinc-900 text-amber-400 text-[9px] font-black tracking-wider uppercase inline-block">
                    📸 Scan with phone camera
                  </div>
                </div>

                <div className="text-xs font-black text-amber-300 mt-2 drop-shadow">
                  Scan to Check Wait & Join Queue
                </div>
                <div className="text-[10px] text-zinc-300 mt-0.5 max-w-xs drop-shadow">
                  Place this standee on your counter for customer walk-in check-in
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 my-3">
              <label htmlFor="smart-queue-radius" className="flex-1 text-[11px] font-semibold text-zinc-300">
                Location assistance radius (50–500 m)
              </label>
              <input
                id="smart-queue-radius"
                type="number"
                min={50}
                max={500}
                value={geofenceRadius}
                onChange={(event) => setGeofenceRadius(Number(event.target.value))}
                className="w-20 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={async () => {
                  try {
                    await updateSmartQueueRadius(geofenceRadius);
                  } catch (error) {
                    triggerNotification(error instanceof Error ? error.message : 'Could not save SmartQueue radius');
                  }
                }}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-black"
              >
                Save
              </button>
            </div>

            {/* Direct URL input with copy */}
            <div className="space-y-1.5 my-3">
              <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Your Customer Direct Queue Link</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getCustomerQueueUrl(activeSalon.id)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = getCustomerQueueUrl(activeSalon.id);
                    navigator.clipboard.writeText(url);
                    setCopiedQueueLink(true);
                    setTimeout(() => setCopiedQueueLink(false), 2500);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedQueueLink
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                  }`}
                >
                  {copiedQueueLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedQueueLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Print, Download, Close */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintDeskStandee}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Standee (A4)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!partnerQrDataUrl) return;
                  const a = document.createElement('a');
                  a.href = partnerQrDataUrl;
                  a.download = `${activeSalon.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_qr.png`;
                  a.click();
                }}
                className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download QR PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
