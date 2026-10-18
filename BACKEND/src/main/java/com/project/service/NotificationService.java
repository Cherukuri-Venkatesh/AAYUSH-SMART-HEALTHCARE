package com.project.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.project.entity.Notification;
import com.project.repository.NotificationRepository;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification createNotification(String recipientType, Long recipientId, String title, String message, String type, Long appointmentId, String roomId) {
        Notification notification = new Notification();
        notification.setRecipientType(recipientType);
        notification.setRecipientId(recipientId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setAppointmentId(appointmentId);
        notification.setRoomId(roomId);
        notification.setIsRead(false);
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotifications(String recipientType, Long recipientId) {
        return notificationRepository.findByRecipientTypeAndRecipientIdOrderByCreatedAtDesc(recipientType, recipientId);
    }

    public List<Notification> getUnreadNotifications(String recipientType, Long recipientId) {
        return notificationRepository.findByRecipientTypeAndRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientType, recipientId);
    }

    public long getUnreadCount(String recipientType, Long recipientId) {
        return notificationRepository.countByRecipientTypeAndRecipientIdAndIsReadFalse(recipientType, recipientId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(String recipientType, Long recipientId) {
        List<Notification> unread = notificationRepository.findByRecipientTypeAndRecipientIdAndIsReadFalseOrderByCreatedAtDesc(recipientType, recipientId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}
