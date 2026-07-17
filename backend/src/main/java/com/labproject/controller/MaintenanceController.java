package com.labproject.controller;

import com.labproject.dto.MaintenanceRequest;
import com.labproject.entity.Maintenance;
import com.labproject.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    @GetMapping
    public ResponseEntity<List<Maintenance>> getAll() {
        return ResponseEntity.ok(maintenanceService.findAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Maintenance>> getMyMaintenance() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Maintenance> list = maintenanceService.findAll().stream()
                .filter(m -> m.getTechnician() != null && m.getTechnician().getEmail().equals(email))
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Maintenance>> getByDepartment(@PathVariable Integer deptId) {
        return ResponseEntity.ok(maintenanceService.findByDepartmentId(deptId));
    }

    @PostMapping
    public ResponseEntity<Maintenance> schedule(@RequestBody MaintenanceRequest request) {
        try {
            return ResponseEntity.ok(maintenanceService.create(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Maintenance> complete(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(maintenanceService.complete(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
