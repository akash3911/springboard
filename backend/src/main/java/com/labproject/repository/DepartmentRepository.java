package com.labproject.repository;

import com.labproject.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Integer> {
    List<Department> findByInstitutionId(Integer institutionId);
}
