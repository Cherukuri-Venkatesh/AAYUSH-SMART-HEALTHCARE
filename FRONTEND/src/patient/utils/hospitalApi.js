import { patientApiGet } from './api';

const normalizeHospital = (hospital, index) => {
  const hospitalId = String(hospital.id ?? `hosp-${index + 1}`);

  return {
    id: hospitalId,
    name: hospital.name || `Hospital ${index + 1}`,
    email: hospital.email || '',
    phone: hospital.phone || '',
    address: hospital.address || '',
    city: hospital.city || '',
    state: hospital.state || '',
    pincode: String(hospital.pincode || ''),
    description: hospital.description || '',
  };
};

let memoryHospitalsCache = null;
let lastHospitalsFetchTime = 0;
const CACHE_TTL_MS = 180000; // 3 minutes

export async function fetchHospitalsForPatient() {
  const now = Date.now();
  if (memoryHospitalsCache && (now - lastHospitalsFetchTime < CACHE_TTL_MS)) {
    return memoryHospitalsCache;
  }

  try {
    const rawSession = sessionStorage.getItem('aayush_hospitals_cache');
    if (rawSession && !memoryHospitalsCache) {
      const parsed = JSON.parse(rawSession);
      if (parsed.data && (now - parsed.timestamp < CACHE_TTL_MS)) {
        memoryHospitalsCache = parsed.data;
        lastHospitalsFetchTime = parsed.timestamp;
        return parsed.data;
      }
    }
  } catch (e) {
    // ignore
  }

  const result = await patientApiGet('hospitals/all', { useAuth: false });

  if (!result.success) {
    if (memoryHospitalsCache) return memoryHospitalsCache;
    throw new Error(result.error || 'Failed to fetch hospitals');
  }

  const payload = result.data;

  if (!Array.isArray(payload)) {
    if (memoryHospitalsCache) return memoryHospitalsCache;
    throw new Error('Invalid hospitals response');
  }

  const normalized = payload.map(normalizeHospital);
  memoryHospitalsCache = normalized;
  lastHospitalsFetchTime = now;

  try {
    sessionStorage.setItem('aayush_hospitals_cache', JSON.stringify({
      data: normalized,
      timestamp: now
    }));
  } catch (e) {
    // ignore
  }

  return normalized;
}

export async function fetchTopHospitalsForPatient(limit = 4) {
  const allHospitals = await fetchHospitalsForPatient();
  return allHospitals.slice(0, limit);
}