package com.labproject.dto;

import java.time.LocalDate;

public class MaintenanceRequest {
    private Integer equipmentId;
    private LocalDate maintenanceDate;
    private LocalDate scheduledDate;
    private String description;
    private LocalDate nextDueDate;
    private Integer technicianId;

    public Integer getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Integer equipmentId) { this.equipmentId = equipmentId; }

    public LocalDate getMaintenanceDate() { return maintenanceDate; }
    public void setMaintenanceDate(LocalDate maintenanceDate) { this.maintenanceDate = maintenanceDate; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getNextDueDate() { return nextDueDate; }
    public void setNextDueDate(LocalDate nextDueDate) { this.nextDueDate = nextDueDate; }

    public Integer getTechnicianId() { return technicianId; }
    public void setTechnicianId(Integer technicianId) { this.technicianId = technicianId; }
}
