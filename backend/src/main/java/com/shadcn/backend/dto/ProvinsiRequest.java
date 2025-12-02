package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProvinsiRequest {
    
    @NotBlank(message = "Kode provinsi tidak boleh kosong")
    @Size(max = 10, message = "Kode provinsi maksimal 10 karakter")
    private String kode;
    
    @NotBlank(message = "Nama provinsi tidak boleh kosong")
    @Size(max = 100, message = "Nama provinsi maksimal 100 karakter")
    private String nama;
}
