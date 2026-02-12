package com.shadcn.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientStatus {
    private Long userId;
    private String fullName;
    private String phoneNumber;
    private String photoPath;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime medicationTime;
    
    private String status; // SUDAH, BELUM, TERLAMBAT
    
    private Long intakeId;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate intakeDate;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "HH:mm:ss")
    private LocalTime intakeTime;
    
    private String videoPath;
    
    private Boolean late; // true if taken after medication time
}
