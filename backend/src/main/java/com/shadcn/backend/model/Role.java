package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Nama role tidak boleh kosong")
    @Size(max = 50, message = "Nama role maksimal 50 karakter")
    @Column(unique = true, nullable = false)
    private String name;
    
    @Size(max = 255, message = "Deskripsi maksimal 255 karakter")
    private String description;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "role_permissions", joinColumns = @JoinColumn(name = "role_id"))
    @Column(name = "permission")
    private Set<String> permissions = new HashSet<>();
    
    @Column(nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Helper methods for permissions
    public void addPermission(String permission) {
        this.permissions.add(permission);
    }
    
    public void removePermission(String permission) {
        this.permissions.remove(permission);
    }
    
    public boolean hasPermission(String permission) {
        return this.permissions.contains(permission);
    }
    
    // Compatibility methods for legacy code
    public String getRoleName() {
        return this.name;
    }
    
    public void setRoleName(String roleName) {
        this.name = roleName;
    }
    
    public Long getRoleId() {
        return this.id;
    }
}
