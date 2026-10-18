package com.project.entity;

import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "households")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Household {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String headName;

    private String phone;

    private String address;

    private String village;

    private String mandalBlock;

    private String district;

    private Integer totalMembers;

    private Integer pregnantWomen;

    private Integer childrenUnderFive;

    private Integer elderlyMembers;

    private String waterSource;

    private String sanitationFacility;

    private String rationCardType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "phc_center_id")
    private PhcCenter phcCenter;

    @OneToMany(mappedBy = "household", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<HouseholdVisit> visits;

    @Column(nullable = false, updatable = false)
    private LocalDateTime registeredAt;

    @PrePersist
    public void prePersist() {
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }
}
