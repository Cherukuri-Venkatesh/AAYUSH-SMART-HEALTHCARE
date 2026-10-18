import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { NavLink } from "react-router-dom";
import { DoctorContext } from "../context/DoctorContext";
import { AdminContext } from "../context/AdminContext";
import { PhcContext } from "../context/PhcContext";
import { useLanguage } from "../../context/LanguageContext";
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { dToken } = useContext(DoctorContext);
  const { aToken } = useContext(AdminContext);
  const { phcToken } = useContext(PhcContext);
  const { t } = useLanguage();

  return (
    <div
      className={`admin-sidebar ${isOpen ? 'is-open' : ''}`}
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      {/* LOGO / HEADER */}
      <div className="admin-sidebar-header">
        <h2>{phcToken ? `🏥 ${t('PHC Portal')}` : dToken ? `👨‍⚕️ ${t('Doctor Panel')}` : `⚕️ ${t('Admin Panel')}`}</h2>
      </div>

      {/* ADMIN MENU */}
      {aToken && (
        <ul className="admin-sidebar-menu">
          <NavLink
            to="/admin-dashboard"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.home_icon} alt="" />
            </span>
            {t('Dashboard')}
          </NavLink>

          <NavLink
            to="/add-doctor"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.add_icon} alt="" />
            </span>
            {t('Add Doctor')}
          </NavLink>

          <NavLink
            to="/doctor-list"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.people_icon} alt="" />
            </span>
            {t('Doctors Management')}
          </NavLink>

          <NavLink
            to="/all-appointments"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.appointment_icon} alt="" />
            </span>
            {t('Patients Management')}
          </NavLink>

          <NavLink
            to="/add-phc-center"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.add_icon} alt="" />
            </span>
            {t('Add PHC Centre')}
          </NavLink>

          <NavLink
            to="/phc-centers-list"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.home_icon} alt="" />
            </span>
            {t('PHC Management')}
          </NavLink>

          <NavLink
            to="/admin/community-health"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.earning_icon} alt="" />
            </span>
            {t('Community Health')}
          </NavLink>
        </ul>
      )}

      {/* DOCTOR MENU */}
      {dToken && (
        <ul className="admin-sidebar-menu">
          <NavLink
            to="/doctor-dashboard"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.home_icon} alt="" />
            </span>
            {t('Dashboard')}
          </NavLink>

          <NavLink
            to="/doctor-appointments"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.appointment_icon} alt="" />
            </span>
            {t('Appointments')}
          </NavLink>

          <NavLink
            to="/doctor-patients"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.people_icon} alt="" />
            </span>
            {t('Doctor Patients')}
          </NavLink>

          <NavLink
            to="/doctor-schedule"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.add_icon} alt="" />
            </span>
            {t('Schedule Uploading') || 'Schedule Uploading'}
          </NavLink>

          <NavLink
            to="/doctor-my-area"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.home_icon} alt="" />
            </span>
            {t('My Area')}
          </NavLink>

          <NavLink
            to="/doctor-analytics"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.earning_icon} alt="" />
            </span>
            {t('Doctor Analytics')}
          </NavLink>
        </ul>
      )}

      {/* PHC CENTERS WORKFORCE MENU */}
      {phcToken && (
        <ul className="admin-sidebar-menu">
          <NavLink
            to="/phc-centers/dashboard"
            className={({ isActive }) =>
              `admin-sidebar-menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <span className="admin-sidebar-icon-wrapper">
              <img src={assets.home_icon} alt="" />
            </span>
            {t('PHC Portal')}
          </NavLink>
        </ul>
      )}
    </div>
  );
};

export default Sidebar;
