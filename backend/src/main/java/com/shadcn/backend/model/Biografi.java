package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "biografi", indexes = {
    // Single column indexes for basic searches
    @Index(name = "idx_biografi_nama", columnList = "namaLengkap"),
    @Index(name = "idx_biografi_jurusan", columnList = "jurusan"),
    @Index(name = "idx_biografi_status", columnList = "status"),
    @Index(name = "idx_biografi_email", columnList = "email"),
    @Index(name = "idx_biografi_telepon", columnList = "nomorTelepon"),
    @Index(name = "idx_biografi_kota", columnList = "kota"),
    @Index(name = "idx_biografi_provinsi", columnList = "provinsi"),
    @Index(name = "idx_biografi_alumni_tahun", columnList = "alumniTahun"),
    
    // Compound indexes for common filter combinations
    @Index(name = "idx_biografi_status_nama", columnList = "status,namaLengkap"),
    @Index(name = "idx_biografi_status_jurusan", columnList = "status,jurusan"),
    @Index(name = "idx_biografi_status_kota", columnList = "status,kota"),
    @Index(name = "idx_biografi_status_alumni_tahun", columnList = "status,alumniTahun"),
    
    // Index for notification recipient selection (most common query)
    @Index(name = "idx_biografi_notification", columnList = "status,nomorTelepon,namaLengkap")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"academicRecords", "achievements", "workExperiences", "spesialisasiKedokteran"})
@ToString(exclude = {"academicRecords", "achievements", "workExperiences", "spesialisasiKedokteran"})
public class Biografi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long biografiId;    @Column(nullable = false)
    @NotBlank(message = "Nama lengkap tidak boleh kosong")
    @Size(max = 100)
    private String namaLengkap;    @Column(nullable = true)
    @Size(max = 20)
    private String nim;

    @Column(nullable = false)
    @NotBlank(message = "Alumni tahun tidak boleh kosong")
    @Size(max = 4)
    private String alumniTahun;

    @Column(nullable = false)
    @Email(message = "Format email tidak valid")
    @NotBlank(message = "Email tidak boleh kosong")
    @Size(max = 100)
    private String email;

    @Column(nullable = false)
    @NotBlank(message = "Nomor telepon tidak boleh kosong")
    @Size(max = 20)
    private String nomorTelepon;    @Column
    @Size(max = 255)
    private String fotoProfil;    @Column(nullable = true)
    @Size(max = 100)
    private String jurusan;

    @Column
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLulus;@Column
    @Size(max = 50)
    private String ipk;
    
    // Additional personal fields
    @Column
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLahir;
    
    @Column
    @Size(max = 100)
    private String tempatLahir;
    
    @Column
    @Size(max = 20)
    private String jenisKelamin;
    
    @Column
    @Size(max = 50)
    private String agama;
    
    @Column
    @Size(max = 255)
    private String foto;
    
    @Column
    @Size(max = 100)
    private String programStudi;    @Column(columnDefinition = "TEXT")    private String pendidikanLanjutan;    // Academic records relationship
    @OneToMany(mappedBy = "biografi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AcademicRecord> academicRecords = new ArrayList<>();    // Achievements relationship
    @OneToMany(mappedBy = "biografi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Achievement> achievements = new ArrayList<>();    // Work experiences relationship
    @OneToMany(mappedBy = "biografi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<WorkExperience> workExperiences = new ArrayList<>();    // Spesialisasi Kedokteran relationship
    @OneToMany(mappedBy = "biografi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<SpesialisasiKedokteran> spesialisasiKedokteran = new ArrayList<>();// Career dates
    @Column
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalMasukKerja;

    @Column
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalKeluarKerja;

    @Column(columnDefinition = "TEXT")
    private String alamat;

    @Column
    @Size(max = 50)
    private String kota;    @Column
    @Size(max = 50)
    private String provinsi;

    @Column
    @Size(max = 15)
    private String kecamatan;

    @Column
    @Size(max = 20)
    private String kelurahan;    @Column
    @Size(max = 10)
    private String kodePos;

    // GIS coordinates for map location
    @Column
    private Double latitude;

    @Column
    private Double longitude;

    @Column(columnDefinition = "TEXT")
    private String prestasi;@Column(columnDefinition = "TEXT")
    private String hobi;

    @Column(length = 200)
    private String instagram;
    
    @Column(length = 200)
    private String youtube;
    
    @Column(length = 200)
    private String linkedin;
      @Column(length = 200)
    private String facebook;
    
    @Column(length = 200)
    private String tiktok;
    
    @Column(length = 200)
    private String telegram;

    @Column(columnDefinition = "TEXT")
    private String catatan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusBiografi status = StatusBiografi.AKTIF;

    @Column(nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    public enum StatusBiografi {
        AKTIF, TIDAK_AKTIF, DRAFT    }

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = StatusBiografi.AKTIF;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }    
    /**
     * Get current job from work experiences
     * Returns the latest work experience (either still working or most recent end date)
     * Safe method that handles lazy loading issues
     */
    public String getPekerjaanSaatIni() {
        try {
            if (workExperiences == null || workExperiences.isEmpty()) {
                return null;
            }
            
            // First check for current job (masih bekerja = true)
            WorkExperience currentJob = workExperiences.stream()
                .filter(WorkExperience::isMasihBekerja)
                .findFirst()
                .orElse(null);
                
            if (currentJob != null) {
                return currentJob.getPosisi() + " di " + currentJob.getPerusahaan();
            }
            
            // If no current job, get the most recent one by end date
            WorkExperience mostRecent = workExperiences.stream()
                .filter(we -> we.getTanggalSelesai() != null)
                .max((we1, we2) -> we1.getTanggalSelesai().compareTo(we2.getTanggalSelesai()))
                .orElse(null);
                
            if (mostRecent != null) {
                return mostRecent.getPosisi() + " di " + mostRecent.getPerusahaan();
            }
            
            // Fallback to first work experience if no dates available
            return workExperiences.get(0).getPosisi() + " di " + workExperiences.get(0).getPerusahaan();
        } catch (Exception e) {
            // If lazy loading fails, return null gracefully
            return null;
        }
    }
    
    // Custom setters for collections to maintain relationships
    public void setAcademicRecords(List<AcademicRecord> academicRecords) {
        this.academicRecords = academicRecords;
        // Set the relationship for each academic record
        if (academicRecords != null) {
            for (AcademicRecord academicRecord : academicRecords) {
                academicRecord.setBiografi(this);
            }
        }
    }

    public void setAchievements(List<Achievement> achievements) {
        this.achievements = achievements;
        // Set the relationship for each achievement
        if (achievements != null) {
            for (Achievement achievement : achievements) {
                achievement.setBiografi(this);
            }
        }
    }

    public void setWorkExperiences(List<WorkExperience> workExperiences) {
        this.workExperiences = workExperiences;
        // Set the relationship for each work experience
        if (workExperiences != null) {
            for (WorkExperience workExp : workExperiences) {
                workExp.setBiografi(this);
            }
        }
    }

    public void setSpesialisasiKedokteran(List<SpesialisasiKedokteran> spesialisasiKedokteran) {
        this.spesialisasiKedokteran = spesialisasiKedokteran;
        // Set the relationship for each spesialisasi kedokteran
        if (spesialisasiKedokteran != null) {
            for (SpesialisasiKedokteran spesialisasi : spesialisasiKedokteran) {
                spesialisasi.setBiografi(this);
            }
        }
    }
}
