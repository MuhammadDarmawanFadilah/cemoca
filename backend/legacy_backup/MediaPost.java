package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "media_post", indexes = {
    @Index(name = "idx_media_post", columnList = "postId"),
    @Index(name = "idx_media_type", columnList = "mediaType"),
    @Index(name = "idx_media_order", columnList = "postId,mediaOrder")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MediaPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mediaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnore
    private PostKomunikasi postKomunikasi;

    @Column(name = "post_id", insertable = false, updatable = false)
    private Long postId;

    @Column(nullable = false)
    @NotBlank(message = "URL media tidak boleh kosong")
    @Size(max = 500)
    private String mediaUrl;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private MediaType mediaType;

    @Column(name = "media_order", nullable = false)
    private Integer mediaOrder = 0;

    @Column
    @Size(max = 500)
    private String caption;

    @Column
    @Size(max = 255)
    private String originalFileName;

    @Column
    private Long fileSize;

    @Column
    @Size(max = 50)
    private String mimeType;

    // For video thumbnails
    @Column
    @Size(max = 500)
    private String thumbnailUrl;

    @Column(nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    public enum MediaType {
        IMAGE, VIDEO, DOCUMENT
    }

    // Lifecycle callbacks
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Helper methods
    public boolean isImage() {
        return MediaType.IMAGE.equals(this.mediaType);
    }

    public boolean isVideo() {
        return MediaType.VIDEO.equals(this.mediaType);
    }

    public boolean isDocument() {
        return MediaType.DOCUMENT.equals(this.mediaType);
    }
}
