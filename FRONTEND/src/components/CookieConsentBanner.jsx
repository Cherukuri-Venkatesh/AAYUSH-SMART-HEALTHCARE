import React, { useState, useEffect } from 'react';
import { hasUserConsented, applyCookieConsent, prefetchAppResources, isPerformanceModeEnabled } from '../utils/cookieManager';
import './CookieConsentBanner.css';

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [fastModeBanner, setFastModeBanner] = useState(false);

  useEffect(() => {
    // If user has not answered yet, show banner after 1 second
    if (!hasUserConsented()) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else if (isPerformanceModeEnabled()) {
      // Proactively prefetch if performance mode was previously enabled
      prefetchAppResources();
    }
  }, []);

  const handleAcceptAll = () => {
    applyCookieConsent('all');
    setVisible(false);
    setFastModeBanner(true);
    setTimeout(() => setFastModeBanner(false), 4000);
  };

  const handleEssentialOnly = () => {
    applyCookieConsent('essential');
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <div className="cookie-banner-overlay animate-slide-up" role="region" aria-label="Cookie Preferences">
          <div className="cookie-banner-card">
            <div className="cookie-banner-header">
              <div className="cookie-icon-wrapper">
                <span className="cookie-emoji" role="img" aria-label="cookie">🍪</span>
              </div>
              <div className="cookie-banner-title-group">
                <h4 className="cookie-title">Enable High-Speed & Lag-Free Experience</h4>
                <p className="cookie-description">
                  Aayush Smart Healthcare uses performance & session cookies to cache doctor catalogs, reduce server latency, and keep tele-consultations ultra smooth.
                </p>
              </div>
            </div>

            <div className="cookie-banner-badges">
              <span className="cookie-pill">⚡ Instant Page Transitions</span>
              <span className="cookie-pill">🩺 Zero-Delay Doctor Search</span>
              <span className="cookie-pill">🔒 Encrypted Session Storage</span>
            </div>

            <div className="cookie-banner-actions">
              <button 
                type="button" 
                className="cookie-btn cookie-btn-essential" 
                onClick={handleEssentialOnly}
              >
                Essential Only
              </button>
              <button 
                type="button" 
                className="cookie-btn cookie-btn-accept" 
                onClick={handleAcceptAll}
              >
                🚀 Accept & Enable Lag-Free Mode
              </button>
            </div>
          </div>
        </div>
      )}

      {fastModeBanner && (
        <div className="fast-mode-toast animate-fade-in" role="status">
          <span className="fast-icon">⚡</span>
          <span><b>Lag-Free Fast Mode Activated!</b> Clinical catalogs are now cached in your browser.</span>
        </div>
      )}
    </>
  );
};

export default CookieConsentBanner;
