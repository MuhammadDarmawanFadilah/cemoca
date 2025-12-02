package com.shadcn.backend.repository;

import com.shadcn.backend.model.VoteUsulan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoteUsulanRepository extends JpaRepository<VoteUsulan, Long> {
    
    Optional<VoteUsulan> findByUsulanIdAndEmailVoter(Long usulanId, String emailVoter);
    
    long countByUsulanIdAndTipeVote(Long usulanId, VoteUsulan.TipeVote tipeVote);
    
    void deleteByUsulanIdAndEmailVoter(Long usulanId, String emailVoter);
}
