import React, { useState, useEffect } from 'react';
import { BACKENDURL } from '../../../lib';
import { showError } from '../../utils/adminToast';
import './DoctorsList.css';

const AdminCommunityHealth = () => {
  const [stats, setStats] = useState({
    totalPhcCenters: 0,
    totalHouseholdsVisited: 0,
    totalFieldVisits: 0,
    totalCommunitySurveys: 0,
    totalPatientsAssisted: 0,
    totalPopulationCovered: 0,
    pregnantMothersCount: 0,
    highRiskAncCount: 0,
    under5ChildrenCount: 0,
    elderlyCount: 0,
    hypertensionSuspects: 0,
    diabetesSuspects: 0,
    immunizationPending: 0,
    immunizationCoveragePct: 100.0,
    communicableSymptomCount: 0,
    referralsRecommended: 0,
    recentVisits: [],
    recentSurveys: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('surveys'); // 'surveys' | 'visits'

  useEffect(() => {
    fetchCommunityStats();
  }, []);

  const fetchCommunityStats = async () => {
    try {
      setLoading(true);
      const aToken = localStorage.getItem('aToken');
      const res = await fetch(`${BACKENDURL}admin/community/statistics`, {
        headers: { 'Authorization': `Bearer ${aToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      showError("Failed to load community health analytics");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', background: '#eef4fa', minHeight: '100vh', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1c486d', margin: 0 }}>
            📊 District & Community Health Command Center
          </h1>
          <p style={{ color: '#52708a', margin: '4px 0 0', fontSize: '14px' }}>
            Real-time grassroots public health telemetry aggregated from Primary Health Centres and village field surveillance
          </p>
        </div>
        <button
          onClick={fetchCommunityStats}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #1f9dcb 0%, #2a68db 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '999px',
            padding: '10px 20px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(31, 157, 203, 0.25)'
          }}
        >
          🔄 {loading ? 'Syncing...' : 'Sync Live Telemetry'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '14px', border: '1px solid #d8e6f2' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e1edf7', borderTopColor: '#1f9dcb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ color: '#52708a', marginTop: '16px', fontWeight: '600' }}>Aggregating real-time public health data...</p>
        </div>
      ) : (
        <>
          {/* PRIMARY KPI OVERVIEW CARDS (6 Grid) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {/* Active PHCs */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d8e6f2', borderLeft: '4px solid #2563eb', boxShadow: '0 4px 14px rgba(18,67,107,0.06)' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ACTIVE PHC CENTRES</p>
              <h2 style={{ margin: '8px 0 2px', fontSize: '26px', fontWeight: '800', color: '#1e40af' }}>{stats.totalPhcCenters || 0}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Network facilities</span>
            </div>

            {/* Households Covered */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d8e6f2', borderLeft: '4px solid #16a34a', boxShadow: '0 4px 14px rgba(18,67,107,0.06)' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HOUSEHOLDS COVERED</p>
              <h2 style={{ margin: '8px 0 2px', fontSize: '26px', fontWeight: '800', color: '#15803d' }}>{stats.totalHouseholdsVisited || 0}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Registered families</span>
            </div>

            {/* Population Tracked */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d8e6f2', borderLeft: '4px solid #0891b2', boxShadow: '0 4px 14px rgba(18,67,107,0.06)' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>POPULATION TRACKED</p>
              <h2 style={{ margin: '8px 0 2px', fontSize: '26px', fontWeight: '800', color: '#0e7490' }}>{stats.totalPopulationCovered || 0}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Citizens surveyed</span>
            </div>

            {/* Field Visits */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d8e6f2', borderLeft: '4px solid #8b5cf6', boxShadow: '0 4px 14px rgba(18,67,107,0.06)' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>FIELD VISITS</p>
              <h2 style={{ margin: '8px 0 2px', fontSize: '26px', fontWeight: '800', color: '#7c3aed' }}>{stats.totalFieldVisits || 0}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Village touchpoints</span>
            </div>

            {/* Surveys Recorded */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d8e6f2', borderLeft: '4px solid #ea580c', boxShadow: '0 4px 14px rgba(18,67,107,0.06)' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SURVEYS RECORDED</p>
              <h2 style={{ margin: '8px 0 2px', fontSize: '26px', fontWeight: '800', color: '#c2410c' }}>{stats.totalCommunitySurveys || 0}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Health screenings</span>
            </div>

            {/* High-Risk Referrals */}
            <div style={{ background: '#fff', borderRadius: '12px', padding: '16px', border: '1px solid #d8e6f2', borderLeft: '4px solid #dc2626', boxShadow: '0 4px 14px rgba(18,67,107,0.06)' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HIGH-RISK REFERRALS</p>
              <h2 style={{ margin: '8px 0 2px', fontSize: '26px', fontWeight: '800', color: '#b91c1c' }}>{stats.referralsRecommended || 0}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Doctor escalations</span>
            </div>
          </div>

          {/* DETAILED CLINICAL & DEMOGRAPHIC ANALYTICS PANELS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            
            {/* Panel 1: Maternal & Child Health (MCH) */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #d8e6f2', boxShadow: '0 8px 22px rgba(18,67,107,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <span style={{ fontSize: '22px' }}>🤰</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1c486d' }}>Maternal & Child Health (MCH)</h3>
                  <small style={{ color: '#64748b' }}>ANC tracking and infant immunization</small>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '13px' }}>Pregnant Mothers Tracked</span>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>{stats.pregnantMothersCount || 0}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: '600' }}>⚠️ High-Risk Pregnancies</span>
                  <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                    {stats.highRiskAncCount || 0} Cases
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '13px' }}>Children Under 5 Years</span>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>{stats.under5ChildrenCount || 0}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#d97706', fontSize: '13px' }}>Immunization Gaps / Pending</span>
                  <strong style={{ color: '#d97706', fontSize: '14px' }}>{stats.immunizationPending || 0}</strong>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px', color: '#64748b' }}>
                    <span>Immunization Coverage</span>
                    <strong style={{ color: '#16a34a' }}>{stats.immunizationCoveragePct || 100}%</strong>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${stats.immunizationCoveragePct || 100}%`, height: '100%', background: '#16a34a', borderRadius: '999px' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: NCD & Chronic Disease Screening */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #d8e6f2', boxShadow: '0 8px 22px rgba(18,67,107,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <span style={{ fontSize: '22px' }}>🩺</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1c486d' }}>NCD & Chronic Disease Triage</h3>
                  <small style={{ color: '#64748b' }}>Hypertension, Diabetes, and early risk flags</small>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '13px' }}>Hypertension Suspects Identified</span>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                    {stats.hypertensionSuspects || 0}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '13px' }}>Diabetes Suspects Screened</span>
                  <span style={{ background: '#f5f3ff', color: '#6d28d9', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                    {stats.diabetesSuspects || 0}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '13px' }}>Elderly Citizens Tracked</span>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>{stats.elderlyCount || 0}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#dc2626', fontSize: '13px' }}>Communicable Symptoms (Fever/Cough)</span>
                  <strong style={{ color: '#dc2626', fontSize: '14px' }}>{stats.communicableSymptomCount || 0}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '13px' }}>Guidance & OPD Patient Care</span>
                  <strong style={{ color: '#0f172a', fontSize: '15px' }}>{stats.totalPatientsAssisted || 0}</strong>
                </div>
              </div>
            </div>

            {/* Panel 3: Operational Public Health Protocols */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #d8e6f2', boxShadow: '0 8px 22px rgba(18,67,107,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <span style={{ fontSize: '22px' }}>🏥</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1c486d' }}>Facility Tele-Triage Network</h3>
                  <small style={{ color: '#64748b' }}>Direct grassroots escalation to district doctors</small>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #2563eb' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>✓ Tele-Referral Channel Active</p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>High-risk field cases automatically route to on-call MBBS doctor queues.</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #16a34a' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#15803d' }}>✓ Digital Household Directory</p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Village families mapped with family head, phone, sanitation, and MCH status.</span>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid #8b5cf6' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: '700', color: '#6d28d9' }}>✓ Multi-Tier Escalation</p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Sub-Center &rarr; PHC &rarr; Community Health Centre &rarr; District AIIMS Hub.</span>
                </div>
              </div>
            </div>

          </div>

          {/* REAL-TIME ACTIVITY STREAM TABLES */}
          <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #d8e6f2', boxShadow: '0 8px 22px rgba(18,67,107,0.06)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e1edf7', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('surveys')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: activeTab === 'surveys' ? '#1f9dcb' : '#f1f5f9',
                    color: activeTab === 'surveys' ? '#fff' : '#475569'
                  }}
                >
                  📋 Recent Health Surveys ({stats.recentSurveys?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('visits')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    background: activeTab === 'visits' ? '#1f9dcb' : '#f1f5f9',
                    color: activeTab === 'visits' ? '#fff' : '#475569'
                  }}
                >
                  🏡 Recent Household Visits ({stats.recentVisits?.length || 0})
                </button>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Live MySQL Persistence Stream</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {activeTab === 'surveys' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#244b6e' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Survey ID</th>
                      <th style={{ padding: '12px 16px' }}>Village / Location</th>
                      <th style={{ padding: '12px 16px' }}>Persons</th>
                      <th style={{ padding: '12px 16px' }}>Hypertension</th>
                      <th style={{ padding: '12px 16px' }}>Diabetes</th>
                      <th style={{ padding: '12px 16px' }}>MCH / Immunization</th>
                      <th style={{ padding: '12px 16px' }}>Referral</th>
                      <th style={{ padding: '12px 16px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSurveys && stats.recentSurveys.length > 0 ? (
                      stats.recentSurveys.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700' }}>#{s.id}</td>
                          <td style={{ padding: '12px 16px' }}>{s.village || 'Community Area'}</td>
                          <td style={{ padding: '12px 16px' }}>{s.totalSurveyedPersons || 1}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                              background: s.hasHypertensionSuspect ? '#fee2e2' : '#f0fdf4',
                              color: s.hasHypertensionSuspect ? '#b91c1c' : '#15803d'
                            }}>
                              {s.hasHypertensionSuspect ? 'Positive' : 'Normal'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                              background: s.hasDiabetesSuspect ? '#fee2e2' : '#f0fdf4',
                              color: s.hasDiabetesSuspect ? '#b91c1c' : '#15803d'
                            }}>
                              {s.hasDiabetesSuspect ? 'Positive' : 'Normal'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {s.hasPregnantWoman ? '🤰 Pregnant Mother ' : ''}
                            {s.hasImmunizationPending ? '⚠️ Imm Pending' : '✓ Immunized'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                              background: s.referralRecommended ? '#fef3c7' : '#f1f5f9',
                              color: s.referralRecommended ? '#b45309' : '#64748b'
                            }}>
                              {s.referralRecommended ? 'Doctor Referral' : 'Routine'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>
                            {s.surveyedAt ? new Date(s.surveyedAt).toLocaleDateString() : 'Today'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          No community surveys recorded yet. PHC Centers can record surveys from their dashboard.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#244b6e' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px' }}>Visit ID</th>
                      <th style={{ padding: '12px 16px' }}>Village</th>
                      <th style={{ padding: '12px 16px' }}>Purpose</th>
                      <th style={{ padding: '12px 16px' }}>Findings Summary</th>
                      <th style={{ padding: '12px 16px' }}>Referral Status</th>
                      <th style={{ padding: '12px 16px' }}>Visit Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentVisits && stats.recentVisits.length > 0 ? (
                      stats.recentVisits.map(v => (
                        <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700' }}>#{v.id}</td>
                          <td style={{ padding: '12px 16px' }}>{v.village || 'Village Field'}</td>
                          <td style={{ padding: '12px 16px', fontWeight: '600' }}>{v.visitPurpose || 'ROUTINE_SURVEY'}</td>
                          <td style={{ padding: '12px 16px', maxWidth: '300px' }}>{v.findingsSummary || 'Routine community checkup'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '700',
                              background: v.referralCreated ? '#fef3c7' : '#f0fdf4',
                              color: v.referralCreated ? '#b45309' : '#15803d'
                            }}>
                              {v.referralCreated ? 'Doctor Escalation' : 'Stable'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>
                            {v.visitDate ? new Date(v.visitDate).toLocaleDateString() : 'Today'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          No household visits recorded yet. PHC Centers can record field visits from their dashboard.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminCommunityHealth;
