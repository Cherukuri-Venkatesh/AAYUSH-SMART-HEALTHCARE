package com.project.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.project.entity.Admindoctor;
import com.project.entity.LoginUser;
import com.project.entity.LoginUserId;
import com.project.entity.Patient;
import com.project.entity.PhcCenter;
import com.project.repository.AdminRepository;
import com.project.repository.LoginUserRepository;
import com.project.repository.PatientRepository;
import com.project.repository.PhcCenterRepository;

@Service
public class LoginUserService {

    private static final Logger logger = LoggerFactory.getLogger(LoginUserService.class);

    @Autowired
    private LoginUserRepository loginUserRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PhcCenterRepository phcCenterRepository;

    public void upsert(Long id, String name, String email, String password, String role) {
        if (id == null) {
            throw new RuntimeException("ID is required");
        }

        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        if (password == null || password.trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        String normalizedRole = role == null ? "" : role.trim().toUpperCase();

        LoginUserId loginUserId = new LoginUserId(id, normalizedRole);

        // Prevent reusing an email already mapped to another account/role.
        loginUserRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(existingUser -> {
            boolean isSameAccount = existingUser.getId().equals(id)
                    && existingUser.getRole().equalsIgnoreCase(normalizedRole);
            if (!isSameAccount) {
                loginUserRepository.delete(existingUser);
            }
        });

        LoginUser loginUser = loginUserRepository.findById(loginUserId)
            .orElseGet(LoginUser::new);

        loginUser.setId(id);
        loginUser.setName(name);
        loginUser.setEmail(normalizedEmail);
        loginUser.setPassword(password.trim());
        loginUser.setRole(normalizedRole);

        loginUserRepository.save(loginUser);
    }

    public void upsertDoctor(Admindoctor doctor) {
        if (doctor == null) {
            return;
        }
        upsert(doctor.getId(), doctor.getName(), doctor.getEmail(), doctor.getPassword(), doctor.getRole());
    }

    public void upsertPatient(Patient patient) {
        if (patient == null) {
            return;
        }
        upsert(patient.getId(), patient.getName(), patient.getEmail(), patient.getPassword(), "PATIENT");
    }

    public void upsertPhcCenter(PhcCenter phcCenter) {
        if (phcCenter == null) {
            return;
        }
        String password = phcCenter.getPassword() != null && !phcCenter.getPassword().trim().isEmpty()
                ? phcCenter.getPassword().trim()
                : "phc123";
        upsert(phcCenter.getId(), phcCenter.getName(), phcCenter.getEmail(), password, "PHC_CENTER");
    }

    public void deleteByEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return;
        }

        loginUserRepository.findByEmailIgnoreCase(email.trim())
                .ifPresent(loginUserRepository::delete);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncAllUsersOnStartup() {
        // 0. Ensure Admin Account Exists
        try {
            upsert(1L, "Aayush Admin", "aayushhealthcare2026@gmail.com", "123456", "ADMIN");
            upsert(2L, "System Admin", "admin@gmail.com", "123456", "ADMIN");
        } catch (Exception ex) {
            logger.warn("Admin sync notice: {}", ex.getMessage());
        }

        // 1. Sync Doctors
        adminRepository.findAll().stream()
                .filter(doctor -> doctor != null && "DOCTOR".equalsIgnoreCase(doctor.getRole()))
                .forEach(doctor -> {
                    try {
                        upsertDoctor(doctor);
                    } catch (RuntimeException ex) {
                        logger.warn("Skipped doctor login sync for email {}: {}", doctor.getEmail(), ex.getMessage());
                    }
                });

        // 2. Sync Patients
        patientRepository.findAll().forEach(patient -> {
            try {
                upsertPatient(patient);
            } catch (RuntimeException ex) {
                logger.warn("Skipped patient login sync for email {}: {}", patient.getEmail(), ex.getMessage());
            }
        });

        // 3. Sync PHC Centers with role PHC_CENTER
        phcCenterRepository.findAll().forEach(phc -> {
            try {
                if (phc.getEmail() != null && !phc.getEmail().trim().isEmpty()) {
                    upsertPhcCenter(phc);
                }
            } catch (RuntimeException ex) {
                logger.warn("Skipped PHC Center login sync for email {}: {}", phc.getEmail(), ex.getMessage());
            }
        });
    }
}
