package com.project.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "phc_centers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PhcCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String phcCode;

    private String address;

    private String village;

    private String mandalBlock;

    private String district;

    private String state;

    private String pincode;

    private String contactNumber;

    @Column(unique = true)
    private String email;

    private String password;

    private String role; // PHC_CENTER

    private Double latitude;

    private Double longitude;

    private String operatingStatus; // ACTIVE, INACTIVE

    private Boolean emergencyAvailability; // true, false

    @PrePersist
    public void prePersist() {
        if (role == null) {
            role = "PHC_CENTER";
        }
        if (operatingStatus == null) {
            operatingStatus = "ACTIVE";
        }
        if (emergencyAvailability == null) {
            emergencyAvailability = true;
        }
        if (password == null || password.trim().isEmpty()) {
            password = "phc123";
        }
    }
}
