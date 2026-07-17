package com.labproject.repository;

import com.labproject.entity.Maintenance;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MaintenanceRepository extends JpaRepository<Maintenance, Integer> {
    List<Maintenance> findByTechnicianId(Integer technicianId);
    List<Maintenance> findByEquipmentId(Integer equipmentId);
    List<Maintenance> findByEquipmentDepartmentId(Integer departmentId);
}
