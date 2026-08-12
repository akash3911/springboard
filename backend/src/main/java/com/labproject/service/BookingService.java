package com.labproject.service;

import com.labproject.dto.BookingRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Equipment;
import com.labproject.entity.User;
import com.labproject.entity.Waitlist;
import com.labproject.repository.BookingRepository;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.UserRepository;
import com.labproject.repository.WaitlistRepository;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final WaitlistRepository waitlistRepository;

    public List<Booking> findAll() {
        return bookingRepository.findAll();
    }

    public Booking findById(Integer id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    public List<Booking> findByUserId(Integer userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> findByEquipmentId(Integer equipmentId) {
        return bookingRepository.findByEquipmentId(equipmentId);
    }

    public List<Booking> findByDepartmentId(Integer departmentId) {
        return bookingRepository.findByEquipmentDepartmentId(departmentId);
    }

    public List<Booking> findByStatus(String status) {
        return bookingRepository.findByStatus(status);
    }

    public Booking createBooking(BookingRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        if ("UNDER_MAINTENANCE".equals(equipment.getStatus()) || "OUT_OF_SERVICE".equals(equipment.getStatus())) {
            throw new RuntimeException("Equipment is currently " + equipment.getStatus() + " and cannot be booked");
        }

        if (user.getRole().equals("STUDENT") && Boolean.TRUE.equals(equipment.getIsRestricted())) {
            throw new RuntimeException("This equipment has restricted access and cannot be booked by students.");
        }

        // Prevent duplicate pending booking requests by the same user for this equipment
        boolean userHasPendingBooking = bookingRepository.findByEquipmentId(equipment.getId()).stream()
                .anyMatch(b -> b.getUser().getEmail().equals(userEmail) && "PENDING".equals(b.getStatus()));

        if (userHasPendingBooking) {
            throw new RuntimeException("You already have a pending booking request for this equipment. Please wait for manager approval.");
        }

        LocalDateTime newStart = request.getStartTime();
        LocalDateTime newEnd = request.getEndTime();

        if (newStart == null || newEnd == null || newEnd.isBefore(newStart) || newEnd.isEqual(newStart)) {
            throw new RuntimeException("Invalid booking start or end time");
        }

        // Prevent past start times
        if (newStart.isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new RuntimeException("Booking start time cannot be in the past.");
        }

        // Check for time slot overlap with existing APPROVED bookings
        List<Booking> approvedBookings = bookingRepository.findByEquipmentId(equipment.getId()).stream()
                .filter(b -> "APPROVED".equals(b.getStatus()))
                .toList();

        for (Booking existing : approvedBookings) {
            if (newStart.isBefore(existing.getEndTime()) && newEnd.isAfter(existing.getStartTime())) {
                throw new RuntimeException("Equipment is already booked from " + 
                        existing.getStartTime() + " to " + existing.getEndTime() + 
                        ". Please join the waitlist instead.");
            }
        }

        // Calculate Cost
        long minutes = Duration.between(newStart, newEnd).toMinutes();
        double hours = Math.max(0.5, minutes / 60.0);
        double rate = equipment.getHourlyRate() != null ? equipment.getHourlyRate() : 45.0;
        double totalCost = Math.round(hours * rate * 100.0) / 100.0;

        // Determine if Cross-Institution
        Integer userInstId = user.getInstitution() != null ? user.getInstitution().getId() : 
                            (user.getDepartment() != null && user.getDepartment().getInstitution() != null ? user.getDepartment().getInstitution().getId() : null);
        Integer eqInstId = equipment.getDepartment() != null && equipment.getDepartment().getInstitution() != null ?
                            equipment.getDepartment().getInstitution().getId() : null;

        boolean isCross = userInstId != null && eqInstId != null && !userInstId.equals(eqInstId);

        Booking booking = new Booking();
        booking.setEquipment(equipment);
        booking.setUser(user);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setStatus("PENDING");
        booking.setTotalCost(totalCost);
        booking.setIsCrossInstitution(isCross);
        booking.setBillingStatus("PENDING");

        Booking saved = bookingRepository.save(booking);

        // Send notification to user
        try {
            notificationService.create(user.getId(), 
                "Booking request submitted for " + equipment.getName() + " ($" + totalCost + "). Awaiting manager approval.",
                "BOOKING");
        } catch (Exception ignored) {}

        return saved;
    }

    public Booking approveBooking(Integer id) {
        Booking booking = findById(id);
        Equipment equipment = booking.getEquipment();

        // Check for time slot overlap with existing APPROVED bookings
        List<Booking> existingApproved = bookingRepository.findByEquipmentId(equipment.getId()).stream()
                .filter(b -> "APPROVED".equals(b.getStatus()) && !b.getId().equals(id))
                .toList();

        for (Booking existing : existingApproved) {
            if (booking.getStartTime().isBefore(existing.getEndTime()) && 
                booking.getEndTime().isAfter(existing.getStartTime())) {
                throw new RuntimeException("Cannot approve: equipment is already booked from " + 
                        existing.getStartTime() + " to " + existing.getEndTime());
            }
        }

        booking.setStatus("APPROVED");
        Booking saved = bookingRepository.save(booking);

        // Update equipment status to BOOKED
        equipment.setStatus("BOOKED");
        equipmentRepository.save(equipment);

        // Notify user
        try {
            notificationService.create(booking.getUser().getId(),
                "Your booking request for " + equipment.getName() + " has been APPROVED!",
                "BOOKING");
        } catch (Exception ignored) {}

        return saved;
    }

    public Booking rejectBooking(Integer id, String reason) {
        Booking booking = findById(id);
        booking.setStatus("REJECTED");
        booking.setRejectionReason(reason);
        Booking saved = bookingRepository.save(booking);

        updateEquipmentStatusIfFreed(booking.getEquipment());

        // Notify user
        try {
            notificationService.create(booking.getUser().getId(),
                "Your booking for " + booking.getEquipment().getName() + " was rejected. Reason: " + reason,
                "BOOKING");
        } catch (Exception ignored) {}

        checkAndNotifyWaitlist(booking.getEquipment());

        return saved;
    }

    public Booking cancelBooking(Integer id) {
        Booking booking = findById(id);
        booking.setStatus("CANCELLED");
        Booking saved = bookingRepository.save(booking);

        updateEquipmentStatusIfFreed(booking.getEquipment());

        // Notify user
        try {
            notificationService.create(booking.getUser().getId(),
                "Your booking for " + booking.getEquipment().getName() + " has been cancelled.",
                "BOOKING");
        } catch (Exception ignored) {}

        checkAndNotifyWaitlist(booking.getEquipment());

        return saved;
    }

    public Booking updateBillingStatus(Integer id, String billingStatus) {
        Booking booking = findById(id);
        booking.setBillingStatus(billingStatus);
        Booking saved = bookingRepository.save(booking);

        try {
            notificationService.create(booking.getUser().getId(),
                "Billing status for booking #" + booking.getId() + " (" + booking.getEquipment().getName() + ") updated to " + billingStatus,
                "BILLING");
        } catch (Exception ignored) {}

        return saved;
    }

    private void checkAndNotifyWaitlist(Equipment equipment) {
        if (equipment == null) return;
        List<Waitlist> pendingWaitlist = waitlistRepository.findByEquipmentId(equipment.getId()).stream()
                .filter(w -> "PENDING".equals(w.getStatus()))
                .toList();

        for (Waitlist w : pendingWaitlist) {
            try {
                notificationService.create(w.getUser().getId(),
                    "Good news! A reservation slot for " + equipment.getName() + " has opened up! Visit the equipment page to submit or claim your booking.",
                    "WAITLIST");
            } catch (Exception ignored) {}
        }
    }

    private void updateEquipmentStatusIfFreed(Equipment equipment) {
        if (equipment == null) return;

        boolean hasApprovedBookings = bookingRepository.findByEquipmentId(equipment.getId()).stream()
                .anyMatch(b -> "APPROVED".equals(b.getStatus()));

        if (!hasApprovedBookings && "BOOKED".equals(equipment.getStatus())) {
            equipment.setStatus("AVAILABLE");
            equipmentRepository.save(equipment);
        }
    }
}

