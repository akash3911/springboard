package com.labproject.controller;

import com.labproject.entity.Utilization;
import com.labproject.service.UtilizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/utilization")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class UtilizationController {

    private final UtilizationService utilizationService;

    @GetMapping
    public ResponseEntity<List<Utilization>> getAll() {
        return ResponseEntity.ok(utilizationService.findAll());
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<Utilization>> getByEquipment(@PathVariable Integer equipmentId) {
        return ResponseEntity.ok(utilizationService.findByEquipmentId(equipmentId));
    }
}
