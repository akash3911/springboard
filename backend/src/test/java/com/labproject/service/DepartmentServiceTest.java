package com.labproject.service;

import com.labproject.entity.Department;
import com.labproject.entity.Institution;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.InstitutionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @InjectMocks
    private DepartmentService departmentService;

    private Department department;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(10);
        department.setName("Biomedical Engineering");
    }

    @Test
    @DisplayName("findAll should return list of departments")
    void testFindAll() {
        when(departmentRepository.findAll()).thenReturn(List.of(department));

        List<Department> list = departmentService.findAll();

        assertEquals(1, list.size());
        assertEquals("Biomedical Engineering", list.get(0).getName());
    }

    @Test
    @DisplayName("findById should return department when found")
    void testFindById_Success() {
        when(departmentRepository.findById(10)).thenReturn(Optional.of(department));

        Department found = departmentService.findById(10);

        assertNotNull(found);
        assertEquals("Biomedical Engineering", found.getName());
    }

    @Test
    @DisplayName("findByInstitutionId should filter departments by institution")
    void testFindByInstitutionId() {
        when(departmentRepository.findByInstitutionId(1)).thenReturn(List.of(department));

        List<Department> list = departmentService.findByInstitutionId(1);

        assertEquals(1, list.size());
    }

    @Test
    @DisplayName("create should save department")
    void testCreate() {
        when(departmentRepository.save(any(Department.class))).thenAnswer(i -> i.getArgument(0));

        Department created = departmentService.create(department);

        assertNotNull(created);
        assertEquals("Biomedical Engineering", created.getName());
    }
}
