package com.labproject.repository;

import com.labproject.entity.Utilization;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UtilizationRepository extends JpaRepository<Utilization, Integer> {
    List<Utilization> findByEquipmentId(Integer equipmentId);
}
