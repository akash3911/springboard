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

        boolean alreadyOnWaitlist = waitlistRepository.findByEquipmentId(equipmentId).stream()
                .anyMatch(w -> w.getUser().getId().equals(user.getId()) && "PENDING".equals(w.getStatus()));
        if (alreadyOnWaitlist) {
            throw new RuntimeException("You are already on the active waitlist for this equipment");
        }

        Waitlist waitlist = new Waitlist();
        waitlist.setEquipment(equipment);
        waitlist.setUser(user);
        waitlist.setRequestTime(LocalDateTime.now());
        waitlist.setStatus("PENDING");

        return waitlistRepository.save(waitlist);
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

        if ("SYSTEM_ADMIN".equals(currentUser.getRole())) {
            return waitlistRepository.findAll();
        } else if (List.of("LAB_MANAGER", "DEPARTMENT_HEAD", "INSTITUTION_HEAD").contains(currentUser.getRole())) {
            Integer userInstId = currentUser.getInstitution() != null ? currentUser.getInstitution().getId() :
                    (currentUser.getDepartment() != null && currentUser.getDepartment().getInstitution() != null ?
                     currentUser.getDepartment().getInstitution().getId() : null);
            if (userInstId == null) {
                return List.of();
            }
            return waitlistRepository.findAll().stream()
                    .filter(w -> {
                        Integer eqInstId = (w.getEquipment() != null && w.getEquipment().getDepartment() != null &&
                                w.getEquipment().getDepartment().getInstitution() != null)
                                ? w.getEquipment().getDepartment().getInstitution().getId() : null;
                        return userInstId.equals(eqInstId);
                    })
                    .toList();
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
