package com.labproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.MaintenanceRequest;
import com.labproject.entity.Maintenance;
import com.labproject.security.JwtUtil;
import com.labproject.security.UserDetailsServiceImpl;
import com.labproject.service.MaintenanceService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = MaintenanceController.class)
@AutoConfigureMockMvc(addFilters = false)
class MaintenanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MaintenanceService maintenanceService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    private Maintenance maintenance;

    @BeforeEach
    void setUp() {
        maintenance = new Maintenance();
        maintenance.setId(1);
        maintenance.setStatus("PENDING");
        maintenance.setWorkOrderNumber("WO-100");
    }

    @Test
    @WithMockUser(username = "tech@lab.org")
    @DisplayName("GET /api/maintenance should return all maintenance records")
    void testGetAll() throws Exception {
        when(maintenanceService.findAll()).thenReturn(List.of(maintenance));

        mockMvc.perform(get("/api/maintenance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].workOrderNumber").value("WO-100"));
    }

    @Test
    @WithMockUser(username = "tech@lab.org")
    @DisplayName("POST /api/maintenance should create work order")
    void testSchedule_Success() throws Exception {
        MaintenanceRequest req = new MaintenanceRequest();
        req.setEquipmentId(100);

        when(maintenanceService.create(any(MaintenanceRequest.class))).thenReturn(maintenance);

        mockMvc.perform(post("/api/maintenance")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    @WithMockUser(username = "tech@lab.org")
    @DisplayName("PUT /api/maintenance/{id}/complete should complete work order")
    void testComplete_Success() throws Exception {
        maintenance.setStatus("COMPLETED");
        when(maintenanceService.complete(1)).thenReturn(maintenance);

        mockMvc.perform(put("/api/maintenance/1/complete"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }
}
