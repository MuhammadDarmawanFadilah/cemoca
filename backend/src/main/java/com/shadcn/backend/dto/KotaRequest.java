package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KotaRequest {
    
    @NotBlank(message = "Kode kota tidak boleh kosong")
    @Size(max = 10, message = "Kode kota maksimal 10 karakter")
    private String kode;
    
    @NotBlank(message = "Nama kota tidak boleh kosong")
    @Size(max = 100, message = "Nama kota maksimal 100 karakter")
    private String nama;
    
    @NotBlank(message = "Tipe tidak boleh kosong")
    @Size(max = 20, message = "Tipe maksimal 20 karakter")
    private String tipe; // KOTA, KABUPATEN
    
    @NotNull(message = "Provinsi ID tidak boleh kosong")
    private Long provinsiId;
}
