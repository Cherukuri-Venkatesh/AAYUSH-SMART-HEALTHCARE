package com.project.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.project.entity.PhcCenter;

@Repository
public interface PhcCenterRepository extends JpaRepository<PhcCenter, Long> {
    Optional<PhcCenter> findByPhcCode(String phcCode);
    List<PhcCenter> findByDistrictIgnoreCase(String district);
    List<PhcCenter> findByMandalBlockIgnoreCase(String mandalBlock);
    boolean existsByPhcCode(String phcCode);
}
