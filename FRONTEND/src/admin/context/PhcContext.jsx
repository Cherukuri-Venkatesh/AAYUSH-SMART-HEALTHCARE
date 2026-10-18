import React, { createContext, useState, useEffect } from 'react';
import { BACKENDURL } from '../../lib';
import { showError, showSuccess } from '../utils/adminToast';

export const PhcContext = createContext();

export const PhcContextProvider = ({ children }) => {
  const [phcToken, setPhcToken] = useState(localStorage.getItem('phcToken') || '');
  const [phcRole, setPhcRole] = useState(localStorage.getItem('phcRole') || 'PHC_CENTER');
  const [workerInfo, setWorkerInfo] = useState({
    name: 'PHC Center Staff',
    role: 'PHC_CENTER',
    phcName: 'Primary Health Centre',
    village: 'Jurisdiction Area'
  });
  const [stats, setStats] = useState({
    totalPhcCenters: 0,
    totalHouseholdsVisited: 0,
    totalFieldVisits: 0,
    totalCommunitySurveys: 0,
    totalPatientsAssisted: 0
  });
  const [households, setHouseholds] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [assistanceHistory, setAssistanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync token state
  useEffect(() => {
    if (phcToken) {
      localStorage.setItem('phcToken', phcToken);
      fetchDashboardStats();
      fetchHouseholds();
      fetchSurveys();
      fetchAssistanceHistory();
    } else {
      localStorage.removeItem('phcToken');
      localStorage.removeItem('phcRole');
    }
  }, [phcToken]);

  const fetchDashboardStats = async () => {
    if (!phcToken) return;
    try {
      setLoading(true);
      const res = await fetch(`${BACKENDURL}phc-centers/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${phcToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch PHC stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHouseholds = async () => {
    if (!phcToken) return;
    try {
      const res = await fetch(`${BACKENDURL}phc-centers/households/all`, {
        headers: {
          'Authorization': `Bearer ${phcToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHouseholds(data);
      }
    } catch (err) {
      console.error("Failed to fetch households:", err);
    }
  };

  const fetchSurveys = async () => {
    if (!phcToken) return;
    try {
      const res = await fetch(`${BACKENDURL}phc-centers/community-surveys/all`, {
        headers: {
          'Authorization': `Bearer ${phcToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSurveys(data);
      }
    } catch (err) {
      console.error("Failed to fetch community surveys:", err);
    }
  };

  const fetchAssistanceHistory = async () => {
    if (!phcToken) return;
    try {
      const res = await fetch(`${BACKENDURL}phc-centers/patient-assistance/history`, {
        headers: {
          'Authorization': `Bearer ${phcToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAssistanceHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch assistance history:", err);
    }
  };

  const logoutPhc = () => {
    setPhcToken('');
    setPhcRole('');
    localStorage.removeItem('phcToken');
    localStorage.removeItem('phcRole');
  };

  const value = {
    phcToken,
    setPhcToken,
    phcRole,
    setPhcRole,
    workerInfo,
    setWorkerInfo,
    stats,
    households,
    surveys,
    assistanceHistory,
    loading,
    fetchDashboardStats,
    fetchHouseholds,
    fetchSurveys,
    fetchAssistanceHistory,
    logoutPhc
  };

  return (
    <PhcContext.Provider value={value}>
      {children}
    </PhcContext.Provider>
  );
};
