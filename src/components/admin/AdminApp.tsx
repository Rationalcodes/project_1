import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
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
  ArrowRight,
  MapPin
} from 'lucide-react';
import { AdminTab, Salon } from '../../types';

export const AdminApp: React.FC = () => {
  const {
    salons,
    verifySalon,
    updateSalonStatus,
    adminTab,
    setAdminTab,
    moderateReview,
    triggerNotification
  } = useSalon();

  const [adminSearch, setAdminSearch] = useState('');
  const [salonStatusFilter, setSalonStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending'>('all');

  // Stats calculation
  const totalSalons = salons.length;
  const activeSalons = salons.filter(s => s.status === 'active').length;
  const pendingVerificationSalons = salons.filter(s => !s.isVerified);
  const totalWaitingRightNow = salons.reduce((acc, s) => acc + s.currentQueue, 0);
  const totalCustomersServedToday = salons.reduce((acc, s) => acc + s.todayCustomersServed, 0);
  const platformRevenueEst = salons.reduce((acc, s) => acc + s.monthlyRevenue, 0) * 0.05; // 5% SaaS fee

  const allReviewsWithSalon = salons.flatMap(s =>
    s.reviews.map(r => ({ ...r, salonName: s.name, salonId: s.id }))
  );

  const flaggedReviews = allReviewsWithSalon.filter(r => r.flagged);

  const filteredSalons = salons.filter(s => {
    if (salonStatusFilter !== 'all' && s.status !== salonStatusFilter) return false;
    if (adminSearch.trim()) {
      const q = adminSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.locality.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const adminTabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'overview', label: 'Platform Overview', icon: BarChart2 },
    { id: 'salons', label: 'Salon Management', icon: Store, badge: totalSalons },
    { id: 'verification', label: 'Salon Approvals', icon: CheckCircle2, badge: pendingVerificationSalons.length },
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
            Kumbhakaran Multi-Salon Ecosystem
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
                <span className="text-[10px] text-amber-400 underline">View Desk &rarr;</span>
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
            <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-in fade-in">
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
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2.5 border-t border-zinc-800/80 gap-2">
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
                      <td className="py-3 text-zinc-400">{salon.locality}</td>
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
                            onClick={() => {
                              const newStatus = salon.status === 'active' ? 'suspended' : 'active';
                              updateSalonStatus(salon.id, newStatus);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold"
                          >
                            {salon.status === 'active' ? 'Suspend' : 'Activate'}
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
              {(['all', 'active', 'suspended'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSalonStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl capitalize font-semibold border ${
                    salonStatusFilter === st
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {st}
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
                    onClick={() => verifySalon(salon.id, !salon.isVerified)}
                    className={`px-3 py-1.5 rounded-xl font-bold border ${
                      salon.isVerified
                        ? 'bg-zinc-900 text-zinc-400 border-zinc-700'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {salon.isVerified ? 'Revoke Verified' : 'Verify Salon'}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SALON VERIFICATION */}
      {adminTab === 'verification' && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs">
            <h3 className="font-bold text-white mb-1">Salon Verification Desk</h3>
            <p className="text-zinc-400">
              Verified salons receive the official Kumbhakaran Gold Badge, boosting walk-in trustworthiness.
            </p>
          </div>

          <div className="space-y-3">
            {salons.map((salon) => (
              <div key={salon.id} className="bg-[#14141c] border border-zinc-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <img src={salon.coverImage} alt={salon.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-white text-sm">{salon.name}</h4>
                    <p className="text-zinc-400">{salon.locality} • Contact: {salon.phone}</p>
                    <span className="text-[10px] text-zinc-500">Business proof verified</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => verifySalon(salon.id, true)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400"
                  >
                    {salon.isVerified ? 'Verified ✓' : 'Approve & Verify'}
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

      {/* TAB 6: PLATFORM ANALYTICS */}
      {adminTab === 'analytics' && (
        <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-6 text-xs space-y-4">
          <h3 className="text-sm font-bold text-white">Platform Usage & Network Growth</h3>
          <p className="text-zinc-400">
            Kumbhakaran platform telemetry: Daily queue update frequency is 98.4% within fresh 10-minute thresholds.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800">
            <div>
              <span className="text-zinc-500">Avg. Queue Across City</span>
              <div className="text-lg font-bold text-white mt-1">2.8 People</div>
            </div>
            <div>
              <span className="text-zinc-500">Phone Calls Saved Today</span>
              <div className="text-lg font-bold text-amber-400 mt-1">~1,840 Calls</div>
            </div>
            <div>
              <span className="text-zinc-500">Wait Time Saved</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">~420 Hours</div>
            </div>
            <div>
              <span className="text-zinc-500">User Retention</span>
              <div className="text-lg font-bold text-white mt-1">79% Repeat Visits</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
