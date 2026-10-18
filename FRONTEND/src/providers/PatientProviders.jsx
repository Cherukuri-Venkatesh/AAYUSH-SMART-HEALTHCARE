import React from 'react';
import PatientAppContextProvider from '../patient/context/AppContext.jsx';
import { LanguageProvider } from '../context/LanguageContext';

const PatientProviders = ({ children }) => (
  <LanguageProvider>
    <PatientAppContextProvider>
      {children}
    </PatientAppContextProvider>
  </LanguageProvider>
);

export default PatientProviders;
