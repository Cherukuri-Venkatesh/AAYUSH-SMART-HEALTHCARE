package com.project.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.project.entity.HouseholdVisit;

@Repository
public interface HouseholdVisitRepository extends JpaRepository<HouseholdVisit, Long> {
    List<HouseholdVisit> findByHouseholdIdOrderByVisitDateDesc(Long householdId);
    List<HouseholdVisit> findByWorkerIdOrderByVisitDateDesc(Long workerId);
    List<HouseholdVisit> findByVillageIgnoreCase(String village);
    long countByWorkerId(Long workerId);
}
