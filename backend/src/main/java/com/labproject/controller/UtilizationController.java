package com.labproject.controller;

import com.labproject.entity.Utilization;
import com.labproject.service.UtilizationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/utilization")
@CrossOrigin(origins = "http://localhost:5173")
public class UtilizationController {

    private final UtilizationService utilizationService;

    public UtilizationController(UtilizationService utilizationService) {
        this.utilizationService = utilizationService;
    }

    @GetMapping
    public ResponseEntity<List<Utilization>> getAllUtilization() {
        return ResponseEntity.ok(utilizationService.findAll());
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<Utilization>> getUtilizationByEquipment(@PathVariable Integer equipmentId) {
        return ResponseEntity.ok(utilizationService.findByEquipmentId(equipmentId));
    }
}
