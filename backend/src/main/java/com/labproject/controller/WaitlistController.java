package com.labproject.controller;

import com.labproject.entity.User;
import com.labproject.entity.Waitlist;
import com.labproject.service.UserService;
import com.labproject.service.WaitlistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/waitlist")
@CrossOrigin(origins = "http://localhost:5173")
public class WaitlistController {

    private final WaitlistService waitlistService;
    private final UserService userService;

    public WaitlistController(WaitlistService waitlistService, UserService userService) {
        this.waitlistService = waitlistService;
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<?> joinWaitlist(@RequestBody Map<String, Integer> body) {
        try {
            Integer equipmentId = body.get("equipmentId");
            if (equipmentId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "equipmentId is required"));
            }
            String email = SecurityContextHolder.getContext().getAuthentication().getName();
            Waitlist waitlist = waitlistService.joinWaitlist(equipmentId, email);
            return ResponseEntity.ok(waitlist);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<List<Waitlist>> getWaitlistByEquipment(@PathVariable Integer equipmentId) {
        return ResponseEntity.ok(waitlistService.findByEquipmentId(equipmentId));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Waitlist>> getMyWaitlist() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userService.findByEmail(email);
        return ResponseEntity.ok(waitlistService.findByUserId(user.getId()));
    }
}
