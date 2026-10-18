package com.project.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.dto.AppointmentDTO;
import com.project.dto.DoctorPatientDTO;
import com.project.entity.*;
import com.project.repository.*;
import com.project.security.AuthContextService;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AdminRepository doctorRepository;

    @Autowired
    private DoctorScheduleRepository scheduleRepository;

    @Autowired
    private AuthContextService authContextService;

    @Autowired
    private ConsultationService consultationService;

    @Autowired
    private NotificationService notificationService;

    // ================================
    // BOOK APPOINTMENT
    // ================================

    @Transactional
    public AppointmentDTO bookAppointment(Long patientId, Long doctorId,
                                          LocalDate date, LocalTime time,
                                          Integer age, Double weight,
                                          String issue, String paymentType,
                                          String appointmentType, Integer consultationDuration) {

        Long effectivePatientId = authContextService.resolvePatientId(patientId);

        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(6);

        if (date.isBefore(today) || date.isAfter(maxDate)) {
            throw new RuntimeException("Booking allowed only for next 7 days");
        }

        List<DoctorSchedule> schedules =
                scheduleRepository.findByDoctor_IdAndScheduleDate(doctorId, date);

        if (schedules.isEmpty()) {
            throw new RuntimeException("Doctor not available on this date");
        }

        boolean withinTime = false;

        for (DoctorSchedule schedule : schedules) {
            if (!time.isBefore(schedule.getStartTime()) &&
                time.isBefore(schedule.getEndTime())) {
                withinTime = true;
                break;
            }
        }

        if (!withinTime) {
            throw new RuntimeException("Appointment time outside doctor's working hours");
        }

        boolean alreadyBooked =
                appointmentRepository.existsByDoctor_IdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                        doctorId, date, time, "CANCELLED"
                );

        if (alreadyBooked) {
            throw new RuntimeException("Doctor already has appointment at this time");
        }

        Patient patient = patientRepository.findById(effectivePatientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Admindoctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        Appointment appointment = new Appointment();

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(date);
        appointment.setAppointmentTime(time);
        appointment.setAge(age);
        appointment.setWeight(weight);
        appointment.setIssue(issue);
        appointment.setStatus("BOOKED");
        appointment.setPaymentType(PaymentType.valueOf(paymentType));
        appointment.setConsultingFees(doctor.getConsultingFees());

        String resolvedType = (appointmentType != null && appointmentType.equalsIgnoreCase("ONLINE")) ? "ONLINE" : "PHYSICAL";
        appointment.setAppointmentType(resolvedType);
        appointment.setConsultationDuration(consultationDuration != null && consultationDuration > 0 ? consultationDuration : 30);

        if ("ONLINE".equals(resolvedType)) {
            String roomId = UUID.randomUUID().toString();
            appointment.setRoomId(roomId);
        }

        Appointment saved = appointmentRepository.save(appointment);

        // If online, initialize consultation room
        if ("ONLINE".equals(resolvedType)) {
            consultationService.createRoomForAppointment(saved);
        }

        // Notify patient & doctor
        notificationService.createNotification(
            "PATIENT",
            patient.getId(),
            "Appointment Booked",
            "Your " + resolvedType.toLowerCase() + " appointment with Dr. " + doctor.getName() + " on " + date + " at " + time + " has been booked successfully.",
            "APPOINTMENT_BOOKED",
            saved.getId(),
            saved.getRoomId()
        );

        notificationService.createNotification(
            "DOCTOR",
            doctor.getId(),
            "New Appointment Booked",
            "New " + resolvedType.toLowerCase() + " appointment with patient " + patient.getName() + " on " + date + " at " + time + ".",
            "APPOINTMENT_BOOKED",
            saved.getId(),
            saved.getRoomId()
        );

        return convertToDTO(saved);
    }

    public AppointmentDTO bookAppointment(Long patientId, Long doctorId,
                                          LocalDate date, LocalTime time,
                                          Integer age, Double weight,
                                          String issue, String paymentType) {
        return bookAppointment(patientId, doctorId, date, time, age, weight, issue, paymentType, "PHYSICAL", 30);
    }

    public AppointmentDTO bookAppointmentForCurrentPatient(Long doctorId,
                                                           LocalDate date,
                                                           LocalTime time,
                                                           Integer age,
                                                           Double weight,
                                                           String issue,
                                                           String paymentType,
                                                           String appointmentType,
                                                           Integer consultationDuration) {
        Long patientId = authContextService.getCurrentPatientId();
        return bookAppointment(patientId, doctorId, date, time, age, weight, issue, paymentType, appointmentType, consultationDuration);
    }

    public AppointmentDTO bookAppointmentForCurrentPatient(Long doctorId,
                                                           LocalDate date,
                                                           LocalTime time,
                                                           Integer age,
                                                           Double weight,
                                                           String issue,
                                                           String paymentType) {
        return bookAppointmentForCurrentPatient(doctorId, date, time, age, weight, issue, paymentType, "PHYSICAL", 30);
    }

    // ================================
    // PATIENT APPOINTMENTS
    // ================================

    public List<AppointmentDTO> getAppointmentsByPatient(Long patientId) {
        Long effectivePatientId = authContextService.resolvePatientId(patientId);

        return appointmentRepository.findByPatient_Id(effectivePatientId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getCurrentPatientAppointments() {
        Long patientId = authContextService.getCurrentPatientId();
        return getAppointmentsByPatient(patientId);
    }

    public List<Appointment> getPatientUpcomingAppointments(Long patientId) {
        Long effectivePatientId = authContextService.resolvePatientId(patientId);

        return appointmentRepository
                .findByPatient_IdAndAppointmentDateAfter(
                        effectivePatientId,
                        LocalDate.now()
                );
    }

    public List<Appointment> getPatientHistory(Long patientId) {
        Long effectivePatientId = authContextService.resolvePatientId(patientId);

        return appointmentRepository
                .findByPatient_IdAndAppointmentDateBefore(
                        effectivePatientId,
                        LocalDate.now()
                );
    }

    // ================================
    // DOCTOR APPOINTMENTS
    // ================================

    public List<AppointmentDTO> getAppointmentsByDoctor(Long doctorId) {
        Long effectiveDoctorId = authContextService.resolveDoctorId(doctorId);

        return appointmentRepository.findByDoctor_Id(effectiveDoctorId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getCurrentDoctorAppointments() {
        Long doctorId = authContextService.getCurrentDoctorId();
        return getAppointmentsByDoctor(doctorId);
    }

    public List<DoctorPatientDTO> getCurrentDoctorPatients() {
        Long doctorId = authContextService.getCurrentDoctorId();
        return appointmentRepository.findByDoctor_Id(doctorId)
                .stream()
                .map(this::convertToDoctorPatientDTO)
                .collect(Collectors.toList());
    }

    public List<Appointment> getDoctorUpcomingAppointments(Long doctorId) {
        Long effectiveDoctorId = authContextService.resolveDoctorId(doctorId);

        return appointmentRepository
                .findByDoctor_IdAndAppointmentDateAfter(
                        effectiveDoctorId,
                        LocalDate.now()
                );
    }

    public List<Appointment> getDoctorTodayAppointments(Long doctorId) {
        Long effectiveDoctorId = authContextService.resolveDoctorId(doctorId);

        return appointmentRepository
                .findByDoctor_IdAndAppointmentDate(
                        effectiveDoctorId,
                        LocalDate.now()
                );
    }

    public List<Appointment> getDoctorPastAppointments(Long doctorId) {
        Long effectiveDoctorId = authContextService.resolveDoctorId(doctorId);

        return appointmentRepository
                .findByDoctor_IdAndAppointmentDateBefore(
                        effectiveDoctorId,
                        LocalDate.now()
                );
    }

    public List<Appointment> getDoctorCancelledAppointments(Long doctorId) {
        Long effectiveDoctorId = authContextService.resolveDoctorId(doctorId);

        return appointmentRepository
                .findByDoctor_IdAndStatus(effectiveDoctorId, "CANCELLED");
    }

    // ================================
    // CANCEL & STATUS UPDATES
    // ================================

    @Transactional
    public AppointmentDTO cancelAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if ("CANCELLED".equals(appointment.getStatus())) {
            throw new RuntimeException("Appointment already cancelled");
        }

        appointment.setStatus("CANCELLED");
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient & doctor
        if (saved.getPatient() != null) {
            notificationService.createNotification(
                "PATIENT",
                saved.getPatient().getId(),
                "Appointment Cancelled",
                "Your appointment #" + saved.getId() + " has been cancelled.",
                "APPOINTMENT_CANCELLED",
                saved.getId(),
                saved.getRoomId()
            );
        }
        if (saved.getDoctor() != null) {
            notificationService.createNotification(
                "DOCTOR",
                saved.getDoctor().getId(),
                "Appointment Cancelled",
                "Appointment #" + saved.getId() + " with patient " + (saved.getPatient() != null ? saved.getPatient().getName() : "") + " has been cancelled.",
                "APPOINTMENT_CANCELLED",
                saved.getId(),
                saved.getRoomId()
            );
        }

        return convertToDTO(saved);
    }

    @Transactional
    public AppointmentDTO cancelAppointment(Long appointmentId, Long patientId) {
        Long effectivePatientId = authContextService.resolvePatientId(patientId);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getPatient() != null && !appointment.getPatient().getId().equals(effectivePatientId)) {
            throw new RuntimeException("Unauthorized: Cannot cancel appointment of another patient");
        }

        return cancelAppointment(appointmentId);
    }

    @Transactional
    public AppointmentDTO cancelCurrentPatientAppointment(Long appointmentId) {
        Long patientId = authContextService.getCurrentPatientId();
        return cancelAppointment(appointmentId, patientId);
    }

    @Transactional
    public AppointmentDTO doctorCancelAppointment(Long appointmentId, Long doctorId) {
        Long effectiveDoctorId = authContextService.resolveDoctorId(doctorId);
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getDoctor() != null && !appointment.getDoctor().getId().equals(effectiveDoctorId)) {
            throw new RuntimeException("Unauthorized: Cannot cancel appointment of another doctor");
        }

        return cancelAppointment(appointmentId);
    }

    @Transactional
    public AppointmentDTO rescheduleAppointment(Long appointmentId, LocalDate newDate, LocalTime newTime) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!"BOOKED".equalsIgnoreCase(appointment.getStatus())) {
            throw new RuntimeException("Only booked appointments can be rescheduled");
        }

        Long doctorId = appointment.getDoctor().getId();
        boolean alreadyBooked = appointmentRepository.existsByDoctor_IdAndAppointmentDateAndAppointmentTimeAndStatusNot(
                doctorId, newDate, newTime, "CANCELLED"
        );

        if (alreadyBooked) {
            throw new RuntimeException("Selected slot is already booked for this doctor");
        }

        appointment.setAppointmentDate(newDate);
        appointment.setAppointmentTime(newTime);
        appointment.setRescheduleCount(appointment.getRescheduleCount() == null ? 1 : appointment.getRescheduleCount() + 1);
        appointment.setUpdatedAt(LocalDateTime.now());

        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient & doctor
        if (saved.getPatient() != null) {
            notificationService.createNotification(
                "PATIENT",
                saved.getPatient().getId(),
                "Appointment Rescheduled",
                "Your appointment has been rescheduled to " + newDate + " at " + newTime + ".",
                "APPOINTMENT_RESCHEDULED",
                saved.getId(),
                saved.getRoomId()
            );
        }
        if (saved.getDoctor() != null) {
            notificationService.createNotification(
                "DOCTOR",
                saved.getDoctor().getId(),
                "Appointment Rescheduled",
                "Appointment #" + saved.getId() + " has been rescheduled to " + newDate + " at " + newTime + ".",
                "APPOINTMENT_RESCHEDULED",
                saved.getId(),
                saved.getRoomId()
            );
        }

        return convertToDTO(saved);
    }

    @Transactional
    public AppointmentDTO rescheduleCurrentPatientAppointment(Long appointmentId, LocalDate newDate, LocalTime newTime) {
        Long patientId = authContextService.getCurrentPatientId();
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getPatient() != null && !appointment.getPatient().getId().equals(patientId)) {
            throw new RuntimeException("Unauthorized: Cannot reschedule appointment of another patient");
        }

        return rescheduleAppointment(appointmentId, newDate, newTime);
    }

    @Transactional
    public AppointmentDTO updateStatus(Long appointmentId, String status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(status.toUpperCase());
        appointment.setUpdatedAt(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        return convertToDTO(saved);
    }

    // ================================
    // DOCTOR ANALYTICS
    // ================================

    public Map<String, Object> getDoctorAnalytics(Long doctorId) {
        Long effectiveDoctorId = authContextService.resolveDoctorId(doctorId);

        Map<String, Object> analytics = new HashMap<>();

        long total = appointmentRepository.countByDoctor_Id(effectiveDoctorId);
        long completed = appointmentRepository.countByDoctor_IdAndStatus(effectiveDoctorId, "COMPLETED");
        long cancelled = appointmentRepository.countByDoctor_IdAndStatus(effectiveDoctorId, "CANCELLED");
        Integer earnings = appointmentRepository.getDoctorTotalEarnings(effectiveDoctorId);

        if (earnings == null) earnings = 0;

        List<Appointment> today =
                appointmentRepository.findByDoctor_IdAndAppointmentDate(
                        effectiveDoctorId,
                        LocalDate.now()
                );

        analytics.put("totalAppointments", total);
        analytics.put("completedAppointments", completed);
        analytics.put("cancelledAppointments", cancelled);
        analytics.put("totalEarnings", earnings);
        analytics.put("todayAppointments", today.size());

        return analytics;
    }

    // ================================
    // DTO CONVERTER
    // ================================

    private AppointmentDTO convertToDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO();

        dto.setId(appointment.getId());
        if (appointment.getPatient() != null) {
            dto.setPatientId(appointment.getPatient().getId());
            dto.setPatientName(appointment.getPatient().getName());
        }
        if (appointment.getDoctor() != null) {
            dto.setDoctorId(appointment.getDoctor().getId());
            dto.setDoctorName(appointment.getDoctor().getName());
            dto.setDoctorSpecialization(appointment.getDoctor().getSpecialization());
            dto.setHospitalName(appointment.getDoctor().getHospitalName());
        }
        dto.setAge(appointment.getAge());
        dto.setWeight(appointment.getWeight());
        dto.setIssue(appointment.getIssue());
        dto.setAppointmentDate(appointment.getAppointmentDate());
        dto.setAppointmentTime(appointment.getAppointmentTime());
        dto.setStatus(appointment.getStatus());
        dto.setConsultingFees(appointment.getConsultingFees());
        dto.setPaymentType(appointment.getPaymentType() == null ? null : appointment.getPaymentType().name());
        dto.setPrescriptionPath(appointment.getPrescriptionPath());
        dto.setLabReportPath(appointment.getLabReportPath());

        // Extended fields
        dto.setAppointmentType(appointment.getAppointmentType() != null ? appointment.getAppointmentType() : "PHYSICAL");
        dto.setRoomId(appointment.getRoomId());
        dto.setConsultationDuration(appointment.getConsultationDuration() != null ? appointment.getConsultationDuration() : 30);
        dto.setConsultationStartedAt(appointment.getConsultationStartedAt());
        dto.setConsultationEndedAt(appointment.getConsultationEndedAt());
        dto.setRescheduleCount(appointment.getRescheduleCount() != null ? appointment.getRescheduleCount() : 0);
        dto.setCancellationReason(appointment.getCancellationReason());
        dto.setCreatedAt(appointment.getCreatedAt());

        return dto;
    }

    private DoctorPatientDTO convertToDoctorPatientDTO(Appointment appointment) {
        DoctorPatientDTO dto = new DoctorPatientDTO();
        if (appointment.getPatient() != null) {
            dto.setPatientId(appointment.getPatient().getId());
            dto.setName(appointment.getPatient().getName());
            dto.setPhone(appointment.getPatient().getPhone());
        }
        if (appointment.getDoctor() != null) {
            dto.setDoctorId(appointment.getDoctor().getId());
        }
        dto.setAge(appointment.getAge());
        dto.setWeight(appointment.getWeight());
        dto.setIssue(appointment.getIssue());
        dto.setAppointmentDate(appointment.getAppointmentDate() == null ? null : appointment.getAppointmentDate().toString());
        dto.setAppointmentTime(appointment.getAppointmentTime() == null ? null : appointment.getAppointmentTime().toString());
        dto.setConsultingFees(appointment.getConsultingFees());
        dto.setPaymentType(appointment.getPaymentType() == null ? null : appointment.getPaymentType().name());
        dto.setPrescriptionPath(appointment.getPrescriptionPath());
        dto.setLabReportPath(appointment.getLabReportPath());
        dto.setStatus(appointment.getStatus());
        dto.setAppointmentId(appointment.getId());
        return dto;
    }
}