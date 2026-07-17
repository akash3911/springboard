package com.labproject.controller;

import com.labproject.entity.User;
import com.labproject.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(@RequestParam(required = false) String role) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.findByEmail(email);

        List<User> users;
        if ("SYSTEM_ADMIN".equals(currentUser.getRole())) {
            if (role != null) {
                users = userService.findByRole(role);
            } else {
                users = userService.findAll();
            }
        } else if ("INSTITUTION_HEAD".equals(currentUser.getRole()) 
                || "LAB_MANAGER".equals(currentUser.getRole()) 
                || "DEPARTMENT_HEAD".equals(currentUser.getRole())) {
            
            if (currentUser.getDepartment() != null && currentUser.getDepartment().getInstitution() != null) {
                Integer instId = currentUser.getDepartment().getInstitution().getId();
                users = userService.findByInstitutionId(instId);
                if (role != null) {
                    users = users.stream().filter(u -> role.equals(u.getRole())).toList();
                }
            } else {
                users = new ArrayList<>();
            }
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(userService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            String role = body.get("role");
            if (role == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
            }
            User user = userService.updateRole(id, role);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        try {
            userService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
