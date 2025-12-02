package com.shadcn.backend.repository;

import com.shadcn.backend.model.PublicInvitationLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface PublicInvitationLinkRepository extends JpaRepository<PublicInvitationLink, Long> {
    
    Optional<PublicInvitationLink> findByLinkToken(String linkToken);
    
    @Query("SELECT p FROM PublicInvitationLink p WHERE p.status = 'ACTIVE' ORDER BY p.createdAt DESC")
    List<PublicInvitationLink> findActiveLinks();
    
    @Query("SELECT p FROM PublicInvitationLink p ORDER BY p.createdAt DESC")
    List<PublicInvitationLink> findAllOrderByCreatedAtDesc();
    
    @Query("SELECT COUNT(p) FROM PublicInvitationLink p WHERE p.status = 'ACTIVE'")
    long countActiveLinks();
}
