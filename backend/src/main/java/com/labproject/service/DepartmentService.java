package com.labproject.service;

import com.labproject.entity.Department;
import com.labproject.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<Department> findAll() {
        return departmentRepository.findAll();
    }

    public Department findById(Integer id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));
    }

    public List<Department> findByInstitutionId(Integer institutionId) {
        return departmentRepository.findByInstitutionId(institutionId);
    }

    public Department create(Department department) {
        return departmentRepository.save(department);
    }

    public void delete(Integer id) {
        departmentRepository.deleteById(id);
    }
}
