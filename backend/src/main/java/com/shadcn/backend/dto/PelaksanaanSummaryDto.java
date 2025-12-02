package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@NoArgsConstructor
public class PelaksanaanSummaryDto {
    private Long id;
    private String status;
    private String catatan;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Usulan basic info
    private Long usulanId;
    private String judul;
    private String rencanaKegiatan;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalMulai;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalSelesai;
    
    private LocalDate durasiUsulan;
    private String gambarUrl;
    private String namaPengusul;
    private String emailPengusul;    private Long jumlahUpvote;
    private Long jumlahDownvote;
    private String usulanStatus;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime usulanCreatedAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime usulanUpdatedAt;
    
    // Summary counts (to avoid loading collections)
    private Long dokumentasiCount;
    private Long komentarCount;
    private Long alumniPesertaCount;    
    // Constructor to match the order in JPQL query
    public PelaksanaanSummaryDto(Long id, String status, String catatan,
                               LocalDateTime createdAt, LocalDateTime updatedAt,
                               Long usulanId, String judul, String rencanaKegiatan,
                               LocalDate tanggalMulai, LocalDate tanggalSelesai,
                               LocalDate durasiUsulan, String gambarUrl,                               String namaPengusul, String emailPengusul,
                               Long jumlahUpvote, Long jumlahDownvote,
                               String usulanStatus, LocalDateTime usulanCreatedAt,
                               LocalDateTime usulanUpdatedAt,
                               Long dokumentasiCount, Long komentarCount, Long alumniPesertaCount) {
        this.id = id;
        this.status = status;
        this.catatan = catatan;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.usulanId = usulanId;
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
        this.usulanStatus = usulanStatus;
        this.usulanCreatedAt = usulanCreatedAt;
        this.usulanUpdatedAt = usulanUpdatedAt;        this.dokumentasiCount = dokumentasiCount;
        this.komentarCount = komentarCount;
        this.alumniPesertaCount = alumniPesertaCount;
    }
}
