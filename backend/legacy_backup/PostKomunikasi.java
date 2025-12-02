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
@Table(name = "post_komunikasi", indexes = {
    @Index(name = "idx_post_created_at", columnList = "createdAt"),
    @Index(name = "idx_post_biografi", columnList = "biografiId"),
    @Index(name = "idx_post_status", columnList = "status"),
    @Index(name = "idx_post_feed", columnList = "status,createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"media", "reactions", "comments"})
@ToString(exclude = {"media", "reactions", "comments"})
public class PostKomunikasi {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long postId;

    @Column(columnDefinition = "TEXT", nullable = false)
    @NotBlank(message = "Konten post tidak boleh kosong")
    @Size(max = 5000, message = "Konten post maksimal 5000 karakter")
    private String konten;

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

    // Media attachments
    @OneToMany(mappedBy = "postKomunikasi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<MediaPost> media = new ArrayList<>();

    // Reactions (likes, dislikes, etc.)
    @OneToMany(mappedBy = "postKomunikasi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PostReaction> reactions = new ArrayList<>();

    // Comments
    @OneToMany(mappedBy = "postKomunikasi", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<PostComment> comments = new ArrayList<>();

    // Reaction counts for performance
    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "dislike_count", nullable = false)
    private Integer dislikeCount = 0;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPost status = StatusPost.AKTIF;

    @Column(nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;

    public enum StatusPost {
        AKTIF, DIHAPUS, DISEMBUNYIKAN, DILAPORKAN
    }

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = StatusPost.AKTIF;
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

    public void incrementCommentCount() {
        this.commentCount = (this.commentCount == null ? 0 : this.commentCount) + 1;
    }

    public void decrementCommentCount() {
        this.commentCount = Math.max(0, (this.commentCount == null ? 0 : this.commentCount) - 1);
    }

    // Custom setters for collections to maintain relationships
    public void setMedia(List<MediaPost> media) {
        this.media = media;
        if (media != null) {
            for (MediaPost mediaItem : media) {
                mediaItem.setPostKomunikasi(this);
            }
        }
    }

    public void setReactions(List<PostReaction> reactions) {
        this.reactions = reactions;
        if (reactions != null) {
            for (PostReaction reaction : reactions) {
                reaction.setPostKomunikasi(this);
            }
        }
    }

    public void setComments(List<PostComment> comments) {
        this.comments = comments;
        if (comments != null) {
            for (PostComment comment : comments) {
                comment.setPostKomunikasi(this);
            }
        }
    }
}
