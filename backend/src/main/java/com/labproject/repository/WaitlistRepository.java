package com.labproject.repository;

import com.labproject.entity.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WaitlistRepository extends JpaRepository<Waitlist, Integer> {
    List<Waitlist> findByEquipmentId(Integer equipmentId);
    List<Waitlist> findByUserId(Integer userId);
    List<Waitlist> findByStatus(String status);
}
