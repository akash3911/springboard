package com.labproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.BookingRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.User;
import com.labproject.security.JwtUtil;
import com.labproject.security.UserDetailsServiceImpl;
import com.labproject.service.BookingService;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = BookingController.class)
@AutoConfigureMockMvc(addFilters = false)
class BookingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private WaitlistService waitlistService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    private Booking booking;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1);
        user.setEmail("researcher@lab.org");

        booking = new Booking();
        booking.setId(10);
        booking.setStatus("PENDING");
        booking.setTotalCost(150.0);
        booking.setUser(user);
    }

    @Test
    @WithMockUser(username = "researcher@lab.org")
    @DisplayName("GET /api/bookings should return list of bookings")
    void testGetAllBookings() throws Exception {
        when(bookingService.findAll()).thenReturn(List.of(booking));

        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "researcher@lab.org")
    @DisplayName("POST /api/bookings should create booking")
    void testCreateBooking_Success() throws Exception {
        BookingRequest request = new BookingRequest();
        request.setEquipmentId(100);
        request.setStartTime(LocalDateTime.now().plusHours(1));
        request.setEndTime(LocalDateTime.now().plusHours(3));

        when(bookingService.createBooking(any(BookingRequest.class), eq("researcher@lab.org")))
                .thenReturn(booking);

        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    @WithMockUser(username = "manager@lab.org")
    @DisplayName("PUT /api/bookings/{id}/approve should approve booking")
    void testApproveBooking() throws Exception {
        booking.setStatus("APPROVED");
        when(bookingService.approveBooking(10)).thenReturn(booking);

        mockMvc.perform(put("/api/bookings/10/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @WithMockUser(username = "manager@lab.org")
    @DisplayName("PUT /api/bookings/{id}/reject should reject booking with reason")
    void testRejectBooking() throws Exception {
        booking.setStatus("REJECTED");
        booking.setRejectionReason("Slot unavailable");
        when(bookingService.rejectBooking(10, "Slot unavailable")).thenReturn(booking);

        mockMvc.perform(put("/api/bookings/10/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rejectionReason", "Slot unavailable"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Slot unavailable"));
    }

    @Test
    @WithMockUser(username = "researcher@lab.org")
    @DisplayName("PUT /api/bookings/{id}/cancel should cancel booking")
    void testCancelBooking() throws Exception {
        booking.setStatus("CANCELLED");
        when(bookingService.cancelBooking(10)).thenReturn(booking);

        mockMvc.perform(put("/api/bookings/10/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @WithMockUser(username = "manager@lab.org")
    @DisplayName("PUT /api/bookings/{id}/billing should update billing status")
    void testUpdateBillingStatus() throws Exception {
        booking.setBillingStatus("BILLED");
        when(bookingService.updateBillingStatus(10, "BILLED")).thenReturn(booking);

        mockMvc.perform(put("/api/bookings/10/billing")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("billingStatus", "BILLED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.billingStatus").value("BILLED"));
    }
}
