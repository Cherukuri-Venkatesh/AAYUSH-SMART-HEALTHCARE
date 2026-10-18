package com.project.service;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.entity.*;
import com.project.repository.*;

@Service
public class PhcPlatformService {

    @Autowired
    private PhcCenterRepository phcCenterRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private PatientAssistanceRepository patientAssistanceRepository;

    @Autowired
    private HouseholdRepository householdRepository;

    @Autowired
    private HouseholdVisitRepository householdVisitRepository;

    @Autowired
    private CommunitySurveyRepository communitySurveyRepository;

    @Autowired
    private LoginUserService loginUserService;

    // ==========================================
    // 1. PHC CENTER MANAGEMENT (ADMIN & ROLE PHC_CENTER)
    // ==========================================
    @Transactional
    public PhcCenter savePhcCenter(PhcCenter phcCenter) {
        if (phcCenter.getPhcCode() == null || phcCenter.getPhcCode().trim().isEmpty()) {
            String prefix = "PHC";
            if (phcCenter.getDistrict() != null && !phcCenter.getDistrict().trim().isEmpty()) {
                prefix = phcCenter.getDistrict().trim().replaceAll("[^a-zA-Z]", "").toUpperCase();
                prefix = prefix.length() >= 3 ? prefix.substring(0, 3) : "PHC";
            }
            String autoCode;
            do {
                autoCode = "PHC-" + prefix + "-" + (1000 + new Random().nextInt(9000));
            } while (phcCenterRepository.existsByPhcCode(autoCode));
            phcCenter.setPhcCode(autoCode);
        } else if (phcCenter.getId() == null && phcCenterRepository.existsByPhcCode(phcCenter.getPhcCode().trim())) {
            throw new RuntimeException("PHC Code already exists: " + phcCenter.getPhcCode());
        }

        if (phcCenter.getOperatingStatus() == null) {
            phcCenter.setOperatingStatus("ACTIVE");
        }
        if (phcCenter.getEmergencyAvailability() == null) {
            phcCenter.setEmergencyAvailability(true);
        }
        if (phcCenter.getRole() == null || phcCenter.getRole().trim().isEmpty()) {
            phcCenter.setRole("PHC_CENTER");
        }
        if (phcCenter.getPassword() == null || phcCenter.getPassword().trim().isEmpty()) {
            phcCenter.setPassword("phc123");
        }

        PhcCenter saved = phcCenterRepository.save(phcCenter);

        if (saved.getEmail() != null && !saved.getEmail().trim().isEmpty()) {
            loginUserService.upsertPhcCenter(saved);
        }

        return saved;
    }

    public List<PhcCenter> getAllPhcCenters() {
        return phcCenterRepository.findAll();
    }

    public PhcCenter getPhcCenterById(Long id) {
        return phcCenterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PHC Center not found with ID: " + id));
    }

    @Transactional
    public void deletePhcCenter(Long id) {
        PhcCenter phc = phcCenterRepository.findById(id).orElse(null);
        if (phc != null) {
            if (phc.getEmail() != null) {
                loginUserService.deleteByEmail(phc.getEmail());
            }
            phcCenterRepository.delete(phc);
        }
    }

    // ==========================================
    // 2. PATIENT ASSISTANCE & REGISTRATION (PHC CENTERS)
    // ==========================================
    @Transactional
    public PatientAssistance recordPatientAssistance(Long patientId, Long workerId, String workerName, String workerRole, Long phcCenterId, String assistanceType, String notes) {
        Patient patient = null;
        if (patientId != null) {
            patient = patientRepository.findById(patientId).orElse(null);
        }
        PhcCenter phcCenter = null;
        if (phcCenterId != null) {
            phcCenter = phcCenterRepository.findById(phcCenterId).orElse(null);
        }

        PatientAssistance record = PatientAssistance.builder()
                .patient(patient)
                .workerId(workerId != null ? workerId : 1L)
                .workerName(workerName != null ? workerName : "PHC Center Team")
                .workerRole("PHC_CENTER")
                .phcCenter(phcCenter)
                .assistanceType(assistanceType != null ? assistanceType : "PATIENT_GUIDANCE")
                .notes(notes)
                .build();

        return patientAssistanceRepository.save(record);
    }

    public List<PatientAssistance> getAssistanceHistoryByWorker(Long workerId) {
        if (workerId == null) {
            return patientAssistanceRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "assistedAt"));
        }
        List<PatientAssistance> list = patientAssistanceRepository.findByWorkerIdOrderByAssistedAtDesc(workerId);
        if (list.isEmpty()) {
            return patientAssistanceRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "assistedAt"));
        }
        return list;
    }

    // ==========================================
    // 3. HOUSEHOLD MANAGEMENT & FIELD VISITS
    // ==========================================
    @Transactional
    public Household saveHousehold(Household household, Long phcCenterId) {
        if (phcCenterId != null) {
            phcCenterRepository.findById(phcCenterId).ifPresent(household::setPhcCenter);
        }
        return householdRepository.save(household);
    }

    public List<Household> getAllHouseholds() {
        return householdRepository.findAll();
    }

    @Transactional
    public HouseholdVisit recordHouseholdVisit(HouseholdVisit visit, Long householdId) {
        if (householdId != null) {
            householdRepository.findById(householdId).ifPresent(visit::setHousehold);
        }
        if (visit.getWorkerRole() == null || visit.getWorkerRole().trim().isEmpty()) {
            visit.setWorkerRole("PHC_CENTER");
        }
        return householdVisitRepository.save(visit);
    }

    public List<HouseholdVisit> getVisitsByWorker(Long workerId) {
        if (workerId == null) {
            return householdVisitRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "visitDate"));
        }
        List<HouseholdVisit> list = householdVisitRepository.findByWorkerIdOrderByVisitDateDesc(workerId);
        if (list.isEmpty()) {
            return householdVisitRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "visitDate"));
        }
        return list;
    }

    @Transactional
    public CommunitySurvey recordCommunitySurvey(CommunitySurvey survey, Long householdId) {
        if (householdId != null) {
            householdRepository.findById(householdId).ifPresent(survey::setHousehold);
        }
        if (survey.getWorkerRole() == null || survey.getWorkerRole().trim().isEmpty()) {
            survey.setWorkerRole("PHC_CENTER");
        }
        return communitySurveyRepository.save(survey);
    }

    public List<CommunitySurvey> getAllCommunitySurveys() {
        return communitySurveyRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "surveyedAt"));
    }

    // ==========================================
    // 4. MULTI-LEVEL AGGREGATED STATISTICS
    // ==========================================
    public Map<String, Object> getOverallPhcStatistics() {
        Map<String, Object> stats = new HashMap<>();
        long phcCount = phcCenterRepository.count();
        long hhCount = householdRepository.count();
        long visitCount = householdVisitRepository.count();
        long surveyCount = communitySurveyRepository.count();
        long assistCount = patientAssistanceRepository.count();

        stats.put("totalPhcCenters", phcCount);
        stats.put("totalHouseholdsVisited", hhCount);
        stats.put("totalFieldVisits", visitCount);
        stats.put("totalCommunitySurveys", surveyCount);
        stats.put("totalPatientsAssisted", assistCount);

        // Demographic & population telemetry from real households
        List<Household> households = householdRepository.findAll();
        long totalPop = households.stream().mapToInt(h -> h.getTotalMembers() != null ? h.getTotalMembers() : 0).sum();
        long pregnantCount = households.stream().mapToInt(h -> h.getPregnantWomen() != null ? h.getPregnantWomen() : 0).sum();
        long under5Count = households.stream().mapToInt(h -> h.getChildrenUnderFive() != null ? h.getChildrenUnderFive() : 0).sum();
        long elderlyCount = households.stream().mapToInt(h -> h.getElderlyMembers() != null ? h.getElderlyMembers() : 0).sum();

        // Clinical screening from real surveys
        List<CommunitySurvey> surveys = communitySurveyRepository.findAll();
        long htCount = surveys.stream().filter(s -> Boolean.TRUE.equals(s.getHasHypertensionSuspect())).count();
        long dbCount = surveys.stream().filter(s -> Boolean.TRUE.equals(s.getHasDiabetesSuspect())).count();
        long immPendingCount = surveys.stream().filter(s -> Boolean.TRUE.equals(s.getHasImmunizationPending())).count();
        long communicableCount = surveys.stream().filter(s -> Boolean.TRUE.equals(s.getHasCommunicableSymptoms())).count();
        long refCount = surveys.stream().filter(s -> Boolean.TRUE.equals(s.getReferralRecommended())).count();
        long highRiskAncCount = surveys.stream().filter(s -> Boolean.TRUE.equals(s.getHasPregnantWoman()) && Boolean.FALSE.equals(s.getIsAncUpToDate())).count();

        // Computed rates
        double immunizationCoveragePct = under5Count > 0
                ? Math.max(0, Math.min(100, Math.round(((double)(under5Count - immPendingCount) / under5Count) * 1000.0) / 10.0))
                : 100.0;

        stats.put("totalPopulationCovered", totalPop);
        stats.put("pregnantMothersCount", pregnantCount);
        stats.put("highRiskAncCount", highRiskAncCount);
        stats.put("under5ChildrenCount", under5Count);
        stats.put("elderlyCount", elderlyCount);
        stats.put("hypertensionSuspects", htCount);
        stats.put("diabetesSuspects", dbCount);
        stats.put("immunizationPending", immPendingCount);
        stats.put("immunizationCoveragePct", immunizationCoveragePct);
        stats.put("communicableSymptomCount", communicableCount);
        stats.put("referralsRecommended", refCount);

        // Recent real-time activity feeds
        List<HouseholdVisit> recentVisits = householdVisitRepository.findAll(
                org.springframework.data.domain.PageRequest.of(0, 6, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "visitDate"))
        ).getContent();
        stats.put("recentVisits", recentVisits);

        List<CommunitySurvey> recentSurveys = communitySurveyRepository.findAll(
                org.springframework.data.domain.PageRequest.of(0, 6, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "surveyedAt"))
        ).getContent();
        stats.put("recentSurveys", recentSurveys);

        return stats;
    }
}
