package com.project.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.project.entity.PatientAssistance;

@Repository
public interface PatientAssistanceRepository extends JpaRepository<PatientAssistance, Long> {
    List<PatientAssistance> findByWorkerIdOrderByAssistedAtDesc(Long workerId);
    List<PatientAssistance> findByPhcCenterIdOrderByAssistedAtDesc(Long phcCenterId);
    List<PatientAssistance> findByPatientIdOrderByAssistedAtDesc(Long patientId);
    long countByPhcCenterId(Long phcCenterId);
    long countByWorkerId(Long workerId);
}
