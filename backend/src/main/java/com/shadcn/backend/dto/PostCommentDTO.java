package com.shadcn.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostCommentDTO {
    private Long commentId;
    private Long postId;
    private Long biografiId;
    private Long parentCommentId;
    
    // Author info
    private String authorName;
    private String authorPhoto;
    private String authorJurusan;
    private String authorAlumniTahun;
    
    private String konten;
    
    // Reaction counts
    private Integer likeCount = 0;
    private Integer dislikeCount = 0;
    private Integer replyCount = 0;
    
    // User's reaction to this comment (if any)
    private String userReaction;
    
    // Replies to this comment (for threaded view)
    private List<PostCommentDTO> replies = new ArrayList<>();
    
    private String status;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Helper methods
    public boolean isReply() {
        return parentCommentId != null;
    }
    
    public boolean isTopLevel() {
        return parentCommentId == null;
    }
    
    public boolean hasReplies() {
        return replyCount != null && replyCount > 0;
    }
    
    public boolean hasReactions() {
        return (likeCount != null && likeCount > 0) || (dislikeCount != null && dislikeCount > 0);
    }
    
    // Time formatting helpers
    public String getTimeAgo() {
        if (createdAt == null) return "";
        
        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(createdAt, now).toMinutes();
        
        if (minutes < 1) return "Baru saja";
        if (minutes < 60) return minutes + " menit yang lalu";
        
        long hours = minutes / 60;
        if (hours < 24) return hours + " jam yang lalu";
        
        long days = hours / 24;
        if (days < 7) return days + " hari yang lalu";
        
        long weeks = days / 7;
        if (weeks < 4) return weeks + " minggu yang lalu";
        
        long months = days / 30;
        return months + " bulan yang lalu";
    }
}
