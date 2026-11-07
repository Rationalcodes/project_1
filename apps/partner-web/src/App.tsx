import React from 'react';
import { PartnerProvider, usePartner } from './context/PartnerContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { PartnerPortal } from './components/partner/PartnerPortal';
import { NotificationToast } from './components/common/NotificationToast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LanguageSelectorButton } from './components/common/LanguageSelectorButton';
import { MandatoryLanguageModal } from './components/common/MandatoryLanguageModal';
import { Store, LogOut, User, LogIn } from 'lucide-react';
import logoWhite from './assets/logo-white.png';
import logoFallback from './assets/logo.png';

const PartnerMainContent: React.FC = () => {
  const { partnerUser, isAuthenticated, logout } = usePartner();
  const { t, hasChosenLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-[#09090c] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-300 w-full max-w-full overflow-x-hidden">
      {/* Partner OS Top Bar */}
      <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-zinc-800/80 px-3 sm:px-4 py-2.5 sm:py-3 transition-all w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink group notranslate">
            <img
              src={logoWhite}
              alt="SLOON - Unisex Grooming Network"
              className="h-9 sm:h-10 md:h-12 w-auto max-w-[190px] sm:max-w-[230px] md:max-w-[270px] object-contain transition-transform group-hover:scale-105 notranslate"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = logoFallback;
              }}
            />
            <span className="hidden sm:inline text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30 shrink-0 self-center notranslate">
              Partner
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            {/* Quick Language Selector Pill Button */}
            <LanguageSelectorButton />

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-partner-signin'));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                  {partnerUser?.avatarUrl ? (
                    <img
                      src={partnerUser.avatarUrl}
                      alt=""
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="font-semibold text-white max-w-[100px] truncate hidden md:inline">
                    {partnerUser?.name}
                  </span>
                </div>

                <button
                  onClick={() => logout()}
                  className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                  title={t.signOut}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Partner Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-6 overflow-x-hidden">
        <PartnerPortal />
      </main>

      {/* Mandatory Language Selection Modal - triggers for authenticated partner if not yet chosen */}
      <MandatoryLanguageModal forceMandatory={isAuthenticated && !hasChosenLanguage} />

      <NotificationToast />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <PartnerProvider>
          <PartnerMainContent />
        </PartnerProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
