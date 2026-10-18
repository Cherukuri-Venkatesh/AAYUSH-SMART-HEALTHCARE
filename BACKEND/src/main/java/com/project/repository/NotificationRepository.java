package com.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.entity.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientTypeAndRecipientIdOrderByCreatedAtDesc(String recipientType, Long recipientId);

    List<Notification> findByRecipientTypeAndRecipientIdAndIsReadFalseOrderByCreatedAtDesc(String recipientType, Long recipientId);

    long countByRecipientTypeAndRecipientIdAndIsReadFalse(String recipientType, Long recipientId);
}
