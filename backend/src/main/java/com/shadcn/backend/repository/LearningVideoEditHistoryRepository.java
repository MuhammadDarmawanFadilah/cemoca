package com.shadcn.backend.repository;

import com.shadcn.backend.model.LearningVideoEditHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningVideoEditHistoryRepository extends JpaRepository<LearningVideoEditHistory, Long> {
    
    @Query("SELECT h FROM LearningVideoEditHistory h WHERE h.learningVideoId = :learningVideoId ORDER BY h.editedAt DESC")
    List<LearningVideoEditHistory> findByLearningVideoIdOrderByEditedAtDesc(Long learningVideoId);
}
