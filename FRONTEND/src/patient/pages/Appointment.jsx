import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import RelatedDoctors from '../components/RelatedDoctors';
import { showError, showSuccess, showWarning, MESSAGES } from '../utils/toastService';
import { fetchDoctorsForPatient } from '../utils/doctorApi';
import { patientApiGet, patientApiPost } from '../utils/api';
import { useLanguage } from '../../context/LanguageContext';

import { formatLocalDate, formatToDisplayDate, getUpcomingDays, formatTo12Hour, formatTo24Hour } from '../../utils/dateUtils';

const Appointment = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { token, userData } = useContext(AppContext);
  const { t } = useLanguage();
  const [doctors, setDoctors] = useState([]);
  const [doctorSchedules, setDoctorSchedules] = useState([]);

  const [appointmentType, setAppointmentType] = useState('PHYSICAL'); // PHYSICAL or ONLINE
  const [consultationDuration, setConsultationDuration] = useState(30);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlotsByDate, setAvailableSlotsByDate] = useState({});
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    symptoms: '',
    paymentType: '',
  });

  const doctor = useMemo(() => doctors.find((item) => item._id === docId), [doctors, docId]);
  const doctorInitials = useMemo(() => {
    if (!doctor?.name) return 'DR';
    return doctor.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }, [doctor]);

  const upcoming7Days = useMemo(() => {
    return getUpcomingDays(7);
  }, []);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await fetchDoctorsForPatient();
        setDoctors(data);
      } catch {
        setDoctors([]);
        showError(MESSAGES.genericError);
      }
    };

    const loadDoctorSchedules = async () => {
      if (!docId) return;
      try {
        const res = await patientApiGet(`schedule/${docId}`);
        if (res && res.success && Array.isArray(res.data)) {
          setDoctorSchedules(res.data);
        }
      } catch {
        setDoctorSchedules([]);
      }
    };

    loadDoctors();
    loadDoctorSchedules();
  }, [docId]);

  const loadSlotsForDate = async (dateKey, mode) => {
    if (!docId || !dateKey) return;

    try {
      const modeParam = mode || appointmentType || 'ALL';
      const response = await patientApiGet(`schedule/available-slots?doctorId=${docId}&date=${dateKey}&mode=${modeParam}`);

      if (response && response.success && Array.isArray(response.data)) {
        const mapped = response.data.map((slot) => formatTo12Hour(slot));

        setAvailableSlotsByDate((prev) => ({
          ...prev,
          [dateKey]: mapped,
        }));
      } else {
        setAvailableSlotsByDate((prev) => ({
          ...prev,
          [dateKey]: [],
        }));
      }
    } catch {
      setAvailableSlotsByDate((prev) => ({
        ...prev,
        [dateKey]: [],
      }));
    }
  };

  const handleDateChange = (dateKey) => {
    setSelectedDate(dateKey);
    setSelectedSlot('');
    if (!availableSlotsByDate[dateKey]) {
      loadSlotsForDate(dateKey, appointmentType);
    }
  };

  const handleModeChange = (newMode) => {
    setAppointmentType(newMode);
    setSelectedSlot('');
    if (selectedDate) {
      loadSlotsForDate(selectedDate, newMode);
    }
  };

  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    return availableSlotsByDate[selectedDate] || [];
  }, [selectedDate, availableSlotsByDate]);

  const bookedSlots = useMemo(() => {
    if (!selectedDate) return [];
    const matchedSchedule = doctorSchedules.find((s) => s.scheduleDate === selectedDate || s.date === selectedDate);
    if (!matchedSchedule) return [];

    const startTime = matchedSchedule.startTime || '09:00';
    const endTime = matchedSchedule.endTime || '17:00';
    const duration = matchedSchedule.slotDuration || 30;

    let [startH, startM] = startTime.split(':').map(Number);
    let [endH, endM] = endTime.split(':').map(Number);
    let curMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const allGenerated = [];
    while (curMinutes + duration <= endMinutes) {
      const h = Math.floor(curMinutes / 60);
      const m = curMinutes % 60;
      const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      allGenerated.push(formatTo12Hour(time24));
      curMinutes += duration;
    }

    const availableSet = new Set(availableSlots);
    return allGenerated.filter((slot) => !availableSet.has(slot));
  }, [selectedDate, availableSlots, doctorSchedules]);

  const handleBookAppointment = async (event) => {
    event.preventDefault();

    if (!token) {
      showWarning(MESSAGES.loginToBook);
      navigate('/login');
      return;
    }

    if (!selectedDate || !selectedSlot) {
      showWarning(MESSAGES.selectSlotWarning);
      return;
    }

    if (!formData.age || !formData.weight || !formData.symptoms.trim() || !formData.paymentType) {
      showWarning(MESSAGES.allFieldsRequired);
      return;
    }

    const response = await patientApiPost('patient/appointments/book', {
      doctorId: Number(docId),
      date: selectedDate,
      time: formatTo24Hour(selectedSlot),
      age: Number(formData.age),
      weight: Number(formData.weight),
      issue: formData.symptoms,
      paymentType: String(formData.paymentType).toUpperCase(),
      appointmentType: String(appointmentType).toUpperCase(),
      consultationDuration: Number(consultationDuration),
    });

    if (!response || !response.success) {
      showError(response?.error || MESSAGES.genericError);
      return;
    }

    setAvailableSlotsByDate((prev) => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] || []).filter((slot) => slot !== selectedSlot),
    }));

    showSuccess(MESSAGES.appointmentBooked);
    navigate('/my-appointments');
  };

  if (!doctor) {
    return null;
  }

  return (
    <div className="py-4">
      {/* Doctor Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row g-4 align-items-center">
            <div className="col-12 col-md-4 col-lg-3">
              <div className="appointment-doctor-profile-card">
                <div className="appointment-doctor-profile-avatar">{doctorInitials}</div>
                <p className="appointment-doctor-profile-tag mb-0">{t('Consultation Ready')}</p>
              </div>
            </div>
            <div className="col-12 col-md-8 col-lg-9">
              <h1 className="h3 fw-bold mb-2">{doctor.name}</h1>
              <p className="mb-1 text-secondary"><strong>{t('Specialisation')}:</strong> {t(doctor.speciality)}</p>
              <p className="mb-1 text-secondary"><strong>{t('Degree')}:</strong> {doctor.degree}</p>
              <p className="mb-1 text-secondary"><strong>{t('Experience')}:</strong> {doctor.experience}</p>
              <p className="mb-1 text-secondary"><strong>{t('Hospital')}:</strong> {doctor.hospital}</p>
              <p className="mb-0 text-secondary"><strong>{t('Consultation Fee')}:</strong> ₹{doctor.fees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Mode Selection */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h5 fw-bold mb-3">🩺 {t('selectConsultationMode') || 'Select Consultation Mode'}</h2>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div
                className={`p-3 border rounded-3 text-center cursor-pointer transition-all ${
                  appointmentType === 'PHYSICAL' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border-secondary-subtle'
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleModeChange('PHYSICAL')}
              >
                <div className="fs-3 mb-2">🏥</div>
                <h5 className="fw-bold mb-1">{t('physicalInClinic') || 'In-Clinic Physical Visit'}</h5>
                <p className="text-muted small mb-0">
                  {t('physicalVisitDesc') || 'Visit the hospital in person for examination & diagnosis'}
                </p>
                <span className="badge bg-primary mt-2">₹{doctor.fees}</span>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div
                className={`p-3 border rounded-3 text-center cursor-pointer transition-all ${
                  appointmentType === 'ONLINE' ? 'border-success bg-success bg-opacity-10 shadow-sm' : 'border-secondary-subtle'
                }`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleModeChange('ONLINE')}
              >
                <div className="fs-3 mb-2">📹</div>
                <h5 className="fw-bold mb-1 text-success">{t('onlineVideoConsultation') || 'Online Video Consultation'}</h5>
                <p className="text-muted small mb-0">
                  {t('onlineConsultDesc') || 'Live encrypted HD WebRTC video call with instant digital prescription'}
                </p>
                <span className="badge bg-success mt-2">₹{doctor.fees} • 30 Mins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slots Section */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h4 fw-bold mb-3">{t('Step 1: Doctor Schedule')}</h2>
          <div className="row g-2">
            {upcoming7Days.map((day) => (
              <div className="col-6 col-md-4 col-lg-2" key={day.key}>
                <button
                  className={`btn w-100 ${selectedDate === day.key ? 'btn-primary' : 'btn-outline-primary'}`}
                  style={selectedDate === day.key ? { background: '#5F6FFF', borderColor: '#5F6FFF' } : {}}
                  onClick={() => handleDateChange(day.key)}
                >
                  {day.label}
                </button>
              </div>
            ))}
          </div>

          <h3 className="h5 fw-bold mt-4 mb-3">{t('Step 2: Available Slots')}</h3>
          {!selectedDate ? (
            <div className="alert alert-warning mb-0">{t('Please select doctor and date first.')}</div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {availableSlots.length === 0 ? (
                <div className="alert alert-warning mb-0 w-100">{t('No available slots for this date.')}</div>
              ) : (
                availableSlots.map((slot) => (
                  <button
                    key={slot}
                    className={`btn ${selectedSlot === slot ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))
              )}
            </div>
          )}

          <h3 className="h5 fw-bold mt-4 mb-3">{t('Step 3: Already Booked Slots')}</h3>
          <div className="d-flex flex-wrap gap-2">
            {bookedSlots.length === 0 ? (
              <span className="text-secondary">{t('No booked slots for this date.')}</span>
            ) : (
              bookedSlots.map((slot) => (
                <span key={slot} className="badge bg-danger px-3 py-2">{slot}</span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h2 className="h4 fw-bold mb-3">{t('Book Appointment Form')}</h2>

          <form onSubmit={handleBookAppointment}>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Patient ID')}</label>
                <input className="form-control" value={userData?.patientId || ''} readOnly />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Doctor ID')}</label>
                <input className="form-control" value={doctor._id} readOnly />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Doctor Name')}</label>
                <input className="form-control" value={doctor.name} readOnly />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Hospital')}</label>
                <input className="form-control" value={doctor.hospital} readOnly />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Specialisation')}</label>
                <input className="form-control" value={t(doctor.speciality)} readOnly />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Mode & Fees')}</label>
                <input
                  className="form-control fw-bold"
                  value={`${appointmentType === 'ONLINE' ? '📹 Online Video' : '🏥 In-Clinic'} - ₹${doctor.fees}`}
                  readOnly
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Age')} <span style={{ color: '#dc3545' }}>*</span></label>
                <input
                  className="form-control"
                  type="number"
                  value={formData.age}
                  onChange={(event) => setFormData((prev) => ({ ...prev, age: event.target.value }))}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Weight')} <span style={{ color: '#dc3545' }}>*</span></label>
                <input
                  className="form-control"
                  type="number"
                  value={formData.weight}
                  onChange={(event) => setFormData((prev) => ({ ...prev, weight: event.target.value }))}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-semibold">{t('Payment Type')} <span style={{ color: '#dc3545' }}>*</span></label>
                <select
                  className="form-select"
                  value={formData.paymentType}
                  onChange={(event) => setFormData((prev) => ({ ...prev, paymentType: event.target.value }))}
                >
                  <option value="">{t('Select Payment Type')}</option>
                  <option value="ONLINE">{t('ONLINE')}</option>
                  {appointmentType === 'PHYSICAL' && <option value="CASH">{t('CASH')}</option>}
                </select>
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t('Appointment Date')} <span style={{ color: '#dc3545' }}>*</span></label>
                <input className="form-control" value={selectedDate} readOnly />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label fw-semibold">{t('Appointment Time')} <span style={{ color: '#dc3545' }}>*</span></label>
                <input className="form-control" value={selectedSlot} readOnly />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">{t('Issue / Symptoms')} <span style={{ color: '#dc3545' }}>*</span></label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.symptoms}
                  onChange={(event) => setFormData((prev) => ({ ...prev, symptoms: event.target.value }))}
                />
              </div>

              <div className="col-12">
                <button type="submit" className="btn btn-primary px-4 py-2 fw-semibold" style={{ background: '#5F6FFF', borderColor: '#5F6FFF' }}>
                  {appointmentType === 'ONLINE'
                    ? `📹 ${t('bookOnlineConsultation') || 'Book Online Video Consultation'}`
                    : `🏥 ${t('Book Appointment')}`}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <RelatedDoctors speciality={doctor.speciality} docId={doctor._id} />
    </div>
  );
};

export default Appointment;
