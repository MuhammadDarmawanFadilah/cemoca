package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "wilayah_provinsi")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WilayahProvinsi {
    
    @Id
    @Column(name = "kode", length = 10)
    private String kode;
    
    @Column(name = "nama", nullable = false, length = 100)
    private String nama;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
