import React from 'react';
import {
  Menu,
  Bell,
  Sparkles,
  Users,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Globe,
  ExternalLink
} from 'lucide-react';
import { PartnerView } from '@kumbhakaran/shared-types';
import { usePartner } from '../../context/PartnerContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { LanguageSelectorButton } from '../common/LanguageSelectorButton';

export interface PartnerHeaderProps {
  onToggleSidebar: () => void;
  activeView: PartnerView;
  onOpenStandeeModal?: () => void;
  onReplayTour?: () => void;
}

export const PartnerHeader: React.FC<PartnerHeaderProps> = ({
  onToggleSidebar,
  activeView,
  onOpenStandeeModal,
  onReplayTour,
}) => {
  const { activeSalon, setPartnerView } = usePartner();
  const { t } = useLanguage();

  const getPageTitle = (view: PartnerView): string => {
    switch (view) {
      case 'overview':
      case 'home':
      case 'dashboard':
        return 'Overview';
      case 'live-queue':
        return 'Live Physical Queue';
      case 'services':
        return 'Services & Dynamic Pricing';
      case 'staff':
        return 'Staff & Chair Roster';
      case 'profile':
      case 'gallery':
        return 'Salon Public Profile';
      case 'reviews':
        return 'Customer Reviews & Feedback';
      case 'analytics':
        return 'Walk-In Analytics & Peak Rush';
      case 'notifications':
        return 'Operational Alerts & Notifications';
      case 'billing':
        return 'Subscription & Billing Invariants';
      case 'settings':
        return 'Salon & Security Settings';
      case 'help':
        return 'Operations Guide & Support';
      default:
        return 'Partner Workspace';
    }
  };

  const isQueuePaused = activeSalon?.queueStatus === 'paused';

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E7DED5] px-3 sm:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Sidebar Toggle + Breadcrumb */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-stone-700 hover:text-stone-950 hover:bg-stone-200/70 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium">
              <span>SLOON Partner</span>
              <span>/</span>
              <span className="font-bold text-stone-900 truncate">
                {activeSalon ? activeSalon.name : 'Studio'}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-stone-950 tracking-tight leading-none truncate font-serif">
              {getPageTitle(activeView)}
            </h1>
          </div>
        </div>

        {/* Right: Operational Controls & Indicators */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-xs">
          {/* Real-time Physical Queue Indicator Pill */}
          {activeSalon && (
            <button
              type="button"
              onClick={() => setPartnerView('live-queue')}
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer shadow-2xs ${
                isQueuePaused
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : activeSalon.isOpen
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-900 border-rose-300 hover:bg-rose-100'
              }`}
              title="Click to manage live queue"
            >
              <span className={`w-2 h-2 rounded-full ${
                isQueuePaused
                  ? 'bg-amber-500'
                  : activeSalon.isOpen
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-rose-500'
              }`} />
              <span className="font-black text-xs">
                {isQueuePaused
                  ? 'Queue Paused'
                  : activeSalon.isOpen
                  ? `${activeSalon.currentQueue} in Line • Live`
                  : 'Studio Closed'}
              </span>
            </button>
          )}

          {/* Quick Counter Standee Print Action */}
          {onOpenStandeeModal && (
            <button
              type="button"
              onClick={onOpenStandeeModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E7DED5] text-stone-800 hover:text-[#FF6422] hover:border-orange-300 font-bold transition-all shadow-2xs cursor-pointer"
              title="Print Counter QR Standee (A4)"
            >
              <QrCode className="w-3.5 h-3.5 text-[#FF6422]" />
              <span>Standee (A4)</span>
            </button>
          )}

          {/* Walkthrough Guide Replay */}
          {onReplayTour && (
            <button
              type="button"
              onClick={onReplayTour}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#E7DED5] text-stone-700 hover:text-[#FF6422] hover:border-orange-300 font-bold transition-all shadow-2xs cursor-pointer text-[11px]"
              title="Replay Partner Walkthrough"
            >
              <Sparkles className="w-3 h-3 text-[#FF6422]" />
              <span>Tour</span>
            </button>
          )}

          {/* Multilingual Selector */}
          <LanguageSelectorButton />

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => setPartnerView('notifications')}
            className="relative p-2 rounded-xl bg-white border border-[#E7DED5] text-stone-700 hover:text-stone-900 hover:border-stone-400 transition-colors cursor-pointer shadow-2xs"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6422] ring-2 ring-[#FAF7F2]" />
          </button>
        </div>
      </div>
    </header>
  );
};
