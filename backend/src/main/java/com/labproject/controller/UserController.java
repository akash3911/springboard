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
            if (currentUser.getDepartment() != null && currentUser.getDepartment().getInstitution() != null) {
                Integer instId = currentUser.getDepartment().getInstitution().getId();
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
