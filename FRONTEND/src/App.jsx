import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

// Core layout & critical landing components
import PatientLayout from './patient/App.jsx';
import AdminLayout from './admin/App.jsx';
import Home from './patient/pages/Home.jsx';

// Lazy-loaded routes for lag-free performance and lightweight bundles
const Doctors = lazy(() => import('./patient/pages/Doctors.jsx'));
const AllHospitals = lazy(() => import('./patient/pages/AllHospitals.jsx'));
const Appointment = lazy(() => import('./patient/pages/Appointment.jsx'));
const Contact = lazy(() => import('./patient/pages/Contact.jsx'));
const About = lazy(() => import('./patient/pages/About.jsx'));
const Login = lazy(() => import('./patient/pages/Login.jsx'));
const ForgotPassword = lazy(() => import('./patient/pages/ForgotPassword.jsx'));
const MyAppointments = lazy(() => import('./patient/pages/MyAppointments.jsx'));
const MyLabReports = lazy(() => import('./patient/pages/MyLabReports.jsx'));
const MyPrescriptions = lazy(() => import('./patient/pages/MyPrescriptions.jsx'));
const MyProfile = lazy(() => import('./patient/pages/MyProfile.jsx'));
const Verify = lazy(() => import('./patient/pages/Verify.jsx'));
const OnlineConsultationRoom = lazy(() => import('./patient/pages/OnlineConsultationRoom.jsx'));

// Lazy-loaded Admin pages
const Dashboard = lazy(() => import('./admin/pages/Admin/Dashboard.jsx'));
const AllAppointments = lazy(() => import('./admin/pages/Admin/AllAppointments.jsx'));
const AddDoctor = lazy(() => import('./admin/pages/Admin/AddDoctor.jsx'));
const AddHospital = lazy(() => import('./admin/pages/Admin/AddHospital.jsx'));
const DeleteDoctor = lazy(() => import('./admin/pages/Admin/DeleteDoctor.jsx'));
const DoctorsList = lazy(() => import('./admin/pages/Admin/DoctorsList.jsx'));
const AddPhcCenter = lazy(() => import('./admin/pages/Admin/AddPhcCenter.jsx'));
const PhcCentersList = lazy(() => import('./admin/pages/Admin/PhcCentersList.jsx'));
const AdminCommunityHealth = lazy(() => import('./admin/pages/Admin/AdminCommunityHealth.jsx'));

// Lazy-loaded Doctor pages
const DoctorAppointments = lazy(() => import('./admin/pages/Doctor/DoctorAppointments.jsx'));
const DoctorDashboard = lazy(() => import('./admin/pages/Doctor/DoctorDashboard.jsx'));
const DoctorProfile = lazy(() => import('./admin/pages/Doctor/DoctorProfile.jsx'));
const DoctorPatients = lazy(() => import('./admin/pages/Doctor/DoctorPatients.jsx'));
const DoctorPatientProfile = lazy(() => import('./admin/pages/Doctor/DoctorPatientProfile.jsx'));
const DoctorSchedule = lazy(() => import('./admin/pages/Doctor/DoctorSchedule.jsx'));
const DoctorAnalytics = lazy(() => import('./admin/pages/Doctor/DoctorAnalytics.jsx'));
const DoctorMyArea = lazy(() => import('./admin/pages/Doctor/DoctorMyArea.jsx'));
const DoctorForgotPassword = lazy(() => import('./admin/pages/Doctor/ForgotPassword.jsx'));

// Lazy-loaded PHC Center pages
const PhcCentersDashboard = lazy(() => import('./admin/pages/PhcCenters/PhcCentersDashboard.jsx'));

import AdminProviders from './providers/AdminProviders.jsx';
import PatientProviders from './providers/PatientProviders.jsx';
import { ProtectedRoute, GuestOnlyRoute } from './components/ProtectedRoute.jsx';
import InactivityLogout from './components/InactivityLogout.jsx';
import AiChatWidget from './components/AiChatWidget.jsx';
import LanguageSelectorWidget from './components/LanguageSelectorWidget.jsx';
import CookieConsentBanner from './components/CookieConsentBanner.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';

const RouteLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
    <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
  </div>
);

const App = () => {
  return (
    <LanguageProvider>
      <InactivityLogout />
      <LanguageSelectorWidget />
      <AiChatWidget />
      <CookieConsentBanner />
      <Suspense fallback={<RouteLoader />}>
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
      </Suspense>
    </LanguageProvider>
  );
};

export default App;
