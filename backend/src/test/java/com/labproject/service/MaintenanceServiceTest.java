package com.labproject.service;

import com.labproject.dto.MaintenanceRequest;
import com.labproject.entity.Equipment;
import com.labproject.entity.Maintenance;
import com.labproject.entity.User;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.MaintenanceRepository;
import com.labproject.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceTest {

    @Mock
    private MaintenanceRepository maintenanceRepository;

    @Mock
    private EquipmentRepository equipmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private MaintenanceService maintenanceService;

    private Equipment equipment;
    private User technician;

    @BeforeEach
    void setUp() {
        equipment = new Equipment();
        equipment.setId(100);
        equipment.setName("Centrifuge");
        equipment.setStatus("AVAILABLE");

        technician = new User();
        technician.setId(5);
        technician.setEmail("tech@lab.org");
        technician.setRole("LAB_MANAGER");
    }

    @Test
    @DisplayName("create should set equipment status to UNDER_MAINTENANCE and assign technician")
    void testCreate_Success() {
        MaintenanceRequest request = new MaintenanceRequest();
        request.setEquipmentId(100);
        request.setTechnicianId(5);
        request.setDescription("Routine belt replacement");
        request.setMaintenanceType("REPAIR");
        request.setCost(200.0);

        when(equipmentRepository.findById(100)).thenReturn(Optional.of(equipment));
        when(userRepository.findById(5)).thenReturn(Optional.of(technician));
        when(maintenanceRepository.save(any(Maintenance.class))).thenAnswer(i -> {
            Maintenance m = i.getArgument(0);
            m.setId(1);
            return m;
        });

        Maintenance result = maintenanceService.create(request);

        assertNotNull(result);
        assertEquals("PENDING", result.getStatus());
        assertEquals("REPAIR", result.getMaintenanceType());
        assertEquals(technician, result.getTechnician());
        verify(equipmentRepository).save(argThat(e -> "UNDER_MAINTENANCE".equals(e.getStatus())));
        verify(notificationService).create(eq(5), contains("Work Order Assigned"), eq("MAINTENANCE"));
    }

    @Test
    @DisplayName("complete should mark maintenance as COMPLETED and reset equipment status to AVAILABLE")
    void testComplete_Success() {
        equipment.setStatus("UNDER_MAINTENANCE");

        Maintenance maintenance = new Maintenance();
        maintenance.setId(1);
        maintenance.setEquipment(equipment);
        maintenance.setTechnician(technician);
        maintenance.setStatus("PENDING");
        maintenance.setMaintenanceType("CALIBRATION");
        maintenance.setWorkOrderNumber("WO-999");

        when(maintenanceRepository.findById(1)).thenReturn(Optional.of(maintenance));
        when(maintenanceRepository.save(any(Maintenance.class))).thenAnswer(i -> i.getArgument(0));

        Maintenance completed = maintenanceService.complete(1);

        assertEquals("COMPLETED", completed.getStatus());
        verify(equipmentRepository).save(argThat(e ->
                "AVAILABLE".equals(e.getStatus()) &&
                "VALID".equals(e.getCalibrationStatus()) &&
                e.getLastCalibrationDate() != null
        ));
        verify(notificationService).create(eq(5), contains("COMPLETED"), eq("MAINTENANCE"));
    }
}
