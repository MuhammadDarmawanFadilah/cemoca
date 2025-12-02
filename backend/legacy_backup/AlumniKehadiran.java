package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.time.LocalDateTime;

@Entity
@Table(name = "alumni_kehadiran")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlumniKehadiran {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pelaksanaan_id", nullable = false)
    @JsonBackReference
    private Pelaksanaan pelaksanaan;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "biografi_id", nullable = false)
    private Biografi biografi;
    
    @Column(name = "hadir", nullable = false)
    private Boolean hadir = false;
    
    @Column(name = "catatan", columnDefinition = "TEXT")
    private String catatan;
    
    @Column(name = "created_at", nullable = false, updatable = false)
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
