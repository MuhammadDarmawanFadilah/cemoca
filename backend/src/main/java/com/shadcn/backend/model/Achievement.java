package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "achievements")
public class Achievement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "judul")
    private String judul;

    @Column(name = "penyelenggara")
    private String penyelenggara;

    @Column(name = "tahun")
    private String tahun;

    @Column(name = "deskripsi", columnDefinition = "TEXT")
    private String deskripsi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biografi_id")
    @JsonBackReference
    private Biografi biografi;

    // Default constructor
    public Achievement() {}

    // Constructor
    public Achievement(String judul, String penyelenggara, String tahun, String deskripsi) {
        this.judul = judul;
        this.penyelenggara = penyelenggara;
        this.tahun = tahun;
        this.deskripsi = deskripsi;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getJudul() {
        return judul;
    }

    public void setJudul(String judul) {
        this.judul = judul;
    }

    public String getPenyelenggara() {
        return penyelenggara;
    }

    public void setPenyelenggara(String penyelenggara) {
        this.penyelenggara = penyelenggara;
    }

    public String getTahun() {
        return tahun;
    }

    public void setTahun(String tahun) {
        this.tahun = tahun;
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
}
