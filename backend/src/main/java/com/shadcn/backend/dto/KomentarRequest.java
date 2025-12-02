package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class KomentarRequest {
    
    @NotBlank(message = "Komentar tidak boleh kosong")
    @Size(max = 1000, message = "Komentar maksimal 1000 karakter")
    private String konten;
    
    @NotBlank(message = "Nama pengguna tidak boleh kosong")
    @Size(max = 100, message = "Nama pengguna maksimal 100 karakter")
    private String namaPengguna;
    
    private Long biografiId;
    
    private Long beritaId;
    
    private Long parentKomentarId; // For replies
}
