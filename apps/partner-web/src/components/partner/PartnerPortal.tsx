import React, { useState } from 'react';
import { useSalon } from '../../context/PartnerContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { SalonRegistrationWizard } from './SalonRegistrationWizard';
import { OwnerApp } from '../owner/OwnerApp';
import { GoogleSignInButton } from '@kumbhakaran/ui';
import { LanguageSelectorButton } from '../common/LanguageSelectorButton';
import logoWhite from '../../assets/logo-white.png';
import logoFallback from '../../assets/logo.png';
import {
  Store,
  PlusCircle,
  Users,
  LayoutDashboard,
  Scissors,
  UserCheck,
  Star,
  Settings,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Languages,
} from 'lucide-react';

export const PartnerPortal: React.FC = () => {
  const {
    salons,
    activeSalon,
    setActiveSalonId,
    partnerView,
    setPartnerView,
    partnerUser,
    isAuthenticated,
    loginWithGoogle,
    logout,
  } = useSalon();

  const { t, openLanguageModal, languageInfo } = useLanguage();
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);

  // If partner is not authenticated, render dedicated Partner Authentication Gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-8 sm:my-12 p-4 sm:p-8 bg-gradient-to-b from-[#181824] via-[#12121a] to-[#0c0c10] border border-amber-500/30 rounded-3xl shadow-2xl text-center space-y-6">
        <div className="flex flex-col items-center justify-center gap-3">
          <img
            src={logoWhite}
            alt="SLOON - Unisex Grooming Network"
            className="h-11 sm:h-13 w-auto object-contain drop-shadow-xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = logoFallback;
            }}
          />
        </div>

        {/* Pre-login language selection badge */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={openLanguageModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-all cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-amber-400" />
            <span>{languageInfo.nativeName} ({languageInfo.name})</span>
            <span className="text-[10px] text-zinc-400">· {t.changeLanguage}</span>
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {t.partnerPortal}
          </span>
          <h1 className="text-2xl font-black text-white font-['Syne',sans-serif]">
            {t.welcomePartnerPortal}
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            {t.partnerPortalSubtitle}
          </p>
        </div>

        <div className="pt-2 flex flex-col items-center justify-center max-w-full">
          <GoogleSignInButton
            onSuccess={(cred, clientId) => loginWithGoogle(cred, clientId)}
            text="signin_with"
            theme="outline"
            width={280}
          />
        </div>

        <div className="pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex flex-wrap items-center justify-center gap-2">
          <span>✓ {t.zeroListingCharges}</span>
          <span>•</span>
          <span>✓ {t.liveQueueControls}</span>
          <span>•</span>
          <span>✓ {t.instantVerifiedSetup}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-28 text-slate-100">
      {/* Partner Portal Distinct Sub-Header Strip */}
      <div className="bg-[#14141c] border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <Store className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {t.partnerPortal}
              </span>
              <span className="text-xs text-zinc-400">partner.kumbhakaran.app</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white mt-0.5 font-['Syne',sans-serif]">
              {t.salonForOwners}
            </h1>
            <p className="text-xs text-zinc-400">
              {t.partnerPortalSubtitle}
            </p>
          </div>
        </div>

        {/* Quick Action: Register New Salon & Switch Salon */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Salon Dropdown */}
          {activeSalon && (
            <div className="relative">
              <button
                onClick={() => setSalonDropdownOpen(!salonDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate max-w-[140px]">{activeSalon.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {salonDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-1.5 z-40">
                  <div className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1">
                    {t.yourStudios} ({salons.length})
                  </div>
                  {salons.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveSalonId(s.id);
                        setPartnerView('live-queue');
                        setSalonDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                        activeSalon.id === s.id
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white truncate">{s.name}</div>
                        <div className="text-[10px] text-zinc-400">{s.locality} • {t.liveQueue}: {s.currentQueue}</div>
                      </div>
                      {activeSalon.id === s.id && <span className="text-amber-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* New Salon Registration Button */}
          <button
            type="button"
            onClick={() => setPartnerView('register')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              partnerView === 'register'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-amber-400'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.registerNewStudio}</span>
          </button>
        </div>
      </div>

      {/* Main Switcher View: Registration Wizard vs Studio Operating Dashboard */}
      {partnerView === 'register' || !activeSalon ? (
        <SalonRegistrationWizard onSuccess={() => setPartnerView('live-queue')} />
      ) : (
        <OwnerApp />
      )}
    </div>
  );
};
