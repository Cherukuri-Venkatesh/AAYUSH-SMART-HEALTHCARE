package com.project.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.project.entity.CommunitySurvey;

@Repository
public interface CommunitySurveyRepository extends JpaRepository<CommunitySurvey, Long> {
    List<CommunitySurvey> findByHouseholdIdOrderBySurveyedAtDesc(Long householdId);
    List<CommunitySurvey> findByWorkerIdOrderBySurveyedAtDesc(Long workerId);
    List<CommunitySurvey> findByVillageIgnoreCase(String village);
    List<CommunitySurvey> findByDistrictIgnoreCase(String district);
    long countByVillageIgnoreCase(String village);
    long countByDistrictIgnoreCase(String district);
}
