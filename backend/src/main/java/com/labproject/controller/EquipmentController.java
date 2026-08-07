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
        String role = currentUser.getRole();
        if ("SYSTEM_ADMIN".equals(role)) {
            list = equipmentService.findAll();
        } else if ("INSTITUTION_HEAD".equals(role)) {
            if (currentUser.getInstitution() != null) {
                list = equipmentService.findByInstitutionId(currentUser.getInstitution().getId());
            } else if (currentUser.getDepartment() != null && currentUser.getDepartment().getInstitution() != null) {
                list = equipmentService.findByInstitutionId(currentUser.getDepartment().getInstitution().getId());
            } else {
                list = equipmentService.findAll();
            }
        } else if ("DEPARTMENT_HEAD".equals(role) || "LAB_MANAGER".equals(role) || "LAB_TECHNICIAN".equals(role)) {
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

    @PutMapping("/{id}/calibration")
    public ResponseEntity<Equipment> recordCalibration(@PathVariable Integer id, @RequestBody EquipmentRequest request) {
        try {
            return ResponseEntity.ok(equipmentService.recordCalibration(id, request));
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
