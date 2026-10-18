import React, { useContext, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { useLanguage } from '../../context/LanguageContext'
import { MESSAGES } from '../utils/toastService'
import { assets } from '../assets/assets'
import NotificationBell from '../../components/NotificationBell'
import '../styles/navbar.css'

const Navbar = () => {
  const navigate = useNavigate()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const { token, setToken, userData } = useContext(AppContext)
  const { t } = useLanguage()

  const handleLogout = () => {
    if (window.confirm(MESSAGES.logoutConfirm)) {
      localStorage.removeItem('pToken')
      localStorage.removeItem('token')
      setToken(false)
      navigate('/login')
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container">
        <NavLink to="/" className="navbar-brand d-flex align-items-center gap-2" onClick={() => setShowMobileMenu(false)}>
          <img src={assets.logo} alt="Aayush Smart Healthcare Logo" className="navbar-logo-enhanced" />
          <span className="navbar-title-enhanced">{t('Aayush Smart Healthcare')}</span>
        </NavLink>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${showMobileMenu ? 'show' : ''}`}>
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 align-items-lg-center">
            <li className="nav-item">
              <NavLink to="/" className="nav-link" onClick={() => setShowMobileMenu(false)}>
                {t('Home')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/doctors" className="nav-link" onClick={() => setShowMobileMenu(false)}>
                {t('All Doctors')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/my-appointments" className="nav-link" onClick={() => setShowMobileMenu(false)}>
                {t('My Appointments')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/about" className="nav-link" onClick={() => setShowMobileMenu(false)}>
                {t('About Us')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/contact" className="nav-link" onClick={() => setShowMobileMenu(false)}>
                {t('Contact Us')}
              </NavLink>
            </li>
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle fw-semibold text-primary"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {t('Dashboards')}
              </a>
              <ul className="dropdown-menu dropdown-menu-custom shadow-sm">
                <li>
                  <NavLink
                    to="/admin-dashboard"
                    className="dropdown-item py-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    🛡️ {t('Admin Dashboard')}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/doctor-dashboard"
                    className="dropdown-item py-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    🩺 {t('Doctor Dashboard')}
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/phc-centers/dashboard"
                    className="dropdown-item py-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    🏥 {t('PHC Centers Dashboard')}
                  </NavLink>
                </li>
              </ul>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {token && <NotificationBell />}
            {token && userData ? (
              <div className="profile-dropdown dropdown">
                <button
                  className="btn btn-link dropdown-toggle p-0"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <img
                    src={userData.image}
                    alt="Profile"
                    className="profile-icon"
                  />
                </button>
                <ul className="dropdown-menu dropdown-menu-end dropdown-menu-custom">
                  <li>
                    <button
                      className="dropdown-item dropdown-item-custom"
                      onClick={() => {
                        navigate('/all-hospitals')
                        setShowMobileMenu(false)
                      }}
                    >
                      {t('Hospitals')}
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item dropdown-item-custom"
                      onClick={() => navigate('/doctors')}
                    >
                      {t('All Doctors')}
                    </button>
                  </li>
                  <li>
                    <button
                      className="dropdown-item dropdown-item-custom"
                      onClick={() => navigate('/doctors')}
                    >
                      {t('Book Appointment')}
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item dropdown-item-custom" onClick={() => navigate('/my-appointments')}>
                      {t('My Appointments')}
                    </button>
                  </li>
                  <li>
                    <button className="dropdown-item dropdown-item-custom" onClick={() => navigate('/my-profile')}>
                      {t('My Profile')}
                    </button>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item dropdown-item-custom text-danger"
                      onClick={handleLogout}
                    >
                      {t('Logout')}
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="btn btn-outline-primary btn-sm px-3"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t('Login')}
                </NavLink>
                <NavLink
                  to="/login"
                  className="btn btn-primary btn-sm px-3"
                  style={{ background: '#5F6FFF', borderColor: '#5F6FFF' }}
                  onClick={() => setShowMobileMenu(false)}
                >
                  {t('Signup')}
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar