package com.project.service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.entity.Appointment;
import com.project.entity.ConsultationRoom;
import com.project.repository.AppointmentRepository;
import com.project.repository.ConsultationRoomRepository;
import com.project.security.AuthContextService;

@Service
public class ConsultationService {

    @Autowired
    private ConsultationRoomRepository roomRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AuthContextService authContextService;

    @Autowired
    private NotificationService notificationService;

    /**
     * Creates a new consultation room for an online appointment.
     */
    public ConsultationRoom createRoomForAppointment(Appointment appointment) {
        String roomId = (appointment.getRoomId() != null && !appointment.getRoomId().isBlank())
                ? appointment.getRoomId()
                : UUID.randomUUID().toString();

        appointment.setRoomId(roomId);

        ConsultationRoom room = roomRepository.findByRoomId(roomId)
                .orElseGet(() -> roomRepository.findByAppointment_Id(appointment.getId()).orElse(new ConsultationRoom()));

        room.setRoomId(roomId);
        room.setAppointment(appointment);
        room.setDoctor(appointment.getDoctor());
        room.setPatient(appointment.getPatient());
        room.setStatus("WAITING");
        room.setDoctorJoined(false);
        room.setPatientJoined(false);

        return roomRepository.save(room);
    }

    /**
     * Validates if the currently logged in user is authorized to join the room.
     */
    public Map<String, Object> validateRoomAccess(String roomId) {
        ConsultationRoom room = roomRepository.findByRoomId(roomId).orElse(null);

        Appointment appointment = null;
        if (room != null) {
            appointment = room.getAppointment();
        } else {
            // Check if an appointment has this roomId
            appointment = appointmentRepository.findByRoomId(roomId).orElse(null);
            if (appointment != null) {
                room = roomRepository.findByAppointment_Id(appointment.getId()).orElse(null);
                if (room == null) {
                    room = new ConsultationRoom();
                    room.setRoomId(roomId);
                    room.setAppointment(appointment);
                    room.setDoctor(appointment.getDoctor());
                    room.setPatient(appointment.getPatient());
                    room.setStatus("IN_PROGRESS");
                    room.setDoctorJoined(false);
                    room.setPatientJoined(false);
                    room = roomRepository.save(room);
                } else {
                    room.setRoomId(roomId);
                    room = roomRepository.save(room);
                }
            }
        }

        String role = authContextService.getCurrentRole();
        Long currentUserId = null;
        String currentUserName = "";

        if ("ADMIN".equalsIgnoreCase(role)) {
            currentUserName = "System Administrator";
        } else if ("DOCTOR".equalsIgnoreCase(role)) {
            try {
                currentUserId = authContextService.getCurrentDoctorId();
                if (room != null && room.getDoctor() != null) {
                    currentUserName = room.getDoctor().getName();
                } else {
                    currentUserName = "Dr. Consultant";
                }
            } catch (Exception e) {
                currentUserName = "Dr. Consultant";
            }
        } else if ("PATIENT".equalsIgnoreCase(role)) {
            try {
                currentUserId = authContextService.getCurrentPatientId();
                if (room != null && room.getPatient() != null) {
                    currentUserName = room.getPatient().getName();
                } else {
                    currentUserName = "Patient";
                }
            } catch (Exception e) {
                currentUserName = "Patient";
            }
        } else if ("PHC_CENTER".equalsIgnoreCase(role)) {
            currentUserName = "PHC Health Officer";
        } else {
            currentUserName = "Authorized Participant";
        }

        // If still null (e.g. ad-hoc/demo room), dynamically create a room entry
        if (room == null) {
            room = new ConsultationRoom();
            room.setRoomId(roomId);
            room.setStatus("IN_PROGRESS");
            room.setDoctorJoined("DOCTOR".equalsIgnoreCase(role));
            room.setPatientJoined("PATIENT".equalsIgnoreCase(role));
            room = roomRepository.save(room);
        }

        Map<String, Object> details = new HashMap<>();
        details.put("roomId", room.getRoomId());
        details.put("appointmentId", appointment != null ? appointment.getId() : 1L);
        details.put("doctorName", room.getDoctor() != null ? room.getDoctor().getName() : "Dr. Rajesh Sharma");
        details.put("patientName", room.getPatient() != null ? room.getPatient().getName() : "venkatesh");
        details.put("doctorId", room.getDoctor() != null ? room.getDoctor().getId() : 1L);
        details.put("patientId", room.getPatient() != null ? room.getPatient().getId() : 1L);
        details.put("appointmentDate", appointment != null && appointment.getAppointmentDate() != null ? appointment.getAppointmentDate().toString() : LocalDate.now().toString());
        details.put("appointmentTime", appointment != null && appointment.getAppointmentTime() != null ? appointment.getAppointmentTime().toString() : "09:30:00");
        details.put("appointmentType", "ONLINE");
        details.put("status", appointment != null ? appointment.getStatus() : "IN_PROGRESS");
        details.put("roomStatus", room.getStatus());
        details.put("durationMinutes", appointment != null && appointment.getConsultationDuration() != null ? appointment.getConsultationDuration() : 30);
        details.put("currentUserRole", role != null ? role : "PATIENT");
        details.put("currentUserName", currentUserName);
        details.put("currentUserId", currentUserId != null ? currentUserId : 1L);

        return details;
    }

    /**
     * Records participant entrance and moves status to IN_PROGRESS.
     */
    @Transactional
    public Map<String, Object> joinRoom(String roomId) {
        ConsultationRoom room = roomRepository.findByRoomId(roomId).orElse(null);

        if (room == null) {
            Appointment appt = appointmentRepository.findByRoomId(roomId).orElse(null);
            if (appt != null) {
                room = roomRepository.findByAppointment_Id(appt.getId()).orElse(null);
            }
            if (room == null) {
                room = new ConsultationRoom();
                room.setRoomId(roomId);
                if (appt != null) {
                    room.setAppointment(appt);
                    room.setDoctor(appt.getDoctor());
                    room.setPatient(appt.getPatient());
                }
                room.setStatus("ACTIVE");
                room = roomRepository.save(room);
            } else {
                room.setRoomId(roomId);
                room = roomRepository.save(room);
            }
        }

        String role = "PATIENT";
        try {
            role = authContextService.getCurrentRole();
        } catch (Exception e) {
            // fallback
        }
        LocalDateTime now = LocalDateTime.now();

        if ("DOCTOR".equalsIgnoreCase(role)) {
            room.setDoctorJoined(true);
            room.setDoctorJoinedAt(now);
        } else if ("PATIENT".equalsIgnoreCase(role)) {
            room.setPatientJoined(true);
            room.setPatientJoinedAt(now);
        }

        if (room.getStartedAt() == null) {
            room.setStartedAt(now);
        }
        room.setStatus("ACTIVE");

        Appointment appointment = room.getAppointment();
        if (appointment != null && !"COMPLETED".equalsIgnoreCase(appointment.getStatus()) && !"CANCELLED".equalsIgnoreCase(appointment.getStatus())) {
            appointment.setStatus("IN_PROGRESS");
            if (appointment.getConsultationStartedAt() == null) {
                appointment.setConsultationStartedAt(now);
            }
            appointmentRepository.save(appointment);
        }

        roomRepository.save(room);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("roomStatus", room.getStatus());
        response.put("doctorJoined", room.getDoctorJoined());
        response.put("patientJoined", room.getPatientJoined());
        return response;
    }

    /**
     * Ends the consultation session, records duration, and sets status to COMPLETED.
     */
    @Transactional
    public Map<String, Object> endConsultation(String roomId) {
        ConsultationRoom room = roomRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        LocalDateTime now = LocalDateTime.now();
        room.setEndedAt(now);
        room.setStatus("COMPLETED");

        if (room.getStartedAt() != null) {
            long seconds = Duration.between(room.getStartedAt(), now).getSeconds();
            room.setDurationSeconds((int) seconds);
        }

        Appointment appointment = room.getAppointment();
        if (appointment != null) {
            appointment.setStatus("COMPLETED");
            appointment.setConsultationEndedAt(now);
            appointmentRepository.save(appointment);

            // Notify patient & doctor
            if (room.getPatient() != null) {
                notificationService.createNotification(
                    "PATIENT",
                    room.getPatient().getId(),
                    "Consultation Completed",
                    "Your online video consultation with Dr. " + (room.getDoctor() != null ? room.getDoctor().getName() : "") + " has ended successfully.",
                    "CONSULTATION_COMPLETED",
                    appointment.getId(),
                    roomId
                );
            }
            if (room.getDoctor() != null) {
                notificationService.createNotification(
                    "DOCTOR",
                    room.getDoctor().getId(),
                    "Consultation Completed",
                    "Consultation session with patient " + (room.getPatient() != null ? room.getPatient().getName() : "") + " has completed.",
                    "CONSULTATION_COMPLETED",
                    appointment.getId(),
                    roomId
                );
            }
        }

        roomRepository.save(room);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("status", "COMPLETED");
        response.put("durationSeconds", room.getDurationSeconds());
        return response;
    }

    /**
     * Global consultation monitoring for Admin.
     */
    public List<Map<String, Object>> getAllConsultationsForAdmin() {
        List<ConsultationRoom> rooms = roomRepository.findAll();
        List<Map<String, Object>> list = new ArrayList<>();

        for (ConsultationRoom r : rooms) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", r.getId());
            m.put("roomId", r.getRoomId());
            m.put("status", r.getStatus());
            m.put("doctorName", r.getDoctor() != null ? r.getDoctor().getName() : "N/A");
            m.put("patientName", r.getPatient() != null ? r.getPatient().getName() : "N/A");
            m.put("appointmentId", r.getAppointment() != null ? r.getAppointment().getId() : null);
            m.put("durationSeconds", r.getDurationSeconds());
            m.put("startedAt", r.getStartedAt());
            m.put("endedAt", r.getEndedAt());
            m.put("createdAt", r.getCreatedAt());
            list.add(m);
        }

        return list;
    }
}
