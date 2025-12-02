package com.shadcn.backend.repository;

import com.shadcn.backend.model.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    Optional<Role> findByName(String name);
    
    boolean existsByName(String name);
    
    @Query("SELECT r FROM Role r ORDER BY r.name")
    List<Role> findAllOrderByName();
    
    @Query("SELECT r FROM Role r WHERE r.name LIKE %:name% ORDER BY r.name")
    List<Role> findByNameContainingIgnoreCase(String name);
    
    Page<Role> findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
        String name, String description, Pageable pageable);
    
    // Compatibility methods for legacy code that use roleName
    @Query("SELECT r FROM Role r WHERE r.name = :roleName")
    Optional<Role> findByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT COUNT(r) > 0 FROM Role r WHERE r.name = :roleName")
    boolean existsByRoleName(@Param("roleName") String roleName);
    
    @Query("SELECT r FROM Role r WHERE r.name LIKE %:roleName% ORDER BY r.name")
    List<Role> findByRoleNameContainingIgnoreCase(@Param("roleName") String roleName);
    
    @Query("SELECT r FROM Role r WHERE r.name LIKE %:roleName% OR r.description LIKE %:description%")
    Page<Role> findByRoleNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
        @Param("roleName") String roleName, @Param("description") String description, Pageable pageable);
}
