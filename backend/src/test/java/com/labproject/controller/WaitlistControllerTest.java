package com.labproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.WaitlistRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Waitlist;
import com.labproject.security.JwtUtil;
import com.labproject.security.UserDetailsServiceImpl;
import com.labproject.service.WaitlistService;
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

@WebMvcTest(controllers = WaitlistController.class)
@AutoConfigureMockMvc(addFilters = false)
class WaitlistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WaitlistService waitlistService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    private Waitlist waitlist;

    @BeforeEach
    void setUp() {
        waitlist = new Waitlist();
        waitlist.setId(5);
        waitlist.setStatus("PENDING");
    }

    @Test
    @WithMockUser(username = "user@lab.org")
    @DisplayName("GET /api/waitlist should return waitlist for current user")
    void testGetAllWaitlist() throws Exception {
        when(waitlistService.findForUser("user@lab.org")).thenReturn(List.of(waitlist));

        mockMvc.perform(get("/api/waitlist"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(5));
    }

    @Test
    @WithMockUser(username = "user@lab.org")
    @DisplayName("POST /api/waitlist should join waitlist when equipmentId is provided")
    void testJoinWaitlist_Success() throws Exception {
        WaitlistRequest req = new WaitlistRequest();
        req.setEquipmentId(100);

        when(waitlistService.joinWaitlist(any(WaitlistRequest.class), eq("user@lab.org")))
                .thenReturn(waitlist);

        mockMvc.perform(post("/api/waitlist")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5));
    }

    @Test
    @WithMockUser(username = "user@lab.org")
    @DisplayName("POST /api/waitlist should return 400 Bad Request if equipmentId is missing")
    void testJoinWaitlist_MissingEquipmentId() throws Exception {
        WaitlistRequest req = new WaitlistRequest();

        mockMvc.perform(post("/api/waitlist")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("equipmentId is required"));
    }

    @Test
    @WithMockUser(username = "manager@lab.org")
    @DisplayName("PUT /api/waitlist/{id}/approve should promote waitlist entry to booking")
    void testApproveWaitlist() throws Exception {
        Booking booking = new Booking();
        booking.setId(200);
        booking.setStatus("APPROVED");

        when(waitlistService.approveWaitlist(eq(5), eq("manager@lab.org"))).thenReturn(booking);

        mockMvc.perform(put("/api/waitlist/5/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(200))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @WithMockUser(username = "user@lab.org")
    @DisplayName("PUT /api/waitlist/{id}/cancel should cancel waitlist entry")
    void testCancelWaitlist() throws Exception {
        mockMvc.perform(put("/api/waitlist/5/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Waitlist entry cancelled successfully"));
    }
}
