package com.shadcn.backend.controller;

import com.shadcn.backend.dto.RoleRequest;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.service.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
public class RoleController {
    
    private final RoleService roleService;    @GetMapping
    public ResponseEntity<Page<Role>> getAllRoles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String search,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {
        try {
            log.debug("Getting all roles with pagination: page={}, size={}, search={}", page, size, search);
            Page<Role> roles = roleService.getAllRoles(page, size, search, sortBy, sortDirection);
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            log.error("Error getting roles with pagination", e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<Role>> getAllRolesNoPagination() {
        try {
            List<Role> roles = roleService.getAllRoles();
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        try {
            return roleService.getRoleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
      @PostMapping
    public ResponseEntity<?> createRole(@Valid @RequestBody RoleRequest request) {
        try {
            log.debug("Creating new role: {}", request.getRoleName());
            Role role = roleService.createRole(request);
            log.info("Role created successfully: {}", role.getRoleName());
            return ResponseEntity.ok(role);
        } catch (RuntimeException e) {
            log.warn("Failed to create role: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error creating role", e);
            return ResponseEntity.internalServerError().body("Failed to create role");
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @Valid @RequestBody RoleRequest request) {
        try {
            Role role = roleService.updateRole(id, request);
            return ResponseEntity.ok(role);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to update role");
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRole(@PathVariable Long id) {
        try {
            roleService.deleteRole(id);
            return ResponseEntity.ok().body("Role deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to delete role");
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Role>> searchRoles(@RequestParam(required = false) String name) {
        try {
            List<Role> roles = roleService.searchRoles(name);
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/permissions")
    public ResponseEntity<Set<String>> getAvailablePermissions() {
        try {
            Set<String> permissions = roleService.getAvailablePermissions();
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/initialize")
    public ResponseEntity<?> initializeDefaultRoles() {
        try {
            roleService.initializeDefaultRoles();
            return ResponseEntity.ok().body("Default roles created successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to create default roles");
        }
    }
}
