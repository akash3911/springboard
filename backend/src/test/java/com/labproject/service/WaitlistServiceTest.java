package com.labproject.service;

import com.labproject.dto.WaitlistRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Equipment;
import com.labproject.entity.User;
import com.labproject.entity.Waitlist;
import com.labproject.repository.BookingRepository;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.UserRepository;
import com.labproject.repository.WaitlistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WaitlistServiceTest {

    @Mock
    private WaitlistRepository waitlistRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRepository bookingRepository;

    @InjectMocks
    private WaitlistService waitlistService;

    private User user;
    private Equipment equipment;
    private Booking approvedBooking;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(10);
        user.setEmail("researcher@lab.org");
        user.setRole("RESEARCHER");

        equipment = new Equipment();
        equipment.setId(100);
        equipment.setName("NMR Spectrometer");
        equipment.setStatus("BOOKED");
        equipment.setIsRestricted(false);
        equipment.setHourlyRate(80.0);

        approvedBooking = new Booking();
        approvedBooking.setId(1);
        approvedBooking.setEquipment(equipment);
        approvedBooking.setUser(user);
        approvedBooking.setStatus("APPROVED");
    }

    @Test
    @DisplayName("joinWaitlist should succeed when equipment is in use (has approved bookings)")
    void testJoinWaitlist_Success() {
        WaitlistRequest request = new WaitlistRequest();
        request.setEquipmentId(100);
        request.setStartTime(LocalDateTime.now().plusDays(1));
        request.setEndTime(LocalDateTime.now().plusDays(1).plusHours(2));

        when(userRepository.findByEmail("researcher@lab.org")).thenReturn(Optional.of(user));
        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(waitlistRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());
        when(bookingRepository.findByEquipmentId(100)).thenReturn(List.of(approvedBooking));
        when(waitlistRepository.save(any(Waitlist.class))).thenAnswer(i -> {
            Waitlist w = i.getArgument(0);
            w.setId(50);
            return w;
        });

        Waitlist result = waitlistService.joinWaitlist(request, "researcher@lab.org");

        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());
        assertEquals(user, result.getUser());
        assertEquals(equipment, result.getEquipment());
    }

    @Test
    @DisplayName("joinWaitlist should fail when equipment has no approved bookings")
    void testJoinWaitlist_NoApprovedBookings() {
        WaitlistRequest request = new WaitlistRequest();
        request.setEquipmentId(100);

        when(userRepository.findByEmail("researcher@lab.org")).thenReturn(Optional.of(user));
        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(waitlistRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());
        when(bookingRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                waitlistService.joinWaitlist(request, "researcher@lab.org")
        );
        assertTrue(exception.getMessage().contains("only join the waitlist when the equipment is currently in use"));
    }

    @Test
    @DisplayName("approveWaitlist should promote waitlist entry to APPROVED booking and update equipment status")
    void testApproveWaitlist_Success() {
        Waitlist waitlist = new Waitlist();
        waitlist.setId(50);
        waitlist.setEquipment(equipment);
        waitlist.setUser(user);
        waitlist.setStartTime(LocalDateTime.now().plusHours(1));
        waitlist.setEndTime(LocalDateTime.now().plusHours(3));
        waitlist.setStatus("PENDING");

        when(waitlistRepository.findById(50)).thenReturn(Optional.of(waitlist));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            b.setId(200);
            return b;
        });

        Booking promotedBooking = waitlistService.approveWaitlist(50, "manager@lab.org");

        assertNotNull(promotedBooking);
        assertEquals("APPROVED", promotedBooking.getStatus());
        assertEquals(160.0, promotedBooking.getTotalCost());
        assertEquals("APPROVED", waitlist.getStatus());
        verify(equipmentRepository).save(argThat(e -> "BOOKED".equals(e.getStatus())));
    }

    @Test
    @DisplayName("cancelWaitlist should throw Exception if user is unauthorized")
    void testCancelWaitlist_Unauthorized() {
        User otherUser = new User();
        otherUser.setId(99);
        otherUser.setEmail("other@lab.org");
        otherUser.setRole("STUDENT");

        Waitlist waitlist = new Waitlist();
        waitlist.setId(50);
        waitlist.setUser(user);

        when(waitlistRepository.findById(50)).thenReturn(Optional.of(waitlist));
        when(userRepository.findByEmail("other@lab.org")).thenReturn(Optional.of(otherUser));

        assertThrows(RuntimeException.class, () ->
                waitlistService.cancelWaitlist(50, "other@lab.org")
        );
    }
}
