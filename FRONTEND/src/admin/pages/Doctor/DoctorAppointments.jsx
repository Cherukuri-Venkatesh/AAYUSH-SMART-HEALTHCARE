import React, { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CancellationModal from '../../components/CancellationModal';
import { DoctorContext } from '../../context/DoctorContext';
import { DOCTOR_MESSAGES, showError, showInfo, showSuccess, showWarning } from '../../utils/doctorToast';
import { formatLocalDate, getUpcomingDays } from '../../../utils/dateUtils';
import { useLanguage } from '../../../context/LanguageContext';
import '../../../patient/styles/appointments.css';
import './DoctorAppointments.css';

const canMarkCompleted = (appointment) => {
  if (appointment.status !== 'BOOKED' && appointment.status !== 'IN_PROGRESS') return false;

  const appointmentDate = String(appointment.appointmentDate || '');
  const appointmentTime = String(appointment.appointmentTime || '').slice(0, 8);
  const slotDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

  if (Number.isNaN(slotDateTime.getTime())) return false;

  return Date.now() >= slotDateTime.getTime();
};

const todayISO = formatLocalDate(new Date());

const sortBySlot = (appointments) =>
  appointments.slice().sort((a, b) => {
    const keyA = `${a.appointmentDate} ${a.startTime}`;
    const keyB = `${b.appointmentDate} ${b.startTime}`;
    return keyA.localeCompare(keyB);
  });

const DoctorAppointments = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { appointments, cancelAppointment, completeAppointment, uploadFile, getAppointments } = useContext(DoctorContext);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeDay, setActiveDay] = useState(todayISO);
  const [activeCancelAppointmentId, setActiveCancelAppointmentId] = useState('');
  const [uploadDraft, setUploadDraft] = useState({ appointmentId: '', patientId: '', doctorId: '', type: '', file: null });

  const statusFilters = [
    { id: 'ONLINE', label: `📹 ${t('onlineConsultation') || 'Online Video'}` },
    { id: 'TODAY', label: `📅 ${t('today') || "Today's"} ${t('appointments') || 'Appointments'}` },
    { id: 'UPCOMING', label: `⏳ ${t('Upcoming') || 'Upcoming'} ${t('appointments') || 'Appointments'}` },
    { id: 'PAST', label: `✅ ${t('Past') || 'Past'} ${t('appointments') || 'Appointments'}` },
    { id: 'CANCELLED', label: `❌ ${t('Cancelled') || 'Cancelled'} ${t('appointments') || 'Appointments'}` },
    { id: 'ALL', label: `📋 ${t('All') || 'All'} ${t('appointments') || 'Appointments'}` },
  ];

  const getStatusBadge = (status) => {
    if (status === 'COMPLETED') return <span className="badge bg-success">{t('COMPLETED') || 'COMPLETED'}</span>;
    if (status === 'CANCELLED') return <span className="badge bg-danger">{t('CANCELLED') || 'CANCELLED'}</span>;
    if (status === 'IN_PROGRESS') return <span className="badge bg-warning text-dark">{t('IN_PROGRESS') || 'IN PROGRESS'}</span>;
    return <span className="badge bg-primary">{t('BOOKED') || 'BOOKED'}</span>;
  };

  const nextSevenDays = useMemo(() => {
    return getUpcomingDays(7).map((d) => ({
      ...d,
      count: appointments.filter((item) => item.appointmentDate === d.date).length,
    }));
  }, [appointments]);

  const queueForSelectedDay = useMemo(() => {
    const dayAppointments = appointments.filter((item) => item.appointmentDate === activeDay);
    return sortBySlot(dayAppointments);
  }, [activeDay, appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const isPast = new Date(item.appointmentDate) < new Date(todayISO);
      if (activeFilter === 'ONLINE') return item.appointmentType === 'ONLINE';
      if (activeFilter === 'TODAY') return item.appointmentDate === todayISO;
      if (activeFilter === 'UPCOMING') return !isPast && (item.status === 'BOOKED' || item.status === 'IN_PROGRESS');
      if (activeFilter === 'PAST') return isPast || item.status === 'COMPLETED';
      if (activeFilter === 'CANCELLED') return item.status === 'CANCELLED';
      return true;
    });
  }, [activeFilter, appointments]);

  const openCancelModal = (appointmentId) => {
    const selected = appointments.find((item) => item.appointmentId === appointmentId);
    if (!selected || (selected.status !== 'BOOKED' && selected.status !== 'IN_PROGRESS')) {
      showWarning(DOCTOR_MESSAGES.onlyBookedCanCancel);
      return;
    }
    setActiveCancelAppointmentId(appointmentId);
  };

  const confirmCancellation = (reason) => {
    cancelAppointment(activeCancelAppointmentId, reason);
    setActiveCancelAppointmentId('');
  };

  const onCompleteAppointment = async (appointmentId) => {
    const success = await completeAppointment(appointmentId);
    if (success) {
      showSuccess(DOCTOR_MESSAGES.appointmentCompleted);
    }
  };

  const submitUpload = async () => {
    if (!uploadDraft.file || !uploadDraft.appointmentId) {
      showWarning(DOCTOR_MESSAGES.fileRequired || 'Please select a file to upload');
      return;
    }

    const success = await uploadFile({
      file: uploadDraft.file,
      type: uploadDraft.type,
      appointmentId: uploadDraft.appointmentId,
      patientId: uploadDraft.patientId,
      doctorId: uploadDraft.doctorId,
    });

    if (success) {
      setUploadDraft({ appointmentId: '', patientId: '', doctorId: '', type: '', file: null });
      getAppointments();
    }
  };

  return (
    <div className="doctor-appointments-page">
      <div className="doctor-appointments-title-block">
        <h1>{t('Doctor Appointments Console')}</h1>
        <p>{t('Manage physical and live online video consultations in real-time')}</p>
      </div>

      {/* 7-day Schedule Selector */}
      <section className="doctor-appointments-card">
        <h2>{t('Next 7 Days Queue')}</h2>
        <div className="doctor-calendar-scroll">
          {nextSevenDays.map((day) => (
            <button
              key={day.date}
              type="button"
              className={`doctor-calendar-day ${activeDay === day.date ? 'active' : ''}`}
              onClick={() => setActiveDay(day.date)}
            >
              <strong>{day.dayLabel}</strong>
              <span>{day.dateLabel}</span>
              <small>{day.count} {t('appointments')}</small>
            </button>
          ))}
        </div>
      </section>

      {/* Queue for active day */}
      <section className="doctor-appointments-card">
        <h2>{t('Patient Queue for')} {activeDay}</h2>
        <div className="doctor-queue-table-wrap">
          <table className="doctor-queue-table">
            <thead>
              <tr>
                <th>{t('Slot')}</th>
                <th>{t('Type / Mode') || 'Type'}</th>
                <th>{t('Patient')}</th>
                <th>{t('Issue')}</th>
                <th>{t('Status')}</th>
                <th>{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {queueForSelectedDay.length > 0 ? (
                queueForSelectedDay.map((appointment) => (
                  <tr key={appointment.appointmentId}>
                    <td>{appointment.startTime} → {appointment.endTime}</td>
                    <td>
                      {appointment.appointmentType === 'ONLINE' ? (
                        <span className="badge bg-success bg-opacity-25 text-success border border-success">
                          📹 {t('onlineConsultation') || 'Online Video'}
                        </span>
                      ) : (
                        <span className="badge bg-primary bg-opacity-25 text-primary border border-primary">
                          🏥 {t('physicalVisit') || 'Physical Visit'}
                        </span>
                      )}
                    </td>
                    <td className="fw-semibold">{appointment.userData.name}</td>
                    <td>{appointment.issue}</td>
                    <td>{getStatusBadge(appointment.status)}</td>
                    <td>
                      {appointment.appointmentType === 'ONLINE' && appointment.roomId && (
                        <button
                          className="btn btn-sm btn-success fw-bold shadow-sm"
                          disabled={appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED'}
                          onClick={() => navigate(`/consultation/room/${appointment.roomId}`)}
                        >
                          📹 {t('joinVideoRoom') || 'Join Video Room'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="doctor-empty-row">{DOCTOR_MESSAGES.noAppointmentsFound}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Filter Section */}
      <section className="doctor-appointments-card">
        <h2>{t('Appointment Filters')}</h2>
        <div className="doctor-filter-scroll">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`doctor-filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {/* All Appointments Table */}
      <section className="doctor-appointments-card">
        <h2>{t('All Appointments Table')}</h2>
        <div className="table-responsive appointment-table-container">
          <table className="table table-bordered table-hover align-middle appointment-table">
            <thead>
              <tr>
                <th>{t('Appointment ID')}</th>
                <th>{t('Type / Mode') || 'Type'}</th>
                <th>{t('Patient ID')}</th>
                <th>{t('Patient Name')}</th>
                <th>{t('Age')}</th>
                <th>{t('Weight')}</th>
                <th>{t('Issue')}</th>
                <th>{t('Appointment Date')}</th>
                <th>{t('Appointment Time')}</th>
                <th>{t('Consulting Fee')}</th>
                <th>{t('Status')}</th>
                <th>{t('videoConsultation') || 'Video Consultation'}</th>
                <th>{t('Lab Reports')}</th>
                <th>{t('Prescriptions')}</th>
                <th>{t('Cancel Appointment')}</th>
                <th>{t('Complete Appointment')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.appointmentId}>
                    <td><strong>#{appointment.appointmentId}</strong></td>
                    <td>
                      {appointment.appointmentType === 'ONLINE' ? (
                        <span className="badge bg-success bg-opacity-25 text-success border border-success">
                          📹 {t('onlineConsultation') || 'Online Video'}
                        </span>
                      ) : (
                        <span className="badge bg-primary bg-opacity-25 text-primary border border-primary">
                          🏥 {t('physicalVisit') || 'Physical Visit'}
                        </span>
                      )}
                    </td>
                    <td>{appointment.patientId}</td>
                    <td className="fw-semibold">{appointment.userData.name}</td>
                    <td>{appointment.age}</td>
                    <td>{appointment.weight}</td>
                    <td>{appointment.issue}</td>
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
                          📹 {t('joinVideoRoom') || 'Join Room'}
                        </button>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const canUpload = (appointment.status === 'COMPLETED' || appointment.status === 'IN_PROGRESS') && !appointment.labReportPath;
                        const buttonLabel = appointment.labReportPath ? t('Already Uploaded') : t('Upload');
                        return (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            type="button"
                            disabled={!canUpload}
                            onClick={() =>
                              setUploadDraft({
                                appointmentId: appointment.appointmentId,
                                patientId: appointment.patientId,
                                doctorId: appointment.doctorId,
                                type: 'labreport',
                                file: null,
                              })
                            }
                          >
                            {buttonLabel}
                          </button>
                        );
                      })()}
                    </td>
                    <td>
                      {(() => {
                        const canUpload = (appointment.status === 'COMPLETED' || appointment.status === 'IN_PROGRESS') && !appointment.prescriptionPath;
                        const buttonLabel = appointment.prescriptionPath ? t('Already Uploaded') : t('Upload');
                        return (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            type="button"
                            disabled={!canUpload}
                            onClick={() =>
                              setUploadDraft({
                                appointmentId: appointment.appointmentId,
                                patientId: appointment.patientId,
                                doctorId: appointment.doctorId,
                                type: 'prescription',
                                file: null,
                              })
                            }
                          >
                            {buttonLabel}
                          </button>
                        );
                      })()}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        type="button"
                        disabled={appointment.status !== 'BOOKED' && appointment.status !== 'IN_PROGRESS'}
                        onClick={() => openCancelModal(appointment.appointmentId)}
                      >
                        {t('Cancel')}
                      </button>
                    </td>
                    <td>
                      {(() => {
                        const canComplete = canMarkCompleted(appointment);
                        return (
                          <button
                            className="btn btn-sm btn-success"
                            type="button"
                            disabled={!canComplete}
                            onClick={() => onCompleteAppointment(appointment.appointmentId)}
                          >
                            {canComplete ? t('Complete') : t('Available After Slot')}
                          </button>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="16" className="doctor-empty-row">{DOCTOR_MESSAGES.noAppointmentsFound}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upload Draft Section */}
      {uploadDraft.appointmentId && (
        <section className="doctor-appointments-card doctor-reschedule-card">
          <h2>{t('Upload')} {uploadDraft.type === 'labreport' ? t('Lab Reports') : t('Prescriptions')} - #{uploadDraft.appointmentId}</h2>
          <div className="doctor-reschedule-grid">
            <div>
              <label htmlFor="uploadFile">{t('Select File')}</label>
              <input
                id="uploadFile"
                type="file"
                onChange={(event) => setUploadDraft((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
              />
            </div>
            <div className="doctor-reschedule-actions">
              <button type="button" className="btn btn-sm btn-success" onClick={submitUpload}>{t('Upload')}</button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setUploadDraft({ appointmentId: '', patientId: '', doctorId: '', type: '', file: null })}
              >
                {t('Cancel')}
              </button>
            </div>
          </div>
        </section>
      )}

      <CancellationModal
        isOpen={Boolean(activeCancelAppointmentId)}
        title={DOCTOR_MESSAGES.cancelAppointmentConfirm}
        onClose={() => setActiveCancelAppointmentId('')}
        onConfirm={confirmCancellation}
      />
    </div>
  );
};

export default DoctorAppointments;
