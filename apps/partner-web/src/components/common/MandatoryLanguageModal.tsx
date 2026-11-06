import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { INDIAN_LANGUAGES, LanguageOption } from '../../i18n/translations';
import { Languages, CheckCircle2, Sparkles, X, Globe, ShieldAlert } from 'lucide-react';
import logoWhite from '../../assets/logo-white.png';
import logoFallback from '../../assets/logo.png';

interface MandatoryLanguageModalProps {
  forceMandatory?: boolean;
}

export const MandatoryLanguageModal: React.FC<MandatoryLanguageModalProps> = ({
  forceMandatory = false,
}) => {
  const {
    currentLanguage,
    isLanguageModalOpen,
    closeLanguageModal,
    confirmMandatoryLanguage,
    hasChosenLanguage,
    t,
  } = useLanguage();

  const [selectedLang, setSelectedLang] = useState<string>(currentLanguage);
  const [searchQuery, setSearchQuery] = useState('');

  // Should show if forceMandatory is active or if user opened the language modal
  const isOpen = forceMandatory || (!hasChosenLanguage && isLanguageModalOpen) || isLanguageModalOpen;

  if (!isOpen) return null;

  const filteredLanguages = INDIAN_LANGUAGES.filter((lang) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      lang.name.toLowerCase().includes(q) ||
      lang.nativeName.toLowerCase().includes(q) ||
      lang.region.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q)
    );
  });

  const activeOption =
    INDIAN_LANGUAGES.find((l) => l.code === selectedLang) || INDIAN_LANGUAGES[0];

  const handleConfirm = () => {
    confirmMandatoryLanguage(selectedLang);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-gradient-to-b from-[#181824] via-[#12121a] to-[#0c0c10] border border-amber-500/40 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Section */}
        <div className="p-4 sm:p-6 pb-3 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Mandatory Language Setup
                  </span>
                  <span className="text-[11px] text-zinc-400 hidden sm:inline">
                    SLOON Partner OS
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-1 font-['Syne',sans-serif]">
                  {t.chooseLanguage}
                </h2>
              </div>
            </div>

            {hasChosenLanguage && !forceMandatory && (
              <button
                type="button"
                onClick={closeLanguageModal}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            {t.chooseLanguageSubtitle}
          </p>

          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>{t.languageMandatoryNote}</span>
          </div>

          {/* Quick Search Input */}
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder={t.searchLanguagePlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Language Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2.5 min-h-[220px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredLanguages.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLang(lang.code)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-md shadow-amber-500/10'
                      : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-850'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white group-hover:text-amber-300 transition-colors">
                        {lang.nativeName}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        ({lang.name})
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {lang.region}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                      {lang.greeting}
                    </span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-amber-400 border-amber-400 text-black'
                          : 'border-zinc-700 group-hover:border-zinc-500'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4 fill-black text-amber-400" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {filteredLanguages.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-500">
              No languages match "{searchQuery}". Try another name.
            </div>
          )}
        </div>

        {/* Footer with preview & confirm button */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/60 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-300 self-start sm:self-center">
            <Globe className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {t.selectedLanguage}: <strong className="text-amber-400">{activeOption.nativeName} ({activeOption.name})</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black" />
            <span>{t.confirmLanguageButton} ({activeOption.nativeName})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
