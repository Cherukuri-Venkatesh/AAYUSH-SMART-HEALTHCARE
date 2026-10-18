import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import '../styles/about.css';

const About = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <div
        className="about-hero"
        style={{
          background: 'linear-gradient(135deg, #5F6FFF 0%, #8B9FFF 100%)',
          color: 'white',
          padding: '80px 0',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">{t('About Aayush Smart Healthcare')}</h1>
          <p className="lead opacity-90">{t('A secure digital care platform connecting patients with hospitals and doctors.')}</p>
        </div>
      </div>

      <div className="container py-5">
        <section className="about-section mb-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div
                className="about-image-box"
                style={{
                  background: 'linear-gradient(135deg, #f0f3ff, #f8faff)',
                  borderRadius: '14px',
                  padding: '40px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏥</div>
                <h3 className="h5 fw-bold mb-2">{t('Patient-first Digital Care')}</h3>
                <p className="text-secondary mb-0">{t('Appointments, records, prescriptions, and reports in one place.')}</p>
              </div>
            </div>

            <div className="col-lg-6">
              <h2 className="h3 fw-bold section-title mb-3">{t('Our Purpose')}</h2>
              <p className="text-secondary mb-3 lead">
                {t('Aayush Smart Healthcare is built to simplify care delivery while keeping data secure and role-based.')}
              </p>
              <p className="text-secondary mb-3">
                {t('Patients can discover doctors, book appointments, and track medical documents through authenticated workflows backed by persisted records.')}
              </p>
              <p className="text-secondary mb-0">
                {t('Doctors and administrators work through dedicated portals with access controls designed to prevent cross-user data exposure.')}
              </p>
            </div>
          </div>
        </section>

        <section className="final-cta text-center" style={{
          background: 'linear-gradient(135deg, #5F6FFF 0%, #8B9FFF 100%)',
          color: 'white',
          padding: '60px',
          borderRadius: '14px'
        }}>
          <h2 className="h3 fw-bold mb-3">{t('Care That Stays Connected')}</h2>
          <p className="lead mb-4 opacity-90">{t('Book consultations, manage visits, and access records with live backend data.')}</p>
          <button className="btn btn-light btn-lg px-5" onClick={() => navigate('/doctors')}>{t('Explore Services')}</button>
        </section>
      </div>
    </div>
  );
};

export default About;
