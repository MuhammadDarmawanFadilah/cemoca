package com.shadcn.backend.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class SchedulerConfigRequest {
    
    @Min(1)
    private Integer intervalHours;
    
    private Boolean enabled;
}
