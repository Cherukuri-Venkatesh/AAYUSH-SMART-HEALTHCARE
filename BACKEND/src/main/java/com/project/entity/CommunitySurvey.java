package com.project.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "community_surveys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunitySurvey {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "household_id")
    private Household household;

    private Long workerId;

    private String workerRole;

    private String village;

    private String mandalBlock;

    private String district;

    // Public health screening indicators
    private Integer totalSurveyedPersons;

    private Boolean hasHypertensionSuspect;

    private Boolean hasDiabetesSuspect;

    private Boolean hasPregnantWoman;

    private Boolean isAncUpToDate;

    private Boolean hasImmunizationPending;

    private Boolean hasCommunicableSymptoms; // Fever / Cough / Rash

    private Boolean referralRecommended;

    @Column(length = 1000)
    private String workerRemarks;

    @Column(nullable = false, updatable = false)
    private LocalDateTime surveyedAt;

    @PrePersist
    public void prePersist() {
        if (surveyedAt == null) {
            surveyedAt = LocalDateTime.now();
        }
    }
}
