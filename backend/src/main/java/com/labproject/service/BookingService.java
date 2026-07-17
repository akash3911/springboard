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
        booking.setStatus("APPROVED");
        return bookingRepository.save(booking);
    }

    public Booking rejectBooking(Integer id, String reason) {
        Booking booking = findById(id);
        booking.setStatus("REJECTED");
        booking.setRejectionReason(reason);
        return bookingRepository.save(booking);
    }

    public Booking cancelBooking(Integer id) {
        Booking booking = findById(id);
        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }
}
