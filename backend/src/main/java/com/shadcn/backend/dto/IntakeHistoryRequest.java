package com.shadcn.backend.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntakeHistoryRequest {
    
    @NotNull(message = "User ID tidak boleh kosong")
    private Long userId;
    
    @NotNull(message = "Tanggal tidak boleh kosong")
    private LocalDate intakeDate;
    
    @NotNull(message = "Waktu tidak boleh kosong")
    private LocalTime intakeTime;
    
    @NotNull(message = "Video path tidak boleh kosong")
    private String videoPath;
}
