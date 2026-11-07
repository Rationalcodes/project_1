import React from 'react';
import { PartnerProvider, usePartner } from './context/PartnerContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { PartnerPortal } from './components/partner/PartnerPortal';
import { NotificationToast } from './components/common/NotificationToast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LanguageSelectorButton } from './components/common/LanguageSelectorButton';
import { MandatoryLanguageModal } from './components/common/MandatoryLanguageModal';
import { Store, LogOut, User, LogIn, Bell } from 'lucide-react';
import logoTransparent from './assets/logo-transparent.png';
import logoFallback from './assets/logo.png';

const PartnerMainContent: React.FC = () => {
  const { partnerUser, isAuthenticated, logout } = usePartner();
  const { t, hasChosenLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 flex flex-col font-sans selection:bg-orange-500/20 selection:text-orange-950 w-full max-w-full overflow-x-hidden">
      {/* Partner OS Top Bar */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D8] px-3 sm:px-4 py-2 sm:py-2.5 transition-all w-full max-w-full overflow-hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Brand mark */}
          <div className="flex items-center gap-2.5 min-w-0 shrink group notranslate">
            <div className="w-8 h-8 rounded-xl bg-[#E05326] text-white flex items-center justify-center font-black text-sm shadow-xs">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight leading-none">
                Sloon
              </span>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider leading-tight mt-0.5">
                Partner
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            {/* Quick Language Selector Pill Button */}
            <LanguageSelectorButton />

            {/* Notification Bell with unread dot (matches screenshot) */}
            <div className="relative p-1.5 rounded-full hover:bg-stone-200/60 transition-colors cursor-pointer text-stone-700">
              <Bell className="w-5 h-5 text-stone-800" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#E05326] ring-2 ring-[#FAF7F2]" />
            </div>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-partner-signin'));
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#18181b] hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1.5 p-0.5 rounded-full bg-white border border-stone-200 shadow-2xs">
                  {partnerUser?.avatarUrl ? (
                    <img
                      src={partnerUser.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#FFF3EC] text-[#E05326] flex items-center justify-center font-bold text-xs">
                      {partnerUser?.name?.charAt(0) || 'P'}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => logout()}
                  className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 hover:text-red-500 transition-colors cursor-pointer"
                  title={t.signOut}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Partner Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 py-4 sm:px-4 sm:py-5 overflow-x-hidden">
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
