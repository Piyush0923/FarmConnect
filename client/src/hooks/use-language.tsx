import { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '@/lib/translations';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translate: (text: string) => Promise<string>;
  isTranslating: boolean;
  supportedLanguages: { code: string; name: string; nativeName: string }[];
}

const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationCache, setTranslationCache] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const savedLanguage = localStorage.getItem('fms_language');
    if (savedLanguage && supportedLanguages.some(lang => lang.code === savedLanguage)) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('fms_language', lang);
    // Clear translation cache when language changes
    setTranslationCache(new Map());
  };

  const translate = async (text: string): Promise<string> => {
    // For static translations, use the getTranslation function
    return getTranslation(text, language);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      translate,
      isTranslating,
      supportedLanguages
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
