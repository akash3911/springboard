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
    private String specifications;
    private String description;
}
