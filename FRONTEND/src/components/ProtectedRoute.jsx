/**
 * Route Protection Component
 * Ensures only authenticated users with proper role can access routes
 */

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AdminContext } from '../admin/context/AdminContext';
import { DoctorContext } from '../admin/context/DoctorContext';
import { PhcContext } from '../admin/context/PhcContext';
import { AppContext } from '../patient/context/AppContext';
import { clearTokens, getRoleFromToken, isTokenExpired } from '../admin/utils/auth';

/**
 * ProtectedRoute component
 * Only renders children if user has valid JWT token for the specified role
 * 
 * @param {React.ReactNode} children - Routes to protect
 * @param {string} requiredRole - 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'PHC_CENTERS' | 'PHC_CENTER'
 * @returns {React.ReactNode} - Children or redirect to login
 */
export const ProtectedRoute = ({ children, requiredRole = 'ADMIN' }) => {
  const adminCtx = useContext(AdminContext) || {};
  const doctorCtx = useContext(DoctorContext) || {};
  const phcCtx = useContext(PhcContext) || {};
  const patientCtx = useContext(AppContext) || {};

  const aToken = adminCtx.aToken || '';
  const dToken = doctorCtx.dToken || '';
  const phcToken = phcCtx.phcToken || '';
  const pToken = patientCtx.token || '';

  // 1. Patient Protected Routes (/my-appointments, /my-profile, etc.)
  if (requiredRole === 'PATIENT') {
    if (!pToken || isTokenExpired(pToken)) {
      return <Navigate to="/login" replace />;
    }
    return children;
  }

  // 2. Staff / Medical Routes (Admin, Doctor, PHC Center)
  const isPhcRoute = requiredRole === 'PHC_CENTERS' || requiredRole === 'PHC_CENTER';

  // If unauthenticated, allow rendering so AdminLayout renders the staff <Login /> page
  if (!aToken && !dToken && !phcToken) {
    return children;
  }

  const activeToken = requiredRole === 'ADMIN'
    ? aToken
    : requiredRole === 'DOCTOR'
      ? dToken
      : isPhcRoute
        ? phcToken
        : '';

  // If the active role token is missing, redirect to the user's currently authenticated dashboard
  if (!activeToken) {
    if (aToken) return <Navigate to="/admin-dashboard" replace />;
    if (dToken) return <Navigate to="/doctor-dashboard" replace />;
    if (phcToken) return <Navigate to="/phc-centers/dashboard" replace />;
    return children;
  }

  if (isTokenExpired(activeToken)) {
    clearTokens();
    return children;
  }

  const role = getRoleFromToken(activeToken);

  if (isPhcRoute) {
    if (role !== 'PHC_CENTER' && role !== 'ADMIN') {
      if (aToken) return <Navigate to="/admin-dashboard" replace />;
      if (dToken) return <Navigate to="/doctor-dashboard" replace />;
      return <Navigate to="/phc-centers/dashboard" replace />;
    }
  } else if (role !== requiredRole) {
    if (aToken) return <Navigate to="/admin-dashboard" replace />;
    if (dToken) return <Navigate to="/doctor-dashboard" replace />;
    if (phcToken) return <Navigate to="/phc-centers/dashboard" replace />;
  }

  return children;
};

/**
 * Redirect to appropriate dashboard if already logged in
 */
export const GuestOnlyRoute = ({ children }) => {
  const adminCtx = useContext(AdminContext) || {};
  const doctorCtx = useContext(DoctorContext) || {};
  const phcCtx = useContext(PhcContext) || {};
  const patientCtx = useContext(AppContext) || {};

  const aToken = adminCtx.aToken || '';
  const dToken = doctorCtx.dToken || '';
  const phcToken = phcCtx.phcToken || '';
  const pToken = patientCtx.token || '';

  if (aToken) return <Navigate to="/admin-dashboard" replace />;
  if (dToken) return <Navigate to="/doctor-dashboard" replace />;
  if (phcToken) return <Navigate to="/phc-centers/dashboard" replace />;
  if (pToken) return <Navigate to="/" replace />;

  return children;
};
