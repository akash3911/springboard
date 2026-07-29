package com.labproject.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MaintenanceRequest {
    private Integer equipmentId;
    private LocalDate maintenanceDate;
    private String description;
    private LocalDate nextDueDate;
    private Integer technicianId;
    private Double cost;
    private String maintenanceType;
    private String workOrderNumber;
}
