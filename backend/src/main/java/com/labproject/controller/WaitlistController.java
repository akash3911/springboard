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

    @PostMapping
    public ResponseEntity<Waitlist> joinWaitlist(@RequestBody Map<String, Integer> body) {
        try {
            Integer equipmentId = body.get("equipmentId");
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            return ResponseEntity.ok(waitlistService.joinWaitlist(equipmentId, email));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<Waitlist>> getByEquipment(@PathVariable Integer equipmentId) {
        return ResponseEntity.ok(waitlistService.findByEquipmentId(equipmentId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Waitlist>> getMyWaitlist() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Waitlist> list = waitlistService.findAll().stream()
                .filter(w -> w.getUser().getEmail().equals(email))
                .toList();
        return ResponseEntity.ok(list);
    }
}
