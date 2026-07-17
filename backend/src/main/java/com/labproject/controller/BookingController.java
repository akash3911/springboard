package com.labproject.controller;

import com.labproject.dto.BookingRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.User;
import com.labproject.entity.Waitlist;
import com.labproject.service.BookingService;
import com.labproject.service.UserService;
import com.labproject.service.WaitlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    private final BookingService bookingService;
    private final UserService userService;
    private final WaitlistService waitlistService;

    public BookingController(BookingService bookingService, UserService userService, WaitlistService waitlistService) {
        this.bookingService = bookingService;
        this.userService = userService;
        this.waitlistService = waitlistService;
    }

    @GetMapping
    public ResponseEntity<?> getAllBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByEmail(email);
        if ("SYSTEM_ADMIN".equals(user.getRole())) {
            return ResponseEntity.ok(bookingService.findAll());
        } else if ("DEPARTMENT_HEAD".equals(user.getRole()) || "LAB_MANAGER".equals(user.getRole())) {
            if (user.getDepartment() != null) {
                return ResponseEntity.ok(bookingService.findByDepartmentId(user.getDepartment().getId()));
            }
        }
        return ResponseEntity.ok(bookingService.findByUserId(user.getId()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(bookingService.findByUserId(user.getId()));
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Booking>> getBookingsByDepartment(@PathVariable Integer deptId) {
        return ResponseEntity.ok(bookingService.findByDepartmentId(deptId));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        try {
            Booking booking = bookingService.createBooking(request, email);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable Integer id) {
        try {
            Booking booking = bookingService.approveBooking(id);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectBooking(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            String reason = body.getOrDefault("rejectionReason", "No reason provided");
            Booking booking = bookingService.rejectBooking(id, reason);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Integer id) {
        try {
            Booking booking = bookingService.cancelBooking(id);
            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/waitlist")
    public ResponseEntity<List<Waitlist>> getActiveWaitlist() {
        return ResponseEntity.ok(waitlistService.findAllActive());
    }
}
