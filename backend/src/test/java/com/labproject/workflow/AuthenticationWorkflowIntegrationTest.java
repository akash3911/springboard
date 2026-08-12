package com.labproject.workflow;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.AuthResponse;
import com.labproject.dto.LoginRequest;
import com.labproject.dto.RegisterRequest;
import com.labproject.security.JwtUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthenticationWorkflowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    @DisplayName("End-to-End Workflow: Register user -> Login -> Authenticate with JWT -> Access protected endpoint")
    void testAuthenticationAndAuthorizationWorkflow() throws Exception {
        // Step 1: Register a new user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setName("Integration Test User");
        registerRequest.setEmail("integration.user@lab.org");
        registerRequest.setPassword("SecretPass123!");
        registerRequest.setRole("FACULTY");

        String registerResponseBody = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email").value("integration.user@lab.org"))
                .andReturn().getResponse().getContentAsString();

        AuthResponse regAuthResponse = objectMapper.readValue(registerResponseBody, AuthResponse.class);
        assertNotNull(regAuthResponse.getToken());
        assertTrue(jwtUtil.validateToken(regAuthResponse.getToken()));

        // Step 2: Login with the registered user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("integration.user@lab.org");
        loginRequest.setPassword("SecretPass123!");

        String loginResponseBody = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn().getResponse().getContentAsString();

        AuthResponse loginAuthResponse = objectMapper.readValue(loginResponseBody, AuthResponse.class);
        String jwtToken = loginAuthResponse.getToken();

        // Step 3: Access protected endpoint using JWT token in Authorization header
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("integration.user@lab.org"))
                .andExpect(jsonPath("$.role").value("FACULTY"));
    }
}
