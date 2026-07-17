package com.labproject.controller;

import com.labproject.entity.Department;
import com.labproject.entity.Institution;
import com.labproject.service.DepartmentService;
import com.labproject.service.InstitutionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@CrossOrigin(origins = "http://localhost:5173")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final InstitutionService institutionService;

    public DepartmentController(DepartmentService departmentService, InstitutionService institutionService) {
        this.departmentService = departmentService;
        this.institutionService = institutionService;
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.findAll());
    }

    @GetMapping("/institution/{instId}")
    public ResponseEntity<List<Department>> getDepartmentsByInstitution(@PathVariable Integer instId) {
        return ResponseEntity.ok(departmentService.findByInstitutionId(instId));
    }

    @PostMapping
    public ResponseEntity<?> createDepartment(@RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("name");
            Integer institutionId = (Integer) body.get("institutionId");

            if (name == null || institutionId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name and institutionId are required"));
            }

            Institution institution = institutionService.findById(institutionId);
            Department department = new Department();
            department.setName(name);
            department.setInstitution(institution);

            Department saved = departmentService.create(department);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Integer id) {
        try {
            departmentService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
