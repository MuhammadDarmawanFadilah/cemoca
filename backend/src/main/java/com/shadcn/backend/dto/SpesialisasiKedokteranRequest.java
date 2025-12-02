package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class SpesialisasiKedokteranRequest {
    
    @NotBlank(message = "Spesialisasi tidak boleh kosong")
    @Size(max = 100, message = "Spesialisasi maksimal 100 karakter")
    private String spesialisasi;
    
    @NotBlank(message = "Lokasi penempatan tidak boleh kosong")
    @Size(max = 100, message = "Lokasi penempatan maksimal 100 karakter")
    private String lokasiPenempatan;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalMulai;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalAkhir;
    
    private boolean masihBekerja;

    // Default constructor
    public SpesialisasiKedokteranRequest() {}

    // Getters and Setters
    public String getSpesialisasi() {
        return spesialisasi;
    }

    public void setSpesialisasi(String spesialisasi) {
        this.spesialisasi = spesialisasi;
    }

    public String getLokasiPenempatan() {
        return lokasiPenempatan;
    }    public void setLokasiPenempatan(String lokasiPenempatan) {
        this.lokasiPenempatan = lokasiPenempatan;
    }    public LocalDate getTanggalMulai() {
        return tanggalMulai;
    }

    public void setTanggalMulai(LocalDate tanggalMulai) {
        this.tanggalMulai = tanggalMulai;
    }

    public LocalDate getTanggalAkhir() {
        return tanggalAkhir;
    }

    public void setTanggalAkhir(LocalDate tanggalAkhir) {
        this.tanggalAkhir = tanggalAkhir;
    }

    public boolean isMasihBekerja() {
        return masihBekerja;
    }

    public void setMasihBekerja(boolean masihBekerja) {
        this.masihBekerja = masihBekerja;
    }
}
