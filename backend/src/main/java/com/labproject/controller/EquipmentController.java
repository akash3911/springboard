package com.labproject.controller;

import com.labproject.dto.EquipmentRequest;
import com.labproject.entity.Equipment;
import com.labproject.service.EquipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    public ResponseEntity<List<Equipment>> getAllEquipment(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ResponseEntity.ok(equipmentService.findByStatus(status));
        }
        return ResponseEntity.ok(equipmentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(equipmentService.findById(id));
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
