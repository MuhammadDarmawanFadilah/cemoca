package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "master_spesialisasi_kedokteran")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MasterSpesialisasiKedokteran {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Nama spesialisasi kedokteran tidak boleh kosong")
    @Size(max = 100, message = "Nama spesialisasi kedokteran maksimal 100 karakter")
    @Column(name = "nama", nullable = false, length = 100, unique = true)
    private String nama;
    
    @Size(max = 255, message = "Deskripsi maksimal 255 karakter")
    @Column(name = "deskripsi", length = 255)
    private String deskripsi;
    
    @Column(name = "is_active", nullable = false, columnDefinition = "BIT(1) DEFAULT 1")
    private Boolean isActive = true;
    
    @Column(name = "sort_order", columnDefinition = "INT DEFAULT 0")
    private Integer sortOrder = 0;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
        if (sortOrder == null) {
            sortOrder = 0;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
