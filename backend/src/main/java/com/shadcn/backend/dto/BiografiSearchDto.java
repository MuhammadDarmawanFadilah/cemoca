package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shadcn.backend.model.Biografi;
import com.shadcn.backend.model.AcademicRecord;
import com.shadcn.backend.model.Achievement;
import com.shadcn.backend.model.WorkExperience;
import com.shadcn.backend.model.SpesialisasiKedokteran;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class BiografiSearchDto {
    private Long biografiId;
    private String namaLengkap;
    private String nim;
    private String alumniTahun;
    private String email;
    private String nomorTelepon;
    private String fotoProfil;
    private String jurusan;
    private String programStudi;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLulus;
    
    private String ipk;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLahir;
    
    private String tempatLahir;
    private String jenisKelamin;
    private String agama;
    private String foto;
    private String alamat;
    private String kota;
    private String provinsi;
    private String kecamatan;
    private String kelurahan;
    private String kodePos;
    private String instagram;
    private String youtube;
    private String linkedin;
    private String facebook;
    private String tiktok;
    private String telegram;
    private String catatan;
    private Biografi.StatusBiografi status;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    // Additional fields that are populated after construction
    private String prestasi;
    private String hobi;
    private String pekerjaanSaatIni;
    private List<AcademicRecord> academicRecords;
    private List<Achievement> achievements;
    private List<WorkExperience> workExperiences;
    private List<SpesialisasiKedokteran> spesialisasiKedokteran;
    
    // Location name fields (resolved from codes)
    private String kotaNama;
    private String provinsiNama;
    private String kecamatanNama;
    private String kelurahanNama;

    // Constructor for JPQL - only includes fields available in basic entity
    public BiografiSearchDto(Long biografiId, String namaLengkap, String nim, String alumniTahun, 
                            String email, String nomorTelepon, String fotoProfil, String jurusan, 
                            String programStudi, LocalDate tanggalLulus, String ipk, 
                            LocalDate tanggalLahir, String tempatLahir, String jenisKelamin, 
                            String agama, String foto, String alamat, String kota, String provinsi, 
                            String kecamatan, String kelurahan, String kodePos, String instagram, 
                            String youtube, String linkedin, String facebook, String tiktok, 
                            String telegram, String catatan, Biografi.StatusBiografi status, 
                            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.biografiId = biografiId;
        this.namaLengkap = namaLengkap;
        this.nim = nim;
        this.alumniTahun = alumniTahun;
        this.email = email;
        this.nomorTelepon = nomorTelepon;
        this.fotoProfil = fotoProfil;
        this.jurusan = jurusan;
        this.programStudi = programStudi;
        this.tanggalLulus = tanggalLulus;
        this.ipk = ipk;
        this.tanggalLahir = tanggalLahir;
        this.tempatLahir = tempatLahir;
        this.jenisKelamin = jenisKelamin;
        this.agama = agama;
        this.foto = foto;
        this.alamat = alamat;
        this.kota = kota;
        this.provinsi = provinsi;
        this.kecamatan = kecamatan;
        this.kelurahan = kelurahan;
        this.kodePos = kodePos;
        this.instagram = instagram;
        this.youtube = youtube;
        this.linkedin = linkedin;
        this.facebook = facebook;
        this.tiktok = tiktok;
        this.telegram = telegram;
        this.catatan = catatan;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
