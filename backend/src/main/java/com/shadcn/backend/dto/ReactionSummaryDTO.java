package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReactionSummaryDTO {
    private String reactionType;
    private String emoji;
    private Integer count;
    private String userName;
    private String userPhoto;
    
    // Constructor for reaction counts
    public ReactionSummaryDTO(String reactionType, String emoji, Integer count) {
        this.reactionType = reactionType;
        this.emoji = emoji;
        this.count = count;
    }
    
    // Constructor for user reactions
    public ReactionSummaryDTO(String reactionType, String emoji, String userName, String userPhoto) {
        this.reactionType = reactionType;
        this.emoji = emoji;
        this.userName = userName;
        this.userPhoto = userPhoto;
        this.count = 1;
    }
}
