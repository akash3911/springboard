package com.labproject.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "equipment")
public class Equipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 100)
    private String manufacturer;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "is_shared")
    private Boolean isShared;

    @Column(name = "is_restricted")
    private Boolean isRestricted;

    @Column(name = "room_number", length = 50)
    private String roomNumber;

    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String specifications;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "operating_instructions", columnDefinition = "TEXT")
    private String operatingInstructions;

    @Column(name = "safety_guidelines", columnDefinition = "TEXT")
    private String safetyGuidelines;

    @Column(name = "maintenance_guide", columnDefinition = "TEXT")
    private String maintenanceGuide;

    @Column(name = "hourly_rate")
    private Double hourlyRate = 45.0;

    @Column(name = "last_calibration_date")
    private LocalDate lastCalibrationDate;

    @Column(name = "next_calibration_date")
    private LocalDate nextCalibrationDate;

    @Column(name = "calibration_status", length = 50)
    private String calibrationStatus = "VALID";
}
