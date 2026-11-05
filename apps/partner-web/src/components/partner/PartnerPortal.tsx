import React, { useState } from 'react';
import { useSalon } from '../../context/PartnerContext';
import { SalonRegistrationWizard } from './SalonRegistrationWizard';
import { OwnerApp } from '../owner/OwnerApp';
import { GoogleSignInButton } from '@kumbhakaran/ui';
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

  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);

  // If partner is not authenticated, render dedicated Partner Authentication Gate
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-8 sm:my-12 p-4 sm:p-8 bg-gradient-to-b from-[#181824] via-[#12121a] to-[#0c0c10] border border-amber-500/30 rounded-3xl shadow-2xl text-center space-y-6">
        <div className="flex flex-col items-center justify-center gap-3">
          <img
            src="/logo-white.png"
            alt="Kumbhkaran Salons"
            className="h-11 sm:h-13 w-auto object-contain drop-shadow-xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.png';
            }}
          />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Salon Partner Access
          </span>
          <h1 className="text-2xl font-black text-white font-['Syne',sans-serif]">
            Welcome to Kumbhkaran Salons Partner OS
          </h1>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Manage your physical walk-in queue, update salon pricing, view analytics, and welcome eager customers with zero booking fees.
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

        <div className="pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-center gap-2">
          <span>✓ Zero listing charges</span>
          <span>•</span>
          <span>✓ Live walk-in queue controls</span>
          <span>•</span>
          <span>✓ Instant verified setup</span>
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
                Partner Portal
              </span>
              <span className="text-xs text-zinc-400">partner.kumbhakaran.app</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white mt-0.5 font-['Syne',sans-serif]">
              Kumbhkaran Salons for Owners
            </h1>
            <p className="text-xs text-zinc-400">
              Manage your physical queue, update prices, and welcome walk-in customers with zero booking fees.
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
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-xs font-semibold text-white transition-colors"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[140px]">{activeSalon.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {salonDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-1.5 z-40">
                <div className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1">
                  Your Studios ({salons.length})
                </div>
                {salons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSalonId(s.id);
                      setPartnerView('live-queue');
                      setSalonDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center justify-between transition-colors ${
                      activeSalon.id === s.id
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white truncate">{s.name}</div>
                      <div className="text-[10px] text-zinc-400">{s.locality} • Queue: {s.currentQueue}</div>
                    </div>
                    {activeSalon.id === s.id && <span className="text-amber-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Register New Salon Button */}
          <button
            onClick={() => setPartnerView('register')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              partnerView === 'register'
                ? 'bg-amber-500 text-black shadow-amber-500/20'
                : 'bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-zinc-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Studio</span>
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
