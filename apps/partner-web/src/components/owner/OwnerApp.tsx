import React, { useState, useEffect, useMemo } from 'react';
import { useSalon, getEstimatedWaitMinutes, formatDuration, formatWaitTime, getQueueDisplay, getQueueFreshness, DEFAULT_AVATAR } from '../../context/PartnerContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { SalonOffer, DEFAULT_SALON_OFFERS } from '@kumbhakaran/shared-types';
import { safeStorage } from '../../utils/safeStorage';
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
  Compass,
  Navigation,
  Crosshair,
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
  X,
  Home,
  Sparkles,
  ChevronDown,
  PlusCircle,
  ArrowRight,
  Tag,
  ShieldCheck
} from 'lucide-react';
import QRCode from 'qrcode';
import { OwnerTab, Service, Staff, QueueEntry, HOME_VISIT_CATEGORIES, HomeVisitBookingRequest, HomeVisitCategory, SalonMarketingConfig } from '@kumbhakaran/shared-types';
import { SalonGrowthMarketingManager } from './SalonGrowthMarketingManager';
import { SloonBusinessInsightsView } from './SloonBusinessInsightsView';
import { openGoogleMapsLocation } from '@kumbhakaran/ui';
import { SalonLocationPicker, LocationPickerResult } from '../partner/SalonLocationPicker';
import { PendingApprovalScreen } from '../partner/PendingApprovalScreen';
import { InstagramGradientIcon } from '../common/InstagramIcon';
import logoFallback from '../../assets/logo.png';
import logoTransparent from '../../assets/logo-transparent.png';
import { defaultApiClient } from '@kumbhakaran/api-client';

export interface OwnerAppProps {
  onOpenWalkthrough?: () => void;
}

export const OwnerApp: React.FC<OwnerAppProps> = ({ onOpenWalkthrough }) => {
  const {
    activeSalon,
    salons = [],
    setActiveSalonId,
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
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);

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
              Print Desk Standee (A4)
            </button>
            <button class="btn btn-secondary" onclick="window.close()">
              Close
            </button>
          </div>

          <div class="standee-container">
            <div class="salon-bg-image"></div>
            <div class="salon-bg-overlay"></div>

            <div class="standee-body">
              <div class="brand-badge">SLOON Live Pass</div>
              <h1 class="salon-name">${activeSalon.name}</h1>
              <p class="salon-locality">${localityText}</p>

              <!-- Solid white container with padding & rounded borders for 100% camera visibility -->
              <div class="qr-card-wrapper">
                <img src="${partnerQrDataUrl}" class="qr-code-img" alt="Counter QR Code" />
                <div class="camera-label">SCAN WITH ANY PHONE CAMERA</div>
              </div>

              <div class="cta-title">Scan to Check Wait & Join Queue</div>
              <p class="cta-desc">
                Skip waiting in crowd. Scan to see live barber queue, select services, and take your token immediately.
              </p>

              <div class="perks">
                <span class="perk-item">Zero App Download</span>
                <span class="perk-item">Live Chair Turn</span>
                <span class="perk-item">Direct Cash & UPI</span>
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

  // Offers & Spin-to-Win deals state
  const salonOffers: SalonOffer[] = useMemo(() => {
    if (Array.isArray(activeSalon.offers) && activeSalon.offers.length > 0) {
      return activeSalon.offers;
    }
    return DEFAULT_SALON_OFFERS;
  }, [activeSalon.offers]);

  // Doorstep & Home Visit booking requests state (Database Synchronized)
  const [doorstepRequests, setDoorstepRequests] = useState<HomeVisitBookingRequest[]>(() => {
    try {
      const saved = localStorage.getItem('sloon_home_visit_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // Query live doorstep bookings from Database via API
  useEffect(() => {
    if (!activeSalon?.id) return;
    defaultApiClient.getHomeVisitBookings(activeSalon.id).then((dbList) => {
      if (Array.isArray(dbList) && dbList.length > 0) {
        setDoorstepRequests(dbList);
      }
    });
  }, [activeSalon?.id]);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SalonOffer | null>(null);
  const [offerForm, setOfferForm] = useState<{
    title: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'flat' | 'free_service';
    discountValue: number;
    minSpend: number;
    validTill: string;
    inSpinWheel: boolean;
    color: string;
    isActive: boolean;
  }>({
    title: '',
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 20,
    minSpend: 250,
    validTill: 'Valid all week',
    inSpinWheel: true,
    color: '#FF6422',
    isActive: true,
  });

  const handleOpenAddOffer = () => {
    setEditingOffer(null);
    setOfferForm({
      title: '',
      code: `OFFER${Math.floor(10 + Math.random() * 90)}`,
      description: '',
      discountType: 'percentage',
      discountValue: 20,
      minSpend: 250,
      validTill: 'Valid all week',
      inSpinWheel: true,
      color: '#FF6422',
      isActive: true,
    });
    setShowOfferModal(true);
  };

  const handleOpenEditOffer = (offer: SalonOffer) => {
    setEditingOffer(offer);
    setOfferForm({
      title: offer.title,
      code: offer.code,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      minSpend: offer.minSpend || 0,
      validTill: offer.validTill || 'Valid all week',
      inSpinWheel: offer.inSpinWheel,
      color: offer.color || '#FF6422',
      isActive: offer.isActive,
    });
    setShowOfferModal(true);
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.title.trim() || !offerForm.code.trim()) {
      triggerNotification('Please enter an offer title and coupon code');
      return;
    }

    let updatedOffers: SalonOffer[];
    if (editingOffer) {
      updatedOffers = salonOffers.map((o) =>
        o.id === editingOffer.id
          ? {
              ...o,
              ...offerForm,
              code: offerForm.code.trim().toUpperCase(),
            }
          : o
      );
      triggerNotification(`Offer "${offerForm.title}" updated successfully!`);
    } else {
      const newOffer: SalonOffer = {
        id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...offerForm,
        code: offerForm.code.trim().toUpperCase(),
      };
      updatedOffers = [newOffer, ...salonOffers];
      triggerNotification(`New Offer "${offerForm.title}" added to salon!`);
    }

    updateSalonInfo(activeSalon.id, { offers: updatedOffers });
    try {
      safeStorage.setItem(`sloon_salon_offers_${activeSalon.id}`, JSON.stringify(updatedOffers));
    } catch {}
    setShowOfferModal(false);
  };

  const handleDeleteOffer = (offerId: string) => {
    const updated = salonOffers.filter((o) => o.id !== offerId);
    updateSalonInfo(activeSalon.id, { offers: updated });
    try {
      safeStorage.setItem(`sloon_salon_offers_${activeSalon.id}`, JSON.stringify(updated));
    } catch {}
    triggerNotification('Offer deleted.');
  };

  const handleToggleOfferSpinWheel = (offerId: string) => {
    const updated = salonOffers.map((o) =>
      o.id === offerId ? { ...o, inSpinWheel: !o.inSpinWheel } : o
    );
    updateSalonInfo(activeSalon.id, { offers: updated });
    try {
      safeStorage.setItem(`sloon_salon_offers_${activeSalon.id}`, JSON.stringify(updated));
    } catch {}
    triggerNotification('Updated spin wheel inclusion.');
  };

  const handleUpdateMarketingConfig = (newConfig: SalonMarketingConfig) => {
    updateSalonInfo(activeSalon.id, { marketingConfig: newConfig });
    void defaultApiClient.updateSalonMarketing(activeSalon.id, newConfig).catch(() => {});
    try {
      safeStorage.setItem(`sloon_salon_marketing_${activeSalon.id}`, JSON.stringify(newConfig));
    } catch {}
    triggerNotification('Salon revenue & marketing campaigns published!');
  };

  const handleToggleOfferActive = (offerId: string) => {
    const updated = salonOffers.map((o) =>
      o.id === offerId ? { ...o, isActive: !o.isActive } : o
    );
    updateSalonInfo(activeSalon.id, { offers: updated });
    try {
      safeStorage.setItem(`sloon_salon_offers_${activeSalon.id}`, JSON.stringify(updated));
    } catch {}
    triggerNotification('Offer status updated.');
  };

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
    salonType: (activeSalon as any)?.salonType || 'men',
    startingPrice: activeSalon?.startingPrice || 150,
    phone: activeSalon?.phone || '',
    instagramHandle: activeSalon?.instagramHandle || (activeSalon as any)?.instagram_handle || '',
    instagramUrl: activeSalon?.instagramUrl || (activeSalon as any)?.instagram_url || '',
    address: activeSalon?.address || '',
    locality: activeSalon?.locality || '',
    city: activeSalon?.city || '',
    state: activeSalon?.state || 'Chhattisgarh',
    pincode: activeSalon?.pincode || '',
    latitude: activeSalon?.coordinates?.lat || Number((activeSalon as any)?.latitude) || 28.6139,
    longitude: activeSalon?.coordinates?.lng || Number((activeSalon as any)?.longitude) || 77.2090,
    openingHoursOpen: activeSalon?.openingHours?.open || '09:00 AM',
    openingHoursClose: activeSalon?.openingHours?.close || '09:30 PM',
    openingDays: 'All Days',
    openingHours: activeSalon?.openingHours?.formatted || (activeSalon as any)?.openingHoursFormatted || '09:00 AM – 09:30 PM (All Days)',
    isOpen: activeSalon?.isOpen ?? true,
    googlePlaceId: (activeSalon as any)?.googlePlaceId || ''
  }));

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempLocation, setTempLocation] = useState<LocationPickerResult | null>(null);
  const [showPreviewCard, setShowPreviewCard] = useState(true);

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
        salonType: (activeSalon as any)?.salonType || 'men',
        startingPrice: activeSalon.startingPrice || 150,
        phone: activeSalon.phone || '',
        instagramHandle: activeSalon.instagramHandle || (activeSalon as any)?.instagram_handle || '',
        instagramUrl: activeSalon.instagramUrl || (activeSalon as any)?.instagram_url || '',
        address: activeSalon.address || '',
        locality: activeSalon.locality || '',
        city: activeSalon.city || '',
        state: activeSalon.state || 'Chhattisgarh',
        pincode: activeSalon.pincode || '',
        latitude: activeSalon.coordinates?.lat || Number((activeSalon as any)?.latitude) || 28.6139,
        longitude: activeSalon.coordinates?.lng || Number((activeSalon as any)?.longitude) || 77.2090,
        openingHoursOpen: activeSalon.openingHours?.open || '09:00 AM',
        openingHoursClose: activeSalon.openingHours?.close || '09:30 PM',
        openingDays: 'All Days',
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

  // Gate platform access: new salons must be approved by an Admin before accessing the platform
  if (!activeSalon.isVerified || activeSalon.status === 'pending') {
    return <PendingApprovalScreen onEditDetails={() => setPartnerView('register')} />;
  }

  const queueInfo = getQueueDisplay(activeSalon.currentQueue, activeSalon.isOpen, activeSalon.queueStatus);
  const isQueuePaused = activeSalon.queueStatus === 'paused';
  const freshness = getQueueFreshness(activeSalon.lastQueueUpdate);
  const waitTime = getEstimatedWaitMinutes(activeSalon.currentQueue, activeSalon.avgServiceTimeMinutes, activeSalon.activeBarbers);
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Navigation Items
  const navTabs: { id: OwnerTab; label: string; icon: React.FC<{ className?: string }>; highlight?: boolean }[] = [
    { id: 'home', label: t.home || 'Home', icon: Home },
    { id: 'live-queue', label: t.liveQueue, icon: Users, highlight: true },
    { id: 'doorstep', label: 'Doorstep Visits 🏠', icon: Home, highlight: true },
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'services', label: t.services, icon: Scissors },
    { id: 'offers', label: 'Offers & Deals', icon: Tag, highlight: true },
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
    const formattedHours = `${salonForm.openingHoursOpen} – ${salonForm.openingHoursClose} (${salonForm.openingDays})`;
    updateSalonInfo(activeSalon.id, {
      name: salonForm.name.trim(),
      tagline: salonForm.tagline.trim(),
      salonType: salonForm.salonType as any,
      startingPrice: Number(salonForm.startingPrice) || 150,
      phone: salonForm.phone.trim(),
      instagramHandle: salonForm.instagramHandle.trim(),
      instagramUrl: salonForm.instagramUrl.trim(),
      address: salonForm.address.trim(),
      locality: salonForm.locality.trim(),
      city: salonForm.city.trim(),
      state: salonForm.state.trim(),
      pincode: salonForm.pincode.trim(),
      coordinates: {
        lat: Number(salonForm.latitude),
        lng: Number(salonForm.longitude),
      },
      isOpen: salonForm.isOpen,
      googlePlaceId: salonForm.googlePlaceId.trim(),
      openingHours: {
        open: salonForm.openingHoursOpen,
        close: salonForm.openingHoursClose,
        formatted: formattedHours,
      }
    });
    triggerNotification('Salon profile & pinpoint location saved successfully!');
  };

  return (
    <div className="max-w-md sm:max-w-2xl mx-auto space-y-4 sm:space-y-5 pb-28 text-stone-900">
      {/* 
        HOME TAB SCREEN: Matches mobile layout from sloon partner design exactly!
      */}
      {ownerTab === 'home' ? (
        <div className="space-y-4">
          {/* 1. Dynamic Greeting Header */}
          <div className="pt-1 px-0.5 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 tracking-tight leading-snug">
                {timeGreeting},<br />
                {activeSalon.name}
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
                Studio reception and daily walk-in command.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 bg-white border border-[#E8E2D8] px-2.5 py-1.5 rounded-2xl shadow-2xs">
              <img
                src={logoFallback}
                alt="SLOON"
                className="h-6 sm:h-7 w-auto object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = logoTransparent;
                }}
              />
              <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-[#FFF3EC] text-[#E05326]">
                Partner
              </span>
            </div>
          </div>

          {/* 2. Branch / Salon Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSalonDropdownOpen(!salonDropdownOpen)}
              className="w-full bg-white border border-[#EFE8DC] rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xs hover:border-orange-400 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Store className="w-4 h-4 text-stone-700 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                  {activeSalon.name} {activeSalon.locality ? `– ${activeSalon.locality}` : ''}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
            </button>

            {salonDropdownOpen && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-stone-200 rounded-2xl shadow-xl p-2 z-40 space-y-1">
                <div className="text-[10px] uppercase font-bold text-stone-400 px-3 py-1">
                  Your Studios ({salons.length})
                </div>
                {salons.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveSalonId(s.id);
                      setSalonDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                      activeSalon.id === s.id
                        ? 'bg-[#FFF3EC] text-[#E05326] font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-stone-900 truncate">{s.name}</div>
                      <div className="text-[10px] text-stone-500">{s.locality} • Queue: {s.currentQueue} waiting</div>
                    </div>
                    {activeSalon.id === s.id && <Check className="w-4 h-4 text-[#E05326]" />}
                  </button>
                ))}
                <div className="pt-1 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPartnerView('register')}
                    className="text-left px-3 py-2 text-xs font-bold text-[#E05326] hover:bg-[#FFF3EC] rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Register New Studio</span>
                  </button>
                  {onOpenWalkthrough && (
                    <button
                      type="button"
                      onClick={onOpenWalkthrough}
                      className="px-3 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 rounded-xl flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Walkthrough</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Operational Status Bar (3-State Controls: Live Open | Paused | Closed) */}
          <div className="bg-[#1E130D] border border-[#3E2417] rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 text-white shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isQueuePaused
                  ? 'bg-amber-400 shadow-[0_0_8px_#FBBF24]'
                  : activeSalon.isOpen
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34D399]'
                  : 'bg-rose-500 shadow-[0_0_8px_#F43F5E]'
              }`} />
              <div>
                <span className="text-xs sm:text-sm font-bold tracking-tight block text-stone-100">
                  {isQueuePaused ? 'Walk-ins Paused' : activeSalon.isOpen ? 'Walk-ins Live' : 'Studio Closed'}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  {isQueuePaused
                    ? 'Existing customers wait in line; new walk-ins blocked'
                    : activeSalon.isOpen
                    ? 'Accepting live walk-in entries'
                    : 'Studio and walk-in queue shut down'}
                </span>
              </div>
            </div>

            {/* 3-State Operational Segmented Control */}
            <div className="flex items-center gap-1 bg-[#291810] p-1 rounded-xl border border-[#3E2417]">
              <button
                type="button"
                disabled={isUpdatingQueueStatus}
                onClick={() => updateQueueStatus(activeSalon.id, 'open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeSalon.isOpen && !isQueuePaused
                    ? 'bg-emerald-500 text-white shadow-sm font-black'
                    : 'text-stone-300 hover:text-white hover:bg-[#3E2417]/60'
                }`}
                title="Turn ON Walk-ins (Open Live Queue)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block" />
                <span>Live</span>
              </button>

              <button
                type="button"
                disabled={isUpdatingQueueStatus}
                onClick={() => updateQueueStatus(activeSalon.id, 'paused')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isQueuePaused
                    ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                    : 'text-stone-300 hover:text-white hover:bg-[#3E2417]/60'
                }`}
                title="Pause Walk-ins (Keeps current line, blocks new joins)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
                <span>Pause</span>
              </button>

              <button
                type="button"
                disabled={isUpdatingQueueStatus}
                onClick={() => {
                  if (activeSalon.currentQueue > 0) {
                    if (window.confirm('Closing the studio will end active queue entries for the day. Are you sure you want to close?')) {
                      updateQueueStatus(activeSalon.id, 'closed');
                    }
                  } else {
                    updateQueueStatus(activeSalon.id, 'closed');
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  !activeSalon.isOpen
                    ? 'bg-rose-600 text-white shadow-sm font-black'
                    : 'text-stone-300 hover:text-white hover:bg-[#3E2417]/60'
                }`}
                title="Turn OFF Studio (Closes queue for the day)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-300 inline-block" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* 5. Live Queue Card (White card with People Waiting and Stepper) */}
          <div className="bg-white border border-[#EFE8DC] rounded-3xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-800" />
                <h3 className="text-sm font-black text-stone-900">Live Queue</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>≈ {formatDuration(waitTime)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl sm:text-5xl font-black text-[#E05326] font-serif leading-none">
                  {activeSalon.currentQueue}
                </span>
                <span className="text-xs sm:text-sm font-bold text-stone-700">
                  People Waiting
                </span>
              </div>

              {/* Stepper buttons: -1 and +1 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateQueue(activeSalon.id, -1)}
                  disabled={activeSalon.currentQueue <= 0}
                  className="w-11 h-9 rounded-xl bg-[#FFF3EC] hover:bg-[#FFE6D8] border border-[#FED7CC] text-[#E05326] font-black text-sm flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-2xs"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => updateQueue(activeSalon.id, 1)}
                  className="w-11 h-9 rounded-xl bg-[#FFF3EC] hover:bg-[#FFE6D8] border border-[#FED7CC] text-[#E05326] font-black text-sm flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                >
                  +1
                </button>
              </div>
            </div>

            {/* Solid Vibrant Orange Action Button */}
            <button
              type="button"
              onClick={() => setOwnerTab('live-queue')}
              className="w-full py-3.5 rounded-2xl bg-[#E05326] hover:bg-[#D4481D] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Open Queue Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 6. Today's Performance Card */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-stone-900">Today's Performance</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Live Today</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {/* Served */}
              <div className="bg-white border border-[#EFE8DC] rounded-2xl p-3 shadow-2xs text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 text-stone-700">
                  <Users className="w-3.5 h-3.5 text-[#E05326]" />
                  <span className="text-base sm:text-lg font-black text-stone-900">{realCustomersServed}</span>
                </div>
                <span className="text-[10px] text-stone-500 font-semibold mt-0.5">Served</span>
              </div>

              {/* Revenue */}
              <div className="bg-white border border-[#EFE8DC] rounded-2xl p-3 shadow-2xs text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-1 text-stone-700">
                  <span className="text-xs font-bold text-[#E05326]">₹</span>
                  <span className="text-base sm:text-lg font-black text-stone-900">
                    {Number(realTodayRevenue).toLocaleString('en-IN')}
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 font-semibold mt-0.5">Revenue</span>
              </div>

              {/* Stylists */}
              <div className="bg-white border border-[#EFE8DC] rounded-2xl p-3 shadow-2xs text-center flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 text-stone-700">
                  <Scissors className="w-3.5 h-3.5 text-[#E05326]" />
                  <span className="text-base sm:text-lg font-black text-stone-900">{activeSalon.activeBarbers}</span>
                </div>
                <span className="text-[10px] text-stone-500 font-semibold mt-0.5">Stylists</span>
              </div>
            </div>
          </div>

          {/* 7. Quick Tools Section (4-Box Grid) */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-black text-stone-900 px-1">Quick Tools</h3>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {/* Prices */}
              <button
                type="button"
                onClick={() => setOwnerTab('services')}
                className="bg-white hover:bg-stone-50 border border-[#EFE8DC] rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] text-[#E05326] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Tag className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-stone-800 mt-2">Prices</span>
              </button>

              {/* Staff */}
              <button
                type="button"
                onClick={() => setOwnerTab('staff')}
                className="bg-white hover:bg-stone-50 border border-[#EFE8DC] rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] text-[#E05326] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-stone-800 mt-2">Staff</span>
              </button>

              {/* Media */}
              <button
                type="button"
                onClick={() => setOwnerTab('gallery')}
                className="bg-white hover:bg-stone-50 border border-[#EFE8DC] rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] text-[#E05326] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-stone-800 mt-2">Media</span>
              </button>

              {/* Setup */}
              <button
                type="button"
                onClick={() => setOwnerTab('settings')}
                className="bg-white hover:bg-stone-50 border border-[#EFE8DC] rounded-2xl p-3 sm:p-4 text-center flex flex-col items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] text-[#E05326] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-stone-800 mt-2">Setup</span>
              </button>
            </div>
          </div>

          {/* 8. Desk QR Standee Quick Action Bar */}
          <div className="flex items-center justify-between bg-white border border-[#EFE8DC] rounded-2xl px-4 py-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-4 h-4 text-[#E05326]" />
              <span className="text-xs font-bold text-stone-800">Counter QR Standee</span>
            </div>
            <button
              type="button"
              onClick={() => setShowStandeeModal(true)}
              className="text-xs font-bold text-[#E05326] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Standee ↗</span>
            </button>
          </div>
        </div>
      ) : (
        /* Sleek Minimal Breadcrumb Bar on Sub-Pages */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 pt-1 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setOwnerTab('home')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-600 hover:text-[#E05326] hover:border-orange-300 transition-all cursor-pointer shadow-2xs"
              >
                <Home className="w-3.5 h-3.5 text-[#E05326]" />
                <span>Home</span>
              </button>
              <span className="text-stone-400 text-xs font-bold">/</span>
              <span className="text-xs font-black text-[#E05326] uppercase tracking-wider">
                {navTabs.find((t) => t.id === ownerTab)?.label || ownerTab}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 hidden sm:inline">{activeSalon.name}</span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isQueuePaused
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : activeSalon.isOpen
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isQueuePaused ? 'bg-amber-500' : activeSalon.isOpen ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
                <span>{isQueuePaused ? 'Paused' : activeSalon.isOpen ? 'Live' : 'Closed'}</span>
              </span>
            </div>
          </div>

          {/* Page-in-Page Operational Sub-Tabs (Clean, tactile, scrollable across all screen sizes) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1 no-scrollbar border-b border-stone-200">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = ownerTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOwnerTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#E05326] text-white shadow-sm font-black'
                      : 'bg-white text-stone-600 border border-stone-200/90 hover:text-stone-900 hover:bg-stone-50 hover:border-stone-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 1: LIVE QUEUE MANAGEMENT (THE CORE B2B FUNCTIONALITY) */}
      {ownerTab === 'live-queue' && (
        <div className="space-y-6">
          {/* Stale Data Warning Banner if not updated recently */}
          {freshness.isStale && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-900">
                    Queue Update Recommended!
                  </h4>
                  <p className="text-amber-700 text-[11px]">
                    Last updated {freshness.text}. Customers trust studios with fresh walk-in numbers.
                  </p>
                </div>
              </div>

              <button
                onClick={() => updateQueue(activeSalon.id, 0, activeSalon.currentQueue)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow transition-colors shrink-0"
              >
                Confirm Current Count ({activeSalon.currentQueue}) is Correct
              </button>
            </div>
          )}

          {/* Big Live Queue Control Station */}
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-8 shadow-xs relative overflow-hidden text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-stone-200 text-xs font-semibold text-stone-600 mb-3">
              <span className={`w-2 h-2 rounded-full ${queueInfo.dotClass}`} />
              <span>Broadcasts Live to All Nearby Customers in Real-Time</span>
            </div>

            <div className="text-xs font-bold uppercase tracking-wider text-stone-400">
              {t.currentQueue} ({t.peopleInQueue})
            </div>

            {/* Giant Counter Display */}
            <div className="my-4">
              <div className="text-6xl sm:text-8xl font-black text-[#E05326] font-serif tracking-tight flex items-center justify-center gap-2">
                <span className="text-orange-200 font-light text-4xl sm:text-6xl">#</span>
                <span>{activeSalon.currentQueue < 10 ? `0${activeSalon.currentQueue}` : activeSalon.currentQueue}</span>
              </div>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${queueInfo.badgeClass}`}>
                {queueInfo.label}
              </div>

              {/* Verified Location Crowd Report from Customers (Where Is My Train Style) */}
              {latestCrowdReport && (
                <div className="mt-4 max-w-md mx-auto p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-left flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <div className="text-xs text-emerald-900">
                      <div className="font-bold text-stone-900 flex items-center gap-1.5">
                        <span>Customer On-Site Report</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-semibold">Verified Location</span>
                      </div>
                      <div className="mt-0.5 text-stone-600">
                        <strong className="text-stone-900">{latestCrowdReport.peopleCount} waiting</strong> • ~<strong>{formatDuration(latestCrowdReport.estimatedWaitMinutes)} wait</strong>
                        {latestCrowdReport.notes && <span className="text-stone-500 italic"> • "{latestCrowdReport.notes}"</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-xl shrink-0">
                    Live Feedback
                  </span>
                </div>
              )}
            </div>

            {/* The Main Big Touch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto my-4">
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="py-3.5 px-5 rounded-2xl bg-[#E05326] hover:bg-[#D0481E] text-white font-black text-base sm:text-lg shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>+ {t.addCustomerToQueue.toUpperCase()}</span>
              </button>

              <button
                onClick={() => updateQueue(activeSalon.id, -1)}
                disabled={activeSalon.currentQueue <= 0}
                className={`py-3.5 px-5 rounded-2xl font-black text-base sm:text-lg shadow-2xs active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  activeSalon.currentQueue <= 0
                    ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
                    : 'bg-[#24140A] hover:bg-[#1A0E07] text-white border border-[#3E2417]'
                }`}
              >
                <Minus className="w-5 h-5 stroke-[3]" />
                <span>- {t.callNext.toUpperCase()}</span>
              </button>
            </div>

            {/* Quick Adjustment Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
              <span className="text-xs text-stone-500 mr-1">Quick:</span>
              <button
                onClick={() => updateQueue(activeSalon.id, 2)}
                className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-orange-300 text-xs font-bold text-stone-700 shadow-2xs cursor-pointer"
              >
                +2 People
              </button>
              <button
                onClick={() => updateQueue(activeSalon.id, 5)}
                className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-orange-300 text-xs font-bold text-stone-700 shadow-2xs cursor-pointer"
              >
                +5 Rush Group
              </button>
              <button
                onClick={() => updateQueue(activeSalon.id, 0, 0)}
                className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 hover:border-rose-300 text-xs font-bold text-rose-600 shadow-2xs cursor-pointer"
              >
                Reset to 0
              </button>

              <button
                onClick={() => setIsEditingManual(!isEditingManual)}
                className="px-3 py-1.5 rounded-xl bg-[#FFF3EC] border border-[#FED7CC] text-xs font-bold text-[#E05326] shadow-2xs cursor-pointer"
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
                  className="w-28 px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 text-center font-bold focus:outline-none focus:border-[#E05326]"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-[#E05326] text-white font-bold text-xs hover:bg-[#D0481E] cursor-pointer"
                >
                  Set Count
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingManual(false)}
                  className="px-2 py-2 text-xs text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}

            {/* Live Queue Metadata */}
            <div className="mt-8 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E05326]" />
                <span>Last updated: <strong className="text-stone-800">{freshness.text}</strong></span>
              </div>

              <div>
                <span>Est. customer wait time: <strong className="text-emerald-700">~{formatDuration(waitTime)}</strong></span>
              </div>

              <div>
                <span>Completed today: <strong className="text-stone-800">{realCustomersServed} customers</strong></span>
              </div>
            </div>
          </div>

          {/* Live Customer Calling & Queue Roster */}
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-7 shadow-xs">
            {/* Salon Reception & Standee Check-In Notice */}
            <div className="mb-5 p-3.5 bg-[#FFF8F3] border border-[#FED7CC] rounded-2xl flex items-start gap-3 text-xs">
              <Sparkles className="w-4 h-4 text-[#C85322] shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-black text-[#C85322]">Self-Check-In Standee Active:</span>
                <span className="text-stone-700 ml-1">
                  Clients scan your counter standee QR, select their desired service, and receive their queue ticket without manual tallying. You stay focused on clients — the queue updates in real-time.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2 font-serif">
                    {t.waitingCustomersList}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC] font-bold">
                      {queueEntries.length} {t.waiting}
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Live tickets from customers who scanned your counter QR standee or joined online.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowStandeeModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-orange-300 text-[#E05326] font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title={t.printStandee}
                >
                  <QrCode className="w-4 h-4 text-[#E05326]" />
                  <span>{t.counterStandee}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ {t.addCustomerToQueue}</span>
                </button>

                <button
                  type="button"
                  onClick={() => refreshQueueEntries(activeSalon.id)}
                  disabled={isLoadingQueue}
                  className="p-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-all cursor-pointer shadow-2xs"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingQueue ? 'animate-spin text-[#E05326]' : ''}`} />
                </button>

                {queueEntries.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Clear all waiting customers from queue?')) {
                        clearQueue();
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Customer List or Empty State */}
            {queueEntries.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center mx-auto mb-3 text-stone-400">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-stone-900">No Customers Currently Waiting</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  When walk-ins arrive, use <strong className="text-[#E05326]">+ ADD CUSTOMER</strong> above or log their name & phone number so you can call them when their turn arrives.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomerModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#FFF3EC] border border-[#FED7CC] hover:bg-orange-100 text-xs font-bold text-[#E05326] inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Log First Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStandeeModal(true)}
                    className="px-4 py-2 rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#E05326]" />
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
                          ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
                          : isAbsent
                            ? 'bg-rose-50/60 border-rose-200 shadow-2xs'
                            : 'bg-white border-[#E8E2D8] hover:border-orange-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* Ticket Token Badge */}
                          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${
                            isServing
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-[#FFF3EC] border border-[#FED7CC] text-[#E05326]'
                          }`}>
                            <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Token</span>
                            <span className="text-base font-black leading-tight">
                              {entry.ticketNumber || `#0${entry.position || index + 1}`.slice(-3)}
                            </span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-stone-900">
                                {entry.customerName || `Customer #${index + 1}`}
                              </h4>
                              {isAbsent ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                  Marked absent
                                </span>
                              ) : isServing ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                  At Chair • In Service
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#E05326] border border-orange-200">
                                  {entry.position === 1 ? 'Next in Turn' : `Position #${entry.position || 1}`}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                              <span>{entry.serviceName || 'Haircut & Styling'}</span>
                              {minsAgo !== null && (
                                <span className="text-stone-400 text-[11px] flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  {minsAgo === 0 ? 'Just joined' : `${formatDuration(minsAgo)} waiting`}
                                </span>
                              )}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {entry.arrivalConfirmedAt && (
                                <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  {entry.checkInMethod === 'qr' ? 'QR check-in' : 'Arrived'}
                                </span>
                              )}
                              {entry.departureDetectedAt && !isAbsent && (
                                <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200">
                                  {entry.departureReviewRequired ? 'Staff review needed' : 'Departure pending'}
                                </span>
                              )}
                              {(entry.partySize || 1) > 1 && (
                                <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200">
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
                            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                            title={`Call ${entry.customerName} on ${entry.phone}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-stone-500 px-2 py-1 rounded-lg bg-stone-100 border border-stone-200 shrink-0">
                            Walk-in
                          </span>
                        )}
                      </div>

                      {/* Phone number display if available */}
                      {entry.phone && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                          <span className="flex items-center gap-1.5 text-stone-700 font-medium">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {entry.phone}
                          </span>
                        </div>
                      )}

                      {/* Status Action Buttons */}
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isAbsent ? (
                            <button
                              type="button"
                              onClick={() => restoreQueueEntry(entry.id).catch((error) =>
                                triggerNotification(error instanceof Error ? error.message : 'Could not restore ticket')
                              )}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Restore to Queue</span>
                            </button>
                          ) : !isServing && (
                            <button
                              type="button"
                              onClick={() => updateCustomerStatus(entry.id, 'in_service')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50 text-stone-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Scissors className="w-3 h-3 text-[#E05326]" />
                              <span>Take to Chair</span>
                            </button>
                          )}
                          {!isAbsent && (
                            <button
                              type="button"
                              onClick={() => updateCustomerStatus(entry.id, 'completed')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
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
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Confirm left</span>
                            </button>
                          )}
                        </div>

                        {!isAbsent && <button
                          type="button"
                          onClick={() => updateCustomerStatus(entry.id, 'cancelled')}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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

      {/* TAB 1.5: DOORSTEP & HOME VISIT VISITATION MANAGER */}
      {ownerTab === 'doorstep' && (
        <div className="space-y-6">
          {/* Header & Master Controls */}
          <div className="bg-gradient-to-br from-[#1F120C] via-[#2A160F] to-[#140B07] text-white p-5 sm:p-6 rounded-3xl border border-amber-900/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold">
                    Doorstep Operations
                  </span>
                  <span className="text-xs text-amber-300 font-semibold">
                    Home Visits & Grooming Dispatch
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Sloon At-Home Service Control
                </h3>
                <p className="text-xs text-stone-300 max-w-xl mt-1 leading-relaxed">
                  Offer in-home haircuts, senior assisted grooming, bridal styling, and kids cuts with certified mobile gear.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const currentStatus = Boolean(activeSalon.hasHomeService);
                    updateSalonInfo(activeSalon.id, {
                      hasHomeService: !currentStatus,
                      homeServiceRadiusKm: activeSalon.homeServiceRadiusKm || 8,
                      homeServiceMinOrder: activeSalon.homeServiceMinOrder || 299,
                    });
                  }}
                  className={`px-4 py-2.5 rounded-2xl font-black text-xs transition shadow-md flex items-center gap-2 ${
                    activeSalon.hasHomeService
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-emerald-950/40'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${activeSalon.hasHomeService ? 'bg-stone-950' : 'bg-rose-400'}`} />
                  <span>{activeSalon.hasHomeService ? 'Doorstep Enabled (Live)' : 'Doorstep Disabled'}</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-800/80">
              <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">Total Home Requests</span>
                <div className="text-xl font-black text-amber-400 mt-0.5">{doorstepRequests.length}</div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">Active Service Radius</span>
                <div className="text-xl font-black text-white mt-0.5">{activeSalon.homeServiceRadiusKm || 8} km</div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">Min Order Value</span>
                <div className="text-xl font-black text-white mt-0.5">₹{activeSalon.homeServiceMinOrder || 299}</div>
              </div>
              <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
                <span className="text-[10px] uppercase font-bold text-stone-400">Stylist Travel Fee</span>
                <div className="text-xl font-black text-emerald-400 mt-0.5">₹0 (Free)</div>
              </div>
            </div>
          </div>

          {/* Supported Visiting Categories */}
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-stone-900">
                Salon Industry Visiting Categories
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                These specialized service categories are actively displayed to customers booking home visits from your salon.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {HOME_VISIT_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85322]">
                        {cat.badge}
                      </span>
                      <h5 className="text-sm font-black text-stone-900 mt-0.5">{cat.title}</h5>
                      <p className="text-xs text-stone-600 mt-0.5">{cat.subtitle}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-200 flex items-center justify-between">
                    <span className="font-semibold text-emerald-700">✓ Ready to Dispatch</span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono">
                      {cat.industryTag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incoming Customer Doorstep Requests */}
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-stone-900">
                  Incoming Doorstep Requests ({doorstepRequests.length})
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Customers requesting verified stylist home visits with address and time slot.
                </p>
              </div>

              {doorstepRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('sloon_home_visit_bookings');
                    setDoorstepRequests([]);
                  }}
                  className="text-xs font-bold text-stone-500 hover:text-rose-600 transition"
                >
                  Clear History
                </button>
              )}
            </div>

            {doorstepRequests.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-stone-50 border border-dashed border-stone-200 space-y-2">
                <Home className="w-8 h-8 text-stone-400 mx-auto" />
                <h5 className="text-sm font-bold text-stone-700">No Pending Doorstep Requests</h5>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  When a customer books a home visit for bridal, kids, senior care, or grooming, it will appear right here in real time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {doorstepRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#C85322] bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {req.id}
                        </span>
                        <span className="font-black text-stone-900 text-sm">{req.customerName}</span>
                        <span className="text-stone-500 font-mono">({req.customerPhone})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                          {req.scheduledDate} • {req.timeSlot}
                        </span>
                        <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {req.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-stone-500 font-semibold">Service Destination:</span>
                        <p className="text-stone-800 font-medium mt-0.5">{req.customerAddress}</p>
                        {req.specialCareRequirements && req.specialCareRequirements.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {req.specialCareRequirements.map((care, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-medium"
                              >
                                ⚠️ {care}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="text-stone-500 font-semibold">Selected Services:</span>
                        <div className="space-y-1 mt-0.5">
                          {req.selectedServices.map((svc, i) => (
                            <div key={i} className="flex justify-between text-stone-700">
                              <span>• {svc.name}</span>
                              <span className="font-bold">₹{svc.price}</span>
                            </div>
                          ))}
                          <div className="pt-1 border-t border-stone-200 flex justify-between font-black text-stone-900">
                            <span>Total Billable:</span>
                            <span className="text-[#C85322]">₹{req.totalPrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const phone = req.customerPhone.replace(/[^0-9]/g, '');
                          window.open(`https://wa.me/91${phone}?text=Hi%20${encodeURIComponent(req.customerName)},%20confirming%20your%20Sloon%20doorstep%20service%20appointment!`, '_blank');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1.5"
                      >
                        <span>WhatsApp Customer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDoorstepRequests((prev) =>
                            prev.map((r) => (r.id === req.id ? { ...r, status: 'confirmed' } : r)),
                          );
                          if (activeSalon?.id) {
                            void defaultApiClient.updateHomeVisitBooking(activeSalon.id, req.id, { status: 'confirmed' }).catch(() => {});
                          }
                          triggerNotification(`Confirmed doorstep visit for ${req.customerName}`);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold transition"
                      >
                        Accept & Assign Stylist
                      </button>
                    </div>
                  </div>
                ))}
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
            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#E05326]" /> Customers Today
              </div>
              <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                {realCustomersServed}
              </div>
              {realCustomersServed > 0 ? (
                <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3 text-emerald-600" /> {realCustomersServed} served today
                </div>
              ) : (
                <div className="text-[10px] text-stone-400 font-medium mt-1">
                  Active tracking from start
                </div>
              )}
            </div>

            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Waiting Now
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#E05326] mt-1 font-serif">
                {activeSalon.currentQueue}
              </div>
              <div className="text-[10px] text-stone-500 mt-1">
                ~{formatDuration(waitTime)} wait time
              </div>
            </div>

            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Today's Revenue
              </div>
              <div className="text-2xl sm:text-3xl font-black text-stone-900 mt-1">
                ₹{realTodayRevenue.toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-500 mt-1">
                Monthly: ₹{realMonthlyRevenue.toLocaleString()}
              </div>
            </div>

            <div className="bg-white border border-[#E8E2D8] rounded-2xl p-4 shadow-2xs">
              <div className="text-[10px] text-stone-500 uppercase font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Average Rating
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                {activeSalon.rating}★
              </div>
              <div className="text-[10px] text-stone-500 mt-1">
                {activeSalon.reviewCount} customer reviews
              </div>
            </div>
          </div>

          {/* Peak Business Hours Visualization (Real-Time Dynamic Hourly Density) */}
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#E05326]" />
                  Peak Walk-In Rush Hours
                </h3>
                <p className="text-xs text-stone-500">
                  Real-time hourly customer density recorded as walk-ins are served
                </p>
              </div>
              <span className="text-xs font-semibold text-[#E05326] bg-[#FFF3EC] border border-[#FED7CC] px-2.5 py-1 rounded-xl">
                {hourlyStats.peakLabel}
              </span>
            </div>

            {/* Visual Bar Graph */}
            <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 border-b border-stone-100">
              {hourlyStats.bars.map((bar) => (
                <div key={bar.time} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-stone-500 group-hover:text-[#E05326] mb-1 opacity-80">
                    {bar.count}
                  </span>
                  <div
                    style={{ height: bar.height }}
                    className={`w-full max-w-[36px] rounded-t-lg transition-all duration-500 ${
                      bar.peak
                        ? 'bg-[#E05326] shadow-sm shadow-orange-500/20 group-hover:bg-[#D0481E]'
                        : bar.count > 0
                        ? 'bg-stone-300 group-hover:bg-[#E05326]'
                        : 'bg-stone-100 group-hover:bg-stone-200'
                    }`}
                  />
                  <span className="text-[10px] text-stone-500 mt-2 font-medium">
                    {bar.time}
                  </span>
                </div>
              ))}
            </div>

            {!hourlyStats.hasData && (
              <div className="mt-3 text-center text-[11px] text-stone-500">
                Density bars will dynamically record and spike as walk-in customers take tokens throughout the day.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2.5: OFFERS, REWARDS & REVENUE MARKETING ENGINE */}
      {ownerTab === 'offers' && (
        <SalonGrowthMarketingManager
          activeSalon={activeSalon}
          onUpdateMarketingConfig={handleUpdateMarketingConfig}
          salonOffers={salonOffers}
          onUpdateOffers={(updated) => {
            updateSalonInfo(activeSalon.id, { offers: updated });
            try {
              safeStorage.setItem(`sloon_salon_offers_${activeSalon.id}`, JSON.stringify(updated));
            } catch {}
          }}
          triggerNotification={triggerNotification}
        />
      )}

      {/* TAB 3: SERVICES & PRICING MANAGEMENT */}
      {ownerTab === 'services' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 font-serif">
                Service Catalogue & Dynamic Pricing
              </h2>
              <p className="text-xs text-stone-500">
                Update prices and service availability instantly for all walk-in customers
              </p>
            </div>

            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-4 py-2 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>

          {/* Add Service Modal */}
          {showAddServiceModal && (
            <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-[#E8E2D8] rounded-3xl max-w-md w-full p-6 shadow-2xl text-stone-900">
                <h3 className="text-base font-bold text-stone-900 font-serif mb-3">Add New Service</h3>
                <form onSubmit={handleCreateService} className="space-y-3 text-xs">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Service Name</label>
                    <input
                      type="text"
                      required
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g. Skin Fade Haircut"
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-stone-700 font-bold block mb-1">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326]"
                      />
                    </div>
                    <div>
                      <label className="text-stone-700 font-bold block mb-1">Duration (Mins)</label>
                      <input
                        type="number"
                        required
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                        className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Category</label>
                    <select
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326]"
                    >
                      <option value="Hair">Hair</option>
                      <option value="Beard">Beard</option>
                      <option value="Combos">Combos</option>
                      <option value="Spa">Spa</option>
                      <option value="Facial">Facial</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Description</label>
                    <textarea
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      placeholder="Brief details of service..."
                      rows={2}
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 placeholder-stone-400 resize-none focus:outline-none focus:border-[#E05326]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(false)}
                      className="px-3 py-1.5 text-stone-500 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#E05326] text-white font-bold rounded-xl hover:bg-[#D0481E] shadow-xs cursor-pointer"
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
                className="bg-white border border-[#E8E2D8] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{svc.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF7F2] text-stone-600 border border-stone-200 font-medium">
                      {svc.category}
                    </span>
                    {!svc.isAvailable && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-stone-500 mt-1">{svc.description}</p>
                  <span className="text-stone-400 text-[11px] mt-1 block">
                    Duration: ~{formatDuration(svc.durationMinutes)}
                  </span>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-stone-400 text-[10px] block font-medium">Price</span>
                    <input
                      type="number"
                      value={svc.price}
                      onChange={(e) => updateService(activeSalon.id, svc.id, { price: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-[#FAF7F2] border border-stone-300 rounded-lg text-[#E05326] font-extrabold text-sm text-right focus:outline-none focus:border-[#E05326]"
                    />
                  </div>

                  <button
                    onClick={() => updateService(activeSalon.id, svc.id, { isAvailable: !svc.isAvailable })}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer ${
                      svc.isAvailable
                        ? 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        : 'bg-orange-50 text-[#E05326] border-orange-200'
                    }`}
                  >
                    {svc.isAvailable ? 'Pause' : 'Enable'}
                  </button>

                  <button
                    onClick={() => deleteService(activeSalon.id, svc.id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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
              <h2 className="text-base font-bold text-stone-900 font-serif">
                Barber & Stylist Chairs ({(activeSalon.staff || []).length})
              </h2>
              <p className="text-xs text-stone-500">
                Number of active chairs directly adjusts estimated wait times on the customer app
              </p>
            </div>

            <button
              onClick={() => setShowAddStaffModal(true)}
              className="px-4 py-2 rounded-xl bg-[#E05326] text-white font-bold text-xs hover:bg-[#D0481E] flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stylist</span>
            </button>
          </div>

          {showAddStaffModal && (
            <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white border border-[#E8E2D8] rounded-3xl max-w-md w-full p-6 shadow-2xl text-stone-900">
                <h3 className="text-base font-bold text-stone-900 font-serif mb-3">Add Stylist</h3>
                <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Stylist Name</label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-stone-700 font-bold block mb-1">Role</label>
                      <input
                        type="text"
                        value={newStaffRole}
                        onChange={(e) => setNewStaffRole(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326]"
                      />
                    </div>
                    <div>
                      <label className="text-stone-700 font-bold block mb-1">Experience</label>
                      <input
                        type="text"
                        value={newStaffExp}
                        onChange={(e) => setNewStaffExp(e.target.value)}
                        className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Specialties (comma separated)</label>
                    <input
                      type="text"
                      value={newStaffSpec}
                      onChange={(e) => setNewStaffSpec(e.target.value)}
                      placeholder="Taper Fade, Beard Art"
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddStaffModal(false)} className="px-3 py-1.5 text-stone-500 hover:text-stone-800 cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 bg-[#E05326] text-white font-bold rounded-xl hover:bg-[#D0481E] shadow-xs cursor-pointer">
                      Save Stylist
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {(activeSalon.staff || []).map((member) => (
              <div key={member.id} className="bg-white border border-[#E8E2D8] rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-2xs">
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
                    <h4 className="font-bold text-stone-900 text-sm">{member.name}</h4>
                    <p className="text-stone-500">{member.role} • {member.experience}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${
                        member.status === 'active' ? 'bg-emerald-500' : 'bg-stone-300'
                      }`} />
                      <span className="capitalize text-stone-700 font-semibold">{member.status}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateStaff(activeSalon.id, member.id, {
                      status: member.status === 'active' ? 'break' : 'active'
                    })}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs border cursor-pointer ${
                      member.status === 'active'
                        ? 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {member.status === 'active' ? 'Take Break' : 'On Chair'}
                  </button>

                  <button
                    onClick={() => deleteStaff(activeSalon.id, member.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
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
              <h2 className="text-base font-bold text-stone-900 font-serif">
                Customer Feedback & Owner Replies
              </h2>
              <p className="text-xs text-stone-500">
                Responding to reviews boosts salon trust and visibility score
              </p>
            </div>
            <button
              onClick={() => fetchSalonReviews(activeSalon.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Refresh reviews"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#E05326]" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-3">
            {(activeSalon.reviews || []).length === 0 ? (
              <div className="bg-white border border-[#E8E2D8] rounded-2xl p-8 text-center text-xs space-y-2 shadow-2xs">
                <MessageSquare className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-stone-800 font-semibold">No reviews received yet</p>
                <p className="text-stone-500 max-w-sm mx-auto">
                  When customers submit verified reviews for {activeSalon.name}, they will appear here instantly for you to read and reply.
                </p>
              </div>
            ) : (
              (activeSalon.reviews || []).map((rev) => (
              <div key={rev.id} className="bg-white border border-[#E8E2D8] rounded-2xl p-4 text-xs space-y-2 shadow-2xs">
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
                      <span className="font-bold text-stone-900">{rev.customerName}</span>
                      <span className="text-[10px] text-stone-400 ml-2">{(rev as any).date || (rev as any).createdAt || 'Recently'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {rev.rating}.0
                  </div>
                </div>

                <p className="text-stone-700 italic">"{rev.comment}"</p>

                {/* Existing Reply */}
                {rev.ownerReply ? (
                  <div className="mt-2 bg-[#FFF3EC] border-l-2 border-[#E05326] p-2.5 rounded-r-xl">
                    <div className="text-[11px] font-bold text-[#E05326]">Your Response:</div>
                    <p className="text-stone-800">{typeof rev.ownerReply === "string" ? rev.ownerReply : rev.ownerReply.comment}</p>
                  </div>
                ) : (
                  /* Reply Input */
                  <div className="mt-2 flex items-center gap-2 pt-2 border-t border-stone-100">
                    <input
                      type="text"
                      placeholder="Write owner response..."
                      value={replyTextMap[rev.id] || ''}
                      onChange={(e) => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 text-xs focus:outline-none focus:border-[#E05326]"
                    />
                    <button
                      onClick={() => {
                        const reply = replyTextMap[rev.id];
                        if (reply?.trim()) {
                          replyToReview(activeSalon.id, rev.id, reply);
                          setReplyTextMap({ ...replyTextMap, [rev.id]: '' });
                        }
                      }}
                      className="px-3 py-1.5 bg-[#E05326] text-white font-bold rounded-xl text-xs hover:bg-[#D0481E] cursor-pointer"
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
      {/* TAB 6: ANALYTICS & BUSINESS INSIGHTS (Fair Marketplace Intelligence) */}
      {ownerTab === 'analytics' && (
        <SloonBusinessInsightsView
          salon={activeSalon}
          queueEntries={queueEntries}
          realCustomersServed={realCustomersServed}
          realTodayRevenue={realTodayRevenue}
          realMonthlyRevenue={realMonthlyRevenue}
          onNavigateTab={(tab) => setOwnerTab(tab as OwnerTab)}
        />
      )}
      {/* TAB: MEDIA & LOOP VIDEO SHOWCASE STUDIO */}
      {ownerTab === 'gallery' && (
        <div className="space-y-6 max-w-4xl">
          {/* Studio Header */}
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#E05326]" />
                  <h2 className="text-base font-bold text-stone-900 font-serif">Media, Poster & Location Showcase</h2>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Upload high-res poster photos, background loop videos, physical salon location pictures, and haircut portfolio.
                </p>
              </div>

              {/* Sub-tab Switcher */}
              <div className="flex items-center gap-1 bg-[#FAF7F2] border border-[#E8E2D8] p-1 rounded-2xl text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setMediaSubTab('poster-video')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    mediaSubTab === 'poster-video'
                      ? 'bg-[#E05326] text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Poster & Loop Video
                </button>
                <button
                  type="button"
                  onClick={() => setMediaSubTab('location')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    mediaSubTab === 'location'
                      ? 'bg-[#E05326] text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Location ({locationPhotosList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMediaSubTab('work')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                    mediaSubTab === 'work'
                      ? 'bg-[#E05326] text-white shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
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
              <form onSubmit={handleSaveHeroMedia} className="bg-white border border-[#E8E2D8] rounded-3xl p-5 space-y-4 text-xs shadow-xs text-stone-900">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-1.5 mb-1">
                    <Video className="w-4 h-4 text-[#E05326]" />
                    Cover Poster & Loop Video
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Set a cinematic looping video (MP4/WebM) or a high-res poster image for your salon's profile banner.
                  </p>
                </div>

                {/* Poster Image URL & File Upload */}
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Poster Image URL (Hero Cover)</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={posterUrlInput}
                      onChange={(e) => setPosterUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 text-xs focus:outline-none focus:border-[#E05326]"
                    />
                    <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0 border border-stone-200">
                      <Upload className="w-3.5 h-3.5 text-[#E05326]" />
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
                  <label className="text-stone-700 font-bold block mb-1">
                    Loop Video URL (MP4 / WebM direct video link)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={loopVideoUrlInput}
                      onChange={(e) => setLoopVideoUrlInput(e.target.value)}
                      placeholder="https://assets.mixkit.co/videos/...mp4"
                      className="flex-1 p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 text-xs focus:outline-none focus:border-[#E05326]"
                    />
                    <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl text-xs cursor-pointer flex items-center gap-1 shrink-0 border border-stone-200">
                      <Upload className="w-3.5 h-3.5 text-[#E05326]" />
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
                <div className="p-3 bg-[#FAF7F2] border border-[#E8E2D8] rounded-2xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                    Sample Studio Loops:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: 'Master Barber Scissors & Fade',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-hair-with-scissors-and-comb-41544-large.mp4'
                      },
                      {
                        label: 'Barber Styling & Comb',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-barber-styling-a-mans-hair-41545-large.mp4'
                      },
                      {
                        label: 'Haircut Precision Cut',
                        url: 'https://assets.mixkit.co/videos/preview/mixkit-hairdresser-brushing-a-womans-hair-41540-large.mp4'
                      }
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setLoopVideoUrlInput(preset.url)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 hover:border-orange-300 text-[11px] text-stone-700 hover:text-[#E05326] transition-colors shadow-2xs cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#E05326] hover:bg-[#D0481E] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Poster & Video</span>
                  </button>
                </div>
              </form>

              {/* Live Customer Preview */}
              <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#E05326]" />
                    Customer Live View Preview
                  </h3>
                  <span className="text-[10px] text-stone-400">How customers see your salon</span>
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
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/80 text-amber-300 border border-amber-400/40">
                      {loopVideoUrlInput ? 'Loop Video Active' : 'Poster Image Active'}
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
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-amber-300 drop-shadow">
                        Style #{idx + 1}
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
            {/* TAB 7: ENHANCED SALON SETTINGS & PINPOINT LOCATION */}
      {ownerTab === 'settings' && (
        <div className="space-y-5 max-w-2xl mx-auto text-xs text-stone-900">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E05326]/20 border border-[#E05326]/40 text-[#FFA384] text-[10px] font-bold tracking-wide uppercase mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Verified Studio Customization</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight">{salonForm.name || activeSalon.name}</h2>
              <p className="text-stone-300 text-xs mt-0.5">Customize your profile, pinpoint your exact GPS location, timings, and contact links.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPreviewCard(!showPreviewCard)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>{showPreviewCard ? 'Hide Preview' : 'Customer View'}</span>
            </button>
          </div>

          {/* Live Customer Card Preview (What customers actually see) */}
          {showPreviewCard && (
            <div className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-3xl p-5 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-stone-500 font-bold text-[11px] uppercase tracking-wider">
                  <Eye className="w-3.5 h-3.5 text-[#E05326]" />
                  <span>Live Customer Preview (How your studio appears on customer-web)</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {salonForm.isOpen ? 'Open Now' : 'Closed'}
                </span>
              </div>

              {/* Mock Customer Card */}
              <div className="bg-white rounded-2xl border border-stone-200/80 p-3.5 flex items-start gap-3.5 shadow-xs">
                <img
                  src={activeSalon.coverImage || activeSalon.posterImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400'}
                  alt={salonForm.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-stone-900 truncate flex items-center gap-1">
                      <span>{salonForm.name || 'Your Studio Name'}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E05326] shrink-0" />
                    </h4>
                    <div className="flex items-center gap-1 shrink-0">
                      {(salonForm.instagramHandle || salonForm.instagramUrl) && (
                        <span className="w-6 h-6 rounded-full bg-pink-50 text-pink-600 border border-pink-200 flex items-center justify-center">
                          <InstagramGradientIcon className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-500 truncate mt-0.5">{salonForm.tagline || 'Craft fades & expert grooming'}</p>
                  <p className="text-[11px] text-stone-600 mt-1 flex items-center gap-1 truncate font-medium">
                    <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate">{salonForm.locality || 'Locality'}, {salonForm.city || 'City'}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-bold">Haircuts from ₹{salonForm.startingPrice || 150}</span>
                  </p>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-mono text-[10px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span>{Number(salonForm.latitude).toFixed(4)}°, {Number(salonForm.longitude).toFixed(4)}°</span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      <Phone className="w-3 h-3" />
                      <span>Call Studio</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Customization Form */}
          <form onSubmit={handleSaveSettings} className="space-y-4">
            {/* 1. Studio Identity & Category */}
            <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <Store className="w-4 h-4 text-[#E05326]" />
                <h3 className="text-sm font-bold text-stone-900 font-serif">1. Studio Identity & Categorization</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Salon / Studio Name *</label>
                  <input
                    type="text"
                    required
                    value={salonForm.name}
                    onChange={(e) => setSalonForm({ ...salonForm, name: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Tagline or Specialty</label>
                  <input
                    type="text"
                    value={salonForm.tagline}
                    onChange={(e) => setSalonForm({ ...salonForm, tagline: e.target.value })}
                    placeholder="e.g. Precision fades, royal beard spa"
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white"
                  />
                </div>
              </div>

              {/* Studio Category Selection */}
              <div>
                <label className="text-stone-700 font-bold block mb-1.5">Studio Category & Target Audience</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'men', label: "Men's Grooming", sub: 'Barbershop & Fades', icon: Scissors },
                    { id: 'women', label: "Women's Beauty", sub: 'Salon & Spa Studio', icon: Sparkles },
                    { id: 'unisex', label: 'Unisex Studio', sub: 'All Genders Welcome', icon: Store }
                  ].map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSalonForm({ ...salonForm, salonType: cat.id as any })}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          salonForm.salonType === cat.id
                            ? 'border-[#E05326] bg-[#FFF3EC] shadow-xs ring-1 ring-[#E05326]/30'
                            : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center mb-1.5 text-[#E05326]">
                          <CatIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="font-bold text-xs text-stone-900">{cat.label}</div>
                        <div className="text-[10px] text-stone-500">{cat.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Starting Service Price */}
              <div className="pt-1">
                <label className="text-stone-700 font-bold block mb-1">Starting Haircut / Service Price (₹) *</label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-2.5 font-black text-stone-500">₹</span>
                  <input
                    type="number"
                    min="30"
                    step="10"
                    required
                    value={salonForm.startingPrice}
                    onChange={(e) => setSalonForm({ ...salonForm, startingPrice: Number(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-bold"
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-1">Highlighted prominently on customer search cards to attract nearby walk-ins.</p>
              </div>
            </div>

            {/* 2. Exact Map Pinpoint Location (PINPOINT FEATURE) */}
            <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#E05326]" />
                  <h3 className="text-sm font-bold text-stone-900 font-serif">2. Exact Map Pinpoint & Address</h3>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-100 text-[#E05326]">
                  High Accuracy GPS
                </span>
              </div>

              {/* Pinpoint Location Interactive Action Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFF8F3] to-[#FAF7F2] border border-[#E8E2D8] space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#E05326]" />
                      <span>Pinpoint Studio Entrance on Interactive Map</span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Ensure customers reach your exact shop front without calling for directions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTempLocation(null);
                      setShowLocationModal(true);
                    }}
                    className="px-4 py-2 bg-[#E05326] hover:bg-[#D0481E] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Pinpoint on Map / GPS</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-stone-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 text-[10px] uppercase font-bold">Coordinates:</span>
                    <span className="font-mono font-bold text-stone-800 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                      Lat: {Number(salonForm.latitude).toFixed(5)}, Lng: {Number(salonForm.longitude).toFixed(5)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openGoogleMapsLocation(Number(salonForm.latitude), Number(salonForm.longitude))}
                    className="text-[#E05326] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Verify in Google Maps ↗</span>
                  </button>
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-3">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Street Address / Landmark *</label>
                  <input
                    type="text"
                    required
                    value={salonForm.address}
                    onChange={(e) => setSalonForm({ ...salonForm, address: e.target.value })}
                    placeholder="e.g. Shop No. 4, Ground Floor, Opposite Central Bank"
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Locality / Area *</label>
                    <input
                      type="text"
                      required
                      value={salonForm.locality}
                      onChange={(e) => setSalonForm({ ...salonForm, locality: e.target.value })}
                      placeholder="e.g. Koramangala or Koni"
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={salonForm.city}
                      onChange={(e) => setSalonForm({ ...salonForm, city: e.target.value })}
                      placeholder="e.g. Bengaluru or Bilaspur"
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-stone-700 font-bold block mb-1">Postal PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={salonForm.pincode}
                      onChange={(e) => setSalonForm({ ...salonForm, pincode: e.target.value })}
                      placeholder="e.g. 560034"
                      className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Verified Contact & Social Redirects */}
            <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <Phone className="w-4 h-4 text-[#E05326]" />
                <h3 className="text-sm font-bold text-stone-900 font-serif">3. Contact Details & Direct Links</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Contact Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={salonForm.phone}
                    onChange={(e) => setSalonForm({ ...salonForm, phone: e.target.value })}
                    placeholder="e.g. +91 98450 12890"
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-semibold"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Triggers native 1-tap phone dialer for customers. Raw digits are masked from web scrapers for privacy.
                  </p>
                </div>

                <div>
                  <label className="text-stone-700 font-bold block mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <InstagramGradientIcon className="w-3.5 h-3.5" />
                      <span>Instagram Profile or Handle</span>
                    </span>
                    {salonForm.instagramUrl && (
                      <a
                        href={salonForm.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-pink-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <span>Test Link</span> ↗
                      </a>
                    )}
                  </label>
                  <input
                    type="text"
                    value={salonForm.instagramHandle}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      const fullUrl = val.startsWith('http') ? val : val ? `https://instagram.com/${val.replace(/^@/, '')}` : '';
                      setSalonForm({ ...salonForm, instagramHandle: val, instagramUrl: fullUrl });
                    }}
                    placeholder="e.g. @bladeandtimber or link"
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-semibold"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Adds an Instagram gradient button directly on your studio cards for customers to follow and view portfolios.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-stone-700 font-bold block mb-1">Google Maps Place ID or Review URL (Optional)</label>
                <input
                  type="text"
                  value={salonForm.googlePlaceId}
                  onChange={(e) => setSalonForm({ ...salonForm, googlePlaceId: e.target.value })}
                  placeholder="e.g. ChIJN1t_tDeuEmsRUsoyG83frY4 or https://g.page/r/.../review"
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Directs verified SLOON customers to your official Google Business Profile review dialog after leaving feedback.
                </p>
              </div>
            </div>

            {/* 4. Operating Hours & Schedule Customization */}
            <div className="bg-white border border-[#E8E2D8] rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#E05326]" />
                  <h3 className="text-sm font-bold text-stone-900 font-serif">4. Operating Hours & Weekly Schedule</h3>
                </div>
                <span className="font-mono text-[11px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                  {salonForm.openingHoursOpen} – {salonForm.openingHoursClose} ({salonForm.openingDays})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Opening Time *</label>
                  <select
                    value={salonForm.openingHoursOpen}
                    onChange={(e) => setSalonForm({ ...salonForm, openingHoursOpen: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-semibold cursor-pointer"
                  >
                    {['06:00 AM', '07:00 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-stone-700 font-bold block mb-1">Closing Time *</label>
                  <select
                    value={salonForm.openingHoursClose}
                    onChange={(e) => setSalonForm({ ...salonForm, openingHoursClose: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-stone-900 focus:outline-none focus:border-[#E05326] focus:bg-white font-semibold cursor-pointer"
                  >
                    {['07:00 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Days of Operation Chips */}
              <div>
                <label className="text-stone-700 font-bold block mb-1.5">Weekly Working Days / Off Day</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    'All Days',
                    'Tue Closed',
                    'Mon Closed',
                    'Mon – Sat'
                  ].map((schedule) => (
                    <button
                      key={schedule}
                      type="button"
                      onClick={() => setSalonForm({ ...salonForm, openingDays: schedule })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        salonForm.openingDays === schedule
                          ? 'border-[#E05326] bg-[#FFF3EC] text-[#E05326] ring-1 ring-[#E05326]/30'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {schedule}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-white border border-[#E8E2D8] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPartnerView('register')}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#FAF7F2] border border-stone-200 hover:border-orange-300 text-stone-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4 text-[#E05326]" />
                <span>Add Another Studio Branch</span>
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-[#E05326] hover:bg-[#D0481E] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Salon Profile & Pinpoint</span>
              </button>
            </div>
          </form>

          {/* PINPOINT MODAL WITH INTERACTIVE MAP PICKER */}
          {showLocationModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto border border-stone-200 text-stone-900">
                <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                      <Crosshair className="w-5 h-5 text-[#E05326]" />
                      <span>Pinpoint Studio Entrance on Map</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Drag the pin or tap anywhere on the map to set your exact storefront entrance coordinates for turn-by-turn customer directions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(false)}
                    className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Embedded High-Accuracy Map & GPS Picker */}
                <div className="rounded-2xl overflow-hidden border border-stone-200">
                  <SalonLocationPicker
                    value={{
                      address: salonForm.address,
                      locality: salonForm.locality,
                      city: salonForm.city,
                      state: salonForm.state,
                      pincode: salonForm.pincode,
                      latitude: Number(salonForm.latitude) || 28.6139,
                      longitude: Number(salonForm.longitude) || 77.2090,
                    }}
                    onChange={(res) => {
                      setTempLocation(res);
                    }}
                  />
                </div>

                {/* Modal Footer Confirmation */}
                <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(false)}
                    className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (tempLocation) {
                        setSalonForm((prev) => ({
                          ...prev,
                          latitude: tempLocation.latitude,
                          longitude: tempLocation.longitude,
                          address: tempLocation.address || prev.address,
                          locality: tempLocation.locality || prev.locality,
                          city: tempLocation.city || prev.city,
                          state: tempLocation.state || prev.state,
                          pincode: tempLocation.pincode || prev.pincode,
                        }));
                        triggerNotification(`Location pinpointed! (${tempLocation.latitude.toFixed(4)}°, ${tempLocation.longitude.toFixed(4)}°)`);
                      }
                      setShowLocationModal(false);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Pinpoint Location</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Sticky Bottom Nav for Salon Owners on Smartphones (7 Primary Tabs with Home First) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/90 to-transparent pt-3 pb-safe pointer-events-none">
        <div className="max-w-md mx-auto px-2 pb-2 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xl border border-[#E8E2D8] rounded-3xl shadow-lg p-1.5 flex items-center justify-between ring-1 ring-black/5">
            {[
              { id: 'home' as const, label: 'Home', icon: Home },
              { id: 'live-queue' as const, label: 'Queue', icon: Users },
              { id: 'dashboard' as const, label: 'Stats', icon: LayoutDashboard },
              { id: 'services' as const, label: 'Prices', icon: Scissors },
              { id: 'offers' as const, label: 'Offers', icon: Tag },
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
                  className={`relative flex flex-col items-center justify-center py-1 px-1 sm:px-1.5 rounded-2xl transition-all flex-1 min-w-0 cursor-pointer ${
                    isActive
                      ? 'text-[#E05326] font-bold bg-[#FFF3EC]'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform shrink-0 ${isActive ? 'scale-110 text-[#E05326]' : ''}`} />
                  <span className={`text-[9px] mt-0.5 truncate max-w-full leading-tight ${isActive ? 'text-[#E05326] font-bold' : 'text-stone-500'}`}>
                    {item.label}
                  </span>
                  {isActive && <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-[#E05326]" />}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Modal: Add Customer with Details (Name & Phone for Calling) */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 text-stone-900">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-stone-900 font-serif">Add Customer to Live Queue</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 p-1.5 rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Customer Name <span className="text-[#E05326]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={customerNameInput}
                  onChange={(e) => setCustomerNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Mobile / Phone Number <span className="text-stone-400 font-normal">(For 1-tap calling)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerPhoneInput}
                  onChange={(e) => setCustomerPhoneInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Service Requested
                </label>
                <input
                  type="text"
                  placeholder="e.g. Haircut & Beard Grooming"
                  value={customerServiceInput}
                  onChange={(e) => setCustomerServiceInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E05326] focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomer}
                  className="px-5 py-2.5 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E8E2D8] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 my-auto text-stone-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#FFF3EC] text-[#E05326] flex items-center justify-center border border-[#FED7CC]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 font-serif">
                    Counter QR Standee
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Tabletop poster with your salon photo background
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStandeeModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {partnerQrError && (
              <div className="my-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {partnerQrError}. Apply the SmartQueue database migration and reload this page.
              </div>
            )}

            {/* Standee Live Card Preview with Salon Background & White Padded Rounded QR Container */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-[#E8E2D8] shadow-xl p-5 text-center my-4 group">
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
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF3EC] border border-[#FED7CC] text-[#E05326] text-[10px] font-black uppercase tracking-wider mb-1.5">
                  <ShieldCheck className="w-3 h-3 text-[#E05326]" />
                  <span>Verified Studio Partner</span>
                </div>
                <h3 className="text-base font-black text-white font-serif drop-shadow-md">
                  {activeSalon.name}
                </h3>
                <p className="text-[11px] text-zinc-300 mb-2 drop-shadow flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-300 inline" />
                  <span>{activeSalon.locality || activeSalon.address}</span>
                </p>

                {/* Solid White Padded Container with Rounded Borders for 100% Camera Scannability */}
                <div className="bg-white p-3.5 pb-2.5 rounded-3xl border-3 border-orange-400 shadow-2xl shadow-black/80 my-1">
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
                  <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-[#24140A] text-white text-[9px] font-bold tracking-wider uppercase inline-block border border-[#3E2417]">
                    Scan with phone camera
                  </div>
                </div>

                <div className="text-xs font-bold text-orange-200 mt-2 drop-shadow">
                  Scan to Check Wait & Join Queue
                </div>
                <div className="text-[10px] text-zinc-300 mt-0.5 max-w-xs drop-shadow">
                  Place this standee on your counter for customer walk-in check-in
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-[#E8E2D8] bg-[#FAF7F2] p-3 my-3">
              <label htmlFor="smart-queue-radius" className="flex-1 text-[11px] font-semibold text-stone-700">
                Location assistance radius (50–500 m)
              </label>
              <input
                id="smart-queue-radius"
                type="number"
                min={50}
                max={500}
                value={geofenceRadius}
                onChange={(event) => setGeofenceRadius(Number(event.target.value))}
                className="w-20 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-[#E05326]"
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
                className="rounded-lg bg-[#E05326] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#D0481E] cursor-pointer"
              >
                Save
              </button>
            </div>

            {/* Direct URL input with copy */}
            <div className="space-y-1.5 my-3">
              <label className="text-[11px] font-semibold text-stone-700 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#E05326]" />
                <span>Your Customer Direct Queue Link</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getCustomerQueueUrl(activeSalon.id)}
                  className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-stone-200 rounded-xl text-xs font-mono text-stone-800 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = getCustomerQueueUrl(activeSalon.id);
                    navigator.clipboard.writeText(url);
                    setCopiedQueueLink(true);
                    setTimeout(() => setCopiedQueueLink(false), 2500);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedQueueLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#E05326] hover:bg-[#D0481E] text-white shadow-xs'
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
                className="py-2.5 px-4 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
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
                className="py-2.5 px-4 rounded-xl bg-[#24140A] hover:bg-[#1A0E07] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#3E2417]"
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
