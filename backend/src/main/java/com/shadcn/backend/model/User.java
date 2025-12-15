package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;
import org.hibernate.annotations.DynamicUpdate;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * User entity with Java 21 features and optimized JPA configuration
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_phone", columnList = "phoneNumber", unique = true),
    @Index(name = "idx_user_username", columnList = "username"),
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_status", columnList = "status"),
    @Index(name = "idx_user_created", columnList = "createdAt"),
    @Index(name = "idx_user_company_code", columnList = "company_code")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@DynamicUpdate
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"password"})
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Column(unique = true, nullable = false, length = 50)
    private String username;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(unique = true, nullable = false, length = 100)
    private String email;    @NotBlank(message = "Full name is required")
    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;
    
    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    @JsonIgnore
    @Column(nullable = false)
    private String password;
    
    @NotBlank(message = "Phone number is required")
    @Size(max = 20, message = "Phone number maksimal 20 karakter")
    @Column(name = "phoneNumber", unique = true, nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(name = "company_code", length = 32)
    private String companyCode;

    @Column(name = "agency_range", length = 20)
    private String agencyRange;

    @Column(name = "reason_to_use", length = 1000)
    private String reasonToUse;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role role;
    
    // Removed biografi and publicInvitationLink relationships for koperasi system
    
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;
    
    // Address fields for employee location information
    @Column(name = "alamat", length = 500)
    private String alamat;
    
    @Column(name = "provinsi", length = 10)
    private String provinsi;
    
    @Column(name = "kota", length = 10)
    private String kota;
    
    @Column(name = "kecamatan", length = 15)
    private String kecamatan;
    
    @Column(name = "kelurahan", length = 20)
    private String kelurahan;
    
    @Column(name = "kode_pos", length = 10)
    private String kodePos;
    
    @Column(name = "latitude")
    private Double latitude;
    
    @Column(name = "longitude")
    private Double longitude;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Removed payments relationship for koperasi system
    
    /**
     * User status enumeration
     */
    public enum UserStatus {
        ACTIVE, INACTIVE, SUSPENDED, WAITING_APPROVAL
    }
    
    /**
     * Business logic methods
     */
    public boolean isActive() {
        return UserStatus.ACTIVE.equals(this.status);
    }
    
    public boolean isKaryawan() {
        return role != null && "KARYAWAN".equals(role.getRoleName());
    }
    
    public boolean isAdmin() {
        return role != null && ("ADMIN".equals(role.getRoleName()) || "MODERATOR".equals(role.getRoleName()));
    }
    
    /**
     * Custom constructor for creating users with basic info
     */
    @Builder(builderMethodName = "basicBuilder")
    public User(String username, String email, String fullName, String password, String phoneNumber) {        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.password = password;
        this.phoneNumber = phoneNumber;
        this.status = UserStatus.ACTIVE;
    }
    
    /**
     * Helper methods for role-based access control
     */
    public boolean hasPermission(String permission) {
        return role != null && role.hasPermission(permission);
    }
    
    public String getRoleName() {
        return role != null ? role.getRoleName() : null;
    }
}
