import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Tag,
  Scissors,
  Store,
  Star,
  BarChart3,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronDown,
  PlusCircle,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { PartnerView } from '@kumbhakaran/shared-types';
import { usePartner } from '../../context/PartnerContext';
import logoFallback from '../../assets/logo.png';
import logoTransparent from '../../assets/logo-transparent.png';

export interface PartnerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: PartnerView;
  onSelectView: (view: PartnerView) => void;
}

export const PartnerSidebar: React.FC<PartnerSidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
}) => {
  const { activeSalon, salons = [], setActiveSalonId, setPartnerView, partnerUser, logout } = usePartner();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const mainNavItems = [
    { id: 'overview' as PartnerView, altIds: ['home', 'dashboard'], label: 'Overview', icon: LayoutDashboard },
    { id: 'live-queue' as PartnerView, label: 'Live Queue', icon: Users, badge: activeSalon ? `${activeSalon.currentQueue}` : undefined },
    { id: 'services' as PartnerView, label: 'Services & Pricing', icon: Tag },
    { id: 'staff' as PartnerView, label: 'Staff & Chairs', icon: Scissors },
    { id: 'profile' as PartnerView, altIds: ['gallery'], label: 'Salon Profile', icon: Store },
    { id: 'reviews' as PartnerView, label: 'Reviews', icon: Star, badge: activeSalon ? `${activeSalon.rating.toFixed(1)}` : undefined },
    { id: 'analytics' as PartnerView, label: 'Analytics', icon: BarChart3 },
  ];

  const managementNavItems = [
    { id: 'notifications' as PartnerView, label: 'Notifications', icon: Bell, badge: '2' },
    { id: 'billing' as PartnerView, label: 'Subscription & Billing', icon: CreditCard },
    { id: 'settings' as PartnerView, label: 'Settings', icon: Settings },
    { id: 'help' as PartnerView, label: 'Help & Support', icon: HelpCircle },
  ];

  const isCurrentView = (item: { id: PartnerView; altIds?: string[] }) => {
    if (activeView === item.id) return true;
    if (item.altIds && item.altIds.includes(activeView)) return true;
    return false;
  };

  const handleNavClick = (view: PartnerView) => {
    onSelectView(view);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed on Desktop, Sliding Drawer on Tablet/Mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 sm:w-72 bg-[#1C1917] text-stone-200 border-r border-[#2E2825] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Canopy: Brand Logo & Branch Switcher */}
        <div className="p-4 border-b border-[#2E2825] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={logoFallback}
                alt="SLOON"
                className="h-8 w-auto object-contain brightness-0 invert"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = logoTransparent;
                }}
              />
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-[#2E1F18] text-[#FF6422] border border-[#523325]">
                PARTNER OS
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Branch / Salon Selector */}
          {activeSalon && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                className="w-full bg-[#292524] hover:bg-[#332E2C] border border-[#3E3835] rounded-xl px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-white truncate group-hover:text-[#FF6422] transition-colors">
                    {activeSalon.name}
                  </div>
                  <div className="text-[10px] text-stone-400 truncate flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      activeSalon.isOpen ? 'bg-emerald-400' : 'bg-rose-400'
                    }`} />
                    <span>{activeSalon.locality || 'Active Studio'}</span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              </button>

              {/* Branch Switcher Dropdown */}
              {branchDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-[#24201E] border border-[#3E3835] rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                  <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 px-2 py-1">
                    Your Studios ({salons.length})
                  </div>
                  {salons.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setActiveSalonId(s.id);
                        setBranchDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        activeSalon.id === s.id
                          ? 'bg-[#3A2218] text-[#FF6422] font-bold'
                          : 'text-stone-300 hover:bg-[#2F2926]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-white">{s.name}</div>
                        <div className="text-[10px] text-stone-400">{s.locality} • Line: {s.currentQueue}</div>
                      </div>
                      {activeSalon.id === s.id && <Check className="w-3.5 h-3.5 text-[#FF6422] shrink-0 ml-1" />}
                    </button>
                  ))}

                  <div className="pt-1 border-t border-[#3E3835]">
                    <button
                      type="button"
                      onClick={() => {
                        setBranchDropdownOpen(false);
                        setPartnerView('register');
                      }}
                      className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-[#FF6422] hover:bg-[#3A2218] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Register New Studio</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Middle Navigation Region */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6 no-scrollbar">
          {/* Main Operational Desks */}
          <div className="space-y-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 px-3 pb-1">
              OPERATIONAL DESKS
            </div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrentView(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#FF6422] text-white font-bold shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-[#292524]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-stone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.2 rounded-full shrink-0 ${
                        active
                          ? 'bg-white text-[#FF6422]'
                          : 'bg-[#292524] text-stone-300 border border-[#3E3835]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Account & Platform Management */}
          <div className="space-y-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-stone-400 px-3 pb-1">
              MANAGEMENT & SYSTEM
            </div>
            {managementNavItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrentView(item);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#FF6422] text-white font-bold shadow-sm'
                      : 'text-stone-300 hover:text-white hover:bg-[#292524]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-stone-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.2 rounded-full shrink-0 ${
                        active
                          ? 'bg-white text-[#FF6422]'
                          : 'bg-[#292524] text-amber-400 border border-[#3E3835]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom User Profile & Sign Out Bar */}
        <div className="p-3 border-t border-[#2E2825] bg-[#161413]">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#221E1C]">
            <div className="flex items-center gap-2 min-w-0">
              {partnerUser?.avatarUrl ? (
                <img
                  src={partnerUser.avatarUrl}
                  alt={partnerUser.name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-stone-600"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#FF6422] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {partnerUser?.name?.charAt(0) || 'P'}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {partnerUser?.name || 'Salon Partner'}
                </div>
                <div className="text-[10px] text-stone-400 truncate">
                  {activeSalon?.ownerName || 'Verified Manager'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logout()}
              className="text-[10px] font-bold text-stone-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-[#2C2623] transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
