import React, { createContext, useContext, useState, useEffect } from 'react';
import { INDIAN_LANGUAGES, LanguageOption, TranslationDictionary, getTranslation } from './translations';
import { safeStorage } from '../utils/safeStorage';
import { setGoogleTranslateLanguage, syncCurrentGoogleTranslateLanguage } from './googleTranslate';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (langCode: string) => void;
  t: TranslationDictionary;
  languageInfo: LanguageOption;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  confirmMandatoryLanguage: (langCode: string) => void;
  hasChosenLanguage: boolean;
}

const STORAGE_LANG_KEY = 'kumbhakaran_partner_language';
const STORAGE_CHOSEN_FLAG = 'kumbhakaran_partner_language_chosen';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_LANG_KEY);
      if (saved && INDIAN_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
    } catch {}
    return 'hi'; // Default friendly fallback for Indian partners
  });

  const [hasChosenLanguage, setHasChosenLanguage] = useState<boolean>(() => {
    try {
      return safeStorage.getItem(STORAGE_CHOSEN_FLAG) === 'true';
    } catch {}
    return false;
  });

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(false);

  // Sync Google Translate with saved language on component mount
  useEffect(() => {
    syncCurrentGoogleTranslateLanguage(currentLanguage);
  }, []);

  const setLanguage = (langCode: string) => {
    if (INDIAN_LANGUAGES.some((l) => l.code === langCode)) {
      setCurrentLanguageState(langCode);
      try {
        safeStorage.setItem(STORAGE_LANG_KEY, langCode);
      } catch {}
      // Programmatically trigger browser Google Translate
      setGoogleTranslateLanguage(langCode);
    }
  };

  const confirmMandatoryLanguage = (langCode: string) => {
    setLanguage(langCode);
    setHasChosenLanguage(true);
    setIsLanguageModalOpen(false);
    try {
      safeStorage.setItem(STORAGE_CHOSEN_FLAG, 'true');
    } catch {}
    // Programmatically trigger browser Google Translate
    setGoogleTranslateLanguage(langCode);
  };

  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => {
    // Only allow manual closing if language was already confirmed before
    if (hasChosenLanguage) {
      setIsLanguageModalOpen(false);
    }
  };

  const t = getTranslation(currentLanguage);
  const languageInfo =
    INDIAN_LANGUAGES.find((l) => l.code === currentLanguage) || INDIAN_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        languageInfo,
        isLanguageModalOpen,
        openLanguageModal,
        closeLanguageModal,
        confirmMandatoryLanguage,
        hasChosenLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
