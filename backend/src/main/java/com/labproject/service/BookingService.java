package com.labproject.service;

import com.labproject.dto.BookingRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Equipment;
import com.labproject.entity.User;
import com.labproject.repository.BookingRepository;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final UserRepository userRepository;

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

        if (user.getRole().equals("STUDENT") || user.getRole().equals("RESEARCHER")) {
            Integer userInstId = user.getInstitution() != null ? user.getInstitution().getId() : 
                                 (user.getDepartment() != null && user.getDepartment().getInstitution() != null ? 
                                  user.getDepartment().getInstitution().getId() : null);
            Integer eqInstId = (equipment.getDepartment() != null && equipment.getDepartment().getInstitution() != null)
                    ? equipment.getDepartment().getInstitution().getId() : null;

            if (userInstId == null || !userInstId.equals(eqInstId)) {
                throw new RuntimeException("You can only book equipment within your own college");
            }
        }

        LocalDateTime newStart = request.getStartTime();
        LocalDateTime newEnd = request.getEndTime();

        if (newStart == null || newEnd == null || newEnd.isBefore(newStart) || newEnd.isEqual(newStart)) {
            throw new RuntimeException("Invalid booking start or end time");
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

        Booking booking = new Booking();
        booking.setEquipment(equipment);
        booking.setUser(user);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setStatus("PENDING");

        return bookingRepository.save(booking);
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

        return saved;
    }

    public Booking rejectBooking(Integer id, String reason) {
        Booking booking = findById(id);
        booking.setStatus("REJECTED");
        booking.setRejectionReason(reason);
        Booking saved = bookingRepository.save(booking);

        updateEquipmentStatusIfFreed(booking.getEquipment());
        return saved;
    }

    public Booking cancelBooking(Integer id) {
        Booking booking = findById(id);
        booking.setStatus("CANCELLED");
        Booking saved = bookingRepository.save(booking);

        updateEquipmentStatusIfFreed(booking.getEquipment());
        return saved;
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
