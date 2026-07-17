package com.labproject.repository;

import com.labproject.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);
    List<Notification> findByUserIdAndIsReadFalse(Integer userId);
}
