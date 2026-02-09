package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificate_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CertificateTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Kode template tidak boleh kosong")
    @Size(max = 50, message = "Kode template maksimal 50 karakter")
    @Column(name = "template_code", nullable = false, length = 50, unique = true)
    private String templateCode;
    
    @NotBlank(message = "Nama template tidak boleh kosong")
    @Size(max = 100, message = "Nama template maksimal 100 karakter")
    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;
    
    @Size(max = 255, message = "Deskripsi maksimal 255 karakter")
    @Column(name = "description", length = 255)
    private String description;
    
    @Column(name = "image_url", length = 500)
    private String imageUrl;
    
    @Column(name = "variable_count", nullable = false)
    private Integer variableCount = 4;
    
    @Column(name = "variable1_name", length = 100)
    private String variable1Name;
    
    @Column(name = "variable1_x")
    private Integer variable1X;
    
    @Column(name = "variable1_y")
    private Integer variable1Y;
    
    @Column(name = "variable1_font_size")
    private Integer variable1FontSize = 24;
    
    @Column(name = "variable1_color", length = 20)
    private String variable1Color = "#000000";
    
    @Column(name = "variable2_name", length = 100)
    private String variable2Name;
    
    @Column(name = "variable2_x")
    private Integer variable2X;
    
    @Column(name = "variable2_y")
    private Integer variable2Y;
    
    @Column(name = "variable2_font_size")
    private Integer variable2FontSize = 24;
    
    @Column(name = "variable2_color", length = 20)
    private String variable2Color = "#000000";
    
    @Column(name = "variable3_name", length = 100)
    private String variable3Name;
    
    @Column(name = "variable3_x")
    private Integer variable3X;
    
    @Column(name = "variable3_y")
    private Integer variable3Y;
    
    @Column(name = "variable3_font_size")
    private Integer variable3FontSize = 24;
    
    @Column(name = "variable3_color", length = 20)
    private String variable3Color = "#000000";
    
    @Column(name = "variable4_name", length = 100)
    private String variable4Name;
    
    @Column(name = "variable4_x")
    private Integer variable4X;
    
    @Column(name = "variable4_y")
    private Integer variable4Y;
    
    @Column(name = "variable4_font_size")
    private Integer variable4FontSize = 24;
    
    @Column(name = "variable4_color", length = 20)
    private String variable4Color = "#000000";
    
    @Column(name = "is_active", nullable = false, columnDefinition = "BIT(1) DEFAULT 1")
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
        if (variableCount == null) {
            variableCount = 4;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
