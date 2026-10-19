import { patientApiGet } from './api';

const SPECIALITY_MAP = {
  'General physician': 'General Physician (General Medicine)',
  Gynecology: 'Gynecologist / Obstetrician',
  Cardiology: 'Cardiologist',
  Dermatology: 'Dermatologist',
  Pediatrics: 'Pediatrician',
  ENT: 'ENT Specialist',
  Eye: 'Ophthalmologist (Eye Specialist)',
};

const normalizeDoctor = (doctor) => {
  const normalizedSpeciality = SPECIALITY_MAP[doctor.specialization] || doctor.specialization;
  const doctorId = String(doctor.id ?? '');

  return {
    _id: doctorId,
    doctorId,
    name: doctor.name || '',
    email: doctor.email || '',
    speciality: normalizedSpeciality || '',
    degree: doctor.degree || '',
    experience: doctor.experience || '',
    about: doctor.aboutDoctor || '',
    fees: Number(doctor.consultingFees || 0),
    hospitalId: doctor.hospitalId ? String(doctor.hospitalId) : '',
    hospital: doctor.hospitalName || '',
    address: {
      line1: doctor.addressLine1 || '',
      line2: doctor.addressLine2 || '',
    },
    whatsappNumber: doctor.whatsappNumber || '',
    slots_booked: {},
  };
};

let memoryDoctorsCache = null;
let lastDoctorsFetchTime = 0;
const CACHE_TTL_MS = 180000; // 3 minutes

export async function fetchDoctorsForPatient() {
  const now = Date.now();
  if (memoryDoctorsCache && (now - lastDoctorsFetchTime < CACHE_TTL_MS)) {
    return memoryDoctorsCache;
  }

  // Check sessionStorage for fast render across page navigations
  try {
    const rawSession = sessionStorage.getItem('aayush_doctors_cache');
    if (rawSession && !memoryDoctorsCache) {
      const parsed = JSON.parse(rawSession);
      if (parsed.data && (now - parsed.timestamp < CACHE_TTL_MS)) {
        memoryDoctorsCache = parsed.data;
        lastDoctorsFetchTime = parsed.timestamp;
        return parsed.data;
      }
    }
  } catch (e) {
    // ignore sessionStorage errors
  }

  const result = await patientApiGet('patient/doctors', { useAuth: false });

  if (!result.success) {
    if (memoryDoctorsCache) return memoryDoctorsCache;
    throw new Error(result.error || 'Failed to fetch doctors');
  }

  const payload = result.data;

  if (!Array.isArray(payload)) {
    if (memoryDoctorsCache) return memoryDoctorsCache;
    throw new Error('Invalid doctors response');
  }

  const normalized = payload.map(normalizeDoctor);
  memoryDoctorsCache = normalized;
  lastDoctorsFetchTime = now;

  try {
    sessionStorage.setItem('aayush_doctors_cache', JSON.stringify({
      data: normalized,
      timestamp: now
    }));
  } catch (e) {
    // ignore storage quota errors
  }

  return normalized;
}

export async function fetchTopDoctorsForPatient(limit = 6) {
  const allDoctors = await fetchDoctorsForPatient();
  return allDoctors.slice(0, limit);
}

