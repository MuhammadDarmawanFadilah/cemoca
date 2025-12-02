package com.shadcn.backend.repository;

import com.shadcn.backend.model.Invitation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, Long> {
    
    // Find invitation by token
    Optional<Invitation> findByInvitationToken(String invitationToken);
    
    // Find invitation by phone number
    Optional<Invitation> findByNomorHp(String nomorHp);
    
    // Find latest invitation by phone number
    @Query("SELECT i FROM Invitation i WHERE i.nomorHp = :nomorHp ORDER BY i.sentAt DESC")
    List<Invitation> findByNomorHpOrderBySentAtDesc(@Param("nomorHp") String nomorHp);
    
    // Find invitations by status
    List<Invitation> findByStatus(Invitation.InvitationStatus status);
    
    // Find expired invitations
    @Query("SELECT i FROM Invitation i WHERE i.expiresAt < :now AND i.status != 'EXPIRED'")
    List<Invitation> findExpiredInvitations(@Param("now") LocalDateTime now);
    
    // Find pending invitations that are not expired
    @Query("SELECT i FROM Invitation i WHERE i.status = 'PENDING' AND i.expiresAt > :now")
    List<Invitation> findValidPendingInvitations(@Param("now") LocalDateTime now);
    
    // Check if phone number has valid invitation
    @Query("SELECT COUNT(i) > 0 FROM Invitation i WHERE i.nomorHp = :nomorHp AND i.status IN ('PENDING', 'SENT') AND i.expiresAt > :now")
    boolean hasValidInvitation(@Param("nomorHp") String nomorHp, @Param("now") LocalDateTime now);
    
    // Find invitations sent today
    @Query("SELECT i FROM Invitation i WHERE DATE(i.sentAt) = CURRENT_DATE")
    List<Invitation> findTodaysInvitations();
    
    // Find all invitations ordered by created date
    @Query("SELECT i FROM Invitation i ORDER BY i.createdAt DESC")
    List<Invitation> findAllByOrderByCreatedAtDesc();    // Pagination and filtering methods with dynamic sorting
    
    // Find invitations by status with pagination and sorting
    Page<Invitation> findByStatus(Invitation.InvitationStatus status, Pageable pageable);
    
    // Find invitations by name (contains) with pagination and sorting
    @Query("SELECT i FROM Invitation i WHERE LOWER(i.namaLengkap) LIKE LOWER(CONCAT('%', :nama, '%'))")
    Page<Invitation> findByNamaLengkapContainingIgnoreCase(@Param("nama") String nama, Pageable pageable);
    
    // Find invitations by phone number (contains) with pagination and sorting
    @Query("SELECT i FROM Invitation i WHERE i.nomorHp LIKE CONCAT('%', :phone, '%')")
    Page<Invitation> findByNomorHpContaining(@Param("phone") String phone, Pageable pageable);
    
    // Find invitations by status and name with pagination and sorting
    @Query("SELECT i FROM Invitation i WHERE i.status = :status AND LOWER(i.namaLengkap) LIKE LOWER(CONCAT('%', :nama, '%'))")
    Page<Invitation> findByStatusAndNamaLengkapContainingIgnoreCase(
        @Param("status") Invitation.InvitationStatus status, 
        @Param("nama") String nama, 
        Pageable pageable
    );
    
    // Find invitations by status and phone with pagination and sorting
    @Query("SELECT i FROM Invitation i WHERE i.status = :status AND i.nomorHp LIKE CONCAT('%', :phone, '%')")
    Page<Invitation> findByStatusAndNomorHpContaining(
        @Param("status") Invitation.InvitationStatus status, 
        @Param("phone") String phone, 
        Pageable pageable
    );
    
    // Find invitations by name and phone with pagination and sorting
    @Query("SELECT i FROM Invitation i WHERE LOWER(i.namaLengkap) LIKE LOWER(CONCAT('%', :nama, '%')) AND i.nomorHp LIKE CONCAT('%', :phone, '%')")
    Page<Invitation> findByNamaLengkapContainingIgnoreCaseAndNomorHpContaining(
        @Param("nama") String nama, 
        @Param("phone") String phone, 
        Pageable pageable
    );
    
    // Find invitations by status, name, and phone with pagination and sorting
    @Query("SELECT i FROM Invitation i WHERE i.status = :status AND LOWER(i.namaLengkap) LIKE LOWER(CONCAT('%', :nama, '%')) AND i.nomorHp LIKE CONCAT('%', :phone, '%')")
    Page<Invitation> findByStatusAndNamaLengkapContainingIgnoreCaseAndNomorHpContaining(
        @Param("status") Invitation.InvitationStatus status, 
        @Param("nama") String nama, 
        @Param("phone") String phone, 
        Pageable pageable
    );
}
