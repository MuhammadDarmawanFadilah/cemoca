package com.shadcn.backend.repository;

import com.shadcn.backend.model.KomentarBeritaVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KomentarBeritaVoteRepository extends JpaRepository<KomentarBeritaVote, Long> {
    
    Optional<KomentarBeritaVote> findByKomentarIdAndBiografiId(Long komentarId, Long biografiId);
    
    @Query("SELECT COUNT(v) FROM KomentarBeritaVote v WHERE v.komentar.id = :komentarId AND v.voteType = 'LIKE'")
    long countLikesByKomentarId(@Param("komentarId") Long komentarId);
    
    @Query("SELECT COUNT(v) FROM KomentarBeritaVote v WHERE v.komentar.id = :komentarId AND v.voteType = 'DISLIKE'")
    long countDislikesByKomentarId(@Param("komentarId") Long komentarId);
    
    void deleteByKomentarIdAndBiografiId(Long komentarId, Long biografiId);
}
