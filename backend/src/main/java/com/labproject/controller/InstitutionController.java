package com.labproject.controller;

import com.labproject.entity.Institution;
import com.labproject.service.InstitutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/institutions")
@CrossOrigin(origins = "http://localhost:5173")
public class InstitutionController {

    private final InstitutionService institutionService;

    public InstitutionController(InstitutionService institutionService) {
        this.institutionService = institutionService;
    }

    @GetMapping
    public ResponseEntity<List<Institution>> getAllInstitutions() {
        return ResponseEntity.ok(institutionService.findAll());
    }

    @PostMapping
    public ResponseEntity<Institution> createInstitution(@RequestBody Institution institution) {
        return ResponseEntity.ok(institutionService.create(institution));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInstitution(@PathVariable Integer id, @RequestBody Institution institution) {
        try {
            Institution updated = institutionService.update(id, institution);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInstitution(@PathVariable Integer id) {
        try {
            institutionService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
