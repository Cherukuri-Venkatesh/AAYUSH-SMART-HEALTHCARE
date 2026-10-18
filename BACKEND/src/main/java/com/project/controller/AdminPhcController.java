package com.project.controller;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.project.entity.*;
import com.project.service.PhcPlatformService;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminPhcController {

    @Autowired
    private PhcPlatformService phcPlatformService;

    // --- PHC Centers ---
    @PostMapping("/phc-centers/add")
    public ResponseEntity<PhcCenter> addPhcCenter(@RequestBody PhcCenter phcCenter) {
        return ResponseEntity.ok(phcPlatformService.savePhcCenter(phcCenter));
    }

    @GetMapping("/phc-centers/all")
    public ResponseEntity<List<PhcCenter>> getAllPhcCenters() {
        return ResponseEntity.ok(phcPlatformService.getAllPhcCenters());
    }

    @DeleteMapping("/phc-centers/delete/{id}")
    public ResponseEntity<Map<String, String>> deletePhcCenter(@PathVariable Long id) {
        phcPlatformService.deletePhcCenter(id);
        return ResponseEntity.ok(Map.of("message", "PHC Center deleted successfully"));
    }

    // --- Analytics ---
    @GetMapping("/community/statistics")
    public ResponseEntity<Map<String, Object>> getCommunityStatistics() {
        return ResponseEntity.ok(phcPlatformService.getOverallPhcStatistics());
    }
}
