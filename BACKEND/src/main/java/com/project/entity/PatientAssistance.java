package com.project.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "patient_assistance_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientAssistance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    private Long workerId;

    private String workerName;

    private String workerRole; // PHC_CENTER

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "phc_center_id")
    private PhcCenter phcCenter;

    private String assistanceType; // ACCOUNT_CREATION, PHC_GUIDANCE, OPD_VISIT, REFERRAL_ASSISTANCE, VITALS_SCREENING

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime assistedAt;

    @PrePersist
    public void prePersist() {
        if (assistedAt == null) {
            assistedAt = LocalDateTime.now();
        }
    }
}
