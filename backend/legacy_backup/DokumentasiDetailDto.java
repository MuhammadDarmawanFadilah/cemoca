package com.shadcn.backend.dto;

import com.shadcn.backend.model.DokumentasiPelaksanaan;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DokumentasiDetailDto {
    private Long id;
    private String judul;
    private String deskripsi;
    private String fotoUrl;
    private String namaUploader;
    private String emailUploader;
    private LocalDateTime createdAt;
    
    public DokumentasiDetailDto(DokumentasiPelaksanaan dokumentasi) {
        this.id = dokumentasi.getId();
        this.judul = dokumentasi.getJudul();
        this.deskripsi = dokumentasi.getDeskripsi();
        this.fotoUrl = dokumentasi.getFotoUrl();
        this.namaUploader = dokumentasi.getNamaUploader();
        this.emailUploader = dokumentasi.getEmailUploader();
        this.createdAt = dokumentasi.getCreatedAt();
    }
}
