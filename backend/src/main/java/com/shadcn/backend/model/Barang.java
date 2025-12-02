package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "barang")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Barang {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String nama;
    
    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal berat;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kategori_id", nullable = false)
    private Kategori kategori;
    
    @Column(nullable = false)
    private Integer stock;
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal harga;
    
    @Column(nullable = false)
    private Integer poin;
    
    @Column(length = 255)
    private String gambar;
    
    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}