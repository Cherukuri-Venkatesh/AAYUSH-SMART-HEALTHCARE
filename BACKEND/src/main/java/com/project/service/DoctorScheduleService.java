package com.project.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.project.dto.DoctorScheduleDTO;
import com.project.entity.Admindoctor;
import com.project.entity.Appointment;
import com.project.entity.DoctorSchedule;
import com.project.repository.AdminRepository;
import com.project.repository.AppointmentRepository;
import com.project.repository.DoctorScheduleRepository;
import com.project.security.AuthContextService;

@Service
public class DoctorScheduleService {

    @Autowired
    private DoctorScheduleRepository scheduleRepository;

    @Autowired
    private AdminRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private AuthContextService authContextService;

    private DoctorScheduleDTO toDTO(DoctorSchedule schedule) {
        DoctorScheduleDTO dto = new DoctorScheduleDTO();
        dto.setId(schedule.getId());
        dto.setScheduleDate(schedule.getScheduleDate());
        dto.setStartTime(schedule.getStartTime());
        dto.setEndTime(schedule.getEndTime());
        dto.setSlotDuration(schedule.getSlotDuration());
        dto.setConsultationMode(schedule.getConsultationMode() != null ? schedule.getConsultationMode() : "BOTH");
        dto.setIsActive(schedule.getIsActive() != null ? schedule.getIsActive() : true);
        dto.setUploadedAt(schedule.getUploadedAt());

        if (schedule.getDoctor() != null) {
            dto.setDoctorId(schedule.getDoctor().getId());
            dto.setDoctorName(schedule.getDoctor().getName());
        }

        boolean canCancel = schedule.getUploadedAt() != null
                && !LocalDateTime.now().isAfter(schedule.getUploadedAt().plusHours(12));

        dto.setCancellable(canCancel);
        return dto;
    }

    public DoctorScheduleDTO addSchedule(Long doctorId,
                                         LocalDate scheduleDate,
                                         LocalTime startTime,
                                         LocalTime endTime,
                                         Integer slotDuration,
                                         String consultationMode) {

        Long effectiveDoctorId = authContextService.resolveDoctorId(doctorId);

        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(6);

        if (scheduleDate.isBefore(today) || scheduleDate.isAfter(maxDate)) {
            throw new RuntimeException("Schedule can only be added for next 7 days");
        }

        if (scheduleRepository.existsByDoctor_IdAndScheduleDate(effectiveDoctorId, scheduleDate)) {
            throw new RuntimeException("Schedule already exists for this date");
        }

        if (!startTime.isBefore(endTime)) {
            throw new RuntimeException("Start time must be before end time");
        }

        Admindoctor doctor = doctorRepository.findById(effectiveDoctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setDoctor(doctor);
        schedule.setScheduleDate(scheduleDate);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setSlotDuration(slotDuration != null ? slotDuration : 30);
        schedule.setConsultationMode(consultationMode != null && !consultationMode.trim().isEmpty() ? consultationMode.toUpperCase() : "BOTH");
        schedule.setIsActive(true);

        DoctorSchedule saved = scheduleRepository.save(schedule);
        return toDTO(saved);
    }

    public DoctorScheduleDTO addSchedule(Long doctorId,
                                         LocalDate scheduleDate,
                                         LocalTime startTime,
                                         LocalTime endTime,
                                         Integer slotDuration) {
        return addSchedule(doctorId, scheduleDate, startTime, endTime, slotDuration, "BOTH");
    }

    public List<DoctorScheduleDTO> getDoctorSchedule(Long doctorId) {
        Long effectiveDoctorId = doctorId;

        if (authContextService.isDoctor()) {
            effectiveDoctorId = authContextService.getCurrentDoctorId();
        }

        return scheduleRepository.findByDoctor_Id(effectiveDoctorId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<LocalTime> getAvailableSlots(Long doctorId, LocalDate date, String mode) {
        Long effectiveDoctorId = doctorId;

        if (authContextService.isDoctor()) {
            effectiveDoctorId = authContextService.getCurrentDoctorId();
        }

        List<DoctorSchedule> schedules =
                scheduleRepository.findByDoctor_IdAndScheduleDate(effectiveDoctorId, date);

        if (schedules.isEmpty()) {
            return new ArrayList<>();
        }

        DoctorSchedule schedule = schedules.get(0);

        // Check if schedule matches requested consultation mode
        if (mode != null && !mode.trim().isEmpty() && !"ALL".equalsIgnoreCase(mode)) {
            String schMode = schedule.getConsultationMode() != null ? schedule.getConsultationMode() : "BOTH";
            if (!"BOTH".equalsIgnoreCase(schMode) && !schMode.equalsIgnoreCase(mode)) {
                return new ArrayList<>(); // Mode mismatch
            }
        }

        LocalTime start = schedule.getStartTime();
        LocalTime end = schedule.getEndTime();

        int duration = schedule.getSlotDuration() != null ? schedule.getSlotDuration() : 30;

        List<LocalTime> slots = new ArrayList<>();
        LocalTime current = start;

        while (!current.plusMinutes(duration).isAfter(end)) {
            slots.add(current);
            current = current.plusMinutes(duration);
        }

        if (date.equals(LocalDate.now())) {
            LocalTime now = LocalTime.now();
            slots.removeIf(time -> time.isBefore(now));
        }

        List<Appointment> blockedAppointments =
                appointmentRepository.findByDoctor_IdAndAppointmentDateAndStatusNot(
                    effectiveDoctorId, date, "CANCELLED"
                );

        for (Appointment appointment : blockedAppointments) {
            slots.remove(appointment.getAppointmentTime());
        }

        return slots;
    }

    public List<LocalTime> getAvailableSlots(Long doctorId, LocalDate date) {
        return getAvailableSlots(doctorId, date, "ALL");
    }

    public DoctorScheduleDTO updateSchedule(Long scheduleId,
                                            LocalTime startTime,
                                            LocalTime endTime,
                                            Integer slotDuration,
                                            String consultationMode) {

        DoctorSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (authContextService.isDoctor()) {
            Long doctorId = authContextService.getCurrentDoctorId();
            if (!schedule.getDoctor().getId().equals(doctorId)) {
                throw new RuntimeException("Unauthorized");
            }
        }

        boolean hasAppointments =
                appointmentRepository.existsByDoctor_IdAndAppointmentDateAndStatusNot(
                        schedule.getDoctor().getId(),
                        schedule.getScheduleDate(),
                        "CANCELLED"
                );

        if (hasAppointments) {
            throw new RuntimeException("Cannot update schedule. Appointments already booked.");
        }

        if (!startTime.isBefore(endTime)) {
            throw new RuntimeException("Start time must be before end time");
        }

        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setSlotDuration(slotDuration != null ? slotDuration : 30);
        if (consultationMode != null && !consultationMode.trim().isEmpty()) {
            schedule.setConsultationMode(consultationMode.toUpperCase());
        }

        DoctorSchedule updated = scheduleRepository.save(schedule);
        return toDTO(updated);
    }

    public DoctorScheduleDTO updateSchedule(Long scheduleId,
                                            LocalTime startTime,
                                            LocalTime endTime,
                                            Integer slotDuration) {
        return updateSchedule(scheduleId, startTime, endTime, slotDuration, null);
    }

    public String deleteSchedule(Long scheduleId) {
        DoctorSchedule schedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new RuntimeException("Schedule not found"));

        if (authContextService.isDoctor()) {
            Long doctorId = authContextService.getCurrentDoctorId();
            if (!schedule.getDoctor().getId().equals(doctorId)) {
                throw new RuntimeException("Unauthorized");
            }
        }

        if (schedule.getUploadedAt() == null) {
            throw new RuntimeException("Cannot verify upload time for this schedule.");
        }

        if (LocalDateTime.now().isAfter(schedule.getUploadedAt().plusHours(12))) {
            throw new RuntimeException("Schedule can be cancelled only within 12 hours of upload.");
        }

        boolean hasAppointments =
                appointmentRepository.existsByDoctor_IdAndAppointmentDateAndStatusNot(
                        schedule.getDoctor().getId(),
                        schedule.getScheduleDate(),
                        "CANCELLED"
                );

        if (hasAppointments) {
            throw new RuntimeException("Cannot cancel schedule. Appointments already booked.");
        }

        scheduleRepository.delete(schedule);
        return "Schedule cancelled successfully";
    }
}