package com.labproject.service;

import com.labproject.dto.EquipmentRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Department;
import com.labproject.entity.Equipment;
import com.labproject.entity.Maintenance;
import com.labproject.repository.BookingRepository;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.MaintenanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private MaintenanceRepository maintenanceRepository;

    @InjectMocks
    private EquipmentService equipmentService;

    private Equipment equipment;
    private Department department;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(1);
        department.setName("Bio Chemistry");

        equipment = new Equipment();
        equipment.setId(100);
        equipment.setName("Electron Microscope");
        equipment.setCategory("Microscopy");
        equipment.setStatus("AVAILABLE");
        equipment.setDepartment(department);
        equipment.setHourlyRate(75.0);
    }

    @Test
    @DisplayName("findById should return equipment and sync status")
    void testFindById_Success() {
        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(bookingRepository.findByEquipmentId(100)).thenReturn(Collections.emptyList());

        Equipment result = equipmentService.findById(100);

        assertNotNull(result);
        assertEquals("Electron Microscope", result.getName());
        assertEquals("AVAILABLE", result.getStatus());
    }

    @Test
    @DisplayName("findById should throw Exception when equipment is not found")
    void testFindById_NotFound() {
        when(equipmentRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> equipmentService.findById(999));
    }

    @Test
    @DisplayName("create should map request and save equipment")
    void testCreate_Success() {
        EquipmentRequest req = new EquipmentRequest();
        req.setName("Spectrometer");
        req.setCategory("Spectroscopy");
        req.setDepartmentId(1);
        req.setHourlyRate(50.0);

        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

        Equipment created = equipmentService.create(req);

        assertNotNull(created);
        assertEquals("Spectrometer", created.getName());
        assertEquals(department, created.getDepartment());
        assertEquals(50.0, created.getHourlyRate());
    }

    @Test
    @DisplayName("recordCalibration should update calibration fields and create maintenance audit entry")
    void testRecordCalibration() {
        equipment.setStatus("UNDER_MAINTENANCE");

        EquipmentRequest req = new EquipmentRequest();
        req.setLastCalibrationDate(LocalDate.now());
        req.setNextCalibrationDate(LocalDate.now().plusMonths(6));
        req.setCalibrationStatus("VALID");
        req.setCertificateNumber("CERT-12345");
        req.setCertificateAgency("ISO-Calib");

        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

        Equipment updated = equipmentService.recordCalibration(100, req);

        assertEquals("AVAILABLE", updated.getStatus());
        assertEquals("VALID", updated.getCalibrationStatus());
        assertEquals("CERT-12345", updated.getCertificateNumber());
        verify(maintenanceRepository).save(any(Maintenance.class));
    }

    @Test
    @DisplayName("syncEquipmentStatus should set status to BOOKED when approved booking exists")
    void testSyncEquipmentStatus_Booked() {
        Booking approvedBooking = new Booking();
        approvedBooking.setStatus("APPROVED");

        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(bookingRepository.findByEquipmentId(100)).thenReturn(List.of(approvedBooking));
        when(equipmentRepository.save(any(Equipment.class))).thenAnswer(i -> i.getArgument(0));

        Equipment result = equipmentService.findById(100);

        assertEquals("BOOKED", result.getStatus());
    }

    @Test
    @DisplayName("delete should invoke repository deleteById")
    void testDelete() {
        equipmentService.delete(100);
        verify(equipmentRepository).deleteById(100);
    }
}
