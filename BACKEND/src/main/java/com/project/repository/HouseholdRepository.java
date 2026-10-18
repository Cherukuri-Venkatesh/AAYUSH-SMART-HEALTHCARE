package com.project.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.project.entity.Household;

@Repository
public interface HouseholdRepository extends JpaRepository<Household, Long> {
    List<Household> findByPhcCenterIdOrderByRegisteredAtDesc(Long phcCenterId);
    List<Household> findByVillageIgnoreCase(String village);
    long countByPhcCenterId(Long phcCenterId);
    long countByVillageIgnoreCase(String village);
}
