package com.labproject.service;

import com.labproject.entity.Institution;
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
class InstitutionServiceTest {

    @Mock
    private InstitutionRepository institutionRepository;

    @InjectMocks
    private InstitutionService institutionService;

    private Institution inst;

    @BeforeEach
    void setUp() {
        inst = new Institution();
        inst.setId(1);
        inst.setName("Stanford University");
        inst.setAddress("Palo Alto, CA");
    }

    @Test
    @DisplayName("findAll should return list of institutions")
    void testFindAll() {
        when(institutionRepository.findAll()).thenReturn(List.of(inst));

        List<Institution> list = institutionService.findAll();

        assertEquals(1, list.size());
        assertEquals("Stanford University", list.get(0).getName());
    }

    @Test
    @DisplayName("findById should return institution when found")
    void testFindById_Success() {
        when(institutionRepository.findById(1)).thenReturn(Optional.of(inst));

        Institution found = institutionService.findById(1);

        assertNotNull(found);
        assertEquals("Stanford University", found.getName());
    }

    @Test
    @DisplayName("create should save new institution")
    void testCreate() {
        when(institutionRepository.save(any(Institution.class))).thenAnswer(i -> i.getArgument(0));

        Institution created = institutionService.create(inst);

        assertNotNull(created);
        assertEquals("Stanford University", created.getName());
    }

    @Test
    @DisplayName("update should modify existing institution details")
    void testUpdate() {
        Institution updatedInfo = new Institution();
        updatedInfo.setName("Stanford Research Institute");
        updatedInfo.setAddress("Menlo Park, CA");

        when(institutionRepository.findById(1)).thenReturn(Optional.of(inst));
        when(institutionRepository.save(any(Institution.class))).thenAnswer(i -> i.getArgument(0));

        Institution result = institutionService.update(1, updatedInfo);

        assertEquals("Stanford Research Institute", result.getName());
        assertEquals("Menlo Park, CA", result.getAddress());
    }
}
