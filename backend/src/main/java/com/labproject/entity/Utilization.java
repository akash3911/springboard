package com.labproject.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
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
}
