package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

@Entity
@Table(name = "academic_records")
public class AcademicRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Jenjang pendidikan tidak boleh kosong")
    @Size(max = 10, message = "Jenjang pendidikan maksimal 10 karakter")
    @Column(nullable = false, length = 10)
    private String jenjangPendidikan; // D1, D2, D3, D4, S1, S2, S3
    
    @NotBlank(message = "Universitas tidak boleh kosong")
    @Size(max = 200, message = "Universitas maksimal 200 karakter")
    @Column(nullable = false, length = 200)
    private String universitas;
    
    @NotBlank(message = "Program studi tidak boleh kosong")
    @Size(max = 100, message = "Program studi maksimal 100 karakter")
    @Column(nullable = false, length = 100)
    private String programStudi;
    
    @Size(max = 10, message = "IPK maksimal 10 karakter")
    @Column(length = 10)
    private String ipk;
    
    @Column(name = "tanggal_lulus")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate tanggalLulus;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biografi_id")
    @JsonBackReference
    private Biografi biografi;
    
    // Default constructor
    public AcademicRecord() {}
    
    // Constructor with required fields
    public AcademicRecord(String jenjangPendidikan, String universitas, String programStudi) {
        this.jenjangPendidikan = jenjangPendidikan;
        this.universitas = universitas;
        this.programStudi = programStudi;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getJenjangPendidikan() {
        return jenjangPendidikan;
    }
    
    public void setJenjangPendidikan(String jenjangPendidikan) {
        this.jenjangPendidikan = jenjangPendidikan;
    }
    
    public String getUniversitas() {
        return universitas;
    }
    
    public void setUniversitas(String universitas) {
        this.universitas = universitas;
    }
    
    public String getProgramStudi() {
        return programStudi;
    }
    
    public void setProgramStudi(String programStudi) {
        this.programStudi = programStudi;
    }
    
    public String getIpk() {
        return ipk;
    }
    
    public void setIpk(String ipk) {
        this.ipk = ipk;
    }
    
    public LocalDate getTanggalLulus() {
        return tanggalLulus;
    }
    
    public void setTanggalLulus(LocalDate tanggalLulus) {
        this.tanggalLulus = tanggalLulus;
    }
    
    public Biografi getBiografi() {
        return biografi;
    }
    
    public void setBiografi(Biografi biografi) {
        this.biografi = biografi;
    }
    
    @Override
    public String toString() {
        return "AcademicRecord{" +
                "id=" + id +
                ", jenjangPendidikan='" + jenjangPendidikan + '\'' +
                ", universitas='" + universitas + '\'' +
                ", programStudi='" + programStudi + '\'' +
                ", ipk='" + ipk + '\'' +
                ", tanggalLulus=" + tanggalLulus +
                '}';
    }
}
