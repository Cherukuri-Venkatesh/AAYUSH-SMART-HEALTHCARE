package com.project.controller;

import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.project.entity.*;
import com.project.repository.PatientRepository;
import com.project.service.PhcPlatformService;

@RestController
@RequestMapping("/api/phc-centers")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAnyAuthority('PHC_CENTER', 'ADMIN', 'DOCTOR')")
public class PhcCentersDashboardController {

    @Autowired
    private PhcPlatformService phcPlatformService;

    @Autowired
    private PatientRepository patientRepository;

    // --- 1. Dashboard KPIs ---
    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(phcPlatformService.getOverallPhcStatistics());
    }

    // --- 2. Patient Search & Assistance ---
    @GetMapping("/patients/search")
    public ResponseEntity<List<Patient>> searchPatients(@RequestParam(required = false, defaultValue = "") String query) {
        String trimmed = query.trim();
        if (trimmed.isEmpty()) {
            return ResponseEntity.ok(patientRepository.findAll());
        }
        return ResponseEntity.ok(patientRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(trimmed, trimmed));
    }

    @PostMapping("/patient-assistance/record")
    public ResponseEntity<PatientAssistance> recordAssistance(@RequestBody Map<String, Object> body) {
        Long patientId = body.get("patientId") != null ? Long.valueOf(body.get("patientId").toString()) : null;
        Long workerId = body.get("workerId") != null ? Long.valueOf(body.get("workerId").toString()) : 1L;
        String workerName = (String) body.get("workerName");
        String workerRole = (String) body.get("workerRole");
        Long phcCenterId = body.get("phcCenterId") != null ? Long.valueOf(body.get("phcCenterId").toString()) : null;
        String assistanceType = (String) body.get("assistanceType");
        String notes = (String) body.get("notes");

        PatientAssistance record = phcPlatformService.recordPatientAssistance(
                patientId, workerId, workerName, workerRole != null ? workerRole : "PHC_CENTER", phcCenterId, assistanceType, notes
        );
        return ResponseEntity.ok(record);
    }

    @GetMapping("/patient-assistance/history")
    public ResponseEntity<List<PatientAssistance>> getAssistanceHistory(@RequestParam(required = false) Long workerId) {
        return ResponseEntity.ok(phcPlatformService.getAssistanceHistoryByWorker(workerId));
    }

    // --- 3. Households ---
    @GetMapping("/households/all")
    public ResponseEntity<List<Household>> getAllHouseholds() {
        return ResponseEntity.ok(phcPlatformService.getAllHouseholds());
    }

    @PostMapping("/households/add")
    public ResponseEntity<Household> addHousehold(@RequestBody Household household,
                                                  @RequestParam(required = false) Long phcCenterId) {
        return ResponseEntity.ok(phcPlatformService.saveHousehold(household, phcCenterId));
    }

    // --- 4. Household Visits ---
    @PostMapping("/household-visits/record")
    public ResponseEntity<HouseholdVisit> recordVisit(@RequestBody HouseholdVisit visit,
                                                      @RequestParam(required = false) Long householdId) {
        return ResponseEntity.ok(phcPlatformService.recordHouseholdVisit(visit, householdId));
    }

    @GetMapping("/household-visits/history")
    public ResponseEntity<List<HouseholdVisit>> getVisitHistory(@RequestParam(required = false) Long workerId) {
        return ResponseEntity.ok(phcPlatformService.getVisitsByWorker(workerId));
    }

    // --- 5. Community Surveys ---
    @PostMapping("/community-surveys/record")
    public ResponseEntity<CommunitySurvey> recordSurvey(@RequestBody CommunitySurvey survey,
                                                        @RequestParam(required = false) Long householdId) {
        return ResponseEntity.ok(phcPlatformService.recordCommunitySurvey(survey, householdId));
    }

    @GetMapping("/community-surveys/all")
    public ResponseEntity<List<CommunitySurvey>> getAllSurveys() {
        return ResponseEntity.ok(phcPlatformService.getAllCommunitySurveys());
    }
}
