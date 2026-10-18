import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './LanguageSelectorWidget.css';

const LanguageSelectorWidget = () => {
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLang = supportedLanguages.find(l => l.code === currentLanguage) || supportedLanguages[0];

  const handleSelect = (langCode) => {
    changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div id="language-selector-widget" className="lang-widget-container" ref={widgetRef}>
      {/* Floating Dropdown Card */}
      {isOpen && (
        <div className="lang-dropdown-panel" role="dialog" aria-label="Select Language">
          <div className="lang-dropdown-header">
            <h4 className="lang-dropdown-title">
              <span>🌐</span> Choose Language
            </h4>
            <span className="lang-dropdown-subtitle">9 Indian Languages</span>
          </div>

          <div className="lang-list-grid">
            {supportedLanguages.map((lang) => {
              const isActive = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  className={`lang-tile-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelect(lang.code)}
                >
                  <div className="lang-tile-info">
                    <span className="lang-tile-native">{lang.nativeName}</span>
                    <span className="lang-tile-english">{lang.name}</span>
                  </div>
                  {isActive && <span className="lang-tile-check">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="lang-dropdown-footer">
            ⚡ Instant UI & Database Auto-Translation
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        className="lang-fab-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Change Application Language"
      >
        <span className="lang-fab-icon">🌐</span>
        <span className="lang-fab-symbol">{activeLang.symbol}</span>
        <span className="lang-fab-label">{activeLang.nativeName}</span>
        <span className={`lang-fab-chevron ${isOpen ? 'open' : ''}`}>▲</span>
      </button>
    </div>
  );
};

export default LanguageSelectorWidget;
