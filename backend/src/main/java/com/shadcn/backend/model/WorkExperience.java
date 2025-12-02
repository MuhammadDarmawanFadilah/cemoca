package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

@Entity
@Table(name = "work_experiences")
public class WorkExperience {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Posisi tidak boleh kosong")
    @Size(max = 100, message = "Posisi maksimal 100 karakter")
    @Column(nullable = false, length = 100)
    private String posisi;
      @NotBlank(message = "Perusahaan tidak boleh kosong")
    @Size(max = 100, message = "Perusahaan maksimal 100 karakter")
    @Column(nullable = false, length = 100)
    private String perusahaan;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Column(name = "tanggal_mulai")
    private LocalDate tanggalMulai;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Column(name = "tanggal_selesai")
    private LocalDate tanggalSelesai;
    
    @Column(name = "masih_bekerja")
    private boolean masihBekerja;
    
    @Size(max = 500, message = "Deskripsi maksimal 500 karakter")
    @Column(length = 500)
    private String deskripsi;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biografi_id")
    @JsonBackReference
    private Biografi biografi;
    
    // Default constructor
    public WorkExperience() {}
    
    // Constructor with required fields
    public WorkExperience(String posisi, String perusahaan) {
        this.posisi = posisi;
        this.perusahaan = perusahaan;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
        // Jika masih bekerja, set tanggal selesai ke null
        if (masihBekerja) {
            this.tanggalSelesai = null;
        }
    }
    
    public String getDeskripsi() {
        return deskripsi;
    }
    
    public void setDeskripsi(String deskripsi) {
        this.deskripsi = deskripsi;
    }
    
    public Biografi getBiografi() {
        return biografi;
    }
    
    public void setBiografi(Biografi biografi) {
        this.biografi = biografi;
    }
    
    @Override
    public String toString() {
        return "WorkExperience{" +
                "id=" + id +
                ", posisi='" + posisi + '\'' +
                ", perusahaan='" + perusahaan + '\'' +
                ", tanggalMulai='" + tanggalMulai + '\'' +
                ", tanggalSelesai='" + tanggalSelesai + '\'' +
                ", deskripsi='" + deskripsi + '\'' +
                '}';
    }
}
