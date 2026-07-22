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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public Waitlist joinWaitlist(WaitlistRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Equipment equipment = equipmentRepository.findById(request.getEquipmentId())
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        if (user.getRole().equals("STUDENT") && Boolean.TRUE.equals(equipment.getIsRestricted())) {
            throw new RuntimeException("This equipment has restricted access and cannot be waitlisted by students.");
        }

        boolean alreadyOnWaitlist = waitlistRepository.findByEquipmentId(request.getEquipmentId()).stream()
                .anyMatch(w -> w.getUser().getId().equals(user.getId()) && "PENDING".equals(w.getStatus()));
        if (alreadyOnWaitlist) {
            throw new RuntimeException("You are already on the active waitlist for this equipment");
        }

        // Prevent joining waitlist if user has a pending booking for this equipment
        boolean hasPendingBooking = bookingRepository.findByEquipmentId(equipment.getId()).stream()
                .anyMatch(b -> b.getUser().getEmail().equals(userEmail) && "PENDING".equals(b.getStatus()));
        if (hasPendingBooking) {
            throw new RuntimeException("You cannot join the waitlist because you already have a pending booking request for this equipment.");
        }

        // Waitlist is only allowed when someone is currently using the equipment (i.e. has an APPROVED booking)
        boolean hasApprovedBooking = bookingRepository.findByEquipmentId(equipment.getId()).stream()
                .anyMatch(b -> "APPROVED".equals(b.getStatus()));
        if (!hasApprovedBooking) {
            throw new RuntimeException("You can only join the waitlist when the equipment is currently in use (has approved bookings).");
        }

        Waitlist waitlist = new Waitlist();
        waitlist.setEquipment(equipment);
        waitlist.setUser(user);
        waitlist.setRequestTime(LocalDateTime.now());
        waitlist.setStartTime(request.getStartTime());
        waitlist.setEndTime(request.getEndTime());
        waitlist.setStatus("PENDING");

        return waitlistRepository.save(waitlist);
    }

    public Booking approveWaitlist(Integer waitlistId, String userEmail) {
        Waitlist waitlist = waitlistRepository.findById(waitlistId)
                .orElseThrow(() -> new RuntimeException("Waitlist entry not found"));

        Equipment equipment = waitlist.getEquipment();

        Booking booking = new Booking();
        booking.setEquipment(equipment);
        booking.setUser(waitlist.getUser());
        booking.setStartTime(waitlist.getStartTime() != null ? waitlist.getStartTime() : LocalDateTime.now());
        booking.setEndTime(waitlist.getEndTime() != null ? waitlist.getEndTime() : LocalDateTime.now().plusDays(1));
        booking.setPurpose("Promoted from Waitlist");
        booking.setStatus("APPROVED");

        Booking savedBooking = bookingRepository.save(booking);

        waitlist.setStatus("APPROVED");
        waitlistRepository.save(waitlist);

        equipment.setStatus("BOOKED");
        equipmentRepository.save(equipment);

        return savedBooking;
    }

    public void cancelWaitlist(Integer id, String userEmail) {
        Waitlist waitlist = waitlistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Waitlist entry not found"));
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isOwner = waitlist.getUser().getId().equals(currentUser.getId());
        boolean isManager = List.of("LAB_MANAGER", "DEPARTMENT_HEAD", "INSTITUTION_HEAD", "SYSTEM_ADMIN")
                .contains(currentUser.getRole());

        if (!isOwner && !isManager) {
            throw new RuntimeException("Not authorized to cancel this waitlist entry");
        }

        waitlist.setStatus("CANCELLED");
        waitlistRepository.save(waitlist);
    }

    public List<Waitlist> findForUser(String userEmail) {
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (List.of("SYSTEM_ADMIN", "INSTITUTION_HEAD", "DEPARTMENT_HEAD", "LAB_MANAGER").contains(currentUser.getRole())) {
            return waitlistRepository.findAll();
        } else {
            return waitlistRepository.findByUserId(currentUser.getId());
        }
    }

    public List<Waitlist> findByEquipmentId(Integer equipmentId) {
        return waitlistRepository.findByEquipmentId(equipmentId);
    }

    public List<Waitlist> findByUserId(Integer userId) {
        return waitlistRepository.findByUserId(userId);
    }

    public List<Waitlist> findAllActive() {
        return waitlistRepository.findByStatus("PENDING");
    }

    public List<Waitlist> findAll() {
        return waitlistRepository.findAll();
    }
}
