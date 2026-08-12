package com.labproject.service;

import com.labproject.entity.Notification;
import com.labproject.entity.User;
import com.labproject.repository.NotificationRepository;
import com.labproject.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1);
        user.setEmail("test@lab.org");
    }

    @Test
    @DisplayName("create should generate notification and mark unread")
    void testCreate_Success() {
        when(userRepository.findById(1)).thenReturn(Optional.of(user));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> {
            Notification n = i.getArgument(0);
            n.setId(10);
            return n;
        });

        Notification result = notificationService.create(1, "Booking approved", "BOOKING");

        assertNotNull(result);
        assertEquals("Booking approved", result.getMessage());
        assertEquals("BOOKING", result.getType());
        assertFalse(result.getIsRead());
        assertNotNull(result.getCreatedAt());
    }

    @Test
    @DisplayName("markAsRead should set isRead to true")
    void testMarkAsRead() {
        Notification notification = new Notification();
        notification.setId(10);
        notification.setIsRead(false);

        when(notificationRepository.findById(10)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(i -> i.getArgument(0));

        Notification updated = notificationService.markAsRead(10);

        assertTrue(updated.getIsRead());
    }

    @Test
    @DisplayName("markAllAsRead should update all unread notifications for user")
    void testMarkAllAsRead() {
        Notification n1 = new Notification();
        n1.setIsRead(false);
        Notification n2 = new Notification();
        n2.setIsRead(false);

        when(notificationRepository.findByUserIdAndIsReadFalse(1)).thenReturn(List.of(n1, n2));

        notificationService.markAllAsRead(1);

        assertTrue(n1.getIsRead());
        assertTrue(n2.getIsRead());
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }
}
