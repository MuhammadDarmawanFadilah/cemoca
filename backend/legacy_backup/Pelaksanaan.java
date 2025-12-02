package com.shadcn.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pelaksanaan")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pelaksanaan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usulan_id", nullable = false)
    private Usulan usulan;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPelaksanaan status = StatusPelaksanaan.PENDING;
    
    @Column(columnDefinition = "TEXT")
    private String catatan;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;    @OneToMany(mappedBy = "pelaksanaan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DokumentasiPelaksanaan> dokumentasi;    @OneToMany(mappedBy = "pelaksanaan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<KomentarPelaksanaan> komentar;    @OneToMany(mappedBy = "pelaksanaan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<AlumniKehadiran> alumniPeserta;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum StatusPelaksanaan {
        PENDING, SUKSES, GAGAL
    }
}
