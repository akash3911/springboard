package com.labproject.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.BookingRequest;
import com.labproject.entity.*;
import com.labproject.repository.*;
import com.labproject.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MultiInstitutionBillingWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private User mitUser;
    private Equipment harvardEquipment;

    @BeforeEach
    void setUp() {
        // Institution 1: MIT
        Institution mit = new Institution();
        mit.setName("Massachusetts Institute of Technology");
        Institution savedMit = institutionRepository.save(mit);

        Department mitCs = new Department();
        mitCs.setName("Computer Science");
        mitCs.setInstitution(savedMit);
        Department savedMitCs = departmentRepository.save(mitCs);

        // User in MIT
        mitUser = new User();
        mitUser.setName("Dr. MIT Researcher");
        mitUser.setEmail("researcher@mit.edu");
        mitUser.setPassword(passwordEncoder.encode("Password123!"));
        mitUser.setRole("FACULTY");
        mitUser.setInstitution(savedMit);
        mitUser.setDepartment(savedMitCs);
        mitUser = userRepository.save(mitUser);

        // Institution 2: Harvard
        Institution harvard = new Institution();
        harvard.setName("Harvard University");
        Institution savedHarvard = institutionRepository.save(harvard);

        Department harvardBio = new Department();
        harvardBio.setName("Biochemistry");
        harvardBio.setInstitution(savedHarvard);
        Department savedHarvardBio = departmentRepository.save(harvardBio);

        // Equipment in Harvard
        harvardEquipment = new Equipment();
        harvardEquipment.setName("Cryo-EM Microscope");
        harvardEquipment.setCategory("Microscopy");
        harvardEquipment.setManufacturer("Thermo Fisher");
        harvardEquipment.setModel("Krios G4");
        harvardEquipment.setStatus("AVAILABLE");
        harvardEquipment.setHourlyRate(200.0);
        harvardEquipment.setIsRestricted(false);
        harvardEquipment.setDepartment(savedHarvardBio);
        harvardEquipment = equipmentRepository.save(harvardEquipment);
    }

    @Test
    @DisplayName("End-to-End Workflow: Cross-institution booking creation -> Auto cross-institution detection -> Approval -> Billing status update")
    void testCrossInstitutionBillingWorkflow() throws Exception {
        // Step 1: MIT User books Harvard Equipment
        LocalDateTime startTime = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0);
        LocalDateTime endTime = startTime.plusHours(4); // 4 hours * $200 = $800

        BookingRequest bookingReq = new BookingRequest();
        bookingReq.setEquipmentId(harvardEquipment.getId());
        bookingReq.setStartTime(startTime);
        bookingReq.setEndTime(endTime);
        bookingReq.setPurpose("Cross-University Protein Structure Analysis");

        String responseBody = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + getJwtToken(mitUser.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isCrossInstitution").value(true))
                .andExpect(jsonPath("$.totalCost").value(800.0))
                .andExpect(jsonPath("$.billingStatus").value("PENDING"))
                .andReturn().getResponse().getContentAsString();

        Booking booking = objectMapper.readValue(responseBody, Booking.class);
        Integer bookingId = booking.getId();

        // Step 2: Approve booking
        mockMvc.perform(put("/api/bookings/" + bookingId + "/approve")
                        .header("Authorization", "Bearer " + getJwtToken(mitUser.getEmail())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        // Step 3: Update billing status to BILLED
        mockMvc.perform(put("/api/bookings/" + bookingId + "/billing")
                        .header("Authorization", "Bearer " + getJwtToken(mitUser.getEmail()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("billingStatus", "BILLED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.billingStatus").value("BILLED"));

        // Step 4: Verify notification created for user regarding billing update
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(mitUser.getId());
        assertTrue(notifications.stream().anyMatch(n -> "BILLING".equals(n.getType()) && n.getMessage().contains("BILLED")));
    }

    private String getJwtToken(String email) {
        com.labproject.dto.LoginRequest req = new com.labproject.dto.LoginRequest();
        req.setEmail(email);
        req.setPassword("Password123!");
        return authService.login(req).getToken();
    }
}
