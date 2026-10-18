package com.project.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many Appointments → One Patient
    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;

    // Many Appointments → One Doctor
    // SET NULL when doctor is deleted - keep appointment history for patient records
    @ManyToOne
    @JoinColumn(name = "doctor_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Admindoctor doctor;

    private Integer age;

    private Double weight;

    @Column(length = 1000)
    private String issue;

    private LocalDate appointmentDate;

    private LocalTime appointmentTime;

    private String status;

    private Integer consultingFees;

    private String prescriptionPath;

    private String labReportPath;

    @Enumerated(EnumType.STRING)
    private PaymentType paymentType;

    // ==========================================
    // EXTENDED ATTRIBUTES: ONLINE & CONSULTATION
    // ==========================================

    @Column(nullable = false, length = 20)
    private String appointmentType = "PHYSICAL"; // PHYSICAL or ONLINE

    @Column(length = 100)
    private String roomId; // Unique UUID for WebRTC Video Room

    private Integer consultationDuration = 30; // Minutes

    private LocalDateTime consultationStartedAt;

    private LocalDateTime consultationEndedAt;

    private Integer rescheduleCount = 0;

    @Column(length = 500)
    private String cancellationReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (appointmentType == null || appointmentType.trim().isEmpty()) {
            appointmentType = "PHYSICAL";
        }
        if (rescheduleCount == null) {
            rescheduleCount = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}