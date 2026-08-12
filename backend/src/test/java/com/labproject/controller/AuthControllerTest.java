package com.labproject.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labproject.dto.AuthResponse;
import com.labproject.dto.LoginRequest;
import com.labproject.dto.RegisterRequest;
import com.labproject.security.JwtUtil;
import com.labproject.security.UserDetailsServiceImpl;
import com.labproject.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private UserDetailsServiceImpl userDetailsService;

    @Test
    @DisplayName("POST /api/auth/login should return 200 OK and AuthResponse on valid credentials")
    void testLogin_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("user@lab.org");
        loginRequest.setPassword("password123");

        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken("valid-token-xyz");
        authResponse.setEmail("user@lab.org");
        authResponse.setRole("FACULTY");

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("valid-token-xyz"))
                .andExpect(jsonPath("$.email").value("user@lab.org"))
                .andExpect(jsonPath("$.role").value("FACULTY"));
    }

    @Test
    @DisplayName("POST /api/auth/login should return 401 Unauthorized on invalid credentials")
    void testLogin_Failure() throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("user@lab.org");
        loginRequest.setPassword("wrongpassword");

        when(authService.login(any(LoginRequest.class))).thenThrow(new RuntimeException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /api/auth/register should return 200 OK on successful registration")
    void testRegister_Success() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setName("John Doe");
        registerRequest.setEmail("john@lab.org");
        registerRequest.setPassword("securePass");

        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken("token-123");
        authResponse.setEmail("john@lab.org");
        authResponse.setRole("STUDENT");

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-123"))
                .andExpect(jsonPath("$.email").value("john@lab.org"));
    }

    @Test
    @DisplayName("POST /api/auth/register should return 400 Bad Request if email exists")
    void testRegister_DuplicateEmail() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setEmail("john@lab.org");

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new RuntimeException("Email already registered"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Email already registered"));
    }

    @Test
    @DisplayName("GET /api/auth/config should return googleClientId configuration")
    void testGetConfig() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/auth/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.googleClientId").exists());
    }

    @Test
    @DisplayName("POST /api/auth/google should process Google token and return AuthResponse")
    void testGoogleLogin() throws Exception {
        AuthResponse authResponse = new AuthResponse();
        authResponse.setToken("google-token-xyz");
        authResponse.setEmail("google.user@lab.org");

        when(authService.processGoogleLogin(any())).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("email", "google.user@lab.org"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("google-token-xyz"))
                .andExpect(jsonPath("$.email").value("google.user@lab.org"));
    }
}
