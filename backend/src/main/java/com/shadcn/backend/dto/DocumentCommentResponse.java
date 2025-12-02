package com.shadcn.backend.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentCommentResponse {
    
    private Long id;
    private Long dokumentId;
    private String nama;
    private String konten;
    private Long parentId;
    private Integer likes;
    private Integer dislikes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DocumentCommentResponse> replies;
}
