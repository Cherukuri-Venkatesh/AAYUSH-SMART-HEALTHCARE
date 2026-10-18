package com.project.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "consultation_rooms", indexes = {
    @Index(name = "idx_room_id", columnList = "roomId", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ConsultationRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String roomId;

    @OneToOne
    @JoinColumn(name = "appointment_id", unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Appointment appointment;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    @OnDelete(action = OnDeleteAction.SET_NULL)
    private Admindoctor doctor;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Patient patient;

    @Column(nullable = false, length = 20)
    private String status = "WAITING"; // WAITING, ACTIVE, COMPLETED, EXPIRED

    private Boolean doctorJoined = false;

    private Boolean patientJoined = false;

    private LocalDateTime doctorJoinedAt;

    private LocalDateTime patientJoinedAt;

    private LocalDateTime startedAt;

    private LocalDateTime endedAt;

    private Integer durationSeconds;

    @Column(nullable = false, updatable = false)
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
        if (status == null) {
            status = "WAITING";
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
