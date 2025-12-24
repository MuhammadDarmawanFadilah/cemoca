package com.shadcn.backend.service;

import com.shadcn.backend.dto.RoleRequest;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Service
@Transactional
public class RoleService {
    
    @Autowired
    private RoleRepository roleRepository;
    
    // Predefined permissions based on complete menu structure from AppSidebar
    public static final Set<String> AVAILABLE_PERMISSIONS = Set.of(
        // Dashboard & Basic Access
        "dashboard.view", "admin.panel.access",
        
        // Public Menu Items (Always visible)
        "home.access",
        "berita.read",
        
        // User/Alumni Menu Items (Visible when authenticated)
        "documents.read", "documents.create", "documents.update", "documents.delete",
        "biografi.read", "biografi.create", "biografi.update", "biografi.delete",
        "komunikasi.read", "komunikasi.create", "komunikasi.update", "komunikasi.delete",
        "alumni-locations.read", "alumni-locations.create", "alumni-locations.update", "alumni-locations.delete",
        "usulan.read", "usulan.create", "usulan.update", "usulan.delete",
        "pelaksanaan.read", "pelaksanaan.create", "pelaksanaan.update", "pelaksanaan.delete",
        "notifikasi.read", "notifikasi.create", "notifikasi.update", "notifikasi.delete",
        
        // Admin Menu Items (Admin/Moderator only)
        "users.read", "users.create", "users.update", "users.delete",
        "roles.read", "roles.create", "roles.update", "roles.delete",
        "berita.admin", "berita.create", "berita.update", "berita.delete",
        "documents.admin",
        "biografi.admin",
        "invitations.history", "invitations.approval",
        "birthday.admin",
        
        // Master Data Menu Items (Admin/Moderator only)
        "master-data.spesialisasi.read", "master-data.spesialisasi.create", "master-data.spesialisasi.update", "master-data.spesialisasi.delete",
        "master-data.wilayah-provinsi.read", "master-data.wilayah-provinsi.create", "master-data.wilayah-provinsi.update", "master-data.wilayah-provinsi.delete",
        "master-data.wilayah-kota.read", "master-data.wilayah-kota.create", "master-data.wilayah-kota.update", "master-data.wilayah-kota.delete",
        "master-data.wilayah-kecamatan.read", "master-data.wilayah-kecamatan.create", "master-data.wilayah-kecamatan.update", "master-data.wilayah-kecamatan.delete",
        "master-data.wilayah-kelurahan.read", "master-data.wilayah-kelurahan.create", "master-data.wilayah-kelurahan.update", "master-data.wilayah-kelurahan.delete",
        "master-data.posisi.read", "master-data.posisi.create", "master-data.posisi.update", "master-data.posisi.delete",
        "master-data.hobi.read", "master-data.hobi.create", "master-data.hobi.update", "master-data.hobi.delete",
        "master-data.agama.read", "master-data.agama.create", "master-data.agama.update", "master-data.agama.delete"
    );
      public List<Role> getAllRoles() {
        return roleRepository.findAllOrderByName();
    }
    
    public Page<Role> getAllRoles(int page, int size, String search, String sortBy, String sortDirection) {
        Sort.Direction direction = sortDirection.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        // Map roleName to name for backward compatibility
        String actualSortField = "roleName".equals(sortBy) ? "name" : sortBy;
        Sort sort = Sort.by(direction, actualSortField);
        Pageable pageable = PageRequest.of(page, size, sort);
        
        if (search != null && !search.trim().isEmpty()) {
            return roleRepository.findByRoleNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                search.trim(), search.trim(), pageable);
        } else {
            return roleRepository.findAll(pageable);
        }
    }
    
    public Optional<Role> getRoleById(Long id) {
        return roleRepository.findById(id);
    }
    
    public Optional<Role> getRoleByName(String roleName) {
        return roleRepository.findByRoleName(roleName);
    }
    
    public Role createRole(RoleRequest request) {
        if (roleRepository.existsByRoleName(request.getRoleName())) {
            throw new RuntimeException("Role with name '" + request.getRoleName() + "' already exists");
        }
        
        Role role = new Role();
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        
        // Validate permissions
        Set<String> validPermissions = new HashSet<>();
        for (String permission : request.getPermissions()) {
            if (AVAILABLE_PERMISSIONS.contains(permission)) {
                validPermissions.add(permission);
            }
        }
        role.setPermissions(validPermissions);
        
        return roleRepository.save(role);
    }
    
    public Role updateRole(Long id, RoleRequest request) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Role not found"));
        
        // Check if new name already exists (excluding current role)
        if (!role.getRoleName().equals(request.getRoleName()) && 
            roleRepository.existsByRoleName(request.getRoleName())) {
            throw new RuntimeException("Role with name '" + request.getRoleName() + "' already exists");
        }
        
        role.setRoleName(request.getRoleName());
        role.setDescription(request.getDescription());
        
        // Validate permissions
        Set<String> validPermissions = new HashSet<>();
        for (String permission : request.getPermissions()) {
            if (AVAILABLE_PERMISSIONS.contains(permission)) {
                validPermissions.add(permission);
            }
        }
        role.setPermissions(validPermissions);
        
        return roleRepository.save(role);
    }
    
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Role not found"));
        roleRepository.delete(role);
    }
    
    public List<Role> searchRoles(String name) {
        if (name == null || name.trim().isEmpty()) {
            return getAllRoles();
        }
        return roleRepository.findByRoleNameContainingIgnoreCase(name.trim());
    }
    
    public Set<String> getAvailablePermissions() {
        return AVAILABLE_PERMISSIONS;
    }
    
    public void initializeDefaultRoles() {
        // Create ADMIN role if not exists
        if (!roleRepository.existsByRoleName("ADMIN")) {
            Role adminRole = new Role();
            adminRole.setRoleName("ADMIN");
            adminRole.setDescription("Administrator dengan akses penuh ke semua fitur sistem");
            adminRole.setPermissions(new HashSet<>(AVAILABLE_PERMISSIONS));
            roleRepository.save(adminRole);
        }
        
        // Create MODERATOR role if not exists
        if (!roleRepository.existsByRoleName("MODERATOR")) {
            Role moderatorRole = new Role();
            moderatorRole.setRoleName("MODERATOR");
            moderatorRole.setDescription("Moderator dengan akses admin terbatas");
            moderatorRole.setPermissions(Set.of(
                "dashboard.view", "admin.panel.access",
                "home.access", "berita.read", "berita.create", "berita.update", "berita.delete", "berita.admin",
                "documents.read", "documents.create", "documents.update", "documents.delete", "documents.admin",
                "biografi.read", "biografi.create", "biografi.update", "biografi.delete", "biografi.admin",
                "komunikasi.read", "komunikasi.create", "komunikasi.update", "komunikasi.delete",
                "alumni-locations.read", "alumni-locations.update",
                "usulan.read", "usulan.create", "usulan.update", "usulan.delete",
                "pelaksanaan.read", "pelaksanaan.create", "pelaksanaan.update", "pelaksanaan.delete",
                "notifikasi.read",
                "users.read", "users.update",
                "invitations.history", "invitations.approval",
                "birthday.admin"
            ));
            roleRepository.save(moderatorRole);
        }
        
        // Create ALUMNI role if not exists
        if (!roleRepository.existsByRoleName("ALUMNI")) {
            Role alumniRole = new Role();
            alumniRole.setRoleName("ALUMNI");
            alumniRole.setDescription("Alumni dengan akses ke fitur alumni");
            alumniRole.setPermissions(Set.of(
                "dashboard.view", "home.access", "berita.read",
                "documents.read", "documents.create", "documents.update",
                "biografi.read", "biografi.create", "biografi.update",
                "komunikasi.read", "komunikasi.create", "komunikasi.update",
                "alumni-locations.read", "alumni-locations.update",
                "usulan.read", "usulan.create", "usulan.update",
                "pelaksanaan.read", "pelaksanaan.create", "pelaksanaan.update",
                "notifikasi.read"
            ));
            roleRepository.save(alumniRole);
        }
        
        // Create USER role if not exists
        if (!roleRepository.existsByRoleName("USER")) {
            Role userRole = new Role();
            userRole.setRoleName("USER");
            userRole.setDescription("User biasa dengan akses dasar");
            userRole.setPermissions(Set.of(
                "dashboard.view", "home.access", "berita.read",
                "documents.read", "biografi.read", "notifikasi.read"
            ));
            roleRepository.save(userRole);
        }
    }
}
