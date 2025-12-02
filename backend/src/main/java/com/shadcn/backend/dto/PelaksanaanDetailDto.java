package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class PelaksanaanDetailDto {
    private Long id;
    private String status;
    private String catatan;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UsulanSummaryDto usulan;
      // Constructor for JPQL or manual mapping
    public PelaksanaanDetailDto(Long id, String status, String catatan, 
                               LocalDateTime createdAt, LocalDateTime updatedAt,
                               Long usulanId, String judul, String rencanaKegiatan,
                               LocalDate tanggalMulai, LocalDate tanggalSelesai,
                               LocalDate durasiUsulan, String gambarUrl, String namaPengusul,
                               String emailPengusul, Long jumlahUpvote, Long jumlahDownvote,
                               String usulanStatus, LocalDateTime usulanCreatedAt, LocalDateTime usulanUpdatedAt) {
        this.id = id;
        this.status = status;
        this.catatan = catatan;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.usulan = new UsulanSummaryDto(usulanId, judul, rencanaKegiatan, tanggalMulai, 
                                          tanggalSelesai, durasiUsulan, gambarUrl, namaPengusul, 
                                          emailPengusul, jumlahUpvote, jumlahDownvote, usulanStatus, 
                                          usulanCreatedAt, usulanUpdatedAt);
    }
    
    @Data
    @NoArgsConstructor
    public static class UsulanSummaryDto {
        private Long id;
        private String judul;
        private String rencanaKegiatan;
        private LocalDate tanggalMulai;
        private LocalDate tanggalSelesai;
        private LocalDate durasiUsulan;
        private String gambarUrl;
        private String namaPengusul;
        private String emailPengusul;
        private Long jumlahUpvote;
        private Long jumlahDownvote;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
          public UsulanSummaryDto(Long id, String judul, String rencanaKegiatan,
                               LocalDate tanggalMulai, LocalDate tanggalSelesai,
                               LocalDate durasiUsulan, String gambarUrl, String namaPengusul,
                               String emailPengusul, Long jumlahUpvote, Long jumlahDownvote,
                               String status, LocalDateTime createdAt, LocalDateTime updatedAt) {
            this.id = id;
            this.judul = judul;
            this.rencanaKegiatan = rencanaKegiatan;
            this.tanggalMulai = tanggalMulai;
            this.tanggalSelesai = tanggalSelesai;
            this.durasiUsulan = durasiUsulan;
            this.gambarUrl = gambarUrl;
            this.namaPengusul = namaPengusul;
            this.emailPengusul = emailPengusul;
            this.jumlahUpvote = jumlahUpvote;
            this.jumlahDownvote = jumlahDownvote;
            this.status = status;
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
    }
}
