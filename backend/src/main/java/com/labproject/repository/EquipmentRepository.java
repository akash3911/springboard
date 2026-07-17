package com.labproject.repository;

import com.labproject.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Integer> {
    List<Equipment> findByDepartmentId(Integer departmentId);
    List<Equipment> findByDepartmentInstitutionId(Integer institutionId);
    List<Equipment> findByStatus(String status);
}
