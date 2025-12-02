package com.shadcn.backend.dto;

import java.time.LocalDateTime;
import java.time.LocalDate;

public interface PelaksanaanSummaryProjection {
    Long getId();
    String getStatus();
    String getCatatan();
    LocalDateTime getCreatedAt();
    LocalDateTime getUpdatedAt();
    
    // Usulan fields
    Long getUsulanId();
    String getJudul();
    String getRencanaKegiatan();
    LocalDate getTanggalMulai();
    LocalDate getTanggalSelesai();
    Integer getDurasiUsulan();
    String getGambarUrl();
    String getNamaPengusul();
    String getEmailPengusul();
    Integer getJumlahUpvote();
    Integer getJumlahDownvote();
    String getUsulanStatus();
    LocalDateTime getUsulanCreatedAt();
    LocalDateTime getUsulanUpdatedAt();
    
    // Counts
    Long getDokumentasiCount();
    Long getKomentarCount();
    Long getAlumniPesertaCount();
}
