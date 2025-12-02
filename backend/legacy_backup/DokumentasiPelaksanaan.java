package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "dokumentasi_pelaksanaan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DokumentasiPelaksanaan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pelaksanaan_id", nullable = false)
    @JsonBackReference
    private Pelaksanaan pelaksanaan;
    
    @Column(name = "foto_url")
    private String fotoUrl;
    
    @Size(max = 200, message = "Judul maksimal 200 karakter")
    @Column(length = 200)
    private String judul;
    
    @Column(columnDefinition = "TEXT")
    private String deskripsi;
    
    @Column(name = "nama_uploader", nullable = false, length = 100)
    private String namaUploader;
    
    @Column(name = "email_uploader", length = 100)
    private String emailUploader;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
