import React, { useState } from 'react';
import { useSalon } from '../../context/PartnerContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { SalonRegistrationWizard } from './SalonRegistrationWizard';
import { PendingApprovalScreen } from './PendingApprovalScreen';
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md p-6 sm:p-8 bg-white border border-[#E8E2D8] rounded-3xl shadow-2xl space-y-6 text-center text-stone-900">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center justify-center gap-2 pt-2">
                <img
                  src={logoFallback}
                  alt="SLOON Partner"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
                <span className="text-[10px] uppercase tracking-widest font-extrabold px-3 py-1 rounded-full bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC]">
                  Partner Sign In
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-stone-900 font-serif">
                  Welcome to SLOON Partner
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                  Sign in with your Google account to access your live queue counter and salon management dashboard.
                </p>
              </div>

              {/* Language pill */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={openLanguageModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-50 border border-stone-200 text-stone-700 text-[11px] font-bold hover:border-[#E05326] transition-all cursor-pointer"
                >
                  <Languages className="w-3.5 h-3.5 text-[#E05326]" />
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

              <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-500 flex flex-wrap items-center justify-center gap-2 font-medium">
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
      <div className="space-y-6 pb-28 text-stone-900">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#E8E2D8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] text-[#E05326] font-black flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-[#E05326]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#E05326] border border-[#FED7CC]">
                  Interactive Demo Mode
                </span>
                <span className="text-xs text-stone-500 hidden sm:inline">Explore all live owner controls</span>
              </div>
              <h2 className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
                You are test-driving the SLOON Partner Dashboard
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsDemoMode(false)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700 transition-colors cursor-pointer"
            >
              Exit Demo
            </button>
            <button
              type="button"
              onClick={() => setShowSignInModal(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#E05326] hover:bg-[#D0481E] text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md p-6 sm:p-8 bg-white border border-[#E8E2D8] rounded-3xl shadow-2xl space-y-6 text-center text-stone-900">
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1.5">
                <h3 className="text-xl font-black text-stone-900 font-serif">
                  Ready to Register Your Salon?
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
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

  // Check if active salon is awaiting admin authorization before granting platform access
  const isPendingAdminApproval = Boolean(activeSalon && (!activeSalon.isVerified || activeSalon.status === 'pending'));

  return (
    <div className="space-y-6 pb-28 text-stone-900">
      {/* Main Switcher View: Registration Wizard vs Pending Gate vs Studio Operating Dashboard */}
      {partnerView === 'register' || !activeSalon ? (
        <SalonRegistrationWizard onSuccess={() => setPartnerView('home')} />
      ) : isPendingAdminApproval ? (
        <PendingApprovalScreen onEditDetails={() => setPartnerView('register')} />
      ) : (
        <OwnerApp onOpenWalkthrough={() => setShowWalkthroughWhenAuth(true)} />
      )}
    </div>
  );
};
