package com.labproject.controller;

import com.labproject.dto.MaintenanceRequest;
import com.labproject.entity.Maintenance;
import com.labproject.entity.User;
import com.labproject.service.MaintenanceService;
import com.labproject.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin(origins = "http://localhost:5173")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;
    private final UserService userService;

    public MaintenanceController(MaintenanceService maintenanceService, UserService userService) {
        this.maintenanceService = maintenanceService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Maintenance>> getAllMaintenance() {
        return ResponseEntity.ok(maintenanceService.findAll());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Maintenance>> getMyMaintenance() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(maintenanceService.findByTechnicianId(user.getId()));
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Maintenance>> getMaintenanceByDepartment(@PathVariable Integer deptId) {
        return ResponseEntity.ok(maintenanceService.findByDepartmentId(deptId));
    }

    @PostMapping
    public ResponseEntity<?> scheduleMaintenance(@RequestBody MaintenanceRequest request) {
        try {
            Maintenance maintenance = maintenanceService.create(request);
            return ResponseEntity.ok(maintenance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeMaintenance(@PathVariable Integer id) {
        try {
            Maintenance maintenance = maintenanceService.complete(id);
            return ResponseEntity.ok(maintenance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
