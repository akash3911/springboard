package com.labproject.service;

import com.labproject.dto.AuthResponse;
import com.labproject.dto.LoginRequest;
import com.labproject.dto.RegisterRequest;
import com.labproject.entity.Department;
import com.labproject.entity.User;
import com.labproject.repository.DepartmentRepository;
import com.labproject.repository.UserRepository;
import com.labproject.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository,
                       DepartmentRepository departmentRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.departmentRepository = departmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());
        return buildAuthResponse(user, token);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : "STUDENT");

        if (request.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException("Department not found"));
            user.setDepartment(dept);
        }

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return buildAuthResponse(user, token);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole());

        if (user.getDepartment() != null) {
            Map<String, Object> deptMap = new HashMap<>();
            deptMap.put("id", user.getDepartment().getId());
            deptMap.put("name", user.getDepartment().getName());

            if (user.getDepartment().getInstitution() != null) {
                Map<String, Object> instMap = new HashMap<>();
                instMap.put("id", user.getDepartment().getInstitution().getId());
                instMap.put("name", user.getDepartment().getInstitution().getName());
                deptMap.put("institution", instMap);
            }

            response.setDepartment(deptMap);
        }

        return response;
    }
}
