package com.project.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "household_visits")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HouseholdVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "household_id")
    private Household household;

    private Long workerId;

    private String workerName;

    private String workerRole; // ASHA_WORKER, PHC_WORKER

    private String village;

    private String visitPurpose; // ROUTINE_SURVEY, ANC_FOLLOWUP, NCD_SCREENING, IMMUNIZATION_CHECK

    @Column(length = 1000)
    private String findingsSummary;

    private Boolean referralCreated;

    private String referralReason;

    @Column(nullable = false, updatable = false)
    private LocalDateTime visitDate;

    @PrePersist
    public void prePersist() {
        if (visitDate == null) {
            visitDate = LocalDateTime.now();
        }
        if (referralCreated == null) {
            referralCreated = false;
        }
    }
}
