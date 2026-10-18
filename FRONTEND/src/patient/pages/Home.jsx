import React, { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { useLanguage } from '../../context/LanguageContext'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import TopHospitals from '../components/TopHospitals'
import Banner from '../components/Banner'
import Features from '../components/Features'

const Home = () => {
  const { token, doctors } = useContext(AppContext)
  const { t } = useLanguage()
  const navigate = useNavigate()

  const upcomingAppointments = useMemo(() => {
    if (!token) return []
    return doctors.slice(0, 3).map((doctor, index) => ({
      id: `APT10${index + 1}`,
      doctorName: doctor.name,
      hospital: doctor.hospital,
      date: new Date(Date.now() + (index + 1) * 86400000).toLocaleDateString(),
      time: ['10:00 AM', '11:30 AM', '02:00 PM'][index] || '10:00 AM',
      status: 'BOOKED',
    }))
  }, [token, doctors])

  return (
    <div className="pb-4">
      <Header />

      {/* Section 1: Upcoming Appointments */}
      {token && upcomingAppointments.length > 0 && (
        <section id="upcoming-appointments-section" className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="h3 fw-bold section-title mb-0">{t('Upcoming Appointments')}</h2>
            <button className="btn btn-outline-primary" onClick={() => navigate('/my-appointments')}>
              {t('View All')}
            </button>
          </div>

          <div className="row g-4">
            {upcomingAppointments.map((appointment) => (
              <div className="col-12 col-md-6 col-xl-4" key={appointment.id}>
                <div className="appointment-card card-hover h-100">
                  <div className="card-body">
                    <h3 className="h6 fw-bold mb-2">{appointment.doctorName}</h3>
                    <p className="mb-1 text-secondary"><strong>{t('Hospital')}:</strong> {appointment.hospital}</p>
                    <p className="mb-1 text-secondary"><strong>{t('Date')}:</strong> {appointment.date}</p>
                    <p className="mb-2 text-secondary"><strong>{t('Time')}:</strong> {appointment.time}</p>
                    <span className="badge bg-primary">{t('BOOKED')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 2: Doctor Specialities */}
      <SpecialityMenu />

      {/* Section 3: Premium Banner */}
      <div className="my-5">
        <div className="card card-premium glow-on-hover" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h3 className="h5 fw-bold mb-2">{t('Book Your First Consultation Today')}</h3>
          <p className="mb-4">{t('Get expert medical advice from verified specialists at top hospitals near you')}</p>
          <button
            className="btn btn-light"
            onClick={() => navigate('/doctors')}
          >
            {t('Explore Doctors')}
          </button>
        </div>
      </div>

      {/* Section 4: Top Hospitals */}
      <TopHospitals />

      {/* Section 5: Another Premium Banner */}
      <div className="my-5">
        <div className="card card-premium glow-on-hover" style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h3 className="h5 fw-bold mb-2">{t('Secure & Encrypted Health Records')}</h3>
          <p className="mb-4">{t('Your medical information is safely stored and accessible anytime, anywhere')}</p>
          <button
            className="btn btn-light"
            onClick={() => token ? navigate('/my-profile') : navigate('/login')}
          >
            {token ? t('View Your Records') : t('Create Account')}
          </button>
        </div>
      </div>

      {/* Section 6: Top Doctors */}
      <TopDoctors />

      {/* Section 7: Premium Banners */}
      <Banner />

      {/* Section 8: Features */}
      <Features />

      {/* Section 9: Primary Health Centre & ASHA Assistance */}
      <div className="my-5">
        <div className="card shadow-sm border-0" style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: 'white',
          borderRadius: '14px',
          padding: '36px'
        }}>
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary text-white">{t('Public Healthcare Network')}</span>
                <span className="badge bg-success text-white">{t('ASHA & PHC Supported')}</span>
              </div>
              <h3 className="h4 fw-bold mb-2">{t('Primary Healthcare Centre (PHC) & Field Assistance')}</h3>
              <p className="mb-0 text-light" style={{ opacity: 0.9 }}>
                {t('Need help at a rural health facility or village sub-centre? Authorized PHC healthcare workers and ASHA mobilizers can assist you with Aayush Smart Healthcare account registration, vitals triage, maternal ANC follow-ups, and specialist tele-referrals.')}
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <button className="btn btn-outline-light px-4 py-2 fw-semibold" onClick={() => navigate('/all-hospitals')}>
                🏥 {t('Locate Nearest PHC / Hospital')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Banner */}
      <div className="my-5">
        <div className="card card-premium glow-on-hover" style={{
          background: 'linear-gradient(135deg, #00BCD4 0%, #009688 100%)',
          color: 'white',
          borderRadius: '14px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h3 className="h5 fw-bold mb-2">{t('Need 24/7 Medical Support?')}</h3>
          <p className="mb-4">{t('Call our healthcare experts for immediate consultation and guidance')}</p>
          <a href="tel:+1234567890" className="btn btn-light">📞 +44 1234 567890</a>
        </div>
      </div>
    </div>
  )
}

export default Home