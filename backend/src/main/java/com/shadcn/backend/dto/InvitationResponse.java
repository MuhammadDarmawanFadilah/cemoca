package com.shadcn.backend.dto;

import com.shadcn.backend.model.Invitation;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvitationResponse {
    
    private Long id;
    private String namaLengkap;
    private String nomorHp;
    private String invitationToken;
    private String status;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sentAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;
      @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime usedAt;
    
    private boolean hasBiografi;
    private Long userId;
    private String userFullName;
    
    // Constructor from Invitation entity
    public InvitationResponse(Invitation invitation) {
        this.id = invitation.getId();
        this.namaLengkap = invitation.getNamaLengkap();
        this.nomorHp = invitation.getNomorHp();
        this.invitationToken = invitation.getInvitationToken();
        this.status = invitation.getStatus().toString();
        this.sentAt = invitation.getSentAt();
        this.expiresAt = invitation.getExpiresAt();
        this.usedAt = invitation.getUsedAt();
        
        // Set user information if invitation is used
        if (invitation.getCreatedUser() != null) {
            this.userId = invitation.getCreatedUser().getId();
            this.userFullName = invitation.getCreatedUser().getFullName();
        }
    }
    
    // Constructor with biography status
    public InvitationResponse(Invitation invitation, boolean hasBiografi) {
        this(invitation);
        this.hasBiografi = hasBiografi;
    }
}
