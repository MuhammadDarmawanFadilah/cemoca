package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BirthdaySettingsRequest {
    private Boolean enabled;
    private String time;
    private String message;
    private Integer daysAhead;
}
