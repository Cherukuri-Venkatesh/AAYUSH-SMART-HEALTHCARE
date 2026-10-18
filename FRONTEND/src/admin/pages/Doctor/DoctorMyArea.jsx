import React, { useState, useEffect } from 'react';
import { BACKENDURL } from '../../../lib';
import { showError } from '../../utils/adminToast';
import '../Admin/DoctorsList.css';

const DoctorMyArea = () => {
  const [stats, setStats] = useState({
    totalHouseholdsVisited: 0,
    totalFieldVisits: 0,
    totalCommunitySurveys: 0,
    totalPatientsAssisted: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAreaStats();
  }, []);

  const fetchAreaStats = async () => {
    try {
      setLoading(true);
      const dToken = localStorage.getItem('dToken');
      const res = await fetch(`${BACKENDURL}doctor/analytics/overview`, {
        headers: { 'Authorization': `Bearer ${dToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'Poppins, sans-serif' }}>
      <div className="mb-4">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>🗺️ My Assigned Healthcare Area & PHC Network</h2>
        <p style={{ color: '#64748b' }}>Community health indicators and ASHA frontline telemetry for your clinical jurisdiction</p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="p-3 bg-white rounded-3 shadow-sm border-start border-primary border-4">
            <p className="text-muted small mb-1 fw-semibold">ASSIGNED PHC</p>
            <h5 className="fw-bold mb-0">Rampachodavaram PHC</h5>
            <small className="text-secondary">Alluri Sitharama Raju District</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 bg-white rounded-3 shadow-sm border-start border-success border-4">
            <p className="text-muted small mb-1 fw-semibold">VILLAGES IN JURISDICTION</p>
            <h5 className="fw-bold text-success mb-0">8 Tribal & Rural Hamlets</h5>
            <small className="text-secondary">Active ASHA mobilizer network</small>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 bg-white rounded-3 shadow-sm border-start border-warning border-4">
            <p className="text-muted small mb-1 fw-semibold">HIGH-RISK ESCALATIONS</p>
            <h5 className="fw-bold text-warning mb-0">MCH & NCD Tele-Referrals</h5>
            <small className="text-secondary">Triage priority for clinical consultation</small>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-3 shadow-sm">
        <h5 className="fw-bold mb-3">🩺 Frontline Field Surveillance Coordination</h5>
        <p className="text-secondary small mb-3">
          Field surveys and vitals logged by village ASHA mobilizers and PHC nurses are synchronized in real time. 
          Patients flagged with hypertension, diabetes, or high-risk pregnancies are automatically routed to your outpatient clinical queue.
        </p>
        <div className="alert alert-info py-2 small mb-0">
          ✓ Connected to AAYUSH-SETU Unified Public Health Triage
        </div>
      </div>
    </div>
  );
};

export default DoctorMyArea;
