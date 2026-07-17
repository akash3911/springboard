package com.labproject.service;

import com.labproject.entity.Equipment;
import com.labproject.entity.User;
import com.labproject.entity.Waitlist;
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

    public Waitlist joinWaitlist(Integer equipmentId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new RuntimeException("Equipment not found"));

        if (user.getRole().equals("STUDENT") || user.getRole().equals("RESEARCHER")) {
            Integer userInstId = user.getInstitution() != null ? user.getInstitution().getId() : 
                                 (user.getDepartment() != null && user.getDepartment().getInstitution() != null ? 
                                  user.getDepartment().getInstitution().getId() : null);
            Integer eqInstId = (equipment.getDepartment() != null && equipment.getDepartment().getInstitution() != null)
                    ? equipment.getDepartment().getInstitution().getId() : null;

            if (userInstId == null || !userInstId.equals(eqInstId)) {
                throw new RuntimeException("You can only join waitlists within your own college");
            }
        }

        Waitlist waitlist = new Waitlist();
        waitlist.setEquipment(equipment);
        waitlist.setUser(user);
        waitlist.setRequestTime(LocalDateTime.now());
        waitlist.setStatus("PENDING");

        return waitlistRepository.save(waitlist);
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
