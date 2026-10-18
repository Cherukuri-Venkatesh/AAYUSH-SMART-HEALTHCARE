import { createContext, useState, useEffect } from "react";
import { clearTokens } from "../utils/auth";
import { apiGet, apiPut } from "../utils/api";
import { showError, showSuccess } from '../utils/doctorToast';
import { BACKENDURL } from '../../lib';


export const DoctorContext = createContext()

// Get initial token only once to avoid multiple reads
const getInitialDToken = () => localStorage.getItem('dToken') || '';

const DoctorContextProvider = (props) => {

    // Load token from localStorage (persists across page refresh)
    const [dToken, setDToken] = useState(getInitialDToken)
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)
    const [profileData, setProfileData] = useState(false)

    const mapAppointment = (item) => ({
        _id: String(item.id),
        appointmentId: String(item.id),
        patientId: String(item.patientId),
        doctorId: String(item.doctorId),
        doctorName: item.doctorName,
        specialisation: item.doctorSpecialization,
        hospital: item.hospitalName,
        age: item.age,
        weight: item.weight,
        issue: item.issue,
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        startTime: item.appointmentTime,
        endTime: item.appointmentTime,
        consultingFees: item.consultingFees,
        paymentType: item.paymentType,
        status: item.status,
        prescriptionPath: item.prescriptionPath || '',
        labReportPath: item.labReportPath || '',
        appointmentType: item.appointmentType || 'PHYSICAL',
        roomId: item.roomId || '',
        consultationDuration: item.consultationDuration || 30,
        userData: {
            name: item.patientName || `Patient ${item.patientId}`,
            email: '',
        },
        prescriptions: [],
        labReports: [],
    });

    // Only sync when token actually changes - only manage dToken
    useEffect(() => {
        if (dToken) {
            localStorage.setItem('dToken', dToken);
        } else {
            localStorage.removeItem('dToken');
        }
    }, [dToken]);

    // Handle auth errors globally (e.g., 401/403 from API)
    useEffect(() => {
        const handleAuthError = (event) => {
            setDToken('');
            clearTokens();
            showError(event.detail?.message || 'Session expired. Please login again.');
            setTimeout(() => window.location.href = '/', 100);
        };
        
        window.addEventListener('auth_error', handleAuthError);
        return () => window.removeEventListener('auth_error', handleAuthError);
    }, []);

    // Load doctor data on mount
    useEffect(() => {
        if (dToken) {
            getAppointments();
            getProfileData();
        }
    }, [dToken]);

    const uploadFile = async (param1, param2) => {
        try {
            let file, type, appointmentId, patientId, doctorId;

            if (param1 instanceof FormData) {
                file = param1.get('file');
                appointmentId = param1.get('appointmentId');
                patientId = param1.get('patientId');
                doctorId = param1.get('doctorId');
                type = typeof param2 === 'string' ? param2 : 'prescription';
            } else if (param2 instanceof FormData) {
                file = param2.get('file');
                appointmentId = param2.get('appointmentId');
                patientId = param2.get('patientId');
                doctorId = param2.get('doctorId');
                type = typeof param1 === 'string' ? param1 : 'prescription';
            } else if (param1 && typeof param1 === 'object') {
                file = param1.file;
                type = param1.type;
                appointmentId = param1.appointmentId;
                patientId = param1.patientId;
                doctorId = param1.doctorId;
            }

            if (!appointmentId) {
                showError('Appointment ID is required for upload');
                return null;
            }

            const formData = new FormData();
            formData.append('appointmentId', String(appointmentId));
            if (patientId) formData.append('patientId', String(patientId));
            if (file) formData.append('file', file);

            const resolvedDoctorId = doctorId || profileData?.id || localStorage.getItem('doctorId') || '1';
            formData.append('doctorId', String(resolvedDoctorId));

            const token = localStorage.getItem('dToken') || localStorage.getItem('token') || localStorage.getItem('aToken');
            const url = (type === 'labreport' || type === 'labreports')
                ? `${BACKENDURL}labreports/upload`
                : `${BACKENDURL}prescriptions/upload`;

            const response = await fetch(url, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || 'Upload failed');
            }

            showSuccess(type === 'labreport' ? 'Lab report uploaded successfully!' : 'Prescription uploaded successfully!');
            return { success: true };
        } catch (error) {
            showError(error?.message || 'Error uploading file');
            return null;
        }
    };

    const getAppointments = async () => {
        try {
            const response = await apiGet('doctor/appointments');
            if (!response || !response.success) throw new Error(response?.error || 'Error loading appointments');
            const rows = Array.isArray(response.data) ? response.data.map(mapAppointment).reverse() : [];
            setAppointments(rows);
        } catch (error) {
            showError("Error loading appointments");
        }
    }

    const getProfileData = async () => {
        try {
            const response = await apiGet('doctor/me');
            if (!response || !response.success) throw new Error(response?.error || 'Error loading profile');
            const doctor = response.data;
            if (doctor?.id) {
                localStorage.setItem('doctorId', String(doctor.id));
            }
            setProfileData({
                ...doctor,
                _id: String(doctor.id),
                id: String(doctor.id),
                hospital_id: doctor.hospitalId ? String(doctor.hospitalId) : '',
                photo: doctor.photo || '',
                image: doctor.photo || '',
                speciality: doctor.specialization,
                fees: doctor.consultingFees,
                password: '',
            });
        } catch (error) {
            showError("Error loading profile");
        }
    }

    const updateProfileData = async (payload) => {
        try {
            if (!dToken) {
                showError('Please login to update profile');
                return null;
            }

            const response = await apiPut('doctor/me', payload);
            if (!response || !response.success) throw new Error(response?.error || 'Error updating profile');

            const doctor = response.data;
            const nextProfile = {
                ...doctor,
                _id: String(doctor.id),
                id: String(doctor.id),
                hospital_id: doctor.hospitalId ? String(doctor.hospitalId) : '',
                photo: doctor.photo || '',
                image: doctor.photo || '',
                speciality: doctor.specialization,
                fees: doctor.consultingFees,
                password: '',
            };

            setProfileData(nextProfile);
            return nextProfile;
        } catch (error) {
            showError(error?.message || 'Error updating profile');
            return null;
        }
    }

    const cancelAppointment = async (appointmentId) => {
        try {
            const response = await apiPut(`appointments/doctor/cancel?appointmentId=${appointmentId}&doctorId=${profileData?.id || 0}`, {});
            if (!response || !response.success) throw new Error(response?.error || 'Error cancelling appointment');
            setAppointments(prev => prev.map(apt =>
                apt._id === appointmentId ? { ...apt, status: 'CANCELLED', cancelled: true } : apt
            ));
            showSuccess('Appointment cancelled');
            getDashData();
        } catch (error) {
            showError("Error cancelling appointment");
        }
    }

    const completeAppointment = async (appointmentId) => {
        try {
            const response = await apiPut(`appointments/status/${appointmentId}?status=COMPLETED`, {});
            if (!response || !response.success) throw new Error(response?.error || 'Error completing appointment');
            setAppointments(prev => prev.map(apt =>
                apt._id === appointmentId ? { ...apt, isCompleted: true, status: 'COMPLETED' } : apt
            ));
            showSuccess('Appointment completed');
            getDashData();
        } catch (error) {
            showError("Error completing appointment");
        }
    }

    const getDashData = async () => {
        try {
            const doctorId = profileData?.id;
            if (!doctorId) return;
            const response = await apiGet(`appointments/doctor/analytics/${doctorId}`);
            if (!response || !response.success) throw new Error(response?.error || 'Error loading dashboard data');

            const total = Number(response.data.totalAppointments || 0);
            const completed = Number(response.data.completedAppointments || 0);
            const pending = Math.max(total - completed - Number(response.data.cancelledAppointments || 0), 0);

            setDashData({
                todaysAppointments: Number(response.data.todayAppointments || 0),
                todaysRevenue: 0,
                completedAppointmentsFromDay1: completed,
                cancelledAppointmentsFromDay1: Number(response.data.cancelledAppointments || 0),
                totalRevenueFromDay1: Number(response.data.totalEarnings || 0),
                totalAppointmentsFromDay1: total,
                pendingConsultations: pending,
            });
        } catch (error) {
            showError("Error loading dashboard data");
        }
    }

    useEffect(() => {
        if (profileData?.id) {
            getDashData();
        }
    }, [profileData?.id]);

    const value = {
        dToken, setDToken,
        appointments,
        getAppointments,
        cancelAppointment,
        completeAppointment,
        dashData, getDashData,
        profileData, setProfileData,
        getProfileData, updateProfileData, uploadFile,
    }

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )


}

export default DoctorContextProvider