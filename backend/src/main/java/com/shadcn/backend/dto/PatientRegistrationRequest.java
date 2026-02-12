package com.shadcn.backend.dto;

import java.time.LocalTime;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientRegistrationRequest {
    
    @NotBlank(message = "Nama tidak boleh kosong")
    private String fullName;
    
    @NotNull(message = "Usia tidak boleh kosong")
    @Min(value = 1, message = "Usia harus lebih dari 0")
    private Integer age;
    
    @NotBlank(message = "Nomor telepon tidak boleh kosong")
    private String phoneNumber;
    
    @NotNull(message = "Jam minum obat tidak boleh kosong")
    private LocalTime medicationTime;
    
    private String photoPath;
    
    @NotBlank(message = "Username tidak boleh kosong")
    private String username;
    
    @Email(message = "Email tidak valid")
    @NotBlank(message = "Email tidak boleh kosong")
    private String email;
    
    @NotBlank(message = "Password tidak boleh kosong")
    private String password;
}
