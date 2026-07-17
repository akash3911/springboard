package com.labproject.controller;

import com.labproject.entity.Department;
import com.labproject.entity.User;
import com.labproject.service.DepartmentService;
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
    private final DepartmentService departmentService;

    public UserController(UserService userService, DepartmentService departmentService) {
        this.userService = userService;
        this.departmentService = departmentService;
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
                
                // Lab Managers and Dept Heads should only see their own department users
                if ("LAB_MANAGER".equals(currentUser.getRole()) || "DEPARTMENT_HEAD".equals(currentUser.getRole())) {
                    Integer deptId = currentUser.getDepartment().getId();
                    users = users.stream().filter(u -> u.getDepartment() != null && deptId.equals(u.getDepartment().getId())).toList();
                }

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

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("name");
            String email = (String) body.get("email");
            String password = (String) body.get("password");
            String role = (String) body.get("role");
            Integer departmentId = (Integer) body.get("departmentId");

            if (name == null || email == null || password == null || role == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name, email, password, and role are required"));
            }

            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(password);
            user.setRole(role);

            if (departmentId != null) {
                Department dept = departmentService.findById(departmentId);
                user.setDepartment(dept);
            }

            User saved = userService.create(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("name");
            String email = (String) body.get("email");
            Integer departmentId = (Integer) body.get("departmentId");

            User user = new User();
            user.setName(name);
            user.setEmail(email);

            if (departmentId != null) {
                Department dept = departmentService.findById(departmentId);
                user.setDepartment(dept);
            }

            User updated = userService.update(id, user);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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

    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            String password = body.get("password");
            if (password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
            }
            User user = userService.resetPassword(id, password);
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
