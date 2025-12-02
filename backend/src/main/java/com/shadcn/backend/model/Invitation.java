package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "invitations", indexes = {
    @Index(name = "idx_invitation_token", columnList = "invitationToken", unique = true),
    @Index(name = "idx_invitation_phone", columnList = "nomorHp"),
    @Index(name = "idx_invitation_status", columnList = "status"),
    @Index(name = "idx_invitation_sent_at", columnList = "sentAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invitation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Nama lengkap is required")
    @Size(max = 100, message = "Nama lengkap maksimal 100 karakter")
    @Column(name = "nama_lengkap", nullable = false)
    private String namaLengkap;
    
    @NotBlank(message = "Nomor HP is required")
    @Size(max = 20, message = "Nomor HP maksimal 20 karakter")
    @Column(name = "nomor_hp", nullable = false)
    private String nomorHp;
    
    @NotBlank(message = "Invitation token is required")
    @Column(name = "invitation_token", unique = true, nullable = false)
    private String invitationToken;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;
    
    @Column(name = "sent_at", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sentAt;
    
    @Column(name = "used_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime usedAt;
    
    @Column(name = "expires_at", nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;
    
    @Column(name = "whatsapp_message_id")
    private String whatsappMessageId;
    
    @Column(name = "created_at", updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    @Column(name = "cancelled_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime cancelledAt;
    
    // Reference to created user (if invitation is used)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_user_id")
    private User createdUser;
      public enum InvitationStatus {
        PENDING,
        SENT,
        USED,
        EXPIRED,
        FAILED,
        CANCELLED
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
        if (expiresAt == null) {
            // Set expiration to 7 days from now
            expiresAt = LocalDateTime.now().plusDays(7);
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Helper methods
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean isUsed() {
        return status == InvitationStatus.USED;
    }
    
    public boolean isValid() {
        return !isExpired() && !isUsed() && 
               (status == InvitationStatus.PENDING || status == InvitationStatus.SENT);
    }
    
    public void markAsUsed(User user) {
        this.status = InvitationStatus.USED;
        this.usedAt = LocalDateTime.now();
        this.createdUser = user;
    }
    
    public void markAsExpired() {
        this.status = InvitationStatus.EXPIRED;
    }
    
    public void markAsSent(String messageId) {
        this.status = InvitationStatus.SENT;
        this.whatsappMessageId = messageId;
    }
    
    public void markAsFailed() {
        this.status = InvitationStatus.FAILED;
    }
    
    public void markAsCancelled() {
        this.status = InvitationStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }
    
    public boolean isCancelled() {
        return status == InvitationStatus.CANCELLED;
    }
}
