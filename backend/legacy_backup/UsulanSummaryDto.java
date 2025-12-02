package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shadcn.backend.model.Usulan;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class UsulanSummaryDto {
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
    private Usulan.StatusUsulan status;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Derived fields
    private boolean expired;
    private long score;
    private long sisaHari;

    // Constructor for JPQL
    public UsulanSummaryDto(Long id, String judul, String rencanaKegiatan, 
                           LocalDate tanggalMulai, LocalDate tanggalSelesai, LocalDate durasiUsulan,
                           String gambarUrl, String namaPengusul, String emailPengusul,
                           Long jumlahUpvote, Long jumlahDownvote, Usulan.StatusUsulan status,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
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
        
        // Calculate derived fields
        this.expired = LocalDate.now().isAfter(durasiUsulan);
        this.score = jumlahUpvote - jumlahDownvote;
        this.sisaHari = Math.max(0, LocalDate.now().until(durasiUsulan).getDays());
    }

    // Constructor from Entity for easier transformation
    public UsulanSummaryDto(Usulan usulan) {
        this.id = usulan.getId();
        this.judul = usulan.getJudul();
        this.rencanaKegiatan = usulan.getRencanaKegiatan();
        this.tanggalMulai = usulan.getTanggalMulai();
        this.tanggalSelesai = usulan.getTanggalSelesai();
        this.durasiUsulan = usulan.getDurasiUsulan();
        this.gambarUrl = usulan.getGambarUrl();
        this.namaPengusul = usulan.getNamaPengusul();
        this.emailPengusul = usulan.getEmailPengusul();
        this.jumlahUpvote = usulan.getJumlahUpvote();
        this.jumlahDownvote = usulan.getJumlahDownvote();
        this.status = usulan.getStatus();
        this.createdAt = usulan.getCreatedAt();
        this.updatedAt = usulan.getUpdatedAt();
        
        // Calculate derived fields
        this.expired = LocalDate.now().isAfter(durasiUsulan);
        this.score = jumlahUpvote - jumlahDownvote;
        this.sisaHari = Math.max(0, LocalDate.now().until(durasiUsulan).getDays());
    }

    // Default constructor
    public UsulanSummaryDto() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJudul() { return judul; }
    public void setJudul(String judul) { this.judul = judul; }

    public String getRencanaKegiatan() { return rencanaKegiatan; }
    public void setRencanaKegiatan(String rencanaKegiatan) { this.rencanaKegiatan = rencanaKegiatan; }

    public LocalDate getTanggalMulai() { return tanggalMulai; }
    public void setTanggalMulai(LocalDate tanggalMulai) { this.tanggalMulai = tanggalMulai; }

    public LocalDate getTanggalSelesai() { return tanggalSelesai; }
    public void setTanggalSelesai(LocalDate tanggalSelesai) { this.tanggalSelesai = tanggalSelesai; }

    public LocalDate getDurasiUsulan() { return durasiUsulan; }
    public void setDurasiUsulan(LocalDate durasiUsulan) { this.durasiUsulan = durasiUsulan; }

    public String getGambarUrl() { return gambarUrl; }
    public void setGambarUrl(String gambarUrl) { this.gambarUrl = gambarUrl; }

    public String getNamaPengusul() { return namaPengusul; }
    public void setNamaPengusul(String namaPengusul) { this.namaPengusul = namaPengusul; }

    public String getEmailPengusul() { return emailPengusul; }
    public void setEmailPengusul(String emailPengusul) { this.emailPengusul = emailPengusul; }

    public Long getJumlahUpvote() { return jumlahUpvote; }
    public void setJumlahUpvote(Long jumlahUpvote) { this.jumlahUpvote = jumlahUpvote; }

    public Long getJumlahDownvote() { return jumlahDownvote; }
    public void setJumlahDownvote(Long jumlahDownvote) { this.jumlahDownvote = jumlahDownvote; }

    public Usulan.StatusUsulan getStatus() { return status; }
    public void setStatus(Usulan.StatusUsulan status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isExpired() { return expired; }
    public void setExpired(boolean expired) { this.expired = expired; }

    public long getScore() { return score; }
    public void setScore(long score) { this.score = score; }

    public long getSisaHari() { return sisaHari; }
    public void setSisaHari(long sisaHari) { this.sisaHari = sisaHari; }
}
