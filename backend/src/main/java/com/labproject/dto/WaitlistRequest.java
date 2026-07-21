package com.labproject.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class WaitlistRequest {
    private Integer equipmentId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
