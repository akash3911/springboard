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
        List<Booking> bookings = bookingService.findAll().stream()
                .filter(b -> b.getUser().getEmail().equals(email))
                .toList();
        return ResponseEntity.ok(bookings);
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<Booking>> getByEquipment(@PathVariable Integer equipmentId) {
        return ResponseEntity.ok(bookingService.findByEquipmentId(equipmentId));
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Booking>> getByDepartment(@PathVariable Integer deptId) {
        return ResponseEntity.ok(bookingService.findByDepartmentId(deptId));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody BookingRequest request) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(bookingService.createBooking(request, email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(bookingService.approveBooking(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectBooking(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        try {
            String reason = body.getOrDefault("rejectionReason", "No reason provided");
            return ResponseEntity.ok(bookingService.rejectBooking(id, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(bookingService.cancelBooking(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/billing")
    public ResponseEntity<?> updateBillingStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        try {
            String billingStatus = body.getOrDefault("billingStatus", "BILLED");
            return ResponseEntity.ok(bookingService.updateBillingStatus(id, billingStatus));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/waitlist")
    public ResponseEntity<List<Waitlist>> getActiveWaitlist() {
        return ResponseEntity.ok(waitlistService.findAllActive());
    }
}
