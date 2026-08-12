package com.labproject.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.BookingRequest;
import com.labproject.dto.EquipmentRequest;
import com.labproject.dto.RegisterRequest;
import com.labproject.dto.WaitlistRequest;
import com.labproject.entity.Booking;
import com.labproject.entity.Equipment;
import com.labproject.entity.Waitlist;
import com.labproject.repository.BookingRepository;
import com.labproject.repository.EquipmentRepository;
import com.labproject.repository.WaitlistRepository;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookingAndWaitlistWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AuthService authService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private WaitlistRepository waitlistRepository;

    private String userAToken;
    private String userBToken;
    private Integer equipmentId;

    @BeforeEach
    void setUp() throws Exception {
        // Register User A
        RegisterRequest regA = new RegisterRequest();
        regA.setName("Alice Researcher");
        regA.setEmail("alice.workflow@lab.org");
        regA.setPassword("Pass1234!");
        regA.setRole("FACULTY");
        userAToken = authService.register(regA).getToken();

        // Register User B
        RegisterRequest regB = new RegisterRequest();
        regB.setName("Bob Researcher");
        regB.setEmail("bob.workflow@lab.org");
        regB.setPassword("Pass1234!");
        regB.setRole("FACULTY");
        userBToken = authService.register(regB).getToken();

        // Create Equipment
        Equipment equipment = new Equipment();
        equipment.setName("Sequencer 9000");
        equipment.setCategory("Genomics");
        equipment.setManufacturer("Illumina");
        equipment.setModel("Novaseq 6000");
        equipment.setStatus("AVAILABLE");
        equipment.setHourlyRate(150.0);
        equipment.setIsRestricted(false);
        Equipment saved = equipmentRepository.save(equipment);
        equipmentId = saved.getId();
    }

    @Test
    @DisplayName("End-to-End Workflow: Booking creation -> Approval -> Overlap rejection -> Waitlist join -> Cancellation -> Waitlist promotion")
    void testBookingAndWaitlistWorkflow() throws Exception {
        LocalDateTime startSlot = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0);
        LocalDateTime endSlot = startSlot.plusHours(3);

        // Step 1: User A submits Booking request
        BookingRequest requestA = new BookingRequest();
        requestA.setEquipmentId(equipmentId);
        requestA.setStartTime(startSlot);
        requestA.setEndTime(endSlot);
        requestA.setPurpose("Gene Sequencing Project A");

        String bookingAResponse = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestA)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.totalCost").value(450.0)) // 3 hours * $150
                .andReturn().getResponse().getContentAsString();

        Booking bookingA = objectMapper.readValue(bookingAResponse, Booking.class);
        Integer bookingAId = bookingA.getId();

        // Step 2: Manager approves User A's booking
        mockMvc.perform(put("/api/bookings/" + bookingAId + "/approve")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Verify equipment is now BOOKED
        Equipment bookedEq = equipmentRepository.findById(equipmentId).orElseThrow();
        assertEquals("BOOKED", bookedEq.getStatus());

        // Step 3: User B tries to book overlapping slot -> Fails with 400 Bad Request
        BookingRequest requestB = new BookingRequest();
        requestB.setEquipmentId(equipmentId);
        requestB.setStartTime(startSlot.plusHours(1));
        requestB.setEndTime(endSlot.plusHours(1));
        requestB.setPurpose("Conflicting Gene Project B");

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestB)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("already booked")));

        // Step 4: User B joins the Waitlist for this equipment
        WaitlistRequest waitlistReq = new WaitlistRequest();
        waitlistReq.setEquipmentId(equipmentId);
        waitlistReq.setStartTime(startSlot);
        waitlistReq.setEndTime(endSlot);

        String waitlistResponse = mockMvc.perform(post("/api/waitlist")
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(waitlistReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        Waitlist waitlistEntry = objectMapper.readValue(waitlistResponse, Waitlist.class);
        Integer waitlistId = waitlistEntry.getId();

        // Step 5: User A cancels Booking
        mockMvc.perform(put("/api/bookings/" + bookingAId + "/cancel")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        // Step 6: Manager approves Waitlist entry for User B -> Auto-creates approved booking for User B
        mockMvc.perform(put("/api/waitlist/" + waitlistId + "/approve")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.purpose").value("Promoted from Waitlist"));

        // Verify equipment remains BOOKED under User B
        Equipment reBookedEq = equipmentRepository.findById(equipmentId).orElseThrow();
        assertEquals("BOOKED", reBookedEq.getStatus());
    }
}
