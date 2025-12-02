package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "public_invitation_links", indexes = {
    @Index(name = "idx_public_link_token", columnList = "linkToken", unique = true),
    @Index(name = "idx_public_link_status", columnList = "status"),
    @Index(name = "idx_public_link_created_at", columnList = "createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublicInvitationLink {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Link token is required")
    @Column(name = "link_token", unique = true, nullable = false)
    private String linkToken;
    
    @Column(name = "description")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LinkStatus status = LinkStatus.ACTIVE;
    
    @Column(name = "expires_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;
    
    @Column(name = "max_uses")
    private Integer maxUses;
    
    @Column(name = "current_uses")
    private Integer currentUses = 0;
    
    @Column(name = "created_at", updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    public enum LinkStatus {
        ACTIVE, INACTIVE, EXPIRED
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper methods
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean isMaxUsesReached() {
        return maxUses != null && currentUses >= maxUses;
    }
    
    public boolean isValid() {
        return status == LinkStatus.ACTIVE && !isExpired() && !isMaxUsesReached();
    }
    
    public void incrementUses() {
        this.currentUses++;
    }
    
    public void markAsExpired() {
        this.status = LinkStatus.EXPIRED;
    }
    
    public void markAsInactive() {
        this.status = LinkStatus.INACTIVE;
    }
}
