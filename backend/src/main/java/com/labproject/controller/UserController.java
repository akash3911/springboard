package com.labproject.controller;

import com.labproject.entity.User;
import com.labproject.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    private Integer getUserInstitutionId(User user) {
        if (user.getInstitution() != null) {
            return user.getInstitution().getId();
        }
        if (user.getDepartment() != null && user.getDepartment().getInstitution() != null) {
            return user.getDepartment().getInstitution().getId();
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(
            @RequestParam(required = false) String role) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.findByEmail(email);

        List<User> list;
        if (currentUser.getRole().equals("SYSTEM_ADMIN")) {
            list = userService.findAll();
        } else {
            // Restrict returned list to users in their institution
            Integer instId = getUserInstitutionId(currentUser);
            if (instId != null) {
                list = userService.findByInstitutionId(instId);
            } else {
                list = List.of(currentUser);
            }
        }

        if (role != null && !role.isEmpty()) {
            list = list.stream().filter(u -> u.getRole().equalsIgnoreCase(role)).toList();
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(userService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        try {
            User user = new User();
            user.setName((String) body.get("name"));
            user.setEmail((String) body.get("email"));
            user.setPassword((String) body.get("password"));
            user.setRole((String) body.get("role"));

            Integer deptId = body.get("departmentId") != null ? ((Number) body.get("departmentId")).intValue() : null;
            Integer instId = body.get("institutionId") != null ? ((Number) body.get("institutionId")).intValue() : null;

            // Scoping validation for non-SYSTEM_ADMIN
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userService.findByEmail(email);
            if (!currentUser.getRole().equals("SYSTEM_ADMIN")) {
                Integer callerInstId = getUserInstitutionId(currentUser);
                if (callerInstId != null) {
                    instId = callerInstId; // Force to caller's institution
                }
            }

            return ResponseEntity.ok(userService.create(user, deptId, instId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            User details = new User();
            details.setName((String) body.get("name"));
            details.setEmail((String) body.get("email"));
            if (body.containsKey("role")) {
                details.setRole((String) body.get("role"));
            }

            Integer deptId = body.get("departmentId") != null ? ((Number) body.get("departmentId")).intValue() : null;
            Integer instId = body.get("institutionId") != null ? ((Number) body.get("institutionId")).intValue() : null;

            // Scoping validation for non-SYSTEM_ADMIN
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userService.findByEmail(email);
            if (!currentUser.getRole().equals("SYSTEM_ADMIN")) {
                Integer callerInstId = getUserInstitutionId(currentUser);
                if (callerInstId != null) {
                    instId = callerInstId; // Force to caller's institution
                }
            }

            return ResponseEntity.ok(userService.update(id, details, deptId, instId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateRole(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body) {
        try {
            String role = body.get("role");
            return ResponseEntity.ok(userService.updateRole(id, role));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            String password = body.get("password");
            return ResponseEntity.ok(userService.resetPassword(id, password));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            userService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
