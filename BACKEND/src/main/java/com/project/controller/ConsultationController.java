package com.project.controller;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.project.service.ConsultationService;

@RestController
@RequestMapping("/api/consultation")
@CrossOrigin(origins = "*")
public class ConsultationController {

    @Autowired
    private ConsultationService consultationService;

    @GetMapping("/room/{roomId}/validate")
    public Map<String, Object> validateRoom(@PathVariable String roomId) {
        Map<String, Object> details = consultationService.validateRoomAccess(roomId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", details);
        return response;
    }

    @PostMapping("/room/{roomId}/join")
    public Map<String, Object> joinRoom(@PathVariable String roomId) {
        return consultationService.joinRoom(roomId);
    }

    @PostMapping("/room/{roomId}/end")
    public Map<String, Object> endConsultation(@PathVariable String roomId) {
        return consultationService.endConsultation(roomId);
    }

    @GetMapping("/admin/all")
    public Map<String, Object> getAdminConsultations() {
        List<Map<String, Object>> consultations = consultationService.getAllConsultationsForAdmin();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("consultations", consultations);
        return response;
    }
}
