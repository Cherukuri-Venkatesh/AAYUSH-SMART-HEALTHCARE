import React from 'react';
import AdminContextProvider from '../admin/context/AdminContext.jsx';
import DoctorContextProvider from '../admin/context/DoctorContext.jsx';
import AdminUtilityContextProvider from '../admin/context/AppContext.jsx';
import { PhcContextProvider } from '../admin/context/PhcContext.jsx';
import { LanguageProvider } from '../context/LanguageContext';

const AdminProviders = ({ children }) => (
  <LanguageProvider>
    <AdminContextProvider>
      <DoctorContextProvider>
        <AdminUtilityContextProvider>
          <PhcContextProvider>
            {children}
          </PhcContextProvider>
        </AdminUtilityContextProvider>
      </DoctorContextProvider>
    </AdminContextProvider>
  </LanguageProvider>
);

export default AdminProviders;
