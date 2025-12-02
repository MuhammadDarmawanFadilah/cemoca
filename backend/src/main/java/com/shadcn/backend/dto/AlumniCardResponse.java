package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlumniCardResponse {
    
    // User basic info
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    
    // Biografi info
    private Long biografiId;
    private String namaLengkap;
    private String nim;
    private String alumniTahun;
    private String nomorTelepon;
    private String fotoProfil;
    private String jurusan;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLulus;
    
    private String ipk;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLahir;
    
    private String tempatLahir;
    private String jenisKelamin;
    private String agama;
    private String foto;
    private String programStudi;
    private String pendidikanLanjutan;
    
    // Address info
    private String alamat;
    private String kota;
    private String provinsi;
    private String kecamatan;
    private String kelurahan;
    private String kodePos;
    
    // Additional info
    private String prestasi;
    private String hobi;
    
    // Social media
    private String instagram;
    private String youtube;
    private String linkedin;
    private String facebook;
    private String tiktok;
    private String telegram;
    
    // Work info
    private String pekerjaanSaatIni;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalMasukKerja;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalKeluarKerja;
    
    // Status
    private String status;
    private String biografiStatus;
    
    // Timestamps
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
