package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shadcn.backend.model.Biografi.StatusBiografi;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Simplified DTO for user profile information
 * Used for /my-biografi endpoint to avoid N+1 problems
 * Contains only essential fields needed by frontend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BiografiProfileDto {
    private Long biografiId;
    private String namaLengkap;
    private String nim;
    private String alumniTahun;
    private String email;
    private String nomorTelepon;
    private String fotoProfil;
    private String foto;
    private String jurusan;
    private String programStudi;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tanggalLulus;
    
    private String ipk;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tanggalLahir;
    
    private String tempatLahir;
    private String jenisKelamin;
    private String agama;
    private String alamat;
    
    // Location fields
    private String kota;
    private String provinsi;
    private String kecamatan;
    private String kelurahan;
    private String kodePos;
    private Double latitude;
    private Double longitude;
    
    // Social media
    private String instagram;
    private String youtube;
    private String linkedin;
    private String facebook;
    private String tiktok;
    private String telegram;
    
    private String catatan;
    private String prestasi;
    private String hobi;
    
    private StatusBiografi status;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
