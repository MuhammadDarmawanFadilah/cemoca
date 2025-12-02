package com.shadcn.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Set;
import java.util.HashSet;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequest {
    
    @NotBlank(message = "Nama role tidak boleh kosong")
    @Size(max = 50, message = "Nama role maksimal 50 karakter")
    private String roleName;
    
    @Size(max = 255, message = "Deskripsi maksimal 255 karakter")
    private String description;
    
    private Set<String> permissions = new HashSet<>();
}
