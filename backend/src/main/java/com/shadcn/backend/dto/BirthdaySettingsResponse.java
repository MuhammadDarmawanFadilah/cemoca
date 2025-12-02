package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BirthdaySettingsResponse {
    private Boolean enabled;
    private String time;
    private String timezone;
    private String message;
    private Integer daysAhead;
}
