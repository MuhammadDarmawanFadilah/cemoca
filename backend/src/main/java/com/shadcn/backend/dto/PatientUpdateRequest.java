package com.shadcn.backend.dto;

import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientUpdateRequest {
    
    private String fullName;
    private Integer age;
    private String phoneNumber;
    private LocalTime medicationTime;
    private String photoPath;
}
