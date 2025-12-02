package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class DokumentasiSummaryDto {
    private Long id;
    private String fotoUrl;
    private String judul;
    private String deskripsi;
    private String namaUploader;
    private String emailUploader;
    private LocalDateTime createdAt;
    
    // Constructor for JPQL query
    public DokumentasiSummaryDto(Long id, String fotoUrl, String judul, String deskripsi, 
                                String namaUploader, String emailUploader, LocalDateTime createdAt) {
        this.id = id;
        this.fotoUrl = fotoUrl;
        this.judul = judul;
        this.deskripsi = deskripsi;
        this.namaUploader = namaUploader;
        this.emailUploader = emailUploader;
        this.createdAt = createdAt;
    }
}
