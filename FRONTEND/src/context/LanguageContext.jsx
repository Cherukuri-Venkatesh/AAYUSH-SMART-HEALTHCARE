import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS } from '../utils/translations';
import {
  applyDOMTranslations,
  setupAutoObserver,
  resolveTranslation,
  installRuntimeTranslationBridge,
} from '../utils/domTranslator';
import { BACKENDURL } from '../lib';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en';
  });

  const dynamicCacheRef = useRef(new Map());

  // Static dictionary translation lookup with bidirectional inverted index
  const t = useCallback((text, fallback = null) => {
    if (!text) return text;
    const cleanText = String(text).trim();
    if (!cleanText) return text;

    const resolved = resolveTranslation(cleanText, currentLanguage);
    if (resolved !== null) {
      return resolved;
    }

    if (currentLanguage === 'en') return cleanText;
    return fallback !== null ? fallback : cleanText;
  }, [currentLanguage]);

  // Translate dynamic content via backend /api/translate with memory caching
  const translateDynamic = useCallback(async (text) => {
    if (!text || currentLanguage === 'en') return text;
    const cleanText = String(text).trim();
    
    // Check static dictionary first
    const staticTranslation = t(cleanText, null);
    if (staticTranslation !== null && staticTranslation !== cleanText) {
      return staticTranslation;
    }

    // Check dynamic cache
    const cacheKey = `${currentLanguage}::${cleanText}`;
    if (dynamicCacheRef.current.has(cacheKey)) {
      return dynamicCacheRef.current.get(cacheKey);
    }

    try {
      const res = await fetch(`${BACKENDURL}translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText,
          targetLanguage: currentLanguage
        })
      });

      if (res.ok) {
        const data = await res.json();
        const translated = data.translatedText || cleanText;
        dynamicCacheRef.current.set(cacheKey, translated);
        return translated;
      }
    } catch (e) {
      // Ignore network errors and fallback
    }

    return cleanText;
  }, [currentLanguage, t]);

  const changeLanguage = (langCode) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('app_language', langCode);
    installRuntimeTranslationBridge();
    applyDOMTranslations(langCode);
    setupAutoObserver(langCode);
  };

  // Run safe TextNode DOM translations on initial load, route changes, and language changes
  useEffect(() => {
    installRuntimeTranslationBridge();
    applyDOMTranslations(currentLanguage);
    setupAutoObserver(currentLanguage);

    const handleRouteChange = () => {
      setTimeout(() => {
        applyDOMTranslations(currentLanguage);
      }, 100);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        t,
        translateDynamic,
        supportedLanguages: SUPPORTED_LANGUAGES
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
