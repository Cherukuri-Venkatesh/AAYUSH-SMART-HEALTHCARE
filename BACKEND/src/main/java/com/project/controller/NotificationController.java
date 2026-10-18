package com.project.controller;

import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.project.entity.Notification;
import com.project.security.AuthContextService;
import com.project.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private AuthContextService authContextService;

    @GetMapping({"", "/", "/my"})
    public Map<String, Object> getMyNotifications() {
        String role = authContextService.getCurrentRole();
        Long userId = null;

        if ("PATIENT".equals(role)) {
            userId = authContextService.getCurrentPatientId();
        } else if ("DOCTOR".equals(role)) {
            userId = authContextService.getCurrentDoctorId();
        } else {
            userId = 1L; // Admin
        }

        List<Notification> list = notificationService.getNotifications(role, userId);
        long unreadCount = notificationService.getUnreadCount(role, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("notifications", list);
        response.put("unreadCount", unreadCount);
        return response;
    }

    @PutMapping("/{id}/read")
    public Map<String, Object> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return response;
    }

    @PutMapping("/read-all")
    public Map<String, Object> markAllAsRead() {
        String role = authContextService.getCurrentRole();
        Long userId = null;

        if ("PATIENT".equals(role)) {
            userId = authContextService.getCurrentPatientId();
        } else if ("DOCTOR".equals(role)) {
            userId = authContextService.getCurrentDoctorId();
        } else {
            userId = 1L;
        }

        notificationService.markAllAsRead(role, userId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return response;
    }
}
