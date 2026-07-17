package com.labproject.repository;

import com.labproject.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Integer> {
    List<Booking> findByUserId(Integer userId);
    List<Booking> findByEquipmentId(Integer equipmentId);
    List<Booking> findByEquipmentDepartmentId(Integer departmentId);
    List<Booking> findByStatus(String status);
}
