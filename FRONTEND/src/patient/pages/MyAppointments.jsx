import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { showError, showSuccess, showWarning, MESSAGES } from '../utils/toastService';
import { patientApiGet, patientApiPut } from '../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { formatLocalDate, getUpcomingDays } from '../../utils/dateUtils';
import '../styles/appointments.css';

const MyAppointments = () => {
  const navigate = useNavigate();
  const { token } = useContext(AppContext);
  const { t } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [rescheduleDraft, setRescheduleDraft] = useState({ appointmentId: '', doctorId: '', date: '', time: '' });
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingRescheduleOptions, setLoadingRescheduleOptions] = useState(false);

  const formatDateLabel = (dateValue) => {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return dateValue;
    return parsed.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getNextSevenDays = () => {
    return getUpcomingDays(7).map((d) => d.date);
  };

  const loadAvailableSlotsForDate = async (doctorId, date) => {
    if (!doctorId || !date) {
      setAvailableSlots([]);
      return;
    }

    const response = await patientApiGet(`schedule/available-slots?doctorId=${doctorId}&date=${date}`);
    if (!response || !response.success || !Array.isArray(response.data)) {
      setAvailableSlots([]);
      return;
    }

    const slots = response.data.map((slot) => String(slot || '').slice(0, 5)).filter(Boolean);
    setAvailableSlots(slots);
  };

  const loadAvailableDatesAndSlots = async (doctorId) => {
    if (!doctorId) {
      setAvailableDates([]);
      setAvailableSlots([]);
      return;
    }

    try {
      setLoadingRescheduleOptions(true);
      const dates = getNextSevenDays();

      const checks = await Promise.all(
        dates.map(async (date) => {
          const response = await patientApiGet(`schedule/available-slots?doctorId=${doctorId}&date=${date}`);
          const slotCount = response?.success && Array.isArray(response.data) ? response.data.length : 0;
          return { date, slotCount };
        }),
      );

      const filteredDates = checks.filter((item) => item.slotCount > 0);
      setAvailableDates(filteredDates);

      if (filteredDates.length > 0) {
        const firstDate = filteredDates[0].date;
        setRescheduleDraft((prev) => ({ ...prev, date: firstDate, time: '' }));
        await loadAvailableSlotsForDate(doctorId, firstDate);
      } else {
        setAvailableSlots([]);
      }
    } finally {
      setLoadingRescheduleOptions(false);
    }
  };

  useEffect(() => {
    const loadAppointments = async () => {
      const response = await patientApiGet('patient/appointments');

      if (!response || !response.success) {
        showError(response?.error || MESSAGES.genericError);
        setAppointments([]);
        return;
      }

      const normalized = (response.data || []).map((item) => ({
        appointmentId: item.id,
        patientId: item.patientId,
        doctorId: item.doctorId,
        doctorName: item.doctorName,
        hospital: item.hospitalName || '-',
        specialisation: item.doctorSpecialization || '-',
        age: item.age,
        weight: item.weight,
        issue: item.issue,
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        consultingFees: item.consultingFees,
        paymentType: item.paymentType || '-',
        status: item.status,
        prescriptionPath: item.prescriptionPath || '',
        labReportPath: item.labReportPath || '',
        appointmentType: item.appointmentType || 'PHYSICAL',
        roomId: item.roomId || '',
        consultationDuration: item.consultationDuration || 30,
      }));

      setAppointments(normalized);
    };

    if (!token) {
      navigate('/login');
      return;
    }

    loadAppointments();
  }, [token, navigate]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Status filter
    if (statusFilter === 'UPCOMING') {
      filtered = filtered.filter((apt) => apt.status === 'BOOKED' || apt.status === 'IN_PROGRESS' || apt.status === 'CONFIRMED');
    } else if (statusFilter === 'PAST') {
      filtered = filtered.filter((apt) => apt.status === 'COMPLETED');
    } else if (statusFilter === 'CANCELLED') {
      filtered = filtered.filter((apt) => apt.status === 'CANCELLED');
    } else if (statusFilter === 'ONLINE') {
      filtered = filtered.filter((apt) => apt.appointmentType === 'ONLINE');
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const today = new Date();
      let startDate = new Date();

      if (dateRangeFilter === '6months') {
        startDate.setMonth(startDate.getMonth() - 6);
      } else if (dateRangeFilter === '1year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      filtered = filtered.filter((apt) => {
        const aptDate = new Date(apt.appointmentDate);
        return aptDate >= startDate && aptDate <= today;
      });
    }

    return filtered;
  }, [appointments, statusFilter, dateRangeFilter]);

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') return <span className="badge bg-success">{t('COMPLETED') || 'COMPLETED'}</span>;
    if (status === 'CANCELLED') return <span className="badge bg-danger">{t('CANCELLED') || 'CANCELLED'}</span>;
    if (status === 'IN_PROGRESS') return <span className="badge bg-warning text-dark">{t('IN_PROGRESS') || 'IN PROGRESS'}</span>;
    return <span className="badge bg-primary">{t('BOOKED') || 'BOOKED'}</span>;
  };

  const cancelAppointment = async (appointmentId) => {
    const target = appointments.find((item) => item.appointmentId === appointmentId);

    if (!target) {
      showError(MESSAGES.cancelOwnOnly);
      return;
    }

    if (target.status !== 'BOOKED') {
      showWarning(MESSAGES.onlyBookedCanCancel);
      return;
    }

    if (!window.confirm(MESSAGES.cancelConfirm)) {
      return;
    }

    const response = await patientApiPut(`patient/appointments/${appointmentId}/cancel`, {});
    if (!response || !response.success) {
      showError(response?.error || MESSAGES.genericError);
      return;
    }

    setAppointments((prev) =>
      prev.map((item) => (item.appointmentId === appointmentId ? { ...item, status: 'CANCELLED' } : item))
    );

    showSuccess(MESSAGES.appointmentCancelled);
  };

  const openReschedule = (appointment) => {
    if (appointment.status !== 'BOOKED') {
      showWarning(MESSAGES.onlyBookedCanCancel);
      return;
    }

    const appointmentDateTime = new Date(`${appointment.appointmentDate}T${String(appointment.appointmentTime || '').slice(0, 8)}`);
    if (!Number.isNaN(appointmentDateTime.getTime())) {
      const hoursLeft = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursLeft < 24) {
        showWarning(t('rescheduleNotice') || 'Reschedule is allowed only until 24 hours before appointment slot.');
        return;
      }
    }

    setRescheduleDraft({
      appointmentId: appointment.appointmentId,
      doctorId: appointment.doctorId,
      date: '',
      time: '',
    });

    loadAvailableDatesAndSlots(appointment.doctorId);
  };

  const onRescheduleDateChange = async (dateValue) => {
    setRescheduleDraft((prev) => ({ ...prev, date: dateValue, time: '' }));
    await loadAvailableSlotsForDate(rescheduleDraft.doctorId, dateValue);
  };

  const saveReschedule = async () => {
    if (!rescheduleDraft.appointmentId || !rescheduleDraft.doctorId || !rescheduleDraft.date || !rescheduleDraft.time) {
      showWarning(MESSAGES.fillRequiredFields);
      return;
    }

    const response = await patientApiPut(
      `patient/appointments/${rescheduleDraft.appointmentId}/reschedule`,
      {
        date: rescheduleDraft.date,
        time: `${rescheduleDraft.time}:00`,
      },
    );

    if (!response || !response.success) {
      showError(response?.error || MESSAGES.genericError);
      return;
    }

    setAppointments((prev) =>
      prev.map((item) =>
        item.appointmentId === rescheduleDraft.appointmentId
          ? {
              ...item,
              appointmentDate: rescheduleDraft.date,
              appointmentTime: `${rescheduleDraft.time}:00`,
            }
          : item,
      ),
    );

    setRescheduleDraft({ appointmentId: '', doctorId: '', date: '', time: '' });
    setAvailableDates([]);
    setAvailableSlots([]);
    showSuccess(MESSAGES.appointmentRescheduled);
  };

  return (
    <>
      <section
        className="appointments-header"
        style={{
          backgroundImage: "linear-gradient(135deg, rgba(32, 54, 158, 0.7) 0%, rgba(95, 111, 255, 0.7) 100%), url('/background1.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="appointments-header-content">
          <div style={{ maxWidth: '800px' }}>
            <h1>{t('Your Medical Appointments')}</h1>
            <p>{t('Track, manage, and monitor all your appointments effortlessly in one centralized location')}</p>
          </div>
        </div>
      </section>

      <div className="py-4">
        <div className="mb-4">
          <h1 className="h3 fw-bold mb-4">{t('My Appointments')}</h1>

          {/* Filter Section */}
          <div className="filter-section card border-0 shadow-sm p-4 mb-4" style={{ backgroundColor: '#f8f9ff' }}>
            <div className="row g-3">
              {/* Status Filter */}
              <div className="col-12 col-md-8">
                <label className="form-label fw-semibold">{t('Filter by Status')}</label>
                <div className="btn-group w-100" role="group">
                  {['ALL', 'ONLINE', 'UPCOMING', 'PAST', 'CANCELLED'].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-outline-primary'} flex-fill`}
                      onClick={() => setStatusFilter(status)}
                    >
                      {status === 'ONLINE'
                        ? `📹 ${t('onlineConsultation') || 'Online Video'}`
                        : status === 'UPCOMING'
                        ? `📅 ${t('Upcoming')}`
                        : status === 'PAST'
                        ? `✅ ${t('Past')}`
                        : status === 'CANCELLED'
                        ? `❌ ${t('Cancelled')}`
                        : `📋 ${t('All')}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Filter by Date Range')}</label>
                <select
                  className="form-select"
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                >
                  <option value="all">{t('All Time')}</option>
                  <option value="6months">{t('Last 6 Months')}</option>
                  <option value="1year">{t('Last 1 Year')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="alert alert-info text-center py-5">
            <h5>{t('No appointments found')}</h5>
            <p className="mb-0">{t('Try adjusting your search or filter criteria')}</p>
            <button className="btn btn-primary mt-3" onClick={() => navigate('/doctors')}>
              {t('Book Appointment')}
            </button>
          </div>
        ) : (
          <div className="table-responsive appointment-table-container">
            <table className="table table-bordered table-hover align-middle appointment-table">
              <thead>
                <tr>
                  <th>{t('Appointment ID')}</th>
                  <th>{t('Type / Mode') || 'Type'}</th>
                  <th>{t('Doctor Name')}</th>
                  <th>{t('Hospital')}</th>
                  <th>{t('Specialisation')}</th>
                  <th>{t('Appointment Date')}</th>
                  <th>{t('Appointment Time')}</th>
                  <th>{t('Consulting Fee')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('videoConsultation') || 'Online Video Call'}</th>
                  <th>{t('Lab Reports')}</th>
                  <th>{t('Prescriptions')}</th>
                  <th>{t('Cancel Appointment')}</th>
                  <th>{t('Reschedule')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.appointmentId} style={{ transition: 'all 0.2s ease' }}>
                    <td><strong>#{appointment.appointmentId}</strong></td>
                    <td>
                      {appointment.appointmentType === 'ONLINE' ? (
                        <span className="badge bg-success bg-opacity-25 text-success border border-success px-2 py-1">
                          📹 {t('onlineConsultation') || 'Online Video'}
                        </span>
                      ) : (
                        <span className="badge bg-primary bg-opacity-25 text-primary border border-primary px-2 py-1">
                          🏥 {t('physicalVisit') || 'Physical Visit'}
                        </span>
                      )}
                    </td>
                    <td className="fw-semibold">{appointment.doctorName}</td>
                    <td>{appointment.hospital}</td>
                    <td>{t(appointment.specialisation)}</td>
                    <td>{appointment.appointmentDate}</td>
                    <td>{appointment.appointmentTime}</td>
                    <td>₹{appointment.consultingFees}</td>
                    <td>{getStatusBadge(appointment.status)}</td>
                    <td>
                      {appointment.appointmentType === 'ONLINE' && appointment.roomId ? (
                        <button
                          className={`btn btn-sm ${
                            appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED'
                              ? 'btn-outline-secondary disabled'
                              : 'btn-success fw-bold shadow-sm'
                          }`}
                          disabled={appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED'}
                          onClick={() => navigate(`/consultation/room/${appointment.roomId}`)}
                        >
                          📹 {t('joinVideoCall') || 'Join Video Call'}
                        </button>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const labEnabled = appointment.status === 'COMPLETED' && Boolean(appointment.labReportPath);
                        return (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={!labEnabled}
                            onClick={() => labEnabled && navigate('/my-labreports')}
                          >
                            {labEnabled ? t('View') : t('Not Uploaded')}
                          </button>
                        );
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const prescriptionEnabled = appointment.status === 'COMPLETED' && Boolean(appointment.prescriptionPath);
                        return (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            disabled={!prescriptionEnabled}
                            onClick={() => prescriptionEnabled && navigate('/my-prescriptions')}
                          >
                            {prescriptionEnabled ? t('View') : t('Not Uploaded')}
                          </button>
                        );
                      })()}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        disabled={appointment.status !== 'BOOKED'}
                        onClick={() => cancelAppointment(appointment.appointmentId)}
                      >
                        {t('Cancel')}
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning"
                        disabled={appointment.status !== 'BOOKED'}
                        onClick={() => openReschedule(appointment)}
                      >
                        {t('Reschedule')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rescheduleDraft.appointmentId && (
          <div className="card border-0 shadow-sm p-4 mt-4" style={{ backgroundColor: '#fff8e1' }}>
            <h5 className="fw-bold mb-3">{t('Reschedule')} #{rescheduleDraft.appointmentId}</h5>
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('New Date')}</label>
                <select
                  className="form-select"
                  value={rescheduleDraft.date}
                  disabled={loadingRescheduleOptions || availableDates.length === 0}
                  onChange={(event) => onRescheduleDateChange(event.target.value)}
                >
                  <option value="">{t('Select Available Date')}</option>
                  {availableDates.map((item) => (
                    <option key={item.date} value={item.date}>
                      {formatDateLabel(item.date)} ({item.slotCount} {t('slots')})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('New Time')}</label>
                <select
                  className="form-select"
                  value={rescheduleDraft.time}
                  disabled={!rescheduleDraft.date || availableSlots.length === 0}
                  onChange={(event) => setRescheduleDraft((prev) => ({ ...prev, time: event.target.value }))}
                >
                  <option value="">{t('Select Available Slot')}</option>
                  {availableSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 col-md-4 d-flex gap-2">
                <button className="btn btn-primary" onClick={saveReschedule} disabled={!rescheduleDraft.date || !rescheduleDraft.time}>{t('Save')}</button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setRescheduleDraft({ appointmentId: '', doctorId: '', date: '', time: '' });
                    setAvailableDates([]);
                    setAvailableSlots([]);
                  }}
                >
                  {t('Cancel')}
                </button>
              </div>
            </div>
            {!loadingRescheduleOptions && availableDates.length === 0 && (
              <p className="text-muted mt-3 mb-0">{t('No available dates/slots in the next 7 days for this doctor.')}</p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MyAppointments;
