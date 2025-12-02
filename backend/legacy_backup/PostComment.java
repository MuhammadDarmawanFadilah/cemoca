package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "post_comment", indexes = {
    @Index(name = "idx_comment_post", columnList = "postId"),
    @Index(name = "idx_comment_biografi", columnList = "biografiId"),
    @Index(name = "idx_comment_parent", columnList = "parentCommentId"),
    @Index(name = "idx_comment_created", columnList = "createdAt"),
    @Index(name = "idx_comment_thread", columnList = "postId,parentCommentId,createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"replies", "reactions"})
@ToString(exclude = {"replies", "reactions"})
public class PostComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long commentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnore
    private PostKomunikasi postKomunikasi;

    @Column(name = "post_id", insertable = false, updatable = false)
    private Long postId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "biografi_id", nullable = false)
    @JsonIgnore
    private Biografi biografi;

    @Column(name = "biografi_id", insertable = false, updatable = false)
    private Long biografiId;

    // Cached author info for performance
    @Column(name = "author_name", nullable = false)
    @Size(max = 100)
    private String authorName;

    @Column(name = "author_photo")
    @Size(max = 255)
    private String authorPhoto;

    @Column(name = "author_jurusan")
    @Size(max = 100)
    private String authorJurusan;

    @Column(name = "author_alumni_tahun")
    @Size(max = 4)
    private String authorAlumniTahun;

    @Column(columnDefinition = "TEXT", nullable = false)
    @NotBlank(message = "Konten komentar tidak boleh kosong")
    @Size(max = 2000, message = "Konten komentar maksimal 2000 karakter")
    private String konten;

    // For threaded comments (replies)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    @JsonIgnore
    private PostComment parentComment;

    @Column(name = "parent_comment_id", insertable = false, updatable = false)
    private Long parentCommentId;

    // Replies to this comment
    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PostComment> replies = new ArrayList<>();

    // Comment reactions
    @OneToMany(mappedBy = "postComment", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CommentReaction> reactions = new ArrayList<>();

    // Reaction counts for performance
    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "dislike_count", nullable = false)
    private Integer dislikeCount = 0;

    @Column(name = "reply_count", nullable = false)
    private Integer replyCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusComment status = StatusComment.AKTIF;

    @Column(nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    public enum StatusComment {
        AKTIF, DIHAPUS, DISEMBUNYIKAN, DILAPORKAN
    }

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = StatusComment.AKTIF;
        }
        
        // Cache author info for performance
        if (this.biografi != null) {
            this.authorName = this.biografi.getNamaLengkap();
            this.authorPhoto = this.biografi.getFotoProfil();
            this.authorJurusan = this.biografi.getJurusan();
            this.authorAlumniTahun = this.biografi.getAlumniTahun();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper methods
    public void incrementLikeCount() {
        this.likeCount = (this.likeCount == null ? 0 : this.likeCount) + 1;
    }

    public void decrementLikeCount() {
        this.likeCount = Math.max(0, (this.likeCount == null ? 0 : this.likeCount) - 1);
    }

    public void incrementDislikeCount() {
        this.dislikeCount = (this.dislikeCount == null ? 0 : this.dislikeCount) + 1;
    }

    public void decrementDislikeCount() {
        this.dislikeCount = Math.max(0, (this.dislikeCount == null ? 0 : this.dislikeCount) - 1);
    }

    public void incrementReplyCount() {
        this.replyCount = (this.replyCount == null ? 0 : this.replyCount) + 1;
    }

    public void decrementReplyCount() {
        this.replyCount = Math.max(0, (this.replyCount == null ? 0 : this.replyCount) - 1);
    }

    public boolean isReply() {
        return this.parentCommentId != null;
    }

    public boolean isTopLevel() {
        return this.parentCommentId == null;
    }

    // Custom setters for collections to maintain relationships
    public void setReplies(List<PostComment> replies) {
        this.replies = replies;
        if (replies != null) {
            for (PostComment reply : replies) {
                reply.setParentComment(this);
            }
        }
    }

    public void setReactions(List<CommentReaction> reactions) {
        this.reactions = reactions;
        if (reactions != null) {
            for (CommentReaction reaction : reactions) {
                reaction.setPostComment(this);
            }
        }
    }
}
