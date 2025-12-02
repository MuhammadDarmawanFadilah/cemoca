package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

public class WorkExperienceRequest {
    
    @NotNull(message = "Posisi tidak boleh kosong")
    @Size(min = 1, max = 100, message = "Posisi harus antara 1-100 karakter")
    private String posisi;
      @NotNull(message = "Perusahaan tidak boleh kosong")
    @Size(min = 1, max = 100, message = "Perusahaan harus antara 1-100 karakter")
    private String perusahaan;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalMulai;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalSelesai;
    
    private boolean masihBekerja;
    
    @Size(max = 500, message = "Deskripsi maksimal 500 karakter")
    private String deskripsi;
    
    // Default constructor
    public WorkExperienceRequest() {}
      // Constructor with all fields
    public WorkExperienceRequest(String posisi, String perusahaan, LocalDate tanggalMulai, 
                                LocalDate tanggalSelesai, String deskripsi) {
        this.posisi = posisi;
        this.perusahaan = perusahaan;
        this.tanggalMulai = tanggalMulai;
        this.tanggalSelesai = tanggalSelesai;
        this.deskripsi = deskripsi;
    }
    
    // Getters and Setters
    public String getPosisi() {
        return posisi;
    }
    
    public void setPosisi(String posisi) {
        this.posisi = posisi;
    }
    
    public String getPerusahaan() {
        return perusahaan;
    }
    
    public void setPerusahaan(String perusahaan) {
        this.perusahaan = perusahaan;
    }
      public LocalDate getTanggalMulai() {
        return tanggalMulai;
    }
    
    public void setTanggalMulai(LocalDate tanggalMulai) {
        this.tanggalMulai = tanggalMulai;
    }
    
    public LocalDate getTanggalSelesai() {
        return tanggalSelesai;
    }
    
    public void setTanggalSelesai(LocalDate tanggalSelesai) {
        this.tanggalSelesai = tanggalSelesai;
    }
    
    public boolean isMasihBekerja() {
        return masihBekerja;
    }
    
    public void setMasihBekerja(boolean masihBekerja) {
        this.masihBekerja = masihBekerja;
    }
    
    public String getDeskripsi() {
        return deskripsi;
    }
    
    public void setDeskripsi(String deskripsi) {
        this.deskripsi = deskripsi;
    }
}