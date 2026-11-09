import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { useSalon } from '../../context/AdminContext';
import {
  ShieldCheck,
  Store,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Star,
  DollarSign,
  TrendingUp,
  BarChart2,
  Settings,
  Search,
  Filter,
  Check,
  Trash2,
  Lock,
  Unlock,
  Building,
  CreditCard,
  Sliders,
  Sparkles,
  QrCode,
  Printer,
  Download,
  ExternalLink,
  Copy,
  Link2,
  X,
  Image as ImageIcon,
  Upload,
  Save,
  RefreshCw,
  Eye,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { AdminTab, Salon } from '@kumbhakaran/shared-types';
import { openGoogleMapsLocation } from '@kumbhakaran/ui';

export const AdminApp: React.FC = () => {
  const {
    salons,
    verifySalon,
    updateSalonStatus,
    deleteSalon,
    adminTab,
    setAdminTab,
    moderateReview,
    triggerNotification,
    banners,
    saveBanners,
    resetBanners,
  } = useSalon();

  const [editableBanners, setEditableBanners] = useState(banners);

  useEffect(() => {
    setEditableBanners(banners);
  }, [banners]);

  // Automatic client-side canvas compression to 1200x400 landscape banner (~80-120KB)
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 400, quality = 0.86): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          resolve('');
          return;
        }
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let targetWidth = img.width;
          let targetHeight = img.height;
          if (targetWidth > maxWidth) {
            targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
            targetWidth = maxWidth;
          }
          if (targetHeight > maxHeight * 1.5) {
            targetWidth = Math.round((targetWidth * maxHeight * 1.5) / targetHeight);
            targetHeight = maxHeight * 1.5;
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (slot: number, file: File) => {
    if (!file) return;
    try {
      triggerNotification(`Processing & optimizing Poster #${slot}...`);
      const compressedUrl = await compressImage(file);
      if (!compressedUrl) {
        triggerNotification('Unable to process image. Please try a different photo.');
        return;
      }
      setEditableBanners((prev) => {
        const updated = prev.map((b) => (b.slot === slot ? { ...b, imageUrl: compressedUrl } : b));
        // Auto-save so the user doesn't have to guess where the publish button is!
        saveBanners(updated);
        return updated;
      });
      triggerNotification(`Poster #${slot} uploaded & published live to customer home page!`);
    } catch (err: any) {
      triggerNotification('Failed to read image: ' + (err?.message || 'Unknown error'));
    }
  };

  const [adminSearch, setAdminSearch] = useState('');
  const [salonStatusFilter, setSalonStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');
  const [verificationFilter, setVerificationFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [deleteTargetSalon, setDeleteTargetSalon] = useState<Salon | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Express Walk-In QR & Deep Link generator
  const [walkinQrSalon, setWalkinQrSalon] = useState<Salon | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [useLocalOrigin, setUseLocalOrigin] = useState(false);

  const getWalkinUrl = (salonId: string, forceLocal = false) => {
    if (forceLocal && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return `http://localhost:3000/?salon=${salonId}&walkin=true`;
    }
    return `https://kumbhkaransalons.in/?salon=${salonId}&walkin=true`;
  };

  useEffect(() => {
    if (walkinQrSalon) {
      const url = getWalkinUrl(walkinQrSalon.id, useLocalOrigin);
      QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#1c1917', light: '#ffffff' },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    } else {
      setQrDataUrl('');
      setCopiedLink(false);
    }
  }, [walkinQrSalon, useLocalOrigin]);

  const handlePrintStandee = (salon: Salon, qrImgUrl: string, walkinUrl: string) => {
    const printWindow = window.open('', '_blank', 'width=800,height=920');
    if (!printWindow) return;

    const salonBgImage =
      salon.coverImage ||
      (salon.images && salon.images[0]) ||
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80';

    const localityText = salon.locality
      ? `${salon.locality} • ${salon.city || 'Chhattisgarh'}`
      : salon.address || 'SLOON Partner Studio';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Express Walk-in Standee - ${salon.name}</title>
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
              background: #ea580c;
              color: #ffffff;
              box-shadow: 0 4px 14px rgba(234, 88, 12, 0.4);
            }
            .btn-primary:hover {
              background: #f97316;
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
              border: 3.5px solid #ea580c;
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
              background: rgba(234, 88, 12, 0.2);
              border: 1px solid rgba(234, 88, 12, 0.5);
              color: #fdba74;
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
              border: 3.5px solid #ea580c;
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
              color: #fdba74;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 1px;
              padding: 4px 12px;
              border-radius: 9999px;
              display: inline-block;
              border: 1px solid rgba(234, 88, 12, 0.4);
            }
            .cta-title {
              font-size: 21px;
              font-weight: 900;
              color: #fdba74;
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
              <h1 class="salon-name">${salon.name}</h1>
              <p class="salon-locality">📍 ${localityText}</p>

              <!-- Solid white container with padding & rounded borders for 100% camera visibility -->
              <div class="qr-card-wrapper">
                <img src="${qrImgUrl}" class="qr-code-img" alt="QR Code" />
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
                ${walkinUrl}
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

  const handleDownloadQr = (salon: Salon, qrImgUrl: string) => {
    if (!qrImgUrl) return;
    const a = document.createElement('a');
    a.href = qrImgUrl;
    a.download = `${salon.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_express_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerNotification(`Downloaded QR Code for ${salon.name}`);
  };

  // Stats and list memoization (Phase 4 Optimization)
  const {
    totalSalons,
    activeSalons,
    pendingVerificationSalons,
    totalWaitingRightNow,
    totalCustomersServedToday,
    platformRevenueEst,
  } = useMemo(() => {
    return {
      totalSalons: salons.length,
      activeSalons: salons.filter(s => s.status === 'active').length,
      pendingVerificationSalons: salons.filter(s => !s.isVerified),
      totalWaitingRightNow: salons.reduce((acc, s) => acc + s.currentQueue, 0),
      totalCustomersServedToday: salons.reduce((acc, s) => acc + s.todayCustomersServed, 0),
      platformRevenueEst: salons.reduce((acc, s) => acc + s.monthlyRevenue, 0) * 0.05,
    };
  }, [salons]);

  const { allReviewsWithSalon, flaggedReviews } = useMemo(() => {
    const all = salons.flatMap(s =>
      s.reviews.map(r => ({ ...r, salonName: s.name, salonId: s.id }))
    );
    const flagged = all.filter(r => r.flagged);
    return { allReviewsWithSalon: all, flaggedReviews: flagged };
  }, [salons]);

  const filteredSalons = useMemo(() => {
    return salons.filter(s => {
      if (salonStatusFilter === 'pending') {
        if (s.isVerified && s.status !== 'pending') return false;
      } else if (salonStatusFilter !== 'all' && s.status !== salonStatusFilter) {
        return false;
      }
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.locality.toLowerCase().includes(q) ||
          s.city.toLowerCase().includes(q) ||
          (s.ownerName && s.ownerName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [salons, salonStatusFilter, adminSearch]);

  const adminTabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Platform Overview', icon: BarChart2 },
    { id: 'salons', label: 'Salon Management', icon: Store, badge: totalSalons },
    { id: 'verification', label: 'Salon Approvals', icon: CheckCircle2, badge: pendingVerificationSalons.length },
    { id: 'banners', label: 'Banners & Posters', icon: ImageIcon },
    { id: 'reviews', label: 'Review Moderation', icon: Star, badge: flaggedReviews.length },
    { id: 'subscriptions', label: 'SaaS Subscriptions', icon: CreditCard },
    { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-28 text-slate-100">
      {/* Admin Title Strip */}
      <div className="bg-gradient-to-r from-[#171720] via-[#121218] to-[#0a0a0d] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Central Platform Admin
            </span>
            <span className="text-xs text-zinc-400">HQ Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1 font-['Syne',sans-serif]">
            SLOON Platform Ecosystem
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time multi-tenant monitoring, walk-in integrity & salon SaaS operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-2xl text-right">
            <div className="text-[10px] text-zinc-400 uppercase font-semibold">Total Waiting Now</div>
            <div className="text-lg font-black text-amber-400">
              {totalWaitingRightNow} customers across network
            </div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-zinc-800">
        {adminTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive ? 'bg-black text-amber-400' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PLATFORM OVERVIEW */}
      {adminTab === 'overview' && (
        <div className="space-y-6">
          {/* Platform KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-amber-400" /> Total Salons
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {totalSalons}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold mt-1">
                {activeSalons} Active & Open
              </div>
            </div>

            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" /> Walk-Ins Today
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                {totalCustomersServedToday}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                {totalWaitingRightNow} waiting currently
              </div>
            </div>

            <div
              onClick={() => setAdminTab('verification')}
              className="bg-[#14141c] border border-zinc-800 hover:border-amber-500/60 transition-all rounded-2xl p-4 cursor-pointer group"
            >
              <span className="text-[10px] text-zinc-400 group-hover:text-amber-400 uppercase font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> Pending Approvals
                </span>
                <span className="text-[10px] text-amber-400/80 underline font-normal">View Desk &rarr;</span>
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                {pendingVerificationSalons.length}
              </div>
              <div className="text-[10px] text-amber-300 font-semibold mt-1">
                {pendingVerificationSalons.length > 0 ? 'Action required immediately' : 'All salons authorized'}
              </div>
            </div>

            <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4">
              <span className="text-[10px] text-zinc-400 uppercase font-bold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Platform MRR
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                ₹{Math.round(platformRevenueEst).toLocaleString()}
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                SaaS recurring revenue
              </div>
            </div>
          </div>

          {/* URGENT ACTION: PENDING SALON APPROVAL REQUESTS */}
          {pendingVerificationSalons.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldCheck className="w-6 h-6 text-amber-400 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black">
                        Action Required
                      </span>
                      <h2 className="text-base sm:text-lg font-black text-white">
                        {pendingVerificationSalons.length} New Partner Registration {pendingVerificationSalons.length === 1 ? 'Pending Approval' : 'Pending Approvals'}
                      </h2>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      New partner studios are locked and hidden from customers until authorized by an administrator.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAdminTab('verification')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-center shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <span>Open Full Approval Desk</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>

              {/* Pending Salons Quick Review Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {pendingVerificationSalons.map((salon) => (
                  <div key={salon.id} className="bg-black/70 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-lg">
                    <div className="flex items-start gap-3">
                      <img
                        src={salon.coverImage || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80'}
                        alt={salon.name}
                        className="w-13 h-13 rounded-xl object-cover shrink-0 border border-zinc-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm truncate">{salon.name}</h4>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            Awaiting Authorization
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate">{salon.locality}, {salon.city}</p>
                        <div className="text-[11px] text-zinc-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>Owner: <strong className="text-zinc-200">{salon.ownerName || 'Partner'}</strong></span>
                          <span>Phone: <strong className="text-zinc-200">{salon.phone || 'N/A'}</strong></span>
                          <span>ID: <code className="text-amber-400 text-[10px]">{salon.id}</code></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/80 gap-2">
                      <div className="flex items-center gap-2">
                        {salon.coordinates && (
                          <button
                            type="button"
                            onClick={() => openGoogleMapsLocation(salon.coordinates.lat, salon.coordinates.lng)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Location Map</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => verifySalon(salon.id, true)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4 text-black stroke-[2.5]" />
                          <span>APPROVE & AUTHORIZE</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Tables */}
          <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">
              Live Network Salon Status Overview
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5">Salon</th>
                    <th className="py-2.5">Locality</th>
                    <th className="py-2.5">Current Queue</th>
                    <th className="py-2.5">Served Today</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                  {salons.map((salon) => (
                    <tr key={salon.id} className="hover:bg-zinc-800/30">
                      <td className="py-3 flex items-center gap-2">
                        <img src={salon.coverImage} alt={salon.name} className="w-7 h-7 rounded-lg object-cover" />
                        <span className="font-bold text-white">{salon.name}</span>
                      </td>
                      <td className="py-3 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <span>{salon.locality}</span>
                          {salon.coordinates && (
                            <button
                              onClick={() => openGoogleMapsLocation(salon.coordinates.lat, salon.coordinates.lng)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                              title="View exact location on Google Maps"
                            >
                              Map ↗
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {salon.currentQueue} waiting
                        </span>
                      </td>
                      <td className="py-3 font-semibold text-white">{salon.todayCustomersServed}</td>
                      <td className="py-3">
                        {!salon.isVerified || salon.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span>PENDING APPROVAL</span>
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            salon.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {salon.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!salon.isVerified && (
                            <button
                              type="button"
                              onClick={() => verifySalon(salon.id, true)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer transform active:scale-95"
                              title="Approve and make salon live on customer app"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Approve</span>
                            </button>
                          )}
                          <button
                            onClick={() => setWalkinQrSalon(salon)}
                            className="px-2 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Generate Express Walk-in Link & QR Standee"
                          >
                            <QrCode className="w-3 h-3 text-orange-400" />
                            <span>QR Link</span>
                          </button>
                          <button
                            onClick={() => {
                              const newStatus = salon.status === 'active' ? 'suspended' : 'active';
                              updateSalonStatus(salon.id, newStatus);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold"
                          >
                            {salon.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTargetSalon(salon);
                              setDeleteConfirmInput('');
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-colors"
                            title="Permanently Delete Salon"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALON MANAGEMENT */}
      {adminTab === 'salons' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search salons by name or locality..."
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              {(['all', 'pending', 'active', 'suspended'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSalonStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl capitalize font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    salonStatusFilter === st
                      ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-md shadow-amber-400/20'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  <span>{st === 'pending' ? 'Pending Approvals' : st}</span>
                  {st === 'pending' && pendingVerificationSalons.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredSalons.map((salon) => (
              <div
                key={salon.id}
                className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img src={salon.coverImage} alt={salon.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{salon.name}</span>
                      {salon.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <p className="text-zinc-400">{salon.address}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span className="text-amber-400 font-bold">{salon.rating}★ ({salon.reviewCount})</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-emerald-400 font-semibold">{salon.currentQueue} waiting</span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400">{salon.staff.length} Barbers</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => setWalkinQrSalon(salon)}
                    className="px-3 py-1.5 rounded-xl font-bold border bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border-orange-500/40 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                    title="Generate Express Walk-in Link & Counter QR Standee"
                  >
                    <QrCode className="w-3.5 h-3.5 text-orange-400" />
                    <span>Walk-in Link & QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => verifySalon(salon.id, !salon.isVerified)}
                    className={`px-3.5 py-1.5 rounded-xl font-black border text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                      salon.isVerified
                        ? 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white hover:border-zinc-500'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 transform active:scale-95'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{salon.isVerified ? 'Revoke Authorization' : 'APPROVE & AUTHORIZE'}</span>
                  </button>

                  <button
                    onClick={() => updateSalonStatus(salon.id, salon.status === 'active' ? 'suspended' : 'active')}
                    className={`px-3 py-1.5 rounded-xl font-bold border ${
                      salon.status === 'active'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {salon.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>

                  <button
                    onClick={() => {
                      setDeleteTargetSalon(salon);
                      setDeleteConfirmInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl font-bold border bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40 flex items-center gap-1 transition-colors"
                    title="Permanently Delete Salon"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SALON VERIFICATION & ADMIN AUTHORIZATION */}
      {adminTab === 'verification' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Gatekeeper
                </span>
                <h3 className="font-bold text-white text-sm">Salon Authorization Desk</h3>
              </div>
              <p className="text-zinc-400 mt-1 max-w-xl">
                Only authorized salons appear on the public customer web app. Review pending partner submissions and authorize studios to make them live.
              </p>
            </div>

            {/* Filter pills: Pending vs Authorized vs All */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-zinc-800 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setVerificationFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  verificationFilter === 'pending'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Pending ({salons.filter((s) => !s.isVerified).length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('verified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  verificationFilter === 'verified'
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Authorized ({salons.filter((s) => s.isVerified).length})
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  verificationFilter === 'all'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({salons.length})
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {salons.filter((s) => !s.isVerified).length === 0 && verificationFilter === 'pending' && (
              <div className="bg-[#14141c] border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-white font-bold text-sm">All Salon Registrations Authorized!</h4>
                <p className="text-zinc-400 text-xs max-w-sm mx-auto">
                  There are currently no new salon partner registration requests awaiting authorization.
                </p>
              </div>
            )}
            {salons
              .filter((salon) => {
                if (verificationFilter === 'pending') return !salon.isVerified;
                if (verificationFilter === 'verified') return salon.isVerified;
                return true;
              })
              .map((salon) => (
                <div key={salon.id} className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <img src={salon.coverImage} alt={salon.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{salon.name}</h4>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                          salon.isVerified
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {salon.isVerified ? 'Authorized' : 'Pending Authorization'}
                        </span>
                      </div>
                      <p className="text-zinc-400">{salon.locality} • Contact: {salon.phone}</p>
                      <span className="text-[10px] text-zinc-500">ID: {salon.id} • Registered by: {salon.ownerName || 'Partner'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setWalkinQrSalon(salon)}
                      className="px-3 py-1.5 rounded-xl font-bold border bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border-orange-500/40 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                      title="Generate Express Walk-in Link & QR Standee"
                    >
                      <QrCode className="w-3.5 h-3.5 text-orange-400" />
                      <span>Walk-in Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => verifySalon(salon.id, !salon.isVerified)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        salon.isVerified
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-red-500/50 hover:text-red-300'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      {salon.isVerified ? 'Revoke Authorization' : 'Authorize & Allow Salon'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 4: REVIEW MODERATION */}
      {adminTab === 'reviews' && (
        <div className="space-y-4">
          <div className="text-xs text-zinc-400">
            Moderate flagged feedback, maintain authentic community trust, and remove spam.
          </div>

          <div className="space-y-3">
            {allReviewsWithSalon.map((rev) => (
              <div key={rev.id} className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={rev.customerAvatar} alt={rev.customerName} className="w-7 h-7 rounded-full object-cover" />
                    <div>
                      <span className="font-bold text-white">{rev.customerName}</span>
                      <span className="text-zinc-400 ml-2">on {rev.salonName}</span>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold">{rev.rating}★</span>
                </div>

                <p className="text-zinc-300">"{rev.comment}"</p>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                  <button
                    onClick={() => moderateReview(rev.salonId, rev.id, 'keep')}
                    className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg hover:text-white"
                  >
                    Keep Approved
                  </button>
                  <button
                    onClick={() => moderateReview(rev.salonId, rev.id, 'delete')}
                    className="px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg hover:bg-rose-500/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTIONS & SAAS TIERS */}
      {adminTab === 'subscriptions' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 text-xs space-y-3">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Starter Listing</span>
            <div className="text-2xl font-black text-white">Free</div>
            <p className="text-zinc-400">Basic salon profile with manual queue updates.</p>
            <div className="text-zinc-300 font-bold">2 salons enrolled</div>
          </div>

          <div className="bg-[#181824] border-2 border-amber-500/50 rounded-3xl p-5 text-xs space-y-3 shadow-xl">
            <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px]">Pro Studio SaaS</span>
            <div className="text-2xl font-black text-white">₹999 <span className="text-xs font-normal text-zinc-400">/ month</span></div>
            <p className="text-zinc-400">Full live queue counter, staff management, priority map ranking, customer insights.</p>
            <div className="text-amber-400 font-bold">4 salons enrolled</div>
          </div>

          <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 text-xs space-y-3">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Enterprise Chain</span>
            <div className="text-2xl font-black text-white">₹4,999 <span className="text-xs font-normal text-zinc-400">/ month</span></div>
            <p className="text-zinc-400">Multi-outlet sync, customized queue telemetry, dedicated account rep.</p>
            <div className="text-zinc-300 font-bold">1 franchise enrolled</div>
          </div>
        </div>
      )}

      {/* TAB 7: BANNERS & POSTERS MANAGEMENT */}
      {adminTab === 'banners' && (
        <div className="space-y-6">
          {/* Dimension Guidelines & Control Strip */}
          <div className="bg-gradient-to-br from-[#181824] via-[#14141c] to-[#0d0d12] border border-amber-500/20 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Customer Home Carousel
                  </span>
                  <span className="text-xs text-zinc-400">4 Poster Slots Available</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Homepage Poster & Banner Controls
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5 max-w-2xl leading-relaxed">
                  Configure the 4 rotating poster spaces displayed at the top of the customer home screen. If a slot is left blank, a clean blank poster container of the exact same dimensions is displayed.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={resetBanners}
                  className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-zinc-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset All to Blank</span>
                </button>
                <button
                  type="button"
                  onClick={() => saveBanners(editableBanners)}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Publish Posters</span>
                </button>
              </div>
            </div>

            {/* Dimension Specs Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs">
              <div className="space-y-1">
                <div className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                  Recommended Dimensions
                </div>
                <div className="text-sm font-black text-amber-400">
                  1200 px × 400 px
                </div>
                <div className="text-[11px] text-zinc-400">
                  Length: 1200px • Breadth: 400px
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                  Aspect Ratio
                </div>
                <div className="text-sm font-black text-white">
                  3 : 1 (or 16 : 6 landscape)
                </div>
                <div className="text-[11px] text-zinc-400">
                  Matches desktop & mobile responsive card
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                  Safe Margin Tip
                </div>
                <div className="text-sm font-black text-emerald-400">
                  Center 80% Safe Zone
                </div>
                <div className="text-[11px] text-zinc-400">
                  Keep crucial text/logos inside center 80% to avoid rounded-corner cropping
                </div>
              </div>
            </div>
          </div>

          {/* 4 Poster Slots Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {editableBanners.map((banner) => {
              const hasImage = Boolean(banner.imageUrl && banner.imageUrl.trim());

              return (
                <div
                  key={banner.slot}
                  className="bg-[#14141c] border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4"
                >
                  {/* Slot Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/30">
                        #{banner.slot}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Poster Space Slot #{banner.slot}
                        </h4>
                        <span className={`text-[10px] font-semibold ${hasImage ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {hasImage ? '🟢 Custom Poster Active' : '⚪ Blank Poster Space (Default)'}
                        </span>
                      </div>
                    </div>

                    {hasImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditableBanners((prev) =>
                            prev.map((b) => (b.slot === banner.slot ? { ...b, imageUrl: '', title: '', subtitle: '', targetUrl: '' } : b)),
                          );
                          triggerNotification(`Poster #${banner.slot} cleared to blank.`);
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        Clear to Blank
                      </button>
                    )}
                  </div>

                  {/* Live Aspect-Ratio Preview (3:1) */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] text-zinc-400 font-medium flex items-center justify-between">
                      <span>Live Preview (3:1 Aspect Ratio)</span>
                      <span className="text-zinc-500">1200 × 400 px</span>
                    </label>
                    <div className="w-full aspect-[3/1] rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden relative flex items-center justify-center shadow-inner">
                      {hasImage ? (
                        <>
                          <img
                            src={banner.imageUrl}
                            alt={`Poster ${banner.slot}`}
                            className="w-full h-full object-cover"
                          />
                          {banner.title && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                              <div className="text-white text-sm sm:text-base font-bold leading-tight drop-shadow">
                                {banner.title}
                              </div>
                              {banner.subtitle && (
                                <div className="text-zinc-300 text-xs drop-shadow">
                                  {banner.subtitle}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-600 flex items-center justify-center mb-1.5">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-zinc-500">
                            Blank Poster Space #{banner.slot}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            Upload image or enter URL below
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Controls & Inputs */}
                  <div className="space-y-3 pt-1">
                    {/* File Upload Button */}
                    <div>
                      <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">
                        Upload Image File (Device):
                      </label>
                      <label className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-dashed border-zinc-700 hover:border-amber-500/50 text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Choose 1200×400 Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(banner.slot, file);
                          }}
                        />
                      </label>
                    </div>

                    {/* Or URL input */}
                    <div>
                      <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">
                        Or Image URL:
                      </label>
                      <input
                        type="url"
                        value={banner.imageUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditableBanners((prev) =>
                            prev.map((b) => (b.slot === banner.slot ? { ...b, imageUrl: val } : b)),
                          );
                        }}
                        placeholder="https://example.com/poster.jpg"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>

                    {/* Optional Target Link */}
                    <div>
                      <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">
                        Target Link (Optional - opens on click):
                      </label>
                      <input
                        type="url"
                        value={banner.targetUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditableBanners((prev) =>
                            prev.map((b) => (b.slot === banner.slot ? { ...b, targetUrl: val } : b)),
                          );
                        }}
                        placeholder="https://sloon.in/explore or leave empty"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors"
                      />
                    </div>

                    {/* Optional Title & Subtitle */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                          Headline Overlay (Opt):
                        </label>
                        <input
                          type="text"
                          value={banner.title || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditableBanners((prev) =>
                              prev.map((b) => (b.slot === banner.slot ? { ...b, title: val } : b)),
                            );
                          }}
                          placeholder="e.g. Festival Offer"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-400 font-semibold mb-1 block">
                          Subtitle (Opt):
                        </label>
                        <input
                          type="text"
                          value={banner.subtitle || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditableBanners((prev) =>
                              prev.map((b) => (b.slot === banner.slot ? { ...b, subtitle: val } : b)),
                            );
                          }}
                          placeholder="e.g. 20% off today"
                          className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                        />
                      </div>
                    </div>

                    {/* Action buttons on slot */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          saveBanners(editableBanners);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-md shadow-amber-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Publish Poster #{banner.slot} to Home Page</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetBanners}
              className="px-4 py-2.5 rounded-2xl bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all border border-zinc-700 cursor-pointer"
            >
              Reset All to Blank
            </button>
            <button
              type="button"
              onClick={() => saveBanners(editableBanners)}
              className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish All Posters</span>
            </button>
          </div>
        </div>
      )}
    
      {/* PERMANENT SALON DELETION CONFIRMATION DIALOG */}
      {deleteTargetSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#14141c] border-2 border-rose-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-['Syne',sans-serif]">
                  Permanently Delete Salon
                </h3>
                <p className="text-xs text-zinc-400">
                  This action is irreversible and requires explicit confirmation.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs text-rose-200 space-y-2">
              <div className="font-bold text-rose-300">Target Business:</div>
              <div className="text-sm font-black text-white">{deleteTargetSalon.name}</div>
              <div className="text-[11px] text-zinc-400">
                Locality: {deleteTargetSalon.locality} • ID: <code className="text-rose-300">{deleteTargetSalon.id}</code>
              </div>
              
              <div className="pt-2 border-t border-rose-500/20 text-[11px] text-zinc-300 space-y-1">
                <div className="font-semibold text-rose-300">The following associated records will be permanently removed:</div>
                <ul className="list-disc list-inside text-zinc-400 space-y-0.5">
                  <li>Salon profile & PostGIS geographical coordinates</li>
                  <li>All catalog services and pricing items ({deleteTargetSalon.services.length} services)</li>
                  <li>Barber & staff roster assignments ({deleteTargetSalon.staff.length} staff)</li>
                  <li>Live queue history and physical counter telemetry</li>
                  <li>Customer reviews and ratings breakdown ({deleteTargetSalon.reviews.length} reviews)</li>
                  <li>Partner ownership memberships for this specific salon</li>
                </ul>
                <div className="text-[10px] text-zinc-500 pt-1">
                  * Note: The owner account will NOT be deleted if they own another business or use SLOON as a customer.
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">
                To confirm permanent deletion, enter the exact salon name:
              </label>
              <div className="text-xs font-mono font-bold text-amber-400 px-3 py-1.5 bg-zinc-900 rounded-xl border border-zinc-800 select-all">
                {deleteTargetSalon.name}
              </div>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="Type exact salon name here to unlock deletion..."
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-400"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetSalon(null);
                  setDeleteConfirmInput('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-semibold hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  isDeleting ||
                  deleteConfirmInput.trim().toLowerCase() !== deleteTargetSalon.name.trim().toLowerCase()
                }
                onClick={async () => {
                  setIsDeleting(true);
                  const success = await deleteSalon(deleteTargetSalon.id, deleteConfirmInput.trim());
                  setIsDeleting(false);
                  if (success) {
                    setDeleteTargetSalon(null);
                    setDeleteConfirmInput('');
                  }
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-extrabold shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting Permanently...' : 'Permanently Delete Salon'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPRESS WALK-IN LINK & QR STANDEE MODAL */}
      {walkinQrSalon && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15151e] border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl text-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Express Walk-in Link & Standee
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {walkinQrSalon.name} • {walkinQrSalon.locality}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWalkinQrSalon(null)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation banner */}
            <div className="my-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl p-3 text-xs text-orange-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong className="text-white">Direct Customer Name Popup:</strong> Opening this link or scanning the counter QR immediately presents the customer with the Name & Token check-in popup for this salon. Regular visitors exploring <span className="font-mono text-orange-200">kumbhkaransalons.in</span> directly will browse normally and will not see this popup.
              </div>
            </div>

            {/* Express Standee Preview with Salon Background Image & White Padded Rounded QR Container */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-orange-500/40 shadow-2xl p-5 text-center my-4 group">
              {/* Salon Shop Photo in Background */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${
                    walkinQrSalon.coverImage ||
                    (walkinQrSalon.images && walkinQrSalon.images[0]) ||
                    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80'
                  })`,
                  filter: 'brightness(0.32) saturate(1.2)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-stone-950/75 to-black/95" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[10px] font-black uppercase tracking-wider mb-1.5">
                  <span>⚡ Express Standee Preview</span>
                </div>
                <h3 className="text-base font-black text-white font-['Syne',sans-serif] drop-shadow-md">
                  {walkinQrSalon.name}
                </h3>
                <p className="text-[11px] text-zinc-300 mb-2 drop-shadow">
                  📍 {walkinQrSalon.locality || walkinQrSalon.address}
                </p>

                {/* Solid White Padded Container with Rounded Borders for 100% Camera Scannability */}
                <div className="bg-white p-3.5 pb-2.5 rounded-3xl border-3 border-orange-500 shadow-2xl shadow-black/80 my-1">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for ${walkinQrSalon.name}`}
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
                  Ready to print for your front desk or reception standee
                </div>
              </div>
            </div>

            {/* Link Copy Field */}
            <div className="space-y-1.5 my-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Express Customer Link</span>
                </label>
                {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                  <button
                    type="button"
                    onClick={() => setUseLocalOrigin(!useLocalOrigin)}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    {useLocalOrigin ? 'Show Production URL' : 'Show Localhost URL'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getWalkinUrl(walkinQrSalon.id, useLocalOrigin)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const url = getWalkinUrl(walkinQrSalon.id, useLocalOrigin);
                    navigator.clipboard.writeText(url);
                    setCopiedLink(true);
                    triggerNotification(`Copied express walk-in link for ${walkinQrSalon.name}`);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-500 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20'
                  }`}
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons: Print, Download, Test */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  handlePrintStandee(
                    walkinQrSalon,
                    qrDataUrl,
                    getWalkinUrl(walkinQrSalon.id, useLocalOrigin)
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-orange-400" />
                <span>Print Standee</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadQr(walkinQrSalon, qrDataUrl)}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download QR</span>
              </button>

              <a
                href={getWalkinUrl(
                  walkinQrSalon.id,
                  typeof window !== 'undefined' && window.location.hostname === 'localhost'
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Popup</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
