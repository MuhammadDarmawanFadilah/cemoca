package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MasterSpesialisasiRequest {
    
    @NotBlank(message = "Nama spesialisasi tidak boleh kosong")
    @Size(max = 100, message = "Nama spesialisasi maksimal 100 karakter")
    private String nama;
    
    @Size(max = 255, message = "Deskripsi maksimal 255 karakter")
    private String deskripsi;
    
    private Boolean isActive = true;
    
    private Integer sortOrder = 0;
}
