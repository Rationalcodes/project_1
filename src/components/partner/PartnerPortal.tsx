import React, { useState } from 'react';
import { useSalon } from '../../context/SalonContext';
import { SalonRegistrationWizard } from './SalonRegistrationWizard';
import { OwnerApp } from '../owner/OwnerApp';
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
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';

export const PartnerPortal: React.FC = () => {
  const {
    salons,
    activeSalon,
    setActiveSalonId,
    partnerView,
    setPartnerView
  } = useSalon();

  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);

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
          {/* Replay Onboarding Tour */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-partner-tour'))}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="View 4-Screen Partner Onboarding Tour"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Tour</span>
          </button>

          {/* Active Salon Dropdown */}
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

          {/* Register New Salon Button */}
          <button
            onClick={() => setPartnerView(partnerView === 'register' ? 'live-queue' : 'register')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
              partnerView === 'register'
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-300 hover:to-amber-400 shadow-amber-500/20'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{partnerView === 'register' ? 'View Live Queue' : 'Register New Salon'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Either Registration Wizard or Live Queue Management Dashboard */}
      {partnerView === 'register' ? (
        <SalonRegistrationWizard onSuccess={() => setPartnerView('live-queue')} />
      ) : (
        <OwnerApp />
      )}
    </div>
  );
};
