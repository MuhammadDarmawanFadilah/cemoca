package com.shadcn.backend.repository;

import com.shadcn.backend.model.KomentarUsulanVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KomentarUsulanVoteRepository extends JpaRepository<KomentarUsulanVote, Long> {
    
    Optional<KomentarUsulanVote> findByKomentarIdAndBiografiId(Long komentarId, Long biografiId);
    
    @Query("SELECT COUNT(v) FROM KomentarUsulanVote v WHERE v.komentar.id = :komentarId AND v.voteType = 'LIKE'")
    long countLikesByKomentarId(@Param("komentarId") Long komentarId);
    
    @Query("SELECT COUNT(v) FROM KomentarUsulanVote v WHERE v.komentar.id = :komentarId AND v.voteType = 'DISLIKE'")
    long countDislikesByKomentarId(@Param("komentarId") Long komentarId);
      void deleteByKomentarIdAndBiografiId(Long komentarId, Long biografiId);
}
