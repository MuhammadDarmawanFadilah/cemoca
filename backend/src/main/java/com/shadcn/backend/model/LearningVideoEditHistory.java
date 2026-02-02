package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "learning_video_edit_history")
@Data
public class LearningVideoEditHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "learning_video_id", nullable = false)
    private Long learningVideoId;

    @Column(name = "edited_by")
    private String editedBy;

    @Column(name = "edited_by_phone")
    private String editedByPhone;

    @Column(name = "edit_type", nullable = false, length = 20)
    private String editType;

    @Column(name = "changes", columnDefinition = "TEXT")
    private String changes;

    @Column(name = "edited_at", nullable = false)
    private LocalDateTime editedAt;

    @PrePersist
    protected void onCreate() {
        if (editedAt == null) {
            editedAt = LocalDateTime.now();
        }
    }
}
