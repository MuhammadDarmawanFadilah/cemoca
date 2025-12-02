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
public class PostKomunikasiDTO {
    private Long postId;
    private String konten;
    private Long biografiId;
    
    // Author info
    private String authorName;
    private String authorPhoto;
    private String authorJurusan;
    private String authorAlumniTahun;
    
    // Media attachments
    private List<MediaPostDTO> media = new ArrayList<>();
    
    // Reaction counts
    private Integer likeCount = 0;
    private Integer dislikeCount = 0;
    private Integer commentCount = 0;
    
    // User's reaction to this post (if any)
    private String userReaction;
    
    // Recent reactions for display
    private List<ReactionSummaryDTO> recentReactions = new ArrayList<>();
    
    // Recent comments for preview
    private List<PostCommentDTO> recentComments = new ArrayList<>();
    
    private String status;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // Helper methods
    public boolean hasMedia() {
        return media != null && !media.isEmpty();
    }
    
    public boolean hasComments() {
        return commentCount != null && commentCount > 0;
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
