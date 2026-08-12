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
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

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
            user.setInstitution(dept.getInstitution());
        } else if (request.getInstitutionId() != null) {
            Institution inst = institutionRepository.findById(request.getInstitutionId())
                    .orElseThrow(() -> new RuntimeException("Institution not found"));
            user.setInstitution(inst);
        }

        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return buildAuthResponse(user, token);
    }

    public AuthResponse processGoogleLogin(Map<String, String> body) {
        String email = body != null ? body.get("email") : null;
        String name = body != null ? body.get("name") : null;
        String credential = body != null ? body.get("credential") : null;

        if (credential != null && !credential.trim().isEmpty()) {
            try {
                String[] parts = credential.split("\\.");
                if (parts.length >= 2) {
                    String payloadJson = new String(java.util.Base64.getUrlDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
                    com.fasterxml.jackson.databind.ObjectMapper om = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode node = om.readTree(payloadJson);
                    if (node.has("email")) {
                        email = node.get("email").asText();
                    }
                    if (node.has("name")) {
                        name = node.get("name").asText();
                    }
                }
            } catch (Exception ignored) {}
        }

        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Google authentication failed: Email is required.");
        }

        return googleLogin(email, name, credential);
    }

    public AuthResponse googleLogin(String email, String name, String credentialToken) {
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            Institution guestInst = institutionRepository.findAll().stream()
                    .filter(i -> i.getName() != null && i.getName().equalsIgnoreCase("Guest University"))
                    .findFirst()
                    .orElseGet(() -> {
                        Institution inst = new Institution();
                        inst.setName("Guest University");
                        inst.setAddress("Guest Campus");
                        return institutionRepository.save(inst);
                    });

            Department guestDept = departmentRepository.findByInstitutionId(guestInst.getId()).stream()
                    .filter(d -> d.getName() != null && d.getName().equalsIgnoreCase("Guest Department"))
                    .findFirst()
                    .orElseGet(() -> {
                        Department dept = new Department();
                        dept.setName("Guest Department");
                        dept.setInstitution(guestInst);
                        return departmentRepository.save(dept);
                    });

            User newUser = new User();
            newUser.setName(name != null && !name.trim().isEmpty() ? name : email.split("@")[0]);
            newUser.setEmail(email);
            newUser.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            newUser.setRole("STUDENT");
            newUser.setDepartment(guestDept);
            newUser.setInstitution(guestInst);

            return userRepository.save(newUser);
        });

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
        } else if (user.getInstitution() != null) {
            Map<String, Object> deptMap = new HashMap<>();
            deptMap.put("id", null);
            deptMap.put("name", null);

            Map<String, Object> instMap = new HashMap<>();
            instMap.put("id", user.getInstitution().getId());
            instMap.put("name", user.getInstitution().getName());
            deptMap.put("institution", instMap);

            response.setDepartment(deptMap);
        }

        return response;
    }
}
