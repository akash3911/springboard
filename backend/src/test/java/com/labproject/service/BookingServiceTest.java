package com.labproject.service;

import com.labproject.dto.BookingRequest;
import com.labproject.entity.*;
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
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private WaitlistRepository waitlistRepository;

    @InjectMocks
    private BookingService bookingService;

    private User studentUser;
    private User facultyUser;
    private Equipment equipment;
    private Institution institution;
    private Department department;

    @BeforeEach
    void setUp() {
        institution = new Institution();
        institution.setId(1);
        institution.setName("MIT");

        department = new Department();
        department.setId(10);
        department.setName("CS");
        department.setInstitution(institution);

        studentUser = new User();
        studentUser.setId(1);
        studentUser.setEmail("student@mit.edu");
        studentUser.setRole("STUDENT");
        studentUser.setDepartment(department);
        studentUser.setInstitution(institution);

        facultyUser = new User();
        facultyUser.setId(2);
        facultyUser.setEmail("faculty@mit.edu");
        facultyUser.setRole("FACULTY");
        facultyUser.setDepartment(department);
        facultyUser.setInstitution(institution);

        equipment = new Equipment();
        equipment.setId(100);
        equipment.setName("Super Computer");
        equipment.setStatus("AVAILABLE");
        equipment.setHourlyRate(100.0);
        equipment.setIsRestricted(false);
        equipment.setDepartment(department);
    }

    @Test
    @DisplayName("createBooking should succeed and calculate cost correctly")
    void testCreateBooking_Success() {
        BookingRequest request = new BookingRequest();
        request.setEquipmentId(100);
        request.setStartTime(LocalDateTime.now().plusHours(1));
        request.setEndTime(LocalDateTime.now().plusHours(3));
        request.setPurpose("AI Research");

        when(userRepository.findByEmail("faculty@mit.edu")).thenReturn(Optional.of(facultyUser));
        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(bookingRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            b.setId(500);
            return b;
        });

        Booking result = bookingService.createBooking(request, "faculty@mit.edu");

        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());
        assertEquals(200.0, result.getTotalCost());
        assertFalse(result.getIsCrossInstitution());
        verify(notificationService).create(eq(2), anyString(), eq("BOOKING"));
    }

    @Test
    @DisplayName("createBooking should fail when equipment status is UNDER_MAINTENANCE")
    void testCreateBooking_UnderMaintenance() {
        equipment.setStatus("UNDER_MAINTENANCE");

        BookingRequest request = new BookingRequest();
        request.setEquipmentId(100);

        when(userRepository.findByEmail("faculty@mit.edu")).thenReturn(Optional.of(facultyUser));
        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                bookingService.createBooking(request, "faculty@mit.edu")
        );
        assertTrue(exception.getMessage().contains("UNDER_MAINTENANCE"));
    }

    @Test
    @DisplayName("createBooking should fail when student attempts to book restricted equipment")
    void testCreateBooking_RestrictedEquipmentStudent() {
        equipment.setIsRestricted(true);

        BookingRequest request = new BookingRequest();
        request.setEquipmentId(100);

        when(userRepository.findByEmail("student@mit.edu")).thenReturn(Optional.of(studentUser));
        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                bookingService.createBooking(request, "student@mit.edu")
        );
        assertTrue(exception.getMessage().contains("restricted access"));
    }

    @Test
    @DisplayName("createBooking should fail when user already has a pending booking for this equipment")
    void testCreateBooking_DuplicatePending() {
        Booking pendingBooking = new Booking();
        pendingBooking.setUser(facultyUser);
        pendingBooking.setStatus("PENDING");

        BookingRequest request = new BookingRequest();
        request.setEquipmentId(100);

        when(userRepository.findByEmail("faculty@mit.edu")).thenReturn(Optional.of(facultyUser));
        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(bookingRepository.findByEquipmentId(100)).thenReturn(List.of(pendingBooking));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                bookingService.createBooking(request, "faculty@mit.edu")
        );
        assertTrue(exception.getMessage().contains("already have a pending booking"));
    }

    @Test
    @DisplayName("createBooking should fail when overlapping with existing APPROVED booking")
    void testCreateBooking_OverlappingApproved() {
        LocalDateTime now = LocalDateTime.now();

        Booking approvedBooking = new Booking();
        approvedBooking.setUser(facultyUser);
        approvedBooking.setStatus("APPROVED");
        approvedBooking.setStartTime(now.plusHours(2));
        approvedBooking.setEndTime(now.plusHours(5));

        BookingRequest request = new BookingRequest();
        request.setEquipmentId(100);
        request.setStartTime(now.plusHours(3));
        request.setEndTime(now.plusHours(4));

        when(userRepository.findByEmail("faculty@mit.edu")).thenReturn(Optional.of(facultyUser));
        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(bookingRepository.findByEquipmentId(100)).thenReturn(List.of(approvedBooking));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                bookingService.createBooking(request, "faculty@mit.edu")
        );
        assertTrue(exception.getMessage().contains("already booked"));
    }

    @Test
    @DisplayName("approveBooking should mark booking as APPROVED and equipment as BOOKED")
    void testApproveBooking_Success() {
        Booking booking = new Booking();
        booking.setId(10);
        booking.setEquipment(equipment);
        booking.setUser(facultyUser);
        booking.setStatus("PENDING");
        booking.setStartTime(LocalDateTime.now().plusHours(1));
        booking.setEndTime(LocalDateTime.now().plusHours(3));

        when(bookingRepository.findById(10)).thenReturn(Optional.of(booking));
        when(bookingRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        Booking approved = bookingService.approveBooking(10);

        assertEquals("APPROVED", approved.getStatus());
        verify(equipmentRepository).save(argThat(e -> "BOOKED".equals(e.getStatus())));
        verify(notificationService).create(eq(2), anyString(), eq("BOOKING"));
    }

    @Test
    @DisplayName("rejectBooking should set REJECTED status, reason, update equipment status, and notify waitlist")
    void testRejectBooking_Success() {
        Booking booking = new Booking();
        booking.setId(10);
        booking.setEquipment(equipment);
        booking.setUser(facultyUser);
        booking.setStatus("PENDING");

        when(bookingRepository.findById(10)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());
        when(waitlistRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());

        Booking rejected = bookingService.rejectBooking(10, "Maintenance conflict");

        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("Maintenance conflict", rejected.getRejectionReason());
        verify(notificationService).create(eq(2), contains("rejected"), eq("BOOKING"));
    }

    @Test
    @DisplayName("cancelBooking should set CANCELLED status and release equipment if no other approved bookings")
    void testCancelBooking_Success() {
        equipment.setStatus("BOOKED");
        Booking booking = new Booking();
        booking.setId(10);
        booking.setEquipment(equipment);
        booking.setUser(facultyUser);
        booking.setStatus("APPROVED");

        when(bookingRepository.findById(10)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());
        when(waitlistRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());

        Booking cancelled = bookingService.cancelBooking(10);

        assertEquals("CANCELLED", cancelled.getStatus());
        verify(equipmentRepository).save(argThat(e -> "AVAILABLE".equals(e.getStatus())));
    }
}
