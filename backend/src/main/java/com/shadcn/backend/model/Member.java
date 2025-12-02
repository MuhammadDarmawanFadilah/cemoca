package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "member")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String nama;
    
    @Column(length = 20)
    private String telepon;
    
    @Column(length = 100)
    private String email;
    
    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    private Integer poin = 0;
    
    @Column(length = 100)
    private String pekerjaan;
    
    @Column(length = 255)
    private String foto;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tingkat_prioritas", nullable = false)
    private TingkatPrioritas tingkatPrioritas = TingkatPrioritas.MENENGAH;
    
    @Column(columnDefinition = "TEXT")
    private String deskripsi;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.AKTIF;
    
    @Column(columnDefinition = "TEXT")
    private String alamat;
    
    @Column(length = 20)
    private String provinsi;
    
    @Column(length = 20)
    private String kota;
    
    @Column(length = 20)
    private String kecamatan;
    
    @Column(length = 30)
    private String kelurahan;
    
    @Column(length = 10)
    private String kodePos;
    
    @Column(precision = 10)
    private Double latitude;
    
    @Column(precision = 11)
    private Double longitude;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum TingkatPrioritas {
        TINGGI, MENENGAH, RENDAH
    }
    
    public enum Status {
        AKTIF, NONAKTIF
    }
}