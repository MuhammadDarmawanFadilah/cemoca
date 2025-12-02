package com.shadcn.backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "comment_reaction", 
    indexes = {
        @Index(name = "idx_comment_reaction_comment", columnList = "commentId"),
        @Index(name = "idx_comment_reaction_biografi", columnList = "biografiId"),
        @Index(name = "idx_comment_reaction_type", columnList = "reactionType"),
        @Index(name = "idx_comment_reaction_unique", columnList = "commentId,biografiId")
    },
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"commentId", "biografiId"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentReaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    @JsonIgnore
    private PostComment postComment;

    @Column(name = "comment_id", insertable = false, updatable = false)
    private Long commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biografi_id", nullable = false)
    @JsonIgnore
    private Biografi biografi;

    @Column(name = "biografi_id", insertable = false, updatable = false)
    private Long biografiId;

    // Cached user info for performance
    @Column(name = "user_name", nullable = false)
    private String userName;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ReactionType reactionType;

    @Column(nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    public enum ReactionType {
        LIKE("👍"),
        DISLIKE("👎");

        private final String emoji;

        ReactionType(String emoji) {
            this.emoji = emoji;
        }

        public String getEmoji() {
            return emoji;
        }
    }

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        
        // Cache user info for performance
        if (this.biografi != null) {
            this.userName = this.biografi.getNamaLengkap();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper methods
    public boolean isLike() {
        return ReactionType.LIKE.equals(this.reactionType);
    }

    public boolean isDislike() {
        return ReactionType.DISLIKE.equals(this.reactionType);
    }

    public String getReactionEmoji() {
        return this.reactionType != null ? this.reactionType.getEmoji() : "";
    }
}
