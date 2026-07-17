package com.labproject.controller;

import com.labproject.entity.Department;
import com.labproject.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public ResponseEntity<List<Department>> getAll() {
        return ResponseEntity.ok(departmentService.findAll());
    }

    @GetMapping("/institution/{instId}")
    public ResponseEntity<List<Department>> getByInstitution(@PathVariable Integer instId) {
        return ResponseEntity.ok(departmentService.findByInstitutionId(instId));
    }

    @PostMapping
    public ResponseEntity<Department> create(@RequestBody Department department) {
        try {
            return ResponseEntity.ok(departmentService.create(department));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            departmentService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
