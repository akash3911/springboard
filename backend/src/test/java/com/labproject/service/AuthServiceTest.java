package com.labproject.service;

import com.labproject.dto.AuthResponse;
import com.labproject.dto.LoginRequest;
import com.labproject.dto.RegisterRequest;
import com.labproject.entity.Department;
import com.labproject.entity.Institution;
import com.labproject.entity.User;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.InstitutionRepository;
import com.labproject.repository.UserRepository;
import com.labproject.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private InstitutionRepository institutionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private Department sampleDepartment;
    private Institution sampleInstitution;

    @BeforeEach
    void setUp() {
        sampleInstitution = new Institution();
        sampleInstitution.setId(1);
        sampleInstitution.setName("Tech University");

        sampleDepartment = new Department();
        sampleDepartment.setId(10);
        sampleDepartment.setName("Physics Lab");
        sampleDepartment.setInstitution(sampleInstitution);

        sampleUser = new User();
        sampleUser.setId(100);
        sampleUser.setName("Dr. Smith");
        sampleUser.setEmail("smith@tech.edu");
        sampleUser.setPassword("encodedPassword");
        sampleUser.setRole("FACULTY");
        sampleUser.setDepartment(sampleDepartment);
        sampleUser.setInstitution(sampleInstitution);
    }

    @Test
    @DisplayName("Login should return AuthResponse on valid credentials")
    void testLogin_Success() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("smith@tech.edu");
        loginRequest.setPassword("password123");

        when(userRepository.findByEmail("smith@tech.edu")).thenReturn(Optional.of(sampleUser));
        when(jwtUtil.generateToken("smith@tech.edu")).thenReturn("mock-jwt-token");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("smith@tech.edu", response.getEmail());
        assertEquals("FACULTY", response.getRole());
        assertNotNull(response.getDepartment());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("Login should throw Exception when user is not found")
    void testLogin_UserNotFound() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail("nonexistent@tech.edu");
        loginRequest.setPassword("password123");

        when(userRepository.findByEmail("nonexistent@tech.edu")).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> authService.login(loginRequest));
    }

    @Test
    @DisplayName("Register should successfully create user with department")
    void testRegister_SuccessWithDepartment() {
        RegisterRequest regRequest = new RegisterRequest();
        regRequest.setName("Jane Doe");
        regRequest.setEmail("jane@tech.edu");
        regRequest.setPassword("password123");
        regRequest.setRole("STUDENT");
        regRequest.setDepartmentId(10);

        when(userRepository.findByEmail("jane@tech.edu")).thenReturn(Optional.empty());
        when(departmentRepository.findById(10)).thenReturn(Optional.of(sampleDepartment));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(101);
            return u;
        });
        when(jwtUtil.generateToken("jane@tech.edu")).thenReturn("mock-jwt-token");

        AuthResponse response = authService.register(regRequest);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertEquals("jane@tech.edu", response.getEmail());
        assertEquals("STUDENT", response.getRole());
        assertNotNull(response.getDepartment());
    }

    @Test
    @DisplayName("Register should throw exception if email is already registered")
    void testRegister_DuplicateEmail() {
        RegisterRequest regRequest = new RegisterRequest();
        regRequest.setEmail("smith@tech.edu");

        when(userRepository.findByEmail("smith@tech.edu")).thenReturn(Optional.of(sampleUser));

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.register(regRequest));
        assertEquals("Email already registered", exception.getMessage());
    }
}
