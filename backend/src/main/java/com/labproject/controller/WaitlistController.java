package com.labproject.controller;

import com.labproject.entity.Waitlist;
import com.labproject.service.WaitlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/waitlist")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class WaitlistController {

    private final WaitlistService waitlistService;

    @GetMapping
    public ResponseEntity<List<Waitlist>> getAllWaitlist() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(waitlistService.findForUser(email));
    }

    @PostMapping
    public ResponseEntity<?> joinWaitlist(@RequestBody Map<String, Integer> body) {
        try {
            Integer equipmentId = body.get("equipmentId");
            if (equipmentId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "equipmentId is required"));
            }
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(waitlistService.joinWaitlist(equipmentId, email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelWaitlist(@PathVariable Integer id) {
        try {
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            waitlistService.cancelWaitlist(id, email);
            return ResponseEntity.ok(Map.of("message", "Waitlist entry cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<Waitlist>> getByEquipment(@PathVariable Integer equipmentId) {
        return ResponseEntity.ok(waitlistService.findByEquipmentId(equipmentId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Waitlist>> getMyWaitlist() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(waitlistService.findForUser(email));
    }
}
