package com.shadcn.backend.dto;

import com.shadcn.backend.model.Biografi;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlumniKehadiranFullDto {
    // AlumniKehadiran fields
    private Long id;
    private Boolean hadir;
    private String catatan;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Biografi fields
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
    private LocalDate tanggalLahir;
    private String tempatLahir;
    private String jenisKelamin;
    private String agama;
    private String foto;
    private String programStudi;
    private String pendidikanLanjutan;
    private LocalDate tanggalMasukKerja;
    private LocalDate tanggalKeluarKerja;
    private String alamat;
    private String kota;
    private String provinsi;
    private String kecamatan;
    private String kelurahan;
    private String kodePos;
    private String prestasi;
    private String hobi;
    private String instagram;
    private String youtube;
    private String linkedin;
    private String facebook;
    private String tiktok;
    private String telegram;
    private String catatan_biografi;
    private Biografi.StatusBiografi status;  // Changed from String to enum
    private LocalDateTime biografiCreatedAt;
    private LocalDateTime biografiUpdatedAt;
}
