package com.project.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.Data;

@Data
public class DoctorScheduleDTO {

    private Long id;
    private Long doctorId;
    private String doctorName;

    private LocalDate scheduleDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer slotDuration;
    private String consultationMode; // PHYSICAL, ONLINE, BOTH
    private Boolean isActive;

    private LocalDateTime uploadedAt;
    private Boolean cancellable;
}