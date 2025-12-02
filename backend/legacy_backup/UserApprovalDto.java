package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.shadcn.backend.model.User;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * DTO for User entity in approval context to avoid lazy loading issues
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserApprovalDto {
    
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String roleName;
    private String status;
    private String avatarUrl;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Biography info
    private Long biografiId;
    private String biografiNamaLengkap;
    private String biografiNomorTelepon;
    
    /**
     * Create DTO from User entity
     */
    public static UserApprovalDto fromUser(User user) {
        UserApprovalDtoBuilder builder = UserApprovalDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .status(user.getStatus().toString())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt());
        
        // Safely get role name
        if (user.getRole() != null) {
            builder.roleName(user.getRole().getRoleName());
        }
        
        // Safely get biography info without triggering lazy loading
        try {
            if (user.getBiografi() != null) {
                builder.biografiId(user.getBiografi().getBiografiId())
                       .biografiNamaLengkap(user.getBiografi().getNamaLengkap())
                       .biografiNomorTelepon(user.getBiografi().getNomorTelepon());
            }
        } catch (Exception e) {
            // Biography is lazy loaded and session might be closed, skip it
        }
        
        return builder.build();
    }
}
