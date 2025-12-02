package com.shadcn.backend.dto;

import com.shadcn.backend.model.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class UserSummaryDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phoneNumber;
    private String avatarUrl;
    private User.UserStatus status;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Role information
    private RoleDto role;
    
    // Biography information (basic)
    private BiografiSummaryDto biografi;
      // Constructor to create from User entity
    public UserSummaryDto(User user) {
        this.id = user.getId();
        this.username = user.getUsername();
        this.email = user.getEmail();
        this.fullName = user.getFullName();
        this.phoneNumber = user.getPhoneNumber();
        this.avatarUrl = user.getAvatarUrl();
        this.status = user.getStatus();
        this.createdAt = user.getCreatedAt();
        this.updatedAt = user.getUpdatedAt();
        
        // Set role if available and not lazy
        try {
            if (user.getRole() != null) {
                this.role = new RoleDto(user.getRole());
            }
        } catch (Exception e) {
            // Ignore lazy loading exceptions
            this.role = null;
        }
        
        // Set basic biography info if available and not lazy
        try {
            if (user.getBiografi() != null) {
                this.biografi = new BiografiSummaryDto(user.getBiografi());
            }
        } catch (Exception e) {
            // Ignore lazy loading exceptions
            this.biografi = null;
        }
    }
    
    @Data
    @NoArgsConstructor
    public static class RoleDto {
        private Long roleId;
        private String roleName;
        private String description;
        
        public RoleDto(com.shadcn.backend.model.Role role) {
            this.roleId = role.getRoleId();
            this.roleName = role.getRoleName();
            this.description = role.getDescription();
        }
    }
    
    @Data
    @NoArgsConstructor
    public static class BiografiSummaryDto {
        private Long biografiId;
        private String namaLengkap;
        private String email;
        private String fotoProfil;
        
        public BiografiSummaryDto(com.shadcn.backend.model.Biografi biografi) {
            try {
                this.biografiId = biografi.getBiografiId();
                this.namaLengkap = biografi.getNamaLengkap();
                this.email = biografi.getEmail();
                this.fotoProfil = biografi.getFotoProfil();
            } catch (Exception e) {
                // Handle lazy loading exceptions gracefully
                this.biografiId = biografi.getBiografiId();
                this.namaLengkap = "N/A";
                this.email = "N/A";
                this.fotoProfil = null;
            }
        }
    }
}
