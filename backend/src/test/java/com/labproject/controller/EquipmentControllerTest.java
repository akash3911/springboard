package com.labproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.EquipmentRequest;
import com.labproject.entity.Department;
import com.labproject.entity.Equipment;
import com.labproject.entity.User;
import com.labproject.security.JwtUtil;
import com.labproject.security.UserDetailsServiceImpl;
import com.labproject.service.EquipmentService;
import com.labproject.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EquipmentController.class)
@AutoConfigureMockMvc(addFilters = false)
class EquipmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipmentService equipmentService;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    private User adminUser;
    private Equipment equipment;
    private Department department;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(1);
        department.setName("Physics");

        adminUser = new User();
        adminUser.setId(1);
        adminUser.setEmail("admin@lab.org");
        adminUser.setRole("SYSTEM_ADMIN");
        adminUser.setDepartment(department);

        equipment = new Equipment();
        equipment.setId(100);
        equipment.setName("Oscilloscope");
        equipment.setStatus("AVAILABLE");
        equipment.setIsRestricted(false);
        equipment.setDepartment(department);
    }

    @Test
    @WithMockUser(username = "admin@lab.org")
    @DisplayName("GET /api/equipment should return list of equipment")
    void testGetAllEquipment() throws Exception {
        when(userService.findByEmail("admin@lab.org")).thenReturn(adminUser);
        when(equipmentService.findAll()).thenReturn(List.of(equipment));

        mockMvc.perform(get("/api/equipment"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].name").value("Oscilloscope"));
    }

    @Test
    @WithMockUser(username = "admin@lab.org")
    @DisplayName("GET /api/equipment/{id} should return equipment by ID")
    void testGetById_Success() throws Exception {
        when(userService.findByEmail("admin@lab.org")).thenReturn(adminUser);
        when(equipmentService.findById(100)).thenReturn(equipment);

        mockMvc.perform(get("/api/equipment/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.name").value("Oscilloscope"));
    }

    @Test
    @WithMockUser(username = "admin@lab.org")
    @DisplayName("POST /api/equipment should create new equipment")
    void testCreate_Success() throws Exception {
        EquipmentRequest req = new EquipmentRequest();
        req.setName("NMR Machine");

        when(equipmentService.create(any(EquipmentRequest.class))).thenReturn(equipment);

        mockMvc.perform(post("/api/equipment")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Oscilloscope"));
    }

    @Test
    @WithMockUser(username = "admin@lab.org")
    @DisplayName("PUT /api/equipment/{id}/calibration should record calibration")
    void testRecordCalibration_Success() throws Exception {
        EquipmentRequest req = new EquipmentRequest();
        req.setCertificateNumber("CERT-999");

        when(equipmentService.recordCalibration(eq(100), any(EquipmentRequest.class))).thenReturn(equipment);

        mockMvc.perform(put("/api/equipment/100/calibration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "admin@lab.org")
    @DisplayName("DELETE /api/equipment/{id} should return 200 OK")
    void testDelete_Success() throws Exception {
        mockMvc.perform(delete("/api/equipment/100"))
                .andExpect(status().isOk());
    }
}
