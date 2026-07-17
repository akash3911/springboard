package com.labproject.controller;

import com.labproject.dto.BookingRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Waitlist;
import com.labproject.service.BookingService;
import com.labproject.service.WaitlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BookingController {

    private final BookingService bookingService;
    private final WaitlistService waitlistService;

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.findAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        // Look up all bookings, then filter by user's email, or find by user's ID
        // Let's filter bookings by user email or fetch using a helper method.
        // Wait, BookingService has findByUserId(Integer userId), but let's query all and filter,
        // or we can find the user ID first.
        // Let's find user's bookings.
        List<Booking> bookings = bookingService.findAll().stream()
                .filter(b -> b.getUser().getEmail().equals(email))
                .toList();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Booking>> getByDepartment(@PathVariable Integer deptId) {
        return ResponseEntity.ok(bookingService.findByDepartmentId(deptId));
    }

    @PostMapping
    public ResponseEntity<Booking> createBooking(@RequestBody BookingRequest request) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(bookingService.createBooking(request, email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Booking> approveBooking(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(bookingService.approveBooking(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Booking> rejectBooking(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        try {
            String reason = body.getOrDefault("rejectionReason", "No reason provided");
            return ResponseEntity.ok(bookingService.rejectBooking(id, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(bookingService.cancelBooking(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/waitlist")
    public ResponseEntity<List<Waitlist>> getActiveWaitlist() {
        return ResponseEntity.ok(waitlistService.findAllActive());
    }
}
