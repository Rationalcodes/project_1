import React, { useState } from 'react';
import { useSalon } from '../../context/PartnerContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { SalonRegistrationWizard } from './SalonRegistrationWizard';
import { OwnerApp } from '../owner/OwnerApp';
import { PartnerLandingPage } from './PartnerLandingPage';
import { GoogleSignInButton } from '@kumbhakaran/ui';
import logoWhite from '../../assets/logo-white.png';
import logoFallback from '../../assets/logo.png';
import {
  Store,
  PlusCircle,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Languages,
  X,
  Play,
  Home,
  LayoutDashboard,
  Sparkles,
  Info
} from 'lucide-react';

export const PartnerPortal: React.FC = () => {
  const {
    salons,
    activeSalon,
    setActiveSalonId,
    partnerView,
    setPartnerView,
    isAuthenticated,
    loginWithGoogle,
  } = useSalon();

  const { t, openLanguageModal, languageInfo } = useLanguage();
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showWalkthroughWhenAuth, setShowWalkthroughWhenAuth] = useState(false);

  // Global listener for navbar Sign In click
  React.useEffect(() => {
    const handleOpenSignIn = () => setShowSignInModal(true);
    window.addEventListener('open-partner-signin', handleOpenSignIn);
    return () => window.removeEventListener('open-partner-signin', handleOpenSignIn);
  }, []);

  // If unauthenticated and not in interactive demo mode -> show Walkthrough Homepage
  if (!isAuthenticated && !isDemoMode) {
    return (
      <div className="relative">
        <PartnerLandingPage
          onStartRegistration={() => {
            setShowSignInModal(true);
          }}
          onOpenSignIn={() => {
            setShowSignInModal(true);
          }}
          onExploreDemo={() => {
            setIsDemoMode(true);
          }}
          onGoogleSuccess={(cred, clientId) => {
            loginWithGoogle(cred, clientId);
            setShowSignInModal(false);
          }}
        />

        {/* Elegant Sign-In Modal */}
        {showSignInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md p-6 sm:p-8 bg-[#121218] border border-amber-500/40 rounded-3xl shadow-2xl space-y-6 text-center">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center justify-center gap-2 pt-2">
                <img
                  src={logoWhite}
                  alt="SLOON Partner"
                  className="h-10 sm:h-12 w-auto object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = logoFallback;
                  }}
                />
                <span className="text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Partner Sign In
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-white font-['Syne',sans-serif]">
                  Welcome to SLOON Partner
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Sign in with your Google account to access your live queue counter and salon management dashboard.
                </p>
              </div>

              {/* Language pill */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={openLanguageModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-bold hover:border-amber-400 transition-all cursor-pointer"
                >
                  <Languages className="w-3.5 h-3.5 text-amber-400" />
                  <span>{languageInfo.nativeName} ({languageInfo.name})</span>
                </button>
              </div>

              {/* Google Sign In Web Component */}
              <div className="pt-2 flex flex-col items-center justify-center">
                <GoogleSignInButton
                  onSuccess={(cred, clientId) => {
                    loginWithGoogle(cred, clientId);
                    setShowSignInModal(false);
                  }}
                  text="signin_with"
                  theme="outline"
                  width={280}
                />
              </div>

              <div className="pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex flex-wrap items-center justify-center gap-2">
                <span>✓ 0% Commission on Cash</span>
                <span>•</span>
                <span>✓ Live Queue Controls</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Interactive Demo Mode Banner (when unauthenticated user explores the dashboard)
  if (!isAuthenticated && isDemoMode) {
    return (
      <div className="space-y-6 pb-28 text-slate-100">
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-zinc-900 to-zinc-900 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black font-black flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Interactive Demo Mode
                </span>
                <span className="text-xs text-zinc-400 hidden sm:inline">Explore all live owner controls</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                You are test-driving the SLOON Partner Dashboard
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 transition-colors cursor-pointer"
            >
              Exit Demo
            </button>
            <button
              type="button"
              onClick={() => setShowSignInModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Register Real Salon</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Demo Dashboard View */}
        <OwnerApp />

        {/* Sign In Modal */}
        {showSignInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md p-6 sm:p-8 bg-[#121218] border border-amber-500/40 rounded-3xl shadow-2xl space-y-6 text-center">
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-white font-['Syne',sans-serif]">
                  Ready to Register Your Salon?
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Sign in with Google to save your salon, get verified, and print your counter QR standee.
                </p>
              </div>

              <div className="pt-2 flex flex-col items-center justify-center">
                <GoogleSignInButton
                  onSuccess={(cred, clientId) => {
                    loginWithGoogle(cred, clientId);
                    setIsDemoMode(false);
                    setShowSignInModal(false);
                  }}
                  text="signin_with"
                  theme="outline"
                  width={280}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // When authenticated, check if user requested to see the Walkthrough Homepage
  if (showWalkthroughWhenAuth) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400">Partner Walkthrough & Features</span>
          </div>
          <button
            type="button"
            onClick={() => setShowWalkthroughWhenAuth(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Back to Salon Dashboard</span>
          </button>
        </div>

        <PartnerLandingPage
          onStartRegistration={() => {
            setShowWalkthroughWhenAuth(false);
            setPartnerView('register');
          }}
          onOpenSignIn={() => setShowWalkthroughWhenAuth(false)}
          onExploreDemo={() => setShowWalkthroughWhenAuth(false)}
          onGoogleSuccess={() => setShowWalkthroughWhenAuth(false)}
        />
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

        {/* Quick Actions: Switch Salon, Walkthrough, Register Studio */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Link to Walkthrough Homepage */}
          <button
            type="button"
            onClick={() => setShowWalkthroughWhenAuth(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            title="View partner benefits and feature walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Offerings Walkthrough</span>
          </button>

          {/* Active Salon Dropdown */}
          {activeSalon && (
            <div className="relative">
              <button
                type="button"
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
