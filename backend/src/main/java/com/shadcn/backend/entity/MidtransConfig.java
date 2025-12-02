package com.shadcn.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "midtrans_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MidtransConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "merchant_id", nullable = false)
    private String merchantId;
    
    @Column(name = "client_key", nullable = false)
    private String clientKey;
    
    @Column(name = "server_key", nullable = false)
    private String serverKey;
    
    @Column(name = "is_production", nullable = false)
    private Boolean isProduction = false;
    
    @Column(name = "snap_url", nullable = false)
    private String snapUrl;
    
    @Column(name = "api_url", nullable = false)
    private String apiUrl;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
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