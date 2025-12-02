package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;

@Entity
@Table(name = "spesialisasi_kedokteran")
public class SpesialisasiKedokteran {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Spesialisasi tidak boleh kosong")
    @Size(max = 100, message = "Spesialisasi maksimal 100 karakter")
    @Column(nullable = false, length = 100)
    private String spesialisasi;
      @Size(max = 200, message = "Lokasi penempatan maksimal 200 karakter")
    @Column(name = "lokasi_penempatan", length = 200)
    private String lokasiPenempatan;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Column(name = "tanggal_mulai")
    private LocalDate tanggalMulai;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    @Column(name = "tanggal_akhir")
    private LocalDate tanggalAkhir;
    
    @Column(name = "masih_bekerja")
    private Boolean masihBekerja = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biografi_id")
    @JsonBackReference
    private Biografi biografi;
    
    // Default constructor
    public SpesialisasiKedokteran() {}
    
    // Constructor with required fields
    public SpesialisasiKedokteran(String spesialisasi, String lokasiPenempatan) {
        this.spesialisasi = spesialisasi;
        this.lokasiPenempatan = lokasiPenempatan;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getSpesialisasi() {
        return spesialisasi;
    }
    
    public void setSpesialisasi(String spesialisasi) {
        this.spesialisasi = spesialisasi;
    }
    
    public String getLokasiPenempatan() {
        return lokasiPenempatan;
    }
    
    public void setLokasiPenempatan(String lokasiPenempatan) {
        this.lokasiPenempatan = lokasiPenempatan;
    }
      public LocalDate getTanggalMulai() {
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
    
    public Boolean getMasihBekerja() {
        return masihBekerja;
    }
    
    public void setMasihBekerja(Boolean masihBekerja) {
        this.masihBekerja = masihBekerja;
    }
    
    public Biografi getBiografi() {
        return biografi;
    }
    
    public void setBiografi(Biografi biografi) {
        this.biografi = biografi;
    }
    
    @Override
    public String toString() {
        return "SpesialisasiKedokteran{" +
                "id=" + id +
                ", spesialisasi='" + spesialisasi + '\'' +
                ", lokasiPenempatan='" + lokasiPenempatan + '\'' +
                ", tanggalMulai='" + tanggalMulai + '\'' +
                ", tanggalAkhir='" + tanggalAkhir + '\'' +
                ", masihBekerja=" + masihBekerja +
                '}';
    }
}
