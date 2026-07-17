package com.labproject.dto;

import java.time.LocalDateTime;

public class BookingRequest {
    private Integer equipmentId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;

    public Integer getEquipmentId() { return equipmentId; }
    public void setEquipmentId(Integer equipmentId) { this.equipmentId = equipmentId; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
}
