package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@NoArgsConstructor
public class AlumniKehadiranDto {
    // AlumniKehadiran fields
    private Long id;
    private Boolean hadir;
    private String catatan;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Biografi essential fields only
    private Long biografiId;
    private String namaLengkap;
    private String nim;
    private String alumniTahun;
    private String email;
    private String nomorTelepon;
    private String fotoProfil;
    private String jurusan;
    private LocalDate tanggalLulus;
    private String ipk;
    private String kota;
    private String provinsi;
    private String status;
    
    // Constructor for JPQL query - hanya fields essential
    public AlumniKehadiranDto(Long id, Boolean hadir, String catatan, LocalDateTime createdAt, LocalDateTime updatedAt,
                             Long biografiId, String namaLengkap, String nim, String alumniTahun, String email, 
                             String nomorTelepon, String fotoProfil, String jurusan, LocalDate tanggalLulus, 
                             String ipk, String kota, String provinsi, String status) {
        this.id = id;
        this.hadir = hadir;
        this.catatan = catatan;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.biografiId = biografiId;
        this.namaLengkap = namaLengkap;
        this.nim = nim;
        this.alumniTahun = alumniTahun;
        this.email = email;
        this.nomorTelepon = nomorTelepon;
        this.fotoProfil = fotoProfil;
        this.jurusan = jurusan;
        this.tanggalLulus = tanggalLulus;
        this.ipk = ipk;
        this.kota = kota;
        this.provinsi = provinsi;
        this.status = status;
    }
}
