import React from "react";
import { useLanguage } from "../../context/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-white py-5 mt-5">
      <div className="container">
        <div className="row mb-5">
          {/* Company Info */}
          <div className="col-md-4 mb-4">
            <h5 className="fw-bold mb-3">{t('Aayush Smart Healthcare')}</h5>
            <p className="text-light">{t('Your trusted partner for healthcare services and medical consultations.')}</p>
          </div>

          {/* Quick Links */}
          <div className="col-md-3 mb-4">
            <h5 className="fw-bold mb-3">{t('Quick Links')}</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="/" className="text-white text-decoration-none">{t('Home')}</a></li>
              <li className="mb-2"><a href="/about" className="text-white text-decoration-none">{t('About Us')}</a></li>
              <li className="mb-2"><a href="/contact" className="text-white text-decoration-none">{t('Contact Us')}</a></li>
              <li className="mb-2"><a href="/doctors" className="text-white text-decoration-none">{t('Find Doctors')}</a></li>
            </ul>
          </div>

          {/* Dashboards & Portals */}
          <div className="col-md-3 mb-4">
            <h5 className="fw-bold mb-3">{t('Dashboards & Portals')}</h5>
            <ul className="list-unstyled">
              <li className="mb-2"><a href="/admin-dashboard" className="text-white text-decoration-none">🛡️ {t('Admin Dashboard')}</a></li>
              <li className="mb-2"><a href="/doctor-dashboard" className="text-white text-decoration-none">🩺 {t('Doctor Dashboard')}</a></li>
              <li className="mb-2"><a href="/phc-centers/dashboard" className="text-white text-decoration-none">🏥 {t('PHC Centers Dashboard')}</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="col-md-2 mb-4">
            <h5 className="fw-bold mb-3">{t('Contact Us')}</h5>
            <ul className="list-unstyled text-light">
              <li className="mb-2"><i className="bi bi-envelope"></i> info@aayush.com</li>
              <li className="mb-2"><i className="bi bi-telephone"></i> +1 (555) 123-4567</li>
              <li className="mb-2"><i className="bi bi-geo-alt"></i> {t('123 Healthcare St, Medical City')}</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-top border-light pt-4 text-center text-light">
          <p>&copy; 2026 {t('Aayush Smart Healthcare')}. {t('All rights reserved.')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
