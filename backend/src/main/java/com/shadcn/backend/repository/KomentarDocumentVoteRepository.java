package com.shadcn.backend.repository;

import com.shadcn.backend.model.KomentarDocumentVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KomentarDocumentVoteRepository extends JpaRepository<KomentarDocumentVote, Long> {
    
    Optional<KomentarDocumentVote> findByKomentarIdAndBiografiId(Long komentarId, Long biografiId);
    
    @Query("SELECT COUNT(v) FROM KomentarDocumentVote v WHERE v.komentar.id = :komentarId AND v.voteType = 'LIKE'")
    Long countLikesByKomentarId(@Param("komentarId") Long komentarId);
    
    @Query("SELECT COUNT(v) FROM KomentarDocumentVote v WHERE v.komentar.id = :komentarId AND v.voteType = 'DISLIKE'")
    Long countDislikesByKomentarId(@Param("komentarId") Long komentarId);
}
