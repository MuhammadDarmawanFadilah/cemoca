package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "message_templates", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"type", "language_code"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private TemplateType type; // VIDEO or WHATSAPP
    
    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode; // en, id, zh, ja, ko, th, vi, ms, tl, hi
    
    @Column(name = "language_name", nullable = false, length = 50)
    private String languageName; // English, Indonesian, Chinese, etc.
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String template;
    
    @Column(name = "is_default")
    @Builder.Default
    private Boolean isDefault = false;
    
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
    
    public enum TemplateType {
        VIDEO,
        WHATSAPP,
        PDF,
        WHATSAPP_PDF
    }
}
