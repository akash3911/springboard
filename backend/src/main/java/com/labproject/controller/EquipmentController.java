package com.labproject.controller;

import com.labproject.dto.EquipmentRequest;
import com.labproject.entity.Equipment;
import com.labproject.service.EquipmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
@CrossOrigin(origins = "http://localhost:5173")
public class EquipmentController {

    private final EquipmentService equipmentService;

    public EquipmentController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @GetMapping
    public ResponseEntity<List<Equipment>> getAllEquipment(@RequestParam(required = false) String status) {
        if (status != null) {
            return ResponseEntity.ok(equipmentService.findByStatus(status));
        }
        return ResponseEntity.ok(equipmentService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipment> getEquipmentById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(equipmentService.findById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Equipment> createEquipment(@RequestBody EquipmentRequest request) {
        return ResponseEntity.ok(equipmentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Equipment> updateEquipment(@PathVariable Integer id, @RequestBody EquipmentRequest request) {
        try {
            return ResponseEntity.ok(equipmentService.update(id, request));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEquipment(@PathVariable Integer id) {
        try {
            equipmentService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/department/{deptId}")
    public ResponseEntity<List<Equipment>> getEquipmentByDepartment(@PathVariable Integer deptId) {
        return ResponseEntity.ok(equipmentService.findByDepartmentId(deptId));
    }

    @GetMapping("/institution/{instId}")
    public ResponseEntity<List<Equipment>> getEquipmentByInstitution(@PathVariable Integer instId) {
        return ResponseEntity.ok(equipmentService.findByInstitutionId(instId));
    }
}
