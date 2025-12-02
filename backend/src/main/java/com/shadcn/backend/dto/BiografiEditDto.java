package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shadcn.backend.model.Biografi.StatusBiografi;
import com.shadcn.backend.model.AcademicRecord;
import com.shadcn.backend.model.Achievement;
import com.shadcn.backend.model.WorkExperience;
import com.shadcn.backend.model.SpesialisasiKedokteran;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class BiografiEditDto {
    private Long biografiId;
    private String namaLengkap;
    private String nim;
    private String alumniTahun;
    private String email;
    private String nomorTelepon;
    private String fotoProfil;
    private String jurusan;
    private String programStudi;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tanggalLulus;
    
    private String ipk;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate tanggalLahir;
    
    private String tempatLahir;    private String jenisKelamin;
    private String agama;
    private String foto;
    private String alamat;
    
    // Location fields
    private String kota;
    private String provinsi;
    private String kecamatan;
    private String kelurahan;
    private String kodePos;
    private Double latitude;
    private Double longitude;
    
    // Location names for display
    private String kotaNama;
    private String provinsiNama;
    private String kecamatanNama;
    private String kelurahanNama;
    
    // Social media
    private String instagram;
    private String youtube;
    private String linkedin;
    private String facebook;
    private String tiktok;
    private String telegram;
      private String catatan;
    
    // Career and achievement fields
    private String prestasi;
    private String hobi;
    
    // Position field (derived from work experiences)
    private String posisiJabatan;
    
    // Relationships
    private List<AcademicRecord> academicRecords;
    private List<Achievement> achievements;
    private List<WorkExperience> workExperiences;
    private List<SpesialisasiKedokteran> spesialisasiKedokteran;
    
    private StatusBiografi status;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
      @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
