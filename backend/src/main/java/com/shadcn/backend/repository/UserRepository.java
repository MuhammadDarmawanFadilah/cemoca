package com.shadcn.backend.repository;

import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByUsernameIgnoreCase(String username);
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByUsernameOrEmail(String username, String email);
    
    Optional<User> findByPhoneNumber(String phoneNumber);
    
    List<User> findByStatus(User.UserStatus status);
    
    Page<User> findByStatus(User.UserStatus status, Pageable pageable);
    
    List<User> findByRole(Role role);
    
    Page<User> findByRole(Role role, Pageable pageable);
    
    List<User> findByStatusAndRole(User.UserStatus status, Role role);
    
    List<User> findByFullNameContainingIgnoreCaseAndRole(String fullName, Role role);
    
    List<User> findByUsernameContainingIgnoreCaseAndRole(String username, Role role);
    
    @Query("SELECT u FROM User u WHERE u.status = :status AND " +
           "(u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%)")
    Page<User> findByStatusAndSearchTerms(@Param("status") User.UserStatus status, 
                                         @Param("search") String search, 
                                         Pageable pageable);
    
    long countByStatus(User.UserStatus status);
    
    long countByRole(Role role);
    
    long countByStatusAndRole(User.UserStatus status, Role role);
    
    @Query("SELECT u FROM User u WHERE u.fullName LIKE %:name% OR u.username LIKE %:name%")
    List<User> findByNameContaining(@Param("name") String name);
    
    @Query("SELECT u FROM User u WHERE " +
           "u.fullName LIKE %:search% OR u.username LIKE %:search% OR u.email LIKE %:search% OR u.phoneNumber LIKE %:search%")
    Page<User> findBySearchTermsIgnoreCase(@Param("search") String search, Pageable pageable);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    boolean existsByPhoneNumber(String phoneNumber);

       boolean existsByCompanyCode(String companyCode);

       Optional<User> findTopByCompanyCodeIgnoreCase(String companyCode);
    
    @Query("SELECT COUNT(u) > 0 FROM User u WHERE u.phoneNumber = :phoneNumber AND u.id != :userId")
    boolean existsByPhoneNumberAndIdNot(@Param("phoneNumber") String phoneNumber, @Param("userId") Long userId);
    
    // Dashboard methods
    @Query("SELECT u FROM User u WHERE u.updatedAt >= :startOfMonth ORDER BY u.updatedAt DESC")
    List<User> findUsersLoggedInThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.updatedAt >= :startOfMonth")
    Long countActiveUsers(@Param("startOfMonth") LocalDateTime startOfMonth);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.updatedAt >= :startOfMonth")
    Long countLoginsThisMonth(@Param("startOfMonth") LocalDateTime startOfMonth);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.updatedAt BETWEEN :start AND :end")
    Long countLoginsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    List<User> findTop5ByOrderByUpdatedAtDesc();

    // Methods for koperasi system - simplified user queries
    
    /**
     * Find users by role name
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role r WHERE r.name = :roleName")
    List<User> findByRoleName(@Param("roleName") String roleName);
    
    /**
     * Find karyawan users (users with KARYAWAN role)
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role r WHERE r.name = 'KARYAWAN'")
    List<User> findKaryawan();
    
    /**
     * Count users by role
     */
    @Query("SELECT COUNT(u) FROM User u JOIN u.role r WHERE r.name = :roleName")
    long countByRoleName(@Param("roleName") String roleName);
    
    /**
     * Find active karyawan for assignment
     */
    @Query("SELECT u FROM User u LEFT JOIN FETCH u.role r WHERE r.name = 'KARYAWAN' AND u.status = 'ACTIVE'")
    List<User> findActiveKaryawan();
}
