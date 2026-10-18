import React, { useContext, useEffect, useMemo, useState } from 'react';
import CancellationModal from '../../components/CancellationModal';
import { DOCTOR_MESSAGES, showError, showSuccess } from '../../utils/doctorToast';
import { DoctorContext } from '../../context/DoctorContext';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api';
import { useLanguage } from '../../../context/LanguageContext';
import { formatLocalDate, getUpcomingDays, formatTo12Hour, formatTo24Hour } from '../../../utils/dateUtils';
import './DoctorSchedule.css';

const today = formatLocalDate(new Date());

const within7Days = (dateStr) => {
  const target = formatLocalDate(dateStr);
  const start = formatLocalDate(new Date());
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 6);
  const end = formatLocalDate(endDate);
  return target >= start && target <= end;
};

const parseDoctorId = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const numeric = String(value || '').match(/\d+/)?.[0];
  return numeric ? Number(numeric) : null;
};

const formatTimeForInput = (value) => String(value || '').slice(0, 5);

const normalizeSchedule = (schedule, fallbackDoctorId) => {
  const startTime = formatTimeForInput(schedule.startTime || schedule.start || '09:00');
  const endTime = formatTimeForInput(schedule.endTime || schedule.end || '17:00');

  const startMinutes = Number(startTime.split(':')[0]) * 60 + Number(startTime.split(':')[1]);
  const endMinutes = Number(endTime.split(':')[0]) * 60 + Number(endTime.split(':')[1]);

  const slotDuration = Number(schedule.slotDuration || 30);
  const derivedSlots = endMinutes > startMinutes
    ? Math.max(1, Math.floor((endMinutes - startMinutes) / slotDuration))
    : 0;

  return {
    scheduleUploadId: String(schedule.id || schedule.scheduleUploadId || `SCH-${Date.now()}`),
    doctor_id: String(schedule.doctor?.id || schedule.doctorId || schedule.doctor_id || fallbackDoctorId || ''),
    date: String(schedule.scheduleDate || schedule.date || ''),
    startTime,
    endTime,
    slotDuration,
    consultationMode: schedule.consultationMode || 'BOTH',
    totalSlots: Number(schedule.totalSlots || schedule.total_slots || derivedSlots),
    isCancelled: Boolean(schedule.isCancelled || false),
  };
};

const DoctorSchedule = () => {
  const { profileData } = useContext(DoctorContext);
  const { t } = useLanguage();
  const resolvedDoctorId = profileData?.id || '';
  const [backendDoctorId, setBackendDoctorId] = useState(parseDoctorId(resolvedDoctorId));

  const [activeTab, setActiveTab] = useState('UPLOAD');
  const [schedules, setSchedules] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [resolvingDoctorId, setResolvingDoctorId] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingScheduleId, setDeletingScheduleId] = useState('');
  const [scheduleLoadError, setScheduleLoadError] = useState('');
  const [cancelScheduleId, setCancelScheduleId] = useState('');
  const [editDraft, setEditDraft] = useState({
    scheduleUploadId: '',
    startTime: '',
    endTime: '',
    slotDuration: 30,
    consultationMode: 'BOTH',
  });

  const [formData, setFormData] = useState({
    scheduleDate: '',
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    consultationMode: 'BOTH',
    doctor_id: String(parseDoctorId(resolvedDoctorId) || resolvedDoctorId || ''),
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, doctor_id: String(backendDoctorId || resolvedDoctorId || '') }));
  }, [backendDoctorId, resolvedDoctorId]);

  const allowedDays = useMemo(() => {
    return getUpcomingDays(10).map((d) => ({
      ...d,
      allowed: within7Days(d.date),
    }));
  }, []);

  const availableSlotLabels = useMemo(() => {
    if (availableSlots.length) {
      return availableSlots.map((slot) => formatTimeForInput(slot));
    }
    return [];
  }, [availableSlots]);

  useEffect(() => {
    const resolveDoctorId = async () => {
      const directId = parseDoctorId(resolvedDoctorId);

      if (directId) {
        setBackendDoctorId(directId);
        setResolvingDoctorId(false);
        return;
      }

      try {
        setResolvingDoctorId(true);
        const result = await apiGet('doctor/me');
        if (!result || !result.success) throw new Error(result?.error || 'Unable to resolve doctor profile');

        const matchedId = parseDoctorId(result.data?.id);
        if (matchedId) setBackendDoctorId(matchedId);
      } catch {
        setBackendDoctorId(null);
      } finally {
        setResolvingDoctorId(false);
      }
    };

    resolveDoctorId();
  }, [resolvedDoctorId]);

  const fetchSchedules = async () => {
    if (!backendDoctorId) {
      setSchedules([]);
      setScheduleLoadError('');
      return;
    }

    try {
      setLoadingSchedules(true);
      setScheduleLoadError('');
      const result = await apiGet(`schedule/${backendDoctorId}`);

      if (!result.success) {
        throw new Error(result.error || DOCTOR_MESSAGES.somethingWentWrong);
      }

      const payload = Array.isArray(result.data) ? result.data : [];
      const normalized = payload.map((item) => normalizeSchedule(item, backendDoctorId)).reverse();
      setSchedules(normalized);
    } catch (error) {
      setSchedules([]);
      const errorMessage = error.message || DOCTOR_MESSAGES.somethingWentWrong;
      setScheduleLoadError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [backendDoctorId]);

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!backendDoctorId || !formData.scheduleDate || !within7Days(formData.scheduleDate)) {
        setAvailableSlots([]);
        return;
      }

      try {
        const params = new URLSearchParams({
          doctorId: String(backendDoctorId),
          date: formData.scheduleDate,
          mode: formData.consultationMode || 'ALL',
        });
        const result = await apiGet(`schedule/available-slots?${params.toString()}`);

        if (!result.success) throw new Error(result.error);

        const payload = Array.isArray(result.data) ? result.data : [];
        setAvailableSlots(payload);
      } catch {
        setAvailableSlots([]);
      }
    };

    loadAvailableSlots();
  }, [backendDoctorId, formData.scheduleDate, formData.consultationMode]);

  const addSchedule = async () => {
    if (!formData.scheduleDate || !within7Days(formData.scheduleDate)) {
      showError(DOCTOR_MESSAGES.doctorScheduleNotAvailable);
      return;
    }

    if (!backendDoctorId) {
      showError('Unable to resolve doctor ID for schedule upload.');
      return;
    }

    const start = Number(formData.startTime.split(':')[0]) * 60 + Number(formData.startTime.split(':')[1]);
    const end = Number(formData.endTime.split(':')[0]) * 60 + Number(formData.endTime.split(':')[1]);

    if (end <= start) {
      showError(DOCTOR_MESSAGES.fillRequiredFields);
      return;
    }

    try {
      setSubmitting(true);
      const params = new URLSearchParams({
        doctorId: String(backendDoctorId),
        scheduleDate: formData.scheduleDate,
        start: formData.startTime,
        end: formData.endTime,
        slotDuration: String(formData.slotDuration),
        consultationMode: formData.consultationMode || 'BOTH',
      });

      const result = await apiPost(`schedule/add?${params.toString()}`, {});

      if (!result.success) throw new Error(result.error);

      showSuccess(t('scheduleUploadedSuccess') || 'Schedule uploaded successfully.');
      setFormData((prev) => ({ ...prev, scheduleDate: '' }));
      await fetchSchedules();
    } catch (error) {
      showError(error.message || DOCTOR_MESSAGES.somethingWentWrong);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditSchedule = (schedule) => {
    setEditDraft({
      scheduleUploadId: schedule.scheduleUploadId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDuration: schedule.slotDuration,
      consultationMode: schedule.consultationMode || 'BOTH',
    });
  };

  const saveEditSchedule = async () => {
    if (!editDraft.startTime || !editDraft.endTime || !editDraft.slotDuration) {
      showError(DOCTOR_MESSAGES.fillRequiredFields);
      return;
    }

    try {
      const params = new URLSearchParams({
        startTime: editDraft.startTime,
        endTime: editDraft.endTime,
        slotDuration: String(editDraft.slotDuration),
        consultationMode: editDraft.consultationMode || 'BOTH',
      });

      const result = await apiPut(`schedule/update/${editDraft.scheduleUploadId}?${params.toString()}`, {});

      if (!result.success) throw new Error(result.error);

      const payload = result.data;

      if (payload) {
        const normalized = normalizeSchedule(payload, backendDoctorId);
        setSchedules((prev) => prev.map((item) => (
          item.scheduleUploadId === editDraft.scheduleUploadId ? normalized : item
        )));
      }

      showSuccess(t('scheduleUpdatedSuccess') || 'Schedule updated successfully.');
      setEditDraft({ scheduleUploadId: '', startTime: '', endTime: '', slotDuration: 30, consultationMode: 'BOTH' });
    } catch (error) {
      showError(error.message || DOCTOR_MESSAGES.somethingWentWrong);
    }
  };

  const cancelSchedule = async () => {
    if (!cancelScheduleId) return;

    try {
      setDeletingScheduleId(cancelScheduleId);
      const result = await apiDelete(`schedule/delete/${cancelScheduleId}`);

      if (!result.success) throw new Error(result.error);

      const successMsg = typeof result.data === 'string' ? result.data : (t('scheduleCancelledSuccess') || 'Schedule cancelled successfully.');
      showSuccess(successMsg);
      await fetchSchedules();
    } catch (error) {
      showError(error.message || DOCTOR_MESSAGES.somethingWentWrong);
    } finally {
      setDeletingScheduleId('');
      setCancelScheduleId('');
    }
  };

  return (
    <div className="doctor-schedule-page">
      <header className="doctor-schedule-header">
        <h1>{t('Doctor Schedule Management')}</h1>
        <p>{t('Configure Physical & Online Video Consultation availability for next 7 days')}</p>
      </header>

      <section className="doctor-schedule-card">
        <h2>{t('Schedule Calendar')}</h2>
        <div className="doctor-schedule-calendar-grid">
          {allowedDays.map((day) => (
            <div key={day.date} className={`doctor-schedule-day ${day.allowed ? 'allowed' : 'blocked'}`}>
              <strong>{day.label}</strong>
              <span>{day.date}</span>
              <small>{day.allowed ? (t('Upload Allowed') || 'Upload Allowed') : (t('Not Allowed') || 'Not Allowed')}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="doctor-schedule-card">
        <div className="doctor-schedule-tab-header">
          <button type="button" className={activeTab === 'UPLOAD' ? 'active' : ''} onClick={() => setActiveTab('UPLOAD')}>
            {t('Upload Schedule')}
          </button>
          <button type="button" className={activeTab === 'UPCOMING' ? 'active' : ''} onClick={() => setActiveTab('UPCOMING')}>
            {t('Upcoming Schedule')}
          </button>
        </div>

        {activeTab === 'UPLOAD' ? (
          <div className="doctor-schedule-upload-form">
            <label>
              {t('Schedule Date')}
              <input
                type="date"
                value={formData.scheduleDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, scheduleDate: event.target.value }))}
              />
            </label>
            <label>
              {t('Start Time')}
              <input
                type="time"
                value={formData.startTime}
                onChange={(event) => setFormData((prev) => ({ ...prev, startTime: event.target.value }))}
              />
            </label>
            <label>
              {t('End Time')}
              <input
                type="time"
                value={formData.endTime}
                onChange={(event) => setFormData((prev) => ({ ...prev, endTime: event.target.value }))}
              />
            </label>
            <label>
              {t('Slot Duration')}
              <select
                value={formData.slotDuration}
                onChange={(event) => setFormData((prev) => ({ ...prev, slotDuration: Number(event.target.value) }))}
              >
                <option value={15}>15 {t('minutes') || 'minutes'}</option>
                <option value={30}>30 {t('minutes') || 'minutes'}</option>
                <option value={45}>45 {t('minutes') || 'minutes'}</option>
                <option value={60}>60 {t('minutes') || 'minutes'}</option>
              </select>
            </label>
            <label>
              {t('Consultation Mode')}
              <select
                value={formData.consultationMode}
                onChange={(event) => setFormData((prev) => ({ ...prev, consultationMode: event.target.value }))}
              >
                <option value="BOTH">✨ {t('bothPhysicalOnline') || 'Both (Physical & Online)'}</option>
                <option value="PHYSICAL">🏥 {t('physicalInClinic') || 'Physical In-Clinic'}</option>
                <option value="ONLINE">📹 {t('onlineVideoConsultation') || 'Online Video Call'}</option>
              </select>
            </label>
            <label>
              {t('Doctor ID (auto-filled)')}
              <input type="text" value={formData.doctor_id} readOnly />
            </label>
            <button type="button" onClick={addSchedule} disabled={submitting} className="btn-upload-schedule">
              {submitting ? t('uploading') || 'Uploading...' : t('Upload Schedule')}
            </button>

            <div className="doctor-schedule-placeholder-slots">
              <h4>{t('Available Slots (from backend)')}</h4>
              <div>
                {availableSlotLabels.length > 0 ? (
                  availableSlotLabels.map((slot) => <span key={slot}>{slot}</span>)
                ) : (
                  <span>{t('No available slots for selected date.')}</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="doctor-schedule-table-wrap">
            <table className="doctor-schedule-table">
              <thead>
                <tr>
                  <th>{t('Schedule ID')}</th>
                  <th>{t('Date')}</th>
                  <th>{t('Mode')}</th>
                  <th>{t('Start Time')}</th>
                  <th>{t('End Time')}</th>
                  <th>{t('Slot Duration')}</th>
                  <th>{t('Total Slots')}</th>
                  <th>{t('Edit Schedule')}</th>
                  <th>{t('Cancel Schedule')}</th>
                </tr>
              </thead>
              <tbody>
                {!resolvingDoctorId && !loadingSchedules && schedules.length > 0 ? (
                  schedules.map((schedule) => (
                    <tr key={schedule.scheduleUploadId}>
                      <td>#{schedule.scheduleUploadId}</td>
                      <td>{schedule.date}</td>
                      <td>
                        {schedule.consultationMode === 'ONLINE' ? (
                          <span className="badge bg-success bg-opacity-25 text-success border border-success">📹 Online</span>
                        ) : schedule.consultationMode === 'PHYSICAL' ? (
                          <span className="badge bg-primary bg-opacity-25 text-primary border border-primary">🏥 Physical</span>
                        ) : (
                          <span className="badge bg-info bg-opacity-25 text-info border border-info">✨ Both</span>
                        )}
                      </td>
                      <td>{schedule.startTime}</td>
                      <td>{schedule.endTime}</td>
                      <td>{schedule.slotDuration} min</td>
                      <td>{schedule.totalSlots}</td>
                      <td>
                        <button
                          type="button"
                          className="doctor-table-btn edit"
                          onClick={() => openEditSchedule(schedule)}
                          disabled={schedule.isCancelled}
                        >
                          {t('Edit')}
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="doctor-table-btn cancel"
                          onClick={() => setCancelScheduleId(schedule.scheduleUploadId)}
                          disabled={schedule.isCancelled || deletingScheduleId === schedule.scheduleUploadId}
                        >
                          {deletingScheduleId === schedule.scheduleUploadId
                            ? t('Cancelling...') || 'Cancelling...'
                            : schedule.isCancelled
                            ? t('Cancelled')
                            : t('Cancel')}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="doctor-empty-row">{DOCTOR_MESSAGES.noAppointmentsFound}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CancellationModal
        isOpen={Boolean(cancelScheduleId)}
        title={t('Cancel Schedule Confirmation')}
        onClose={() => setCancelScheduleId('')}
        onConfirm={cancelSchedule}
      />
    </div>
  );
};

export default DoctorSchedule;
