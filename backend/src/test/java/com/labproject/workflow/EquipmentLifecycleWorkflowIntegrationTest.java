package com.labproject.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.EquipmentRequest;
import com.labproject.dto.MaintenanceRequest;
import com.labproject.entity.Equipment;
import com.labproject.entity.Maintenance;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.MaintenanceRepository;
import com.labproject.security.JwtUtil;
import com.labproject.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class EquipmentLifecycleWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private MaintenanceRepository maintenanceRepository;

    @Test
    @WithMockUser(username = "admin@lab.org", roles = {"SYSTEM_ADMIN"})
    @DisplayName("End-to-End Workflow: Create equipment -> Maintenance schedule -> Maintenance complete -> Calibration renewal")
    void testEquipmentLifecycleWorkflow() throws Exception {
        // Step 1: Create new Equipment
        EquipmentRequest createReq = new EquipmentRequest();
        createReq.setName("Flow Cytometer Alpha");
        createReq.setCategory("Cytometry");
        createReq.setManufacturer("BD Biosciences");
        createReq.setModel("FACSCelesta");
        createReq.setHourlyRate(120.0);
        createReq.setStatus("AVAILABLE");

        String eqResponseBody = mockMvc.perform(post("/api/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andReturn().getResponse().getContentAsString();

        Equipment createdEquipment = objectMapper.readValue(eqResponseBody, Equipment.class);
        Integer equipmentId = createdEquipment.getId();

        // Step 2: Schedule Maintenance for Equipment
        MaintenanceRequest maintReq = new MaintenanceRequest();
        maintReq.setEquipmentId(equipmentId);
        maintReq.setDescription("Laser optical alignment");
        maintReq.setMaintenanceType("REPAIR");
        maintReq.setCost(350.0);

        String maintResponseBody = mockMvc.perform(post("/api/maintenance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(maintReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        Maintenance maintenance = objectMapper.readValue(maintResponseBody, Maintenance.class);
        Integer maintenanceId = maintenance.getId();

        // Verify equipment status changed to UNDER_MAINTENANCE
        Equipment underMaintEq = equipmentRepository.findById(equipmentId).orElseThrow();
        assertEquals("UNDER_MAINTENANCE", underMaintEq.getStatus());

        // Step 3: Complete Maintenance Work Order
        mockMvc.perform(put("/api/maintenance/" + maintenanceId + "/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));

        // Verify equipment status returned to AVAILABLE
        Equipment restoredEq = equipmentRepository.findById(equipmentId).orElseThrow();
        assertEquals("AVAILABLE", restoredEq.getStatus());

        // Step 4: Record Calibration for Equipment
        EquipmentRequest calibReq = new EquipmentRequest();
        calibReq.setLastCalibrationDate(LocalDate.now());
        calibReq.setNextCalibrationDate(LocalDate.now().plusMonths(12));
        calibReq.setCalibrationStatus("VALID");
        calibReq.setCertificateNumber("CERT-BD-2026-99");
        calibReq.setCertificateAgency("National Calibration Lab");

        mockMvc.perform(put("/api/equipment/" + equipmentId + "/calibration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(calibReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calibrationStatus").value("VALID"))
                .andExpect(jsonPath("$.certificateNumber").value("CERT-BD-2026-99"));

        // Verify calibration maintenance log entry was automatically created
        List<Maintenance> logs = maintenanceRepository.findByEquipmentId(equipmentId);
        assertTrue(logs.stream().anyMatch(m -> "CALIBRATION".equalsIgnoreCase(m.getMaintenanceType())));
    }
}
