package com.labproject.controller;

import com.labproject.dto.EquipmentRequest;
import com.labproject.entity.Equipment;
import com.labproject.entity.User;
import com.labproject.service.EquipmentService;
import com.labproject.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EquipmentController {

    private final EquipmentService equipmentService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Equipment>> getAllEquipment(
            @RequestParam(required = false) String status) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userService.findByEmail(email);

        List<Equipment> list;
        if ("LAB_MANAGER".equals(currentUser.getRole())) {
            // Lab Manager MUST ONLY see equipment belonging to their own lab/department
            if (currentUser.getDepartment() != null) {
                list = equipmentService.findByDepartmentId(currentUser.getDepartment().getId());
            } else {
                list = List.of();
            }
        } else {
            list = equipmentService.findAll();
        }

        if (status != null && !status.isEmpty()) {
            list = list.stream().filter(e -> e.getStatus().equalsIgnoreCase(status)).toList();
        }
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getById(@PathVariable Integer id) {
        try {
            Equipment eq = equipmentService.findById(id);
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userService.findByEmail(email);

            if ("LAB_MANAGER".equals(currentUser.getRole())) {
                if (currentUser.getDepartment() == null || 
                    eq.getDepartment() == null || 
                    !currentUser.getDepartment().getId().equals(eq.getDepartment().getId())) {
                    return ResponseEntity.status(403).build(); // Block viewing equipment of other labs
                }
            }

            if (currentUser.getRole().equals("STUDENT") && Boolean.TRUE.equals(eq.getIsRestricted())) {
                return ResponseEntity.status(403).build();
            }

            return ResponseEntity.ok(eq);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Equipment> create(@RequestBody EquipmentRequest request) {
        try {
            return ResponseEntity.ok(equipmentService.create(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Equipment> update(@PathVariable Integer id, @RequestBody EquipmentRequest request) {
        try {
            return ResponseEntity.ok(equipmentService.update(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            equipmentService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Equipment>> getByDepartment(@PathVariable Integer deptId) {
        return ResponseEntity.ok(equipmentService.findByDepartmentId(deptId));
    }

    @GetMapping("/institution/{instId}")
    public ResponseEntity<List<Equipment>> getByInstitution(@PathVariable Integer instId) {
        return ResponseEntity.ok(equipmentService.findByInstitutionId(instId));
    }
}
