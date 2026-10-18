import React, { useState, useEffect, useContext } from 'react';
import { PhcContext } from '../../context/PhcContext';
import { BACKENDURL } from '../../../lib';
import { showError, showSuccess } from '../../utils/adminToast';
import './PhcCentersDashboard.css';

const PhcCentersDashboard = () => {
  const {
    phcToken,
    phcRole,
    stats,
    households,
    surveys,
    assistanceHistory,
    fetchDashboardStats,
    fetchHouseholds,
    fetchSurveys,
    fetchAssistanceHistory,
    logoutPhc
  } = useContext(PhcContext);

  const [activeTab, setActiveTab] = useState('assist'); // 'assist', 'households', 'surveys', 'stats'

  // --- Assist Patient States ---
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [assistanceNotes, setAssistanceNotes] = useState('');
  const [assistanceType, setAssistanceType] = useState('PATIENT_GUIDANCE');

  // --- New Patient Registration Form ---
  const [showRegModal, setShowRegModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    gender: 'Female',
    address: ''
  });

  // --- Household Form ---
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [newHousehold, setNewHousehold] = useState({
    headName: '',
    phone: '',
    address: '',
    village: '',
    mandalBlock: '',
    district: '',
    totalMembers: 4,
    pregnantWomen: 0,
    childrenUnderFive: 1,
    elderlyMembers: 1
  });

  // --- Household Visit Form ---
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedVisitHousehold, setSelectedVisitHousehold] = useState(null);
  const [visitData, setVisitData] = useState({
    visitPurpose: 'ROUTINE_SURVEY',
    findingsSummary: '',
    referralCreated: false,
    referralReason: ''
  });

  // --- Field Survey Form ---
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [selectedSurveyHouseholdId, setSelectedSurveyHouseholdId] = useState('');
  const [surveyData, setSurveyData] = useState({
    totalSurveyedPersons: 4,
    hasHypertensionSuspect: false,
    hasDiabetesSuspect: false,
    hasPregnantWoman: false,
    isAncUpToDate: true,
    hasImmunizationPending: false,
    hasCommunicableSymptoms: false,
    referralRecommended: false,
    workerRemarks: ''
  });

  useEffect(() => {
    fetchDashboardStats();
    fetchHouseholds();
    fetchSurveys();
    fetchAssistanceHistory();
    handlePatientSearch();
  }, [phcToken]);

  // Search existing patients
  const handlePatientSearch = async () => {
    try {
      setSearching(true);
      const queryParam = patientSearchQuery.trim() ? `?query=${encodeURIComponent(patientSearchQuery.trim())}` : '';
      const res = await fetch(`${BACKENDURL}phc-centers/patients/search${queryParam}`, {
        headers: { 'Authorization': `Bearer ${phcToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      showError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  // Record assistance for existing searched patient
  const handleRecordAssistance = async () => {
    if (!selectedPatient) {
      showError("Please select a patient from the search results first");
      return;
    }
    try {
      const res = await fetch(`${BACKENDURL}phc-centers/patient-assistance/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${phcToken}`
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          workerName: 'PHC Center Team',
          workerRole: 'PHC_CENTER',
          assistanceType,
          notes: assistanceNotes || "Assistance and clinical guidance provided at Primary Healthcare Center."
        })
      });
      if (res.ok) {
        showSuccess(`Assistance recorded for ${selectedPatient.name}!`);
        setAssistanceNotes('');
        setSelectedPatient(null);
        fetchDashboardStats();
        fetchAssistanceHistory();
      } else {
        showError("Failed to record assistance");
      }
    } catch (err) {
      showError("Failed to record assistance");
    }
  };

  // Register New Patient and automatically log assistance history
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKENDURL}patients/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPatient.name,
          email: newPatient.email.trim().toLowerCase(),
          phone: newPatient.phone,
          password: newPatient.password,
          age: parseInt(newPatient.age) || 30,
          gender: newPatient.gender
        })
      });

      if (res.ok) {
        const savedPatient = await res.json();

        // Automatically log this as an assistance event into patient_assistance_records
        try {
          await fetch(`${BACKENDURL}phc-centers/patient-assistance/record`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${phcToken}`
            },
            body: JSON.stringify({
              patientId: savedPatient?.id || null,
              workerName: 'PHC Center Staff',
              workerRole: 'PHC_CENTER',
              assistanceType: 'ACCOUNT_CREATION',
              notes: `New citizen registration and digital health ID onboarding completed at PHC Center. Phone: ${newPatient.phone}`
            })
          });
        } catch (logErr) {
          console.error("Auto log assistance error:", logErr);
        }

        showSuccess(`Patient ${newPatient.name} registered successfully! Account created & assistance logged.`);
        setShowRegModal(false);
        setNewPatient({ name: '', email: '', phone: '', password: '', age: '', gender: 'Female', address: '' });
        setPatientSearchQuery(newPatient.name);
        handlePatientSearch();
        fetchDashboardStats();
        fetchAssistanceHistory();
      } else {
        const errText = await res.text();
        showError(errText || "Patient registration failed. Please verify credentials.");
      }
    } catch (e) {
      showError("Patient registration failed");
    }
  };

  // Register New Village Household
  const handleAddHousehold = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKENDURL}phc-centers/households/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${phcToken}`
        },
        body: JSON.stringify(newHousehold)
      });
      if (res.ok) {
        showSuccess(`Household of ${newHousehold.headName} registered successfully!`);
        setShowHouseholdModal(false);
        setNewHousehold({
          headName: '',
          phone: '',
          address: '',
          village: '',
          mandalBlock: '',
          district: '',
          totalMembers: 4,
          pregnantWomen: 0,
          childrenUnderFive: 1,
          elderlyMembers: 1
        });
        fetchHouseholds();
        fetchDashboardStats();
      } else {
        showError("Failed to register household");
      }
    } catch (e) {
      showError("Failed to register household");
    }
  };

  // Log Household Field Visit
  const handleRecordVisit = async (e) => {
    e.preventDefault();
    try {
      const hhId = selectedVisitHousehold?.id || (households[0] ? households[0].id : null);
      const res = await fetch(`${BACKENDURL}phc-centers/household-visits/record${hhId ? `?householdId=${hhId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${phcToken}`
        },
        body: JSON.stringify({
          workerName: 'PHC Center Staff',
          workerRole: 'PHC_CENTER',
          village: selectedVisitHousehold?.village || 'Community Jurisdiction',
          visitPurpose: visitData.visitPurpose,
          findingsSummary: visitData.findingsSummary || 'Routine household wellness visit completed.',
          referralCreated: visitData.referralCreated,
          referralReason: visitData.referralReason
        })
      });
      if (res.ok) {
        showSuccess("Field visit logged successfully!");
        setShowVisitModal(false);
        setVisitData({ visitPurpose: 'ROUTINE_SURVEY', findingsSummary: '', referralCreated: false, referralReason: '' });
        fetchDashboardStats();
      } else {
        showError("Failed to log field visit");
      }
    } catch (e) {
      showError("Failed to log field visit");
    }
  };

  // Record Community Health & Field Survey
  const handleRecordSurvey = async (e) => {
    e.preventDefault();
    try {
      const hhId = selectedSurveyHouseholdId || (households[0] ? households[0].id : '');
      const selectedHh = households.find(h => String(h.id) === String(hhId));
      const res = await fetch(`${BACKENDURL}phc-centers/community-surveys/record${hhId ? `?householdId=${hhId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${phcToken}`
        },
        body: JSON.stringify({
          ...surveyData,
          workerRole: 'PHC_CENTER',
          village: selectedHh?.village || "Village Jurisdiction",
          mandalBlock: selectedHh?.mandalBlock || "Block Mandal",
          district: selectedHh?.district || "District Area"
        })
      });
      if (res.ok) {
        showSuccess("Community health & epidemiological survey recorded!");
        setShowSurveyModal(false);
        setSurveyData({
          totalSurveyedPersons: 4,
          hasHypertensionSuspect: false,
          hasDiabetesSuspect: false,
          hasPregnantWoman: false,
          isAncUpToDate: true,
          hasImmunizationPending: false,
          hasCommunicableSymptoms: false,
          referralRecommended: false,
          workerRemarks: ''
        });
        fetchSurveys();
        fetchDashboardStats();
      } else {
        showError("Failed to submit survey");
      }
    } catch (e) {
      showError("Failed to submit survey");
    }
  };

  return (
    <div className="phc-dashboard-container">
      {/* HEADER */}
      <div className="phc-dashboard-header">
        <div>
          <h2 className="phc-title">🏥 PHC CENTERS DASHBOARD</h2>
          <p className="phc-subtitle">
            Role: <span className="phc-role-badge">Primary Health Centre (PHC_CENTER)</span> | Unified Healthcare Platform
          </p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary btn-sm" onClick={() => { fetchDashboardStats(); fetchHouseholds(); fetchSurveys(); fetchAssistanceHistory(); }}>
            🔄 Refresh
          </button>
          <button className="btn btn-outline-danger btn-sm" onClick={logoutPhc}>
            Logout
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-3 col-sm-6">
          <div className="phc-kpi-card border-primary">
            <p className="phc-kpi-label">PATIENTS ASSISTED</p>
            <h3 className="phc-kpi-value text-primary">{stats.totalPatientsAssisted || 0}</h3>
            <small className="text-muted">Direct assistance events</small>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="phc-kpi-card border-success">
            <p className="phc-kpi-label">HOUSEHOLDS COVERED</p>
            <h3 className="phc-kpi-value text-success">{stats.totalHouseholdsVisited || households.length}</h3>
            <small className="text-muted">Registered village families</small>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="phc-kpi-card border-info">
            <p className="phc-kpi-label">FIELD VISITS</p>
            <h3 className="phc-kpi-value text-info">{stats.totalFieldVisits || 0}</h3>
            <small className="text-muted">Community touchpoints</small>
          </div>
        </div>
        <div className="col-md-3 col-sm-6">
          <div className="phc-kpi-card border-warning">
            <p className="phc-kpi-label">HEALTH SURVEYS</p>
            <h3 className="phc-kpi-value text-warning">{stats.totalCommunitySurveys || surveys.length}</h3>
            <small className="text-muted">Screening records</small>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="phc-tabs">
        <button className={`phc-tab-btn ${activeTab === 'assist' ? 'active' : ''}`} onClick={() => setActiveTab('assist')}>
          🤝 Assist & Register Patient ({assistanceHistory.length})
        </button>
        <button className={`phc-tab-btn ${activeTab === 'households' ? 'active' : ''}`} onClick={() => setActiveTab('households')}>
          🏡 Village Households ({households.length})
        </button>
        <button className={`phc-tab-btn ${activeTab === 'surveys' ? 'active' : ''}`} onClick={() => setActiveTab('surveys')}>
          🩺 Village Field Surveys ({surveys.length})
        </button>
        <button className={`phc-tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
          📈 Public Health Analytics
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ASSIST & REGISTER PATIENT */}
      {/* ========================================================================= */}
      {activeTab === 'assist' && (
        <div className="phc-tab-content">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold mb-1">Patient Desk & Search</h4>
              <p className="text-muted small">Search existing citizens or create an account for arriving patients</p>
            </div>
            <button className="btn btn-primary fw-semibold shadow-sm" onClick={() => setShowRegModal(true)}>
              + Register New Patient
            </button>
          </div>

          <div className="input-group mb-3 shadow-sm">
            <input
              type="text"
              className="form-control"
              placeholder="Search patient by Name or Email (leave blank to show all)..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
            />
            <button className="btn btn-primary px-4 fw-semibold" onClick={handlePatientSearch} disabled={searching}>
              {searching ? 'Searching...' : '🔍 Search Patient'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="table-responsive mb-4 bg-white rounded-3 border p-3 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold mb-0 text-primary">Search Matches ({searchResults.length})</h6>
                <small className="text-muted">Click 'Select' to record care or guidance</small>
              </div>
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Patient ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Gender & Age</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map(p => (
                    <tr key={p.id} className={selectedPatient?.id === p.id ? 'table-primary' : ''}>
                      <td><span className="badge bg-secondary">PAT-{p.id}</span></td>
                      <td className="fw-semibold">{p.name}</td>
                      <td>{p.email}</td>
                      <td>{p.phone || '—'}</td>
                      <td>{p.gender || '—'}, {p.age ? `${p.age} yrs` : '—'}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${selectedPatient?.id === p.id ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setSelectedPatient(p)}
                        >
                          {selectedPatient?.id === p.id ? '✓ Selected' : 'Select for Assistance'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Assistance Action Panel */}
          {selectedPatient && (
            <div className="card p-3 mb-4 bg-light border-primary shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="fw-bold text-primary mb-0">📋 Log Clinical Assistance: {selectedPatient.name}</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedPatient(null)}>✕ Cancel</button>
              </div>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Assistance Type</label>
                  <select className="form-select" value={assistanceType} onChange={(e) => setAssistanceType(e.target.value)}>
                    <option value="PATIENT_GUIDANCE">Patient Guidance / OPD Help</option>
                    <option value="ACCOUNT_CREATION">Account Creation Assistance</option>
                    <option value="VITALS_SCREENING">Vitals & Triage Screening</option>
                    <option value="REFERRAL_ASSISTANCE">PHC / Telemedicine Referral</option>
                  </select>
                </div>
                <div className="col-md-8">
                  <label className="form-label small fw-semibold">Worker Notes & Observations</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Screened vitals BP 120/80, guided to Doctor OPD"
                    value={assistanceNotes}
                    onChange={(e) => setAssistanceNotes(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-success fw-semibold px-4" onClick={handleRecordAssistance}>
                  💾 Save Assistance Record
                </button>
              </div>
            </div>
          )}

          {/* Recent History Table */}
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Recent Assistance Log ({assistanceHistory.length})</h6>
              <small className="text-muted">Real-time audit log of citizen frontline interactions</small>
            </div>
            <div className="table-responsive bg-white rounded-3 border p-3 shadow-sm">
              {assistanceHistory.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">No assistance history records found yet. Use '+ Register New Patient' or select a patient to log assistance.</p>
                </div>
              ) : (
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Record ID</th>
                      <th>Patient Name</th>
                      <th>Type</th>
                      <th>Worker Role</th>
                      <th>Timestamp</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assistanceHistory.map(rec => (
                      <tr key={rec.id}>
                        <td><span className="badge bg-light text-dark border">#AST-{rec.id}</span></td>
                        <td className="fw-semibold">{rec.patient ? rec.patient.name : 'Registered Citizen'}</td>
                        <td><span className="badge bg-info-subtle text-info fw-semibold">{rec.assistanceType}</span></td>
                        <td><span className="badge bg-secondary">{rec.workerRole}</span></td>
                        <td className="small text-muted">{rec.assistedAt ? new Date(rec.assistedAt).toLocaleString() : 'Recent'}</td>
                        <td className="small text-muted">{rec.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VILLAGE HOUSEHOLDS */}
      {/* ========================================================================= */}
      {activeTab === 'households' && (
        <div className="phc-tab-content">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold mb-1">Village Households Directory</h4>
              <p className="text-muted small">Manage community families, MCH status, and demographic coverage</p>
            </div>
            <button className="btn btn-success fw-semibold shadow-sm" onClick={() => setShowHouseholdModal(true)}>
              + Register New Household
            </button>
          </div>

          <div className="table-responsive bg-white rounded-3 border p-3 shadow-sm">
            {households.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <p className="mb-0">No households registered yet. Click '+ Register New Household' above to add village families.</p>
              </div>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Household ID</th>
                    <th>Head of Family</th>
                    <th>Village & Location</th>
                    <th>Phone</th>
                    <th>Total Members</th>
                    <th>Pregnant Women</th>
                    <th>Under 5 Kids</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {households.map(h => (
                    <tr key={h.id}>
                      <td><span className="badge bg-secondary">HH-{h.id}</span></td>
                      <td className="fw-semibold">{h.headName}</td>
                      <td>
                        <span className="fw-semibold text-dark">{h.village || 'Village Area'}</span>
                        {h.mandalBlock ? <small className="text-muted d-block">{h.mandalBlock}</small> : null}
                      </td>
                      <td>{h.phone || '—'}</td>
                      <td><span className="badge bg-light text-dark border">{h.totalMembers || 1} Persons</span></td>
                      <td>
                        {h.pregnantWomen > 0 ? (
                          <span className="badge bg-danger">🤰 {h.pregnantWomen} Pregnant</span>
                        ) : (
                          <span className="text-muted small">0</span>
                        )}
                      </td>
                      <td>
                        {h.childrenUnderFive > 0 ? (
                          <span className="badge bg-warning text-dark">👶 {h.childrenUnderFive} Under 5</span>
                        ) : (
                          <span className="text-muted small">0</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-warning text-dark"
                            onClick={() => {
                              setSelectedSurveyHouseholdId(String(h.id));
                              setShowSurveyModal(true);
                            }}
                          >
                            + Survey
                          </button>
                          <button
                            className="btn btn-outline-info"
                            onClick={() => {
                              setSelectedVisitHousehold(h);
                              setShowVisitModal(true);
                            }}
                          >
                            + Visit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VILLAGE FIELD SURVEYS */}
      {/* ========================================================================= */}
      {activeTab === 'surveys' && (
        <div className="phc-tab-content">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h4 className="fw-bold mb-1">Community Health & Field Surveillance</h4>
              <p className="text-muted small">Record maternal visits, NCD hypertension/diabetes screenings, and immunization followups</p>
            </div>
            <button className="btn btn-warning text-dark fw-semibold shadow-sm" onClick={() => setShowSurveyModal(true)}>
              + Record Health Survey
            </button>
          </div>

          {/* Protocols Card */}
          <div className="p-3 bg-white rounded-3 border mb-4 shadow-sm">
            <h6 className="fw-bold text-primary mb-2">Field Protocols & Surveillance Checklist</h6>
            <div className="row g-3">
              <div className="col-md-4">
                <div className="p-3 border rounded bg-light">
                  <p className="fw-bold mb-1">🤰 Maternal ANC Tracker</p>
                  <small className="text-muted">Ensure 4 mandatory ANC checkups, IFA supplementation, and TT vaccinations.</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 border rounded bg-light">
                  <p className="fw-bold mb-1">🩺 NCD Community Screening</p>
                  <small className="text-muted">Adult 30+ screening for high blood pressure and blood sugar risk.</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="p-3 border rounded bg-light">
                  <p className="fw-bold mb-1">👶 Universal Immunization</p>
                  <small className="text-muted">Track BCG, Pentavalent, MR, and Vitamin A doses for infants under 5.</small>
                </div>
              </div>
            </div>
          </div>

          {/* Survey History Log */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold mb-0">Recorded Community Surveys ({surveys.length})</h6>
              <small className="text-muted">Epidemiological surveillance dataset</small>
            </div>
            <div className="table-responsive bg-white rounded-3 border p-3 shadow-sm">
              {surveys.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <p className="mb-0">No health surveys recorded yet. Click '+ Record Health Survey' to log field data.</p>
                </div>
              ) : (
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Survey ID</th>
                      <th>Household / Head</th>
                      <th>Village</th>
                      <th>Hypertension</th>
                      <th>Diabetes</th>
                      <th>Maternal / ANC</th>
                      <th>Immunization</th>
                      <th>Referral</th>
                      <th>Remarks</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map(s => (
                      <tr key={s.id}>
                        <td><span className="badge bg-light text-dark border">#SUR-{s.id}</span></td>
                        <td className="fw-semibold">{s.household ? s.household.headName : 'Household Family'}</td>
                        <td>{s.village || 'Village'}</td>
                        <td>
                          {s.hasHypertensionSuspect ? (
                            <span className="badge bg-danger">🔴 Suspect</span>
                          ) : (
                            <span className="badge bg-success-subtle text-success">Normal</span>
                          )}
                        </td>
                        <td>
                          {s.hasDiabetesSuspect ? (
                            <span className="badge bg-danger">🔴 High Risk</span>
                          ) : (
                            <span className="badge bg-success-subtle text-success">Normal</span>
                          )}
                        </td>
                        <td>
                          {s.hasPregnantWoman ? (
                            <span className={`badge ${s.isAncUpToDate ? 'bg-info' : 'bg-warning text-dark'}`}>
                              🤰 {s.isAncUpToDate ? 'ANC Up-to-date' : 'ANC Overdue'}
                            </span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          {s.hasImmunizationPending ? (
                            <span className="badge bg-warning text-dark">👶 Pending</span>
                          ) : (
                            <span className="badge bg-success-subtle text-success">✓ Complete</span>
                          )}
                        </td>
                        <td>
                          {s.referralRecommended ? (
                            <span className="badge bg-danger">🏥 PHC Referral</span>
                          ) : (
                            <span className="badge bg-light text-muted border">None</span>
                          )}
                        </td>
                        <td className="small text-muted">{s.workerRemarks || '—'}</td>
                        <td className="small text-muted">{s.surveyedAt ? new Date(s.surveyedAt).toLocaleDateString() : 'Recent'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PUBLIC HEALTH ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'stats' && (
        <div className="phc-tab-content">
          <h4 className="fw-bold mb-3">Public Health & Field Analytics</h4>

          <div className="row g-3 mb-4">
            <div className="col-md-3 col-sm-6">
              <div className="p-3 bg-white border rounded-3 shadow-sm text-center">
                <p className="text-muted small fw-semibold mb-1">PREGNANT MOTHERS</p>
                <h3 className="fw-bold text-danger mb-0">{stats.pregnantMothersCount || 0}</h3>
                <small className="text-muted">High-priority ANC cases</small>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="p-3 bg-white border rounded-3 shadow-sm text-center">
                <p className="text-muted small fw-semibold mb-1">UNDER 5 CHILDREN</p>
                <h3 className="fw-bold text-warning mb-0">{stats.under5ChildrenCount || 0}</h3>
                <small className="text-muted">Immunization coverage</small>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="p-3 bg-white border rounded-3 shadow-sm text-center">
                <p className="text-muted small fw-semibold mb-1">NCD RISK SUSPECTS</p>
                <h3 className="fw-bold text-danger mb-0">{(stats.hypertensionSuspects || 0) + (stats.diabetesSuspects || 0)}</h3>
                <small className="text-muted">Hypertension & Diabetes</small>
              </div>
            </div>
            <div className="col-md-3 col-sm-6">
              <div className="p-3 bg-white border rounded-3 shadow-sm text-center">
                <p className="text-muted small fw-semibold mb-1">PHC REFERRALS</p>
                <h3 className="fw-bold text-primary mb-0">{stats.referralsRecommended || 0}</h3>
                <small className="text-muted">Tele-referrals generated</small>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-3 border shadow-sm">
            <div className="row g-4">
              <div className="col-md-6">
                <h6 className="fw-bold mb-3 text-primary">Community Coverage Breakdown</h6>
                <ul className="list-group">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Total Registered Households
                    <span className="badge bg-primary rounded-pill">{stats.totalHouseholdsVisited || households.length}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Community Field Visits
                    <span className="badge bg-success rounded-pill">{stats.totalFieldVisits || 0}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Health Surveys Completed
                    <span className="badge bg-info rounded-pill">{stats.totalCommunitySurveys || surveys.length}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Direct Citizen Guidance & Assistance
                    <span className="badge bg-warning text-dark rounded-pill">{stats.totalPatientsAssisted || assistanceHistory.length}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    Immunization Backlog Pending
                    <span className="badge bg-danger rounded-pill">{stats.immunizationPending || 0}</span>
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold mb-3 text-success">PHC Facility Network Topology</h6>
                <div className="p-3 bg-light rounded border">
                  <p className="mb-2"><strong>Facility Network:</strong> {stats.totalPhcCenters || 1} Registered Primary Health Centre(s)</p>
                  <p className="mb-2"><strong>Facility Role:</strong> PHC_CENTER (Unified Primary Care & Surveillance)</p>
                  <p className="mb-2"><strong>Operational Status:</strong> 24x7 Triage, MCH & Field Survey Unit</p>
                  <hr />
                  <small className="text-muted">
                    Telemetry syncs live with National Health Mission (NHM) and Primary Healthcare Provider registries.
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* MODAL: REGISTER PATIENT */}
      {showRegModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Register New Patient</h5>
                <button type="button" className="btn-close" onClick={() => setShowRegModal(false)}></button>
              </div>
              <form onSubmit={handleRegisterPatient}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Patient Name *</label>
                    <input type="text" className="form-control" required value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Email (Login ID) *</label>
                    <input type="email" className="form-control" required value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Phone Number *</label>
                    <input type="tel" className="form-control" required value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Password *</label>
                    <input type="password" minLength="6" className="form-control" required value={newPatient.password} onChange={e => setNewPatient({ ...newPatient, password: e.target.value })} />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold">Age</label>
                      <input type="number" className="form-control" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold">Gender</label>
                      <select className="form-select" value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRegModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Patient Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD HOUSEHOLD */}
      {showHouseholdModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Register Village Household</h5>
                <button type="button" className="btn-close" onClick={() => setShowHouseholdModal(false)}></button>
              </div>
              <form onSubmit={handleAddHousehold}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Head of Household Name *</label>
                    <input type="text" className="form-control" required value={newHousehold.headName} onChange={e => setNewHousehold({ ...newHousehold, headName: e.target.value })} />
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold">Village *</label>
                      <input type="text" className="form-control" required value={newHousehold.village} onChange={e => setNewHousehold({ ...newHousehold, village: e.target.value })} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold">Contact Phone</label>
                      <input type="tel" className="form-control" value={newHousehold.phone} onChange={e => setNewHousehold({ ...newHousehold, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold">Mandal / Block</label>
                      <input type="text" className="form-control" value={newHousehold.mandalBlock} onChange={e => setNewHousehold({ ...newHousehold, mandalBlock: e.target.value })} />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label small fw-semibold">District</label>
                      <input type="text" className="form-control" value={newHousehold.district} onChange={e => setNewHousehold({ ...newHousehold, district: e.target.value })} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-3 mb-3">
                      <label className="form-label small fw-semibold">Members</label>
                      <input type="number" className="form-control" value={newHousehold.totalMembers} onChange={e => setNewHousehold({ ...newHousehold, totalMembers: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div className="col-3 mb-3">
                      <label className="form-label small fw-semibold">Pregnant</label>
                      <input type="number" className="form-control" value={newHousehold.pregnantWomen} onChange={e => setNewHousehold({ ...newHousehold, pregnantWomen: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="col-3 mb-3">
                      <label className="form-label small fw-semibold">Under 5</label>
                      <input type="number" className="form-control" value={newHousehold.childrenUnderFive} onChange={e => setNewHousehold({ ...newHousehold, childrenUnderFive: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div className="col-3 mb-3">
                      <label className="form-label small fw-semibold">Elderly</label>
                      <input type="number" className="form-control" value={newHousehold.elderlyMembers} onChange={e => setNewHousehold({ ...newHousehold, elderlyMembers: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowHouseholdModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">Save Household</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG FIELD VISIT */}
      {showVisitModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Log Household Field Visit</h5>
                <button type="button" className="btn-close" onClick={() => setShowVisitModal(false)}></button>
              </div>
              <form onSubmit={handleRecordVisit}>
                <div className="modal-body">
                  <p className="mb-2"><strong>Household:</strong> {selectedVisitHousehold?.headName} ({selectedVisitHousehold?.village})</p>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Visit Purpose</label>
                    <select className="form-select" value={visitData.visitPurpose} onChange={e => setVisitData({ ...visitData, visitPurpose: e.target.value })}>
                      <option value="ROUTINE_SURVEY">Routine Family Health Survey</option>
                      <option value="ANC_FOLLOWUP">Maternal ANC & Immunization Followup</option>
                      <option value="NCD_SCREENING">NCD Hypertension / Blood Sugar Check</option>
                      <option value="EMERGENCY_ESCALATION">Illness / Emergency Followup</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Visit Findings & Observations</label>
                    <textarea className="form-control" rows="2" placeholder="Summary of health status, vital check findings..." value={visitData.findingsSummary} onChange={e => setVisitData({ ...visitData, findingsSummary: e.target.value })}></textarea>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={visitData.referralCreated} onChange={e => setVisitData({ ...visitData, referralCreated: e.target.checked })} />
                    <label className="form-check-label small text-danger fw-semibold">Requires PHC Medical Officer Attention</label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowVisitModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-info text-white">Save Field Visit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SURVEY */}
      {showSurveyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Record Community Health Survey</h5>
                <button type="button" className="btn-close" onClick={() => setShowSurveyModal(false)}></button>
              </div>
              <form onSubmit={handleRecordSurvey}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select Household</label>
                    <select className="form-select" value={selectedSurveyHouseholdId} onChange={e => setSelectedSurveyHouseholdId(e.target.value)}>
                      <option value="">-- Choose Household --</option>
                      {households.map(h => (
                        <option key={h.id} value={h.id}>{h.headName} ({h.village || 'Village'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={surveyData.hasHypertensionSuspect} onChange={e => setSurveyData({ ...surveyData, hasHypertensionSuspect: e.target.checked })} />
                    <label className="form-check-label small">Hypertension Symptom / High BP Suspect</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={surveyData.hasDiabetesSuspect} onChange={e => setSurveyData({ ...surveyData, hasDiabetesSuspect: e.target.checked })} />
                    <label className="form-check-label small">Diabetes Symptom / High Blood Sugar Suspect</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={surveyData.hasPregnantWoman} onChange={e => setSurveyData({ ...surveyData, hasPregnantWoman: e.target.checked })} />
                    <label className="form-check-label small">Pregnant Woman in Household</label>
                  </div>
                  {surveyData.hasPregnantWoman && (
                    <div className="form-check mb-2 ms-3">
                      <input className="form-check-input" type="checkbox" checked={surveyData.isAncUpToDate} onChange={e => setSurveyData({ ...surveyData, isAncUpToDate: e.target.checked })} />
                      <label className="form-check-label small">ANC Checkups Up-to-date</label>
                    </div>
                  )}
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={surveyData.hasImmunizationPending} onChange={e => setSurveyData({ ...surveyData, hasImmunizationPending: e.target.checked })} />
                    <label className="form-check-label small">Immunization / Vaccine Dose Pending for Children</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={surveyData.hasCommunicableSymptoms} onChange={e => setSurveyData({ ...surveyData, hasCommunicableSymptoms: e.target.checked })} />
                    <label className="form-check-label small">Fever / Respiratory / Communicable Illness</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" checked={surveyData.referralRecommended} onChange={e => setSurveyData({ ...surveyData, referralRecommended: e.target.checked })} />
                    <label className="form-check-label small text-danger fw-semibold">Recommend PHC / Telemedicine Referral</label>
                  </div>
                  <div className="mt-3">
                    <label className="form-label small fw-semibold">Survey Remarks & Recommendations</label>
                    <input type="text" className="form-control" placeholder="Observations, medicine supply notes..." value={surveyData.workerRemarks} onChange={e => setSurveyData({ ...surveyData, workerRemarks: e.target.value })} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowSurveyModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-warning text-dark fw-semibold">Save Health Survey</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhcCentersDashboard;
