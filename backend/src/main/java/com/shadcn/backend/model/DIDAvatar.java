package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "did_avatars")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DIDAvatar {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "presenter_id", nullable = false, unique = true)
    private String presenterId;
    
    @Column(name = "presenter_name", nullable = false)
    private String presenterName;
    
    @Column(name = "avatar_type")
    private String avatarType; // "express" or "clips"
    
    @Column(name = "thumbnail_url", length = 1000)
    private String thumbnailUrl;
    
    @Column(name = "preview_url", length = 1000)
    private String previewUrl;
    
    @Column(name = "voice_id")
    private String voiceId;

    @Column(name = "voice_type")
    private String voiceType;

    @Column(name = "consent_id")
    private String consentId;

    @Column(name = "consent_text", length = 4000)
    private String consentText;
    
    @Column(name = "gender")
    private String gender;
    
    @Column(name = "is_premium")
    private Boolean isPremium;
    
    @Column(name = "is_active")
    @Builder.Default
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
