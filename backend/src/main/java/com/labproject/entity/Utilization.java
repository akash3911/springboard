package com.labproject.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "utilization")
public class Utilization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    @Column(name = "usage_hours", nullable = false, precision = 10, scale = 2)
    private BigDecimal usageHours;

    @Column(name = "utilization_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal utilizationPercentage;

    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Equipment getEquipment() { return equipment; }
    public void setEquipment(Equipment equipment) { this.equipment = equipment; }

    public BigDecimal getUsageHours() { return usageHours; }
    public void setUsageHours(BigDecimal usageHours) { this.usageHours = usageHours; }

    public BigDecimal getUtilizationPercentage() { return utilizationPercentage; }
    public void setUtilizationPercentage(BigDecimal utilizationPercentage) { this.utilizationPercentage = utilizationPercentage; }

    public LocalDate getRecordedDate() { return recordedDate; }
    public void setRecordedDate(LocalDate recordedDate) { this.recordedDate = recordedDate; }
}
