import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './admin/App.jsx';
import Dashboard from './admin/pages/Admin/Dashboard.jsx';
import AllAppointments from './admin/pages/Admin/AllAppointments.jsx';
import AddDoctor from './admin/pages/Admin/AddDoctor.jsx';
import AddHospital from './admin/pages/Admin/AddHospital.jsx';
import DeleteDoctor from './admin/pages/Admin/DeleteDoctor.jsx';
import DoctorsList from './admin/pages/Admin/DoctorsList.jsx';
import AddPhcCenter from './admin/pages/Admin/AddPhcCenter.jsx';
import PhcCentersList from './admin/pages/Admin/PhcCentersList.jsx';
import AdminCommunityHealth from './admin/pages/Admin/AdminCommunityHealth.jsx';

import DoctorAppointments from './admin/pages/Doctor/DoctorAppointments.jsx';
import DoctorDashboard from './admin/pages/Doctor/DoctorDashboard.jsx';
import DoctorProfile from './admin/pages/Doctor/DoctorProfile.jsx';
import DoctorPatients from './admin/pages/Doctor/DoctorPatients.jsx';
import DoctorPatientProfile from './admin/pages/Doctor/DoctorPatientProfile.jsx';
import DoctorSchedule from './admin/pages/Doctor/DoctorSchedule.jsx';
import DoctorAnalytics from './admin/pages/Doctor/DoctorAnalytics.jsx';
import DoctorMyArea from './admin/pages/Doctor/DoctorMyArea.jsx';
import DoctorForgotPassword from './admin/pages/Doctor/ForgotPassword.jsx';

import PhcCentersDashboard from './admin/pages/PhcCenters/PhcCentersDashboard.jsx';

import PatientLayout from './patient/App.jsx';
import About from './patient/pages/About.jsx';
import AllHospitals from './patient/pages/AllHospitals.jsx';
import Appointment from './patient/pages/Appointment.jsx';
import Contact from './patient/pages/Contact.jsx';
import Doctors from './patient/pages/Doctors.jsx';
import Home from './patient/pages/Home.jsx';
import Login from './patient/pages/Login.jsx';
import ForgotPassword from './patient/pages/ForgotPassword.jsx';
import MyAppointments from './patient/pages/MyAppointments.jsx';
import MyLabReports from './patient/pages/MyLabReports.jsx';
import MyPrescriptions from './patient/pages/MyPrescriptions.jsx';
import MyProfile from './patient/pages/MyProfile.jsx';
import Verify from './patient/pages/Verify.jsx';
import OnlineConsultationRoom from './patient/pages/OnlineConsultationRoom.jsx';
import AdminProviders from './providers/AdminProviders.jsx';
import PatientProviders from './providers/PatientProviders.jsx';
import { ProtectedRoute, GuestOnlyRoute } from './components/ProtectedRoute.jsx';
import InactivityLogout from './components/InactivityLogout.jsx';
import AiChatWidget from './components/AiChatWidget.jsx';
import LanguageSelectorWidget from './components/LanguageSelectorWidget.jsx';
import CookieConsentBanner from './components/CookieConsentBanner.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';

const App = () => {
  return (
    <LanguageProvider>
      <InactivityLogout />
      <LanguageSelectorWidget />
      <AiChatWidget />
      <CookieConsentBanner />
      <Routes>
        {/* 1. PATIENT DASHBOARD & PORTAL */}
        <Route
          element={(
            <PatientProviders>
              <PatientLayout />
            </PatientProviders>
          )}
        >
          <Route path="/" element={<Home />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/doctors/:speciality" element={<Doctors />} />
          <Route path="/all-hospitals" element={<AllHospitals />} />
          <Route path="/login" element={<GuestOnlyRoute><Login /></GuestOnlyRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/appointment/:docId" element={<ProtectedRoute requiredRole="PATIENT"><Appointment /></ProtectedRoute>} />
          <Route path="/my-appointments" element={<ProtectedRoute requiredRole="PATIENT"><MyAppointments /></ProtectedRoute>} />
          <Route path="/my-profile" element={<ProtectedRoute requiredRole="PATIENT"><MyProfile /></ProtectedRoute>} />
          <Route path="/verify" element={<ProtectedRoute requiredRole="PATIENT"><Verify /></ProtectedRoute>} />
          <Route path="/my-prescriptions" element={<ProtectedRoute requiredRole="PATIENT"><MyPrescriptions /></ProtectedRoute>} />
          <Route path="/my-labreports" element={<ProtectedRoute requiredRole="PATIENT"><MyLabReports /></ProtectedRoute>} />
        </Route>

        {/* 2. ADMIN DASHBOARD, 3. DOCTOR DASHBOARD, 4. PHC CENTERS DASHBOARD */}
        <Route
          element={(
            <AdminProviders>
              <AdminLayout />
            </AdminProviders>
          )}
        >
          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="ADMIN"><Dashboard /></ProtectedRoute>} />
          <Route path="/all-appointments" element={<ProtectedRoute requiredRole="ADMIN"><AllAppointments /></ProtectedRoute>} />
          <Route path="/add-doctor" element={<ProtectedRoute requiredRole="ADMIN"><AddDoctor /></ProtectedRoute>} />
          <Route path="/add-hospital" element={<ProtectedRoute requiredRole="ADMIN"><AddHospital /></ProtectedRoute>} />
          <Route path="/delete-doctor" element={<ProtectedRoute requiredRole="ADMIN"><DeleteDoctor /></ProtectedRoute>} />
          <Route path="/doctor-list" element={<ProtectedRoute requiredRole="ADMIN"><DoctorsList /></ProtectedRoute>} />
          <Route path="/add-phc-center" element={<ProtectedRoute requiredRole="ADMIN"><AddPhcCenter /></ProtectedRoute>} />
          <Route path="/phc-centers-list" element={<ProtectedRoute requiredRole="ADMIN"><PhcCentersList /></ProtectedRoute>} />
          <Route path="/admin/community-health" element={<ProtectedRoute requiredRole="ADMIN"><AdminCommunityHealth /></ProtectedRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor-dashboard" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor-appointments" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorAppointments /></ProtectedRoute>} />
          <Route path="/doctor-profile" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorProfile /></ProtectedRoute>} />
          <Route path="/doctor-patients" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorPatients /></ProtectedRoute>} />
          <Route path="/doctor-patient/:patientId" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorPatientProfile /></ProtectedRoute>} />
          <Route path="/doctor-schedule" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorSchedule /></ProtectedRoute>} />
          <Route path="/doctor-analytics" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorAnalytics /></ProtectedRoute>} />
          <Route path="/doctor-my-area" element={<ProtectedRoute requiredRole="DOCTOR"><DoctorMyArea /></ProtectedRoute>} />
          <Route path="/doctor-forgot-password" element={<DoctorForgotPassword />} />

          {/* 4. PHC CENTERS UNIFIED DASHBOARD */}
          <Route path="/phc-centers/dashboard" element={<ProtectedRoute requiredRole="PHC_CENTERS"><PhcCentersDashboard /></ProtectedRoute>} />
        </Route>

        {/* 🎥 ONLINE VIDEO CONSULTATION ROOM (PATIENT / DOCTOR / ADMIN) */}
        <Route path="/consultation/room/:roomId" element={<ProtectedRoute><OnlineConsultationRoom /></ProtectedRoute>} />
        <Route path="/consultation-room/:roomId" element={<ProtectedRoute><OnlineConsultationRoom /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LanguageProvider>
  );
};

export default App;
