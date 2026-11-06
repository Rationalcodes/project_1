import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Languages, Globe } from 'lucide-react';

export const LanguageSelectorButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { languageInfo, openLanguageModal } = useLanguage();

  return (
    <button
      type="button"
      onClick={openLanguageModal}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-400 text-xs text-zinc-200 transition-colors cursor-pointer group shadow-xs"
      title="Change Language / भाषा बदलें"
    >
      <Languages className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
      <span className="font-bold text-amber-400">{languageInfo.nativeName}</span>
      {!compact && (
        <span className="text-[11px] text-zinc-400 hidden sm:inline">
          ({languageInfo.name})
        </span>
      )}
    </button>
  );
};
