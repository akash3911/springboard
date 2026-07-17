package com.labproject.controller;

import com.labproject.entity.Institution;
import com.labproject.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class InstitutionController {

    private final InstitutionService institutionService;

    @GetMapping
    public ResponseEntity<List<Institution>> getAll() {
        return ResponseEntity.ok(institutionService.findAll());
    }

    @PostMapping
    public ResponseEntity<Institution> create(@RequestBody Institution institution) {
        try {
            return ResponseEntity.ok(institutionService.create(institution));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Institution> update(@PathVariable Integer id, @RequestBody Institution institution) {
        try {
            return ResponseEntity.ok(institutionService.update(id, institution));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            institutionService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
