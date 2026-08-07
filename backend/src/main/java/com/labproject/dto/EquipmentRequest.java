package com.labproject.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class EquipmentRequest {
    private Integer departmentId;
    private String name;
    private String category;
    private String manufacturer;
    private String model;
    private String serialNumber;
    private String status;
    private LocalDate purchaseDate;
    private Boolean isShared;
    private Boolean isRestricted;
    private String roomNumber;
    private String contactEmail;
    private String imageUrl;
    private String specifications;
    private String description;
    private String operatingInstructions;
    private String safetyGuidelines;
    private String maintenanceGuide;
    private Double hourlyRate;
    private LocalDate lastCalibrationDate;
    private LocalDate nextCalibrationDate;
    private String calibrationStatus;
    private String certificateNumber;
    private String certificateAgency;
    private String certificateType;
    private String certificateUrl;
    private String notes;
    private Double cost;
}
